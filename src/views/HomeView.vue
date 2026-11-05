<script setup>
import { ref, onMounted } from 'vue' // <-- Adicionado onMounted
import { lookupProduct } from '@/services/productsApi'
import { searchRecipes } from '@/services/recipesApi'
import BarcodeScanner from '@/components/BarcodeScanner.vue' 
import { validateItem, parseQuantity, guessCategory, UNITS } from '@/services/pantryHelpers'

// 1. IMPORTAR A TUA BASE DE DADOS
// (Ajusta o caminho se o teu index.js do Dexie não estiver na pasta db)
import { db } from '@/db'

// --- ESTADOS DA DESPENSA ---
const pantryItems = ref([])
const isScannerOpen = ref(false)

const newItemName = ref('')
const newItemQty = ref(1)
const newItemUnit = ref('un')
const newItemCategory = ref('Other')
const formErrors = ref({}) 

// --- ESTADOS DAS APIs ---
const result = ref(null)
const productId = ref('') 
const isLoading = ref(false)

// 2. CARREGAR OS DADOS QUANDO A PÁGINA ABRE
onMounted(async () => {
  try {
    // Vai buscar todos os itens à tabela pantryItems do Dexie
    pantryItems.value = await db.pantryItems.toArray()
  } catch (error) {
    console.error("Erro ao carregar a despensa:", error)
  }
})

// --- LÓGICA DE ADICIONAR (US-03) ---
function toggleScanner() {
  isScannerOpen.value = !isScannerOpen.value
}

async function handleAddItem() {
  const itemToValidate = {
    name: newItemName.value,
    quantity: newItemQty.value,
    unit: newItemUnit.value,
    category: newItemCategory.value
  }

  const errors = validateItem(itemToValidate)
  
  if (Object.keys(errors).length > 0) {
    formErrors.value = errors
    return
  }
  
  formErrors.value = {}
  
  try {
    // 3. GUARDAR NA BASE DE DADOS (DEXIE)
    // O Dexie gera o ID automaticamente e devolve-o
    const generatedId = await db.pantryItems.add(itemToValidate)
    
    // Atualiza a lista visual com o ID verdadeiro da base de dados
    pantryItems.value.push({
      id: generatedId,
      ...itemToValidate
    })
    
    // Limpa o formulário
    newItemName.value = ''
    newItemQty.value = 1
    newItemUnit.value = 'un'
    newItemCategory.value = 'Other'

  } catch (error) {
    console.error("Erro ao guardar o item:", error)
    alert("Houve um erro ao guardar o produto na base de dados.")
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
      newItemCategory.value = guessCategory(apiProduct.categories, ['Dairy', 'Beverages', 'Other']); 
    }

    // Chama o adicionar (que agora é assíncrono porque vai à base de dados)
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
  } 
  catch (error) { 
    result.value = { erro: "Falha ao procurar produto." }; 
  } 
  finally { 
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
  } 
  catch (error) { 
    result.value = { erro: "Falha ao procurar receitas." }; 
  } 
  finally { 
    isLoading.value = false; 
  }
}
</script>

<template>
  <div class="app-container">
    <header class="main-header">
      <h1>🛒 SmartPantry</h1>
      <p class="subtitle">Adiciona itens à tua despensa & Testa a API</p>
    </header>

    <main class="content-wrapper">
      <!-- ZONA 1: ADICIONAR À DESPENSA -->
      <section class="card pantry-card">
        <div class="card-header">
          <h2>📦 Novo Ingrediente</h2>
          <button @click="toggleScanner" class="btn-icon" :class="{ 'active': isScannerOpen }" title="Ler Código de Barras">
            📷
          </button>
        </div>
        
        <div v-if="isScannerOpen" class="scanner-wrapper">
          <BarcodeScanner @scanned="handleScan" />
        </div>

        <form @submit.prevent="handleAddItem" class="modern-form">
          <div class="form-row">
            <div class="form-group flex-2">
              <label>Produto</label>
              <input v-model="newItemName" type="text" placeholder="Ex: Arroz agulha..." :class="{ 'has-error': formErrors.name }" />
              <span v-if="formErrors.name" class="error-text">{{ formErrors.name }}</span>
            </div>
            
            <div class="form-group flex-1">
              <label>Categoria</label>
              <select v-model="newItemCategory" :class="{ 'has-error': formErrors.category }">
                <option value="Dairy">Laticínios</option>
                <option value="Beverages">Bebidas</option>
                <option value="Other">Outro</option>
              </select>
              <span v-if="formErrors.category" class="error-text">{{ formErrors.category }}</span>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Quantidade</label>
              <input v-model="newItemQty" type="number" min="0.1" step="0.1" :class="{ 'has-error': formErrors.quantity }" />
              <span v-if="formErrors.quantity" class="error-text">{{ formErrors.quantity }}</span>
            </div>
            
            <div class="form-group flex-1">
              <label>Unidade</label>
              <select v-model="newItemUnit" :class="{ 'has-error': formErrors.unit }">
                <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
              </select>
              <span v-if="formErrors.unit" class="error-text">{{ formErrors.unit }}</span>
            </div>

            <div class="form-group button-group">
              <button type="submit" class="btn-primary">Adicionar Item</button>
            </div>
          </div>
        </form>
      </section>

      <!-- ZONA 2: LISTA DA DESPENSA (Sem botão remover) -->
      <section class="card list-card">
        <h2>📋 A Minha Despensa</h2>
        <ul class="pantry-list">
          <li v-if="pantryItems.length === 0" class="empty-msg">
            <div class="empty-icon">🍽️</div>
            A tua despensa está vazia. Adiciona produtos acima.
          </li>
          <li v-for="item in pantryItems" :key="item.id" class="pantry-item">
            <div class="item-main">
              <strong class="item-name">{{ item.name }}</strong>
              <span class="category-tag">
                {{ item.category === 'Dairy' ? '🧀 Laticínios' : item.category === 'Beverages' ? '🥤 Bebidas' : '📦 Outro' }}
              </span>
            </div>
            <div class="item-meta">
              <span class="qty-badge">{{ item.quantity }} {{ item.unit }}</span>
            </div>
          </li>
        </ul>
      </section>

      <!-- ZONA 3: TESTES DA API -->
      <div class="api-grid">
        <section class="card api-card">
          <h2>🔍 Testar Produto (API)</h2>
          <div class="input-group">
            <input v-model="productId" type="text" placeholder="Ex: 3017620422003" />
            <button class="btn-api" @click="testProduct" :disabled="isLoading">Procurar</button>
          </div>
        </section>

        <section class="card api-card">
          <h2>🍳 Testar Receitas (API)</h2>
          <button class="btn-api btn-full" @click="testRecipes" :disabled="isLoading">
            Procurar Receitas (Ovos, Tomate, Queijo)
          </button>
        </section>
      </div>

      <!-- ZONA 4: CONSOLA DE RESULTADOS DA API -->
      <section class="result-area" v-if="isLoading || result">
        <div class="result-header">
          <h2>💻 Consola da API</h2>
        </div>
        <div v-if="isLoading" class="loading">A carregar os dados...</div>
        <pre v-else class="json-viewer">{{ result }}</pre>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* O CSS MANTEVE-SE EXATAMENTE IGUAL AO ANTERIOR - Podes colar os teus estilos aqui sem alterar nada */
