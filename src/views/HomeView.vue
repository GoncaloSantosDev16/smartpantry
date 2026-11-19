<script setup>
import { ref, computed, onMounted } from 'vue'
import { lookupProduct } from '@/services/productsApi'
import { searchRecipes } from '@/services/recipesApi'
import BarcodeScanner from '@/components/BarcodeScanner.vue'
import ImageBarcodeUpload from '@/components/ImageBarcodeUpload.vue'
import ShoppingListButton from '@/components/ShoppingListButton.vue'
import ShoppingListDrawer from '@/components/ShoppingListDrawer.vue'
import { validateItem, parseQuantity, guessCategory, UNITS } from '@/services/pantryHelpers'
import { usePantryStore } from '@/stores/pantry'
import { isExpiringSoon, isExpired, expiryLabel } from '@/services/expiration'
import ExpiringAlert from '@/components/ExpiringAlert.vue'
import ProfileSwitcher from '@/components/ProfileSwitcher.vue'
import NewCategoryModal from '@/components/NewCategoryModal.vue'
import { useCategoriesStore } from '@/stores/categories'

// --- ESTADOS DA DESPENSA ---
const pantry = usePantryStore();
const pantryItems = computed(() => pantry.items);
const activeInputMode = ref('manual'); // Pode ser: 'manual', 'camera', ou 'upload'
const isShoppingListOpen = ref(false);

const newItemName = ref('')
const newItemQty = ref(1)
const newItemUnit = ref('un')
const newItemCategory = ref('Other')
const newItemExpiration = ref('') // US-06: AAAA-MM-DD (input type="date")
const formErrors = ref({})

// US-05: categorias personalizadas (Pinia + Dexie)
const categoriesStore = useCategoriesStore()
const isCategoryModalOpen = ref(false)
const allCategories = computed(() => categoriesStore.all)

async function onCategoryCreated(name) {
  try {
    const saved = await categoriesStore.add(name)
    newItemCategory.value = saved
  } catch (error) {
    console.error('Erro ao guardar a categoria:', error)
  }
}


// NOVO: Estado para controlar a edição (US-04)
const editingId = ref(null);

// --- ESTADOS DAS APIs ---
const result = ref(null)
const productId = ref('')
const isLoading = ref(false)

// CARREGAR OS DADOS (US-04 - Listar)
onMounted(async () => {
  await pantry.load();
  await categoriesStore.load();
});

// --- LÓGICA DO FORMULÁRIO (US-03 Adicionar & US-04 Editar) ---
function setInputMode(mode) {
  // Se clicar no modo que já está ativo, volta para o manual (fechar)
  activeInputMode.value = activeInputMode.value === mode ? 'manual' : mode;
}

// NOVO: Função para limpar o formulário e resetar estados
function resetForm() {
  newItemName.value = "";
  newItemQty.value = 1;
  newItemUnit.value = "un";
  newItemCategory.value = "Other";
  newItemExpiration.value = "";
  editingId.value = null;
  formErrors.value = {};
}

async function handleAddItem() {
  const itemToValidate = {
    name: newItemName.value,
    quantity: newItemQty.value,
    unit: newItemUnit.value,
    category: newItemCategory.value,
    expirationDate: newItemExpiration.value || null,
  };

  const errors = validateItem({ ...itemToValidate, expiresOn: itemToValidate.expirationDate });
  if (Object.keys(errors).length > 0) {
    formErrors.value = errors;
    return;
  }
  formErrors.value = {}

  try {
    if (editingId.value) {
      // US-04: ATUALIZAR ITEM EXISTENTE
      await pantry.updateItem(editingId.value, itemToValidate)
    } else {
      // US-03: ADICIONAR NOVO ITEM
      await pantry.addItem(itemToValidate);
    }

    resetForm()
  } catch (error) {
    console.error("Erro ao guardar o item:", error);
    alert("Houve um erro ao guardar o produto na base de dados.");
  }
}

