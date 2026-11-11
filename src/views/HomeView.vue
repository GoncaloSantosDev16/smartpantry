<script setup>
import { ref, onMounted } from "vue";
import { lookupProduct } from "@/services/productsApi";
import { searchRecipes } from "@/services/recipesApi";
import BarcodeScanner from "@/components/BarcodeScanner.vue";
import ProfileSwitcher from "@/components/ProfileSwitcher.vue";
import {
  validateItem,
  parseQuantity,
  guessCategory,
  UNITS,
} from "@/services/pantryHelpers";
import { db } from "@/db";

// --- ESTADOS DA DESPENSA ---
const pantryItems = ref([]);
const isScannerOpen = ref(false);

const newItemName = ref("");
const newItemQty = ref(1);
const newItemUnit = ref("un");
const newItemCategory = ref("Other");
const formErrors = ref({});

// NOVO: Estado para controlar a edição (US-04)
const editingId = ref(null);

// --- ESTADOS DAS APIs ---
const result = ref(null);
const productId = ref("");
const isLoading = ref(false);

// CARREGAR OS DADOS (US-04 - Listar)
onMounted(async () => {
  try {
    pantryItems.value = await db.pantryItems.toArray();
  } catch (error) {
    console.error("Erro ao carregar a despensa:", error);
  }
});

// --- LÓGICA DO FORMULÁRIO (US-03 Adicionar & US-04 Editar) ---
function toggleScanner() {
  isScannerOpen.value = !isScannerOpen.value;
}

// NOVO: Função para limpar o formulário e resetar estados
function resetForm() {
  newItemName.value = "";
  newItemQty.value = 1;
  newItemUnit.value = "un";
  newItemCategory.value = "Other";
  editingId.value = null;
  formErrors.value = {};
}

async function handleAddItem() {
  const itemToValidate = {
    name: newItemName.value,
    quantity: newItemQty.value,
    unit: newItemUnit.value,
    category: newItemCategory.value,
  };

  const errors = validateItem(itemToValidate);
  if (Object.keys(errors).length > 0) {
    formErrors.value = errors;
    return;
  }
  formErrors.value = {};

  try {
    if (editingId.value) {
      // US-04: ATUALIZAR ITEM EXISTENTE
      await db.pantryItems.update(editingId.value, itemToValidate);

      // Atualizar a interface
      const index = pantryItems.value.findIndex(
        (i) => i.id === editingId.value,
      );
      if (index !== -1) {
        pantryItems.value[index] = { id: editingId.value, ...itemToValidate };
      }
    } else {
      // US-03: ADICIONAR NOVO ITEM
      const generatedId = await db.pantryItems.add(itemToValidate);
      pantryItems.value.push({ id: generatedId, ...itemToValidate });
    }

    resetForm();
  } catch (error) {
    console.error("Erro ao guardar o item:", error);
    alert("Houve um erro ao guardar o produto na base de dados.");
  }
}

// --- LÓGICA DE EDITAR E REMOVER (US-04) ---