/* CORES E VARIÁVEIS */
:root {
  --primary: #42b883;
  --primary-dark: #33a06f;
  --bg-color: #f4f7f6;
  --card-bg: #ffffff;
  --text-main: #2c3e50;
  --text-muted: #7f8c8d;
  --border-color: #e2e8f0;
  --error: #e74c3c;
}

/* LAYOUT GLOBAL */
.app-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--text-main);
}

.main-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.main-header h1 {
  font-size: 2.5rem;
  color: var(--primary);
  margin: 0 0 0.5rem 0;
  font-weight: 800;
  letter-spacing: -1px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 1.1rem;
  margin: 0;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* CARTÕES */
.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card h2 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--text-main);
}

/* BOTÃO CÂMARA */
.btn-icon {
  background: #f8f9fa;
  border: 1px solid var(--border-color);
  font-size: 1.2rem;
  padding: 0.6rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

.btn-icon.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(66, 184, 131, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(66, 184, 131, 0); }
  100% { box-shadow: 0 0 0 0 rgba(66, 184, 131, 0); }
}

/* FORMULÁRIO */
.modern-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.flex-1 { flex: 1; width: 100%; }
.flex-2 { flex: 2; width: 100%; }

.button-group {
  justify-content: flex-end;
  height: 100%;
  padding-top: 1.8rem;
}

label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

input, select {
  padding: 0.8rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s;
  background-color: #fafafa;
  color: var(--text-main);
}

input:focus, select:focus {
  outline: none;
  border-color: var(--primary);
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

input.has-error, select.has-error {
  border-color: var(--error);
  background-color: #fdf2f2;
}

.error-text {
  color: var(--error);
  font-size: 0.75rem;
  font-weight: 500;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  height: 45px;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.2);
}

/* SCANNER WRAPPER */
.scanner-wrapper {
  margin-bottom: 1.5rem;
  border: 2px dashed var(--primary);
  border-radius: 12px;
  padding: 15px;
  background-color: #f0fdf4;
}

/* LISTA DA DESPENSA */
.pantry-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.pantry-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.2rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: transform 0.2s;
}

.pantry-item:hover {
  transform: translateX(4px);
  border-color: #cbd5e1;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.item-name {
  font-size: 1.05rem;
  font-weight: 600;
}

.category-tag {
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  background: #e2e8f0;
  color: #475569;
  font-weight: 500;
}

.qty-badge {
  background: var(--primary);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(66, 184, 131, 0.2);
}

.empty-msg {
  text-align: center;
  color: var(--text-muted);
  padding: 3rem 1rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed var(--border-color);
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

/* ESTILOS PARA API TOOLS */
.api-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .api-grid {
    grid-template-columns: 1fr;
  }
}

.api-card h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.btn-api {
  background-color: #35495e;
  color: white;
  border: none;
  padding: 0.8rem 1.2rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-api:hover:not(:disabled) {
  background-color: #2c3e50;
}

.btn-api:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.btn-full {
  width: 100%;
}

/* CONSOLA DE RESULTADOS */
.result-area {
  background: #1e1e1e;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

.result-header {
  background: #2d2d2d;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #444;
}

.result-header h2 {
  margin: 0;
  color: #fff;
  font-size: 1.1rem;
}

.loading {
  padding: 2rem;
  text-align: center;
  color: var(--primary);
  font-weight: bold;
}

.json-viewer {
  margin: 0;
  padding: 1.5rem;
  color: #a6e22e;
  font-family: 'Fira Code', monospace;
  font-size: 0.95rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 500px;
  overflow-y: auto;
}
</style>