// --- LÓGICA DE EDITAR E REMOVER (US-04) ---

// Iniciar edição
function startEdit(item) {
  editingId.value = item.id
  newItemName.value = item.name
  newItemQty.value = item.quantity
  newItemUnit.value = item.unit
  newItemCategory.value = item.category
  newItemExpiration.value = item.expirationDate ?? ''

  // Fazer scroll para o formulário no topo suavemente
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Remover item
async function removeItem(id) {
  try {
    await pantry.removeItem(id);
  } catch (error) {
    console.error("Erro ao remover o item:", error);
    alert("Houve um erro ao remover o produto.");
  }
}

// --- LÓGICA DA CÂMARA ---
async function handleScan(barcode) {
  activeInputMode.value = 'manual'; // Volta ao modo manual após ler
  isLoading.value = true;

  try {
    const apiResult = await lookupProduct(barcode);
    result.value = apiResult;

    const apiProduct = apiResult?.product || {};

    // 1. Atualizado: Procura por 'name' primeiro (para apanhar "Nutella")
    newItemName.value = apiProduct.name || apiProduct.product_name || `Produto (${barcode})`;

    if (apiProduct.quantity) {
      const parsed = parseQuantity(apiProduct.quantity);
      if (parsed.quantity) newItemQty.value = parsed.quantity;
      if (parsed.unit) newItemUnit.value = parsed.unit;
    }

    // 2. Atualizado: Procura por 'category' primeiro (para apanhar "breakfasts")
    // Substitui o bloco "if (apiProduct.categories) { ... }" por isto:
    const apiCategory = apiProduct.category || apiProduct.categories;
    if (apiCategory) {
      newItemCategory.value = apiCategory;
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
    result.value = await searchRecipes(['eggs', 'tomato', 'cheese'], {
      diets: ['vegetarian'],
      allergies: ['peanut'],
      excludedIngredients: ['mushroom'],
    });
  } catch (error) {
    result.value = { erro: "Falha ao procurar receitas." };
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-8 px-4 text-gray-800 font-sans" data-testid="home">
    <header class="text-center mb-10">
      <div class="flex justify-end items-center gap-3 mb-4">
        <ProfileSwitcher />
        <RouterLink
          to="/receitas"
          data-testid="recipes-link"
          class="flex h-11 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 text-sm font-semibold shadow-sm active:scale-95"
        >
          🍳 Receitas
        </RouterLink>
        <ShoppingListButton @open="isShoppingListOpen = true" />
      </div>
      <h1 class="text-4xl font-extrabold text-[#42b883] mb-2 tracking-tight">
        🛒 SmartPantry
      </h1>
      <p class="text-gray-500 text-lg">
        Adiciona itens à tua despensa & Testa a API
      </p>
    </header>

    <ShoppingListDrawer v-model:open="isShoppingListOpen" />

    <main class="flex flex-col gap-8">
      <!-- US-06: ALERTA DE ITENS A EXPIRAR (48h) -->
      <ExpiringAlert />

    <!-- ZONA 1: ADICIONAR À DESPENSA -->
      <section class="card">
        <div class="flex flex-col mb-6 gap-4">
          <h2 class="text-2xl font-bold text-gray-800 m-0" data-testid="form-title">{{ editingId ? '✏️ Editar Ingrediente' : '📦 Novo Ingrediente' }}</h2>

          <!-- TABS DE SELEÇÃO DE MODO -->
          <div class="flex bg-gray-100 p-1 rounded-lg w-full max-w-md mx-auto sm:mx-0">
            <button
              type="button"
              data-testid="tab-manual"
              @click="setInputMode('manual')"
              :class="['flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-colors', activeInputMode === 'manual' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
            >
              ✍️ Manual
            </button>
            <button
              type="button"
              data-testid="tab-camera"
              @click="setInputMode('camera')"
              :class="['flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-colors', activeInputMode === 'camera' ? 'bg-[#42b883] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700']"
            >
              📷 Câmara
            </button>
            <button
              type="button"
              data-testid="tab-upload"
              @click="setInputMode('upload')"
              :class="['flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-colors', activeInputMode === 'upload' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700']"
            >
              🖼️ Imagem
            </button>
          </div>
        </div>

        <!-- RENDERIZAÇÃO CONDICIONAL DOS COMPONENTES DE LEITURA -->
        <div
          v-if="activeInputMode === 'camera'"
          data-testid="scanner-panel"
          class="mb-6 border-2 border-dashed border-[#42b883] rounded-xl p-4 bg-green-50"
        >
          <BarcodeScanner @scanned="handleScan" />
        </div>

        <div
          v-if="activeInputMode === 'upload'"
          data-testid="upload-panel"
          class="mb-6 border-2 border-dashed border-blue-400 rounded-xl p-4 bg-blue-50"
        >
          <ImageBarcodeUpload @scanned="handleScan" />
        </div>

        <!-- FORMULÁRIO -->
        <form @submit.prevent="handleAddItem" class="flex flex-col gap-5" data-testid="item-form">
          <div class="flex flex-col sm:flex-row gap-4 items-start">
            <div class="flex flex-col gap-1.5 w-full sm:flex-[2]">
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Produto</label>
              <input v-model="newItemName" data-testid="input-name" type="text" placeholder="Ex: Arroz agulha..."
                :class="{ 'has-error': formErrors.name }" />
              <span v-if="formErrors.name" data-testid="error-name" class="text-xs font-medium text-red-500">{{ formErrors.name }}</span>
            </div>

            <div class="flex flex-col gap-1.5 w-full sm:flex-1">
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</label>
              <input
                v-model="newItemCategory"
                data-testid="input-category"
                list="category-options"
                type="text"
                placeholder="Seleciona ou escreve uma..."
                :class="{ 'has-error': formErrors.category }"
              />
                            <button
                type="button"
                data-testid="btn-new-category"
                class="self-start text-xs font-semibold text-[#42b883] hover:underline"
                @click="isCategoryModalOpen = true"
              >
                + Nova categoria
              </button>
              <datalist id="category-options">
                <option v-for="cat in allCategories" :key="cat" :value="cat"></option>
              </datalist>
              <span
                v-if="formErrors.category"
                data-testid="error-category"
                class="text-xs font-medium text-red-500"
              >{{ formErrors.category }}</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 items-start">
            <div class="flex flex-col gap-1.5 w-full sm:flex-1">
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantidade</label>
              <input v-model="newItemQty" data-testid="input-quantity" type="number" min="0.1" step="0.1"
                :class="{ 'has-error': formErrors.quantity }" />
              <span v-if="formErrors.quantity" data-testid="error-quantity" class="text-xs font-medium text-red-500">{{ formErrors.quantity }}</span>
            </div>

            <div class="flex flex-col gap-1.5 w-full sm:flex-1">
              <label
                class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >Unidade</label
              >
              <select
                v-model="newItemUnit"
                data-testid="select-unit"
                :class="{ 'has-error': formErrors.unit }"
              >
                <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
              </select>
              <span
                v-if="formErrors.unit"
                data-testid="error-unit"
                class="text-xs font-medium text-red-500"
                >{{ formErrors.unit }}</span
              >
            </div>

            <div class="flex flex-col gap-1.5 w-full sm:flex-1">
              <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Validade</label>
              <input v-model="newItemExpiration" data-testid="item-expiration" type="date"
                :class="{ 'has-error': formErrors.expiresOn }" />
              <span v-if="formErrors.expiresOn" class="text-xs font-medium text-red-500">{{ formErrors.expiresOn }}</span>
            </div>

            <div class="flex justify-end gap-2 w-full sm:flex-1 sm:pt-6">
              <!-- US-04: em modo de edição, "Guardar" + "Cancelar" -->
              <button v-if="editingId" type="button" data-testid="btn-cancel-edit" @click="resetForm"
                class="w-full sm:w-auto rounded-[10px] border border-gray-300 bg-white px-5 font-semibold text-gray-600 hover:bg-gray-50 h-[45px]">
                Cancelar
              </button>
              <button type="submit" data-testid="btn-add-item" class="btn-primary w-full sm:w-auto">
                {{ editingId ? 'Guardar' : 'Adicionar Item' }}
              </button>
            </div>
          </div>
        </form>
        <NewCategoryModal
          v-model:open="isCategoryModalOpen"
          :existing="allCategories"
          @created="onCategoryCreated"
        />
      </section>

      <!-- ZONA 2: LISTA DA DESPENSA -->
      <section class="card">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          📋 A Minha Despensa
        </h2>
        <ul class="flex flex-col gap-3 m-0 p-0 list-none" data-testid="pantry-list">
          <li v-if="pantryItems.length === 0"
            data-testid="pantry-empty"
            class="text-center text-gray-500 py-12 px-4 bg-slate-50 rounded-xl border-2 border-dashed border-gray-200">
            <div class="text-4xl mb-2 opacity-50">🍽️</div>
            A tua despensa está vazia. Adiciona produtos acima.
          </li>
          <li v-for="item in pantryItems" :key="item.id"
            data-testid="pantry-item"
            :data-name="item.name"
            :data-expiring="isExpiringSoon(item, pantry.now)"
            :class="[
              'flex justify-between items-center p-4 rounded-xl border hover:translate-x-1 transition-transform',
              isExpiringSoon(item, pantry.now)
                ? 'bg-amber-50 border-amber-300 border-l-4 border-l-amber-500'
                : 'bg-slate-50 border-gray-200 hover:border-slate-300',
            ]">
            <div class="flex flex-wrap items-center gap-2 sm:gap-4">
              <strong data-testid="pantry-item-name" class="text-lg font-semibold">{{ item.name }}</strong>
              <span class="text-xs px-3 py-1 rounded-full bg-slate-200 text-slate-600 font-medium capitalize">
                🏷️ {{ item.category }}
              </span>
              <span v-if="item.expirationDate" data-testid="pantry-item-expiry"
                :class="[
                  'text-xs px-3 py-1 rounded-full font-semibold',
                  isExpired(item, pantry.now) ? 'bg-red-100 text-red-700'
                    : isExpiringSoon(item, pantry.now) ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-500',
                ]">
                ⏳ {{ expiryLabel(item.expirationDate, pantry.now) }}
              </span>
            </div>
            <div class="flex items-center gap-3">
              <span data-testid="pantry-item-qty" class="bg-[#42b883] text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                {{ item.quantity }} {{ item.unit }}
              </span>
              <button @click="startEdit(item)" data-testid="btn-edit-item" class="text-blue-500 hover:bg-blue-100 hover:scale-110 p-1.5 rounded-full transition-all" title="Editar item">
                ✏️
              </button>
              <button @click="removeItem(item.id)" data-testid="btn-remove-item" class="text-red-500 hover:bg-red-100 hover:scale-110 p-1.5 rounded-full transition-all" title="Remover item">
                ❌
              </button>
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
            <input v-model="productId" type="text" placeholder="Ex: 3017620422003" class="w-full flex-1" />
            <button
              class="bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              @click="testProduct" :disabled="isLoading">Procurar</button>
          </div>
        </section>

        <section class="card">
          <h2 class="text-xl font-bold text-gray-800 mb-4">🍳 Testar Receitas (API)</h2>
          <button
            class="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            @click="testRecipes" :disabled="isLoading">
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
        <div v-if="isLoading" class="p-8 text-center text-[#42b883] font-bold">A carregar os dados...</div>
        <pre v-else
          class="m-0 p-6 text-green-400 font-mono text-sm whitespace-pre-wrap break-words max-h-[500px] overflow-y-auto">{{ result }}</pre>
      </section>
    </main>
  </div>
</template>