// Iniciar edição
function startEdit(item) {
  editingId.value = item.id;
  newItemName.value = item.name;
  newItemQty.value = item.quantity;
  newItemUnit.value = item.unit;
  newItemCategory.value = item.category;

  // Fazer scroll para o formulário no topo suavemente
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Remover item
async function removeItem(id) {
  try {
    await db.pantryItems.delete(id);
    pantryItems.value = pantryItems.value.filter((item) => item.id !== id);
  } catch (error) {
    console.error("Erro ao remover o item:", error);
    alert("Houve um erro ao remover o produto.");
  }
}

// --- LÓGICA DA CÂMARA ---
async function handleScan(barcode) {
  isScannerOpen.value = false;
  isLoading.value = true;
  try {
    const apiResult = await lookupProduct(barcode);
    result.value = apiResult;

    const apiProduct = apiResult?.product || {};
    newItemName.value = apiProduct.product_name || `Produto (${barcode})`;

    if (apiProduct.quantity) {
      const parsed = parseQuantity(apiProduct.quantity);
      if (parsed.quantity) newItemQty.value = parsed.quantity;
      if (parsed.unit) newItemUnit.value = parsed.unit;
    }

    if (apiProduct.categories) {
      newItemCategory.value = guessCategory(apiProduct.categories, [
        "Dairy",
        "Beverages",
        "Other",
      ]);
    }

    // Assegurar que não estamos em modo de edição ao adicionar via scanner
    editingId.value = null;
    await handleAddItem();
  } catch (error) {
    alert("Erro ao procurar o produto lido pela câmara.");
  } finally {
    isLoading.value = false;
  }
}

// --- LÓGICA DE TESTE DAS APIs ---
async function testProduct() {
  if (!productId.value) return;
  isLoading.value = true;
  result.value = null;
  try {
    result.value = await lookupProduct(productId.value);
  } catch (error) {
    result.value = { erro: "Falha ao procurar produto." };
  } finally {
    isLoading.value = false;
  }
}

async function testRecipes() {
  isLoading.value = true;
  result.value = null;
  try {
    result.value = await searchRecipes(["eggs", "tomato", "cheese"], {
      diets: ["vegetarian"],
      allergies: ["peanut"],
      excludedIngredients: ["mushroom"],
    });
  } catch (error) {
    result.value = { erro: "Falha ao procurar receitas." };
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-8 px-4 text-gray-800 font-sans">
    <header class="text-center mb-10">
      <div class="flex justify-end mb-4">
        <ProfileSwitcher />
      </div>
      <h1 class="text-4xl font-extrabold text-[#42b883] mb-2 tracking-tight">
        🛒 SmartPantry
      </h1>
      <p class="text-gray-500 text-lg">
        Adiciona itens à tua despensa & Testa a API
      </p>
    </header>

    <main class="flex flex-col gap-8">
      <!-- ZONA 1: ADICIONAR À DESPENSA -->
      <section class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800 m-0">
            📦 Novo Ingrediente
          </h2>
          <button
            @click="toggleScanner"
            :class="[
              'p-2 text-xl bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all',
              isScannerOpen
                ? 'bg-[#42b883] border-[#42b883] text-white animate-pulse shadow-[0_0_0_4px_rgba(66,184,131,0.2)]'
                : '',
            ]"
            title="Ler Código de Barras"
          >
            📷
          </button>
        </div>

        <div
          v-if="isScannerOpen"
          class="mb-6 border-2 border-dashed border-[#42b883] rounded-xl p-4 bg-green-50"
        >
          <BarcodeScanner @scanned="handleScan" />
        </div>

        <form @submit.prevent="handleAddItem" class="flex flex-col gap-5">
          <div class="flex flex-col sm:flex-row gap-4 items-start">
            <div class="flex flex-col gap-1.5 w-full sm:flex-[2]">
              <label
                class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >Produto</label
              >
              <input
                v-model="newItemName"
                type="text"
                placeholder="Ex: Arroz agulha..."
                :class="{ 'has-error': formErrors.name }"
              />
              <span
                v-if="formErrors.name"
                class="text-xs font-medium text-red-500"
                >{{ formErrors.name }}</span
              >
            </div>

            <div class="flex flex-col gap-1.5 w-full sm:flex-1">
              <label
                class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >Categoria</label
              >
              <select
                v-model="newItemCategory"
                :class="{ 'has-error': formErrors.category }"
              >
                <option value="Dairy">Laticínios</option>
                <option value="Beverages">Bebidas</option>
                <option value="Other">Outro</option>
              </select>
              <span
                v-if="formErrors.category"
                class="text-xs font-medium text-red-500"
                >{{ formErrors.category }}</span
              >
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 items-start">
            <div class="flex flex-col gap-1.5 w-full sm:flex-1">
              <label
                class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >Quantidade</label
              >
              <input
                v-model="newItemQty"
                type="number"
                min="0.1"
                step="0.1"
                :class="{ 'has-error': formErrors.quantity }"
              />
              <span
                v-if="formErrors.quantity"
                class="text-xs font-medium text-red-500"
                >{{ formErrors.quantity }}</span
              >
            </div>

            <div class="flex flex-col gap-1.5 w-full sm:flex-1">
              <label
                class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >Unidade</label
              >
              <select
                v-model="newItemUnit"
                :class="{ 'has-error': formErrors.unit }"
              >
                <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
              </select>
              <span
                v-if="formErrors.unit"
                class="text-xs font-medium text-red-500"
                >{{ formErrors.unit }}</span
              >
            </div>

            <div class="flex justify-end w-full sm:flex-1 sm:pt-6">
              <button type="submit" class="btn-primary w-full sm:w-auto">
                Adicionar Item
              </button>
            </div>
          </div>
        </form>
      </section>

      <!-- ZONA 2: LISTA DA DESPENSA -->
      <section class="card">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          📋 A Minha Despensa
        </h2>
        <ul class="flex flex-col gap-3 m-0 p-0 list-none">
          <li
            v-if="pantryItems.length === 0"
            class="text-center text-gray-500 py-12 px-4 bg-slate-50 rounded-xl border-2 border-dashed border-gray-200"
          >
            <div class="text-4xl mb-2 opacity-50">🍽️</div>
            A tua despensa está vazia. Adiciona produtos acima.
          </li>
          <li
            v-for="item in pantryItems"
            :key="item.id"
            class="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-gray-200 hover:translate-x-1 hover:border-slate-300 transition-transform"
          >
            <div class="flex items-center gap-4">
              <strong class="text-lg font-semibold">{{ item.name }}</strong>
              <span
                class="text-xs px-3 py-1 rounded-full bg-slate-200 text-slate-600 font-medium"
              >
                {{
                  item.category === "Dairy"
                    ? "🧀 Laticínios"
                    : item.category === "Beverages"
                      ? "🥤 Bebidas"
                      : "📦 Outro"
                }}
              </span>
            </div>
            <div>
              <span
                class="bg-[#42b883] text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm"
                >{{ item.quantity }} {{ item.unit }}</span
              >
            </div>
          </li>
        </ul>
      </section>

      <!-- ZONA 3: TESTES DA API -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section class="card">
          <h2 class="text-xl font-bold text-gray-800 mb-4">
            🔍 Testar Produto (API)
          </h2>
          <div class="flex gap-2">
            <input
              v-model="productId"
              type="text"
              placeholder="Ex: 3017620422003"
              class="w-full flex-1"
            />
            <button
              class="bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              @click="testProduct"
              :disabled="isLoading"
            >
              Procurar
            </button>
          </div>
        </section>

        <section class="card">
          <h2 class="text-xl font-bold text-gray-800 mb-4">
            🍳 Testar Receitas (API)
          </h2>
          <button
            class="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            @click="testRecipes"
            :disabled="isLoading"
          >
            Procurar Receitas (Ovos, Tomate, Queijo)
          </button>
        </section>
      </div>

      <!-- ZONA 4: CONSOLA DE RESULTADOS DA API -->
      <section
        class="bg-gray-900 rounded-xl overflow-hidden shadow-lg mt-2"
        v-if="isLoading || result"
      >
        <div class="bg-gray-800 p-4 border-b border-gray-700">
          <h2 class="text-white text-lg font-bold m-0">💻 Consola da API</h2>
        </div>
        <div v-if="isLoading" class="p-8 text-center text-[#42b883] font-bold">
          A carregar os dados...
        </div>
        <pre
          v-else
          class="m-0 p-6 text-green-400 font-mono text-sm whitespace-pre-wrap break-words max-h-[500px] overflow-y-auto"
          >{{ result }}</pre
        >
      </section>
    </main>
  </div>
</template>
