<script setup>
import { ref, onMounted } from 'vue'
import { lookupProduct } from '@/services/productsApi'
import { searchRecipes } from '@/services/recipesApi'

// Importa o teu componente (ajusta o caminho se estiver noutra pasta)
import BarcodeScanner from '@/components/BarcodeScanner.vue'
// import { getItems, addItem, removeItem } from '@/services/pantryHelpers'

const result = ref(null)
const productId = ref('') 
const isLoading = ref(false)

const pantryItems = ref([])
const newItemName = ref('')
const newItemQty = ref(1)

// Estado para mostrar/esconder o componente da câmara
const isScannerOpen = ref(false)

function toggleScanner() {
  isScannerOpen.value = !isScannerOpen.value
}

// Função que recebe o código emitido pelo BarcodeScanner.vue
async function handleScan(barcode) {
  isScannerOpen.value = false; // Fecha a câmara
  await lookupAndAddToPantry(barcode);
}

async function lookupAndAddToPantry(barcode) {
  isLoading.value = true;
  try {
    const apiResult = await lookupProduct(barcode);
    result.value = apiResult;
    
    const productName = apiResult?.product?.product_name || `Produto (${barcode})`;
    
    newItemName.value = productName;
    newItemQty.value = 1;
    await handleAddItem();
    
    alert(`✅ ${productName} adicionado à despensa!`);
  } catch (error) {
    alert("Erro ao procurar o produto lido pela câmara.");
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

// --- LÓGICA DA DESPENSA ---
onMounted(async () => {
  // pantryItems.value = await getItems()
})

async function handleAddItem() {
  if (!newItemName.value) return;
  const newItem = { id: Date.now(), name: newItemName.value, quantity: newItemQty.value }
  // await addItem(newItem)
  pantryItems.value.push(newItem)
  newItemName.value = ''
  newItemQty.value = 1
}

async function handleRemoveItem(id) {
  // await removeItem(id)
  pantryItems.value = pantryItems.value.filter(item => item.id !== id)
}

// --- LÓGICA DAS APIs ---
async function testProduct() {
  if (!productId.value) return;
  isLoading.value = true;
  result.value = null;
  try {
    result.value = await lookupProduct(productId.value);
  } catch (error) {
    result.value = { erro: "Falha ao procurar o produto." };
  } finally {
    isLoading.value = false;
  }
}

async function testRecipes() {
  isLoading.value = true
  result.value = null
  try {
    result.value = await searchRecipes(['eggs', 'tomato', 'cheese'], { diets: ['vegetarian'], allergies: ['peanut'], excludedIngredients: ['mushroom'] })
  } catch (error) {
    result.value = { erro: "Falha ao procurar receitas." }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="app-container">
    <header>
      <h1>🛒 SmartPantry</h1>
    </header>

    <main class="grid-layout">
      <section class="card pantry-card">
        <h2>📦 A Minha Despensa</h2>
        <p class="description">Gere os teus ingredientes</p>
        
        <div class="pantry-controls">
          <form @submit.prevent="handleAddItem" class="add-item-form">
            <input v-model="newItemName" type="text" placeholder="Nome do produto..." required />
            <input v-model="newItemQty" type="number" min="1" class="qty-input" />
            <button type="submit" class="btn-add">Adicionar</button>
          </form>
          
          <button @click="toggleScanner" class="btn-camera" :class="{ 'is-scanning': isScannerOpen }">
            📷 {{ isScannerOpen ? 'Fechar Câmara' : 'Ler Código' }}
          </button>
        </div>

        <!-- Renderiza o componente real aqui e ouve o evento @scanned -->
        <div v-if="isScannerOpen" class="scanner-wrapper">
          <BarcodeScanner @scanned="handleScan" />
        </div>

        <ul class="pantry-list">
          <li v-if="pantryItems.length === 0" class="empty-msg">A tua despensa está vazia.</li>
          <li v-for="item in pantryItems" :key="item.id" class="pantry-item">
            <div class="item-info">
              <strong>{{ item.name }}</strong>
              <span class="badge">x{{ item.quantity }}</span>
            </div>
            <button @click="handleRemoveItem(item.id)" class="btn-delete">🗑️</button>
          </li>
        </ul>
      </section>

      <div class="api-tools">
        <section class="card">
          <h2>🔍 Testar Produto (API)</h2>
          <div class="input-group">
            <input v-model="productId" type="text" placeholder="Ex: 3017620422003" />
            <button @click="testProduct" :disabled="isLoading">Procurar</button>
          </div>
        </section>

        <section class="card">
          <h2>🍳 Testar Receitas (API)</h2>
          <button @click="testRecipes" class="btn-secondary" :disabled="isLoading">
            Procurar Receitas (Ovos, Tomate, Queijo)
          </button>
        </section>
      </div>
    </main>

    <section class="result-area" v-if="isLoading || result">
      <div class="result-header">
        <h2>💻 Consola da API</h2>
      </div>
      <div v-if="isLoading" class="loading">A carregar os dados...</div>
      <pre v-else class="json-viewer">{{ result }}</pre>
    </section>
  </div>
</template>

<style scoped>
/* Adiciona apenas esta classe aos estilos que já tinhas no ficheiro anterior */
.scanner-wrapper {
  margin-bottom: 1.5rem;
  border: 2px dashed #42b883;
  border-radius: 8px;
  padding: 10px;
  background-color: #fafafa;
}

/* O resto dos estilos mantém-se igual à versão anterior */
.app-container { max-width: 1000px; margin: 0 auto; padding: 2rem; font-family: 'Inter', sans-serif; color: #2c3e50; }
header h1 { text-align: center; font-size: 2.5rem; margin-bottom: 2rem; color: #42b883; }
.grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
@media (max-width: 768px) { .grid-layout { grid-template-columns: 1fr; } }
.api-tools { display: flex; flex-direction: column; gap: 1.5rem; }
.card { background: #ffffff; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #eaeaea; }
.card h2 { margin: 0 0 0.5rem 0; font-size: 1.25rem; }
.description { color: #7f8c8d; font-size: 0.9rem; margin-bottom: 1rem; }
.pantry-controls { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
.add-item-form { display: flex; gap: 0.5rem; }
.qty-input { width: 70px; }
.btn-add { flex-shrink: 0; }
.btn-camera { background-color: #f39c12; color: white; width: 100%; display: flex; justify-content: center; align-items: center; gap: 0.5rem; }
.btn-camera:hover:not(:disabled) { background-color: #e67e22; }
.btn-camera.is-scanning { background-color: #e74c3c; }
.pantry-list { list-style: none; padding: 0; margin: 0; max-height: 300px; overflow-y: auto; }
.pantry-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8f9fa; border-radius: 8px; margin-bottom: 0.5rem; border: 1px solid #e9ecef; }
.item-info { display: flex; align-items: center; gap: 0.75rem; }
.badge { background: #e9ecef; padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold; color: #495057; }
.btn-delete { background: transparent; border: none; padding: 0.5rem; cursor: pointer; color: #dc3545; transition: transform 0.2s; }
.btn-delete:hover { transform: scale(1.2); }
.empty-msg { text-align: center; color: #adb5bd; padding: 1rem; font-style: italic; }
.input-group { display: flex; gap: 0.5rem; }
input { flex: 1; padding: 0.75rem; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem; }
input:focus { outline: none; border-color: #42b883; }
button { padding: 0.75rem 1.25rem; background-color: #42b883; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
button:hover:not(:disabled) { background-color: #33a06f; }
.btn-secondary { background-color: #35495e; width: 100%; }
.btn-secondary:hover:not(:disabled) { background-color: #2c3e50; }
.result-area { background: #1e1e1e; border-radius: 12px; overflow: hidden; }
.result-header { background: #2d2d2d; padding: 1rem 1.5rem; border-bottom: 1px solid #444; }
.result-header h2 { margin: 0; color: #fff; font-size: 1.1rem; }
.json-viewer { margin: 0; padding: 1.5rem; color: #a6e22e; font-family: monospace; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
</style>