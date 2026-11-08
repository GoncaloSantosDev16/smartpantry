<script setup>
import { ref, onMounted } from 'vue'
import { lookupProduct } from '@/services/productsApi'
import { searchRecipes } from '@/services/recipesApi'
import BarcodeScanner from '@/components/BarcodeScanner.vue'
import { validateItem, parseQuantity, guessCategory, UNITS } from '@/services/pantryHelpers'
import { db } from '@/db'

// --- ESTADOS DA DESPENSA ---
const pantryItems = ref([])
const isScannerOpen = ref(false)

const newItemName = ref('')
const newItemQty = ref(1)
const newItemUnit = ref('un')
const newItemCategory = ref('Other')
const formErrors = ref({})

// Estado para controlar a edição (US-04)
const editingId = ref(null)

// --- ESTADOS DAS APIs ---
const result = ref(null)
const productId = ref('')
const isLoading = ref(false)

// CARREGAR OS DADOS (US-04 - Listar)
onMounted(async () => {
  try {
    pantryItems.value = await db.pantryItems.toArray()
  } catch (error) {
    console.error('Erro ao carregar a despensa:', error)
  }
})

// --- LÓGICA DO FORMULÁRIO (US-03 Adicionar & US-04 Editar) ---
function toggleScanner() {
  isScannerOpen.value = !isScannerOpen.value
}

// Limpar o formulário e repor estados
function resetForm() {
  newItemName.value = ''
  newItemQty.value = 1
  newItemUnit.value = 'un'
  newItemCategory.value = 'Other'
  editingId.value = null
  formErrors.value = {}
}

async function handleAddItem() {
  const itemToValidate = {
    name: newItemName.value,
    quantity: newItemQty.value,
    unit: newItemUnit.value,
    category: newItemCategory.value,
  }

  const errors = validateItem(itemToValidate)
  if (Object.keys(errors).length > 0) {
    formErrors.value = errors
    return
  }
  formErrors.value = {}

  try {
    if (editingId.value) {
      // US-04: ATUALIZAR ITEM EXISTENTE
      await db.pantryItems.update(editingId.value, itemToValidate)

      const index = pantryItems.value.findIndex((i) => i.id === editingId.value)
      if (index !== -1) {
        pantryItems.value[index] = { id: editingId.value, ...itemToValidate }
      }
    } else {
      // US-03: ADICIONAR NOVO ITEM
      const generatedId = await db.pantryItems.add(itemToValidate)
      pantryItems.value.push({ id: generatedId, ...itemToValidate })
    }

    resetForm()
  } catch (error) {
    console.error('Erro ao guardar o item:', error)
    alert('Houve um erro ao guardar o produto na base de dados.')
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
  isScannerOpen.value = false

  // Scroll suave para o formulário no topo
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Remover item
async function removeItem(id) {
  try {
    await db.pantryItems.delete(id)
    pantryItems.value = pantryItems.value.filter((item) => item.id !== id)
    if (editingId.value === id) resetForm()
  } catch (error) {
    console.error('Erro ao remover o item:', error)
    alert('Houve um erro ao remover o produto.')
  }
}

// --- LÓGICA DA CÂMARA ---
async function handleScan(barcode) {
  isScannerOpen.value = false
  isLoading.value = true
  try {
    const apiResult = await lookupProduct(barcode)
    result.value = apiResult

    const apiProduct = apiResult?.product || {}
    newItemName.value = apiProduct.product_name || `Produto (${barcode})`

    if (apiProduct.quantity) {
      const parsed = parseQuantity(apiProduct.quantity)
      if (parsed.quantity) newItemQty.value = parsed.quantity
      if (parsed.unit) newItemUnit.value = parsed.unit
    }

    if (apiProduct.categories) {
      newItemCategory.value = guessCategory(apiProduct.categories, ['Dairy', 'Beverages', 'Other'])
    }

    // Garantir que não estamos em modo de edição ao adicionar via scanner
    editingId.value = null
    await handleAddItem()
  } catch (error) {
    alert('Erro ao procurar o produto lido pela câmara.')
  } finally {
    isLoading.value = false
  }
}

// --- LÓGICA DE TESTE DAS APIs ---
async function testProduct() {
  if (!productId.value) return
  isLoading.value = true
  result.value = null
  try {
    result.value = await lookupProduct(productId.value)
  } catch (error) {
    result.value = { erro: 'Falha ao procurar produto.' }
  } finally {
    isLoading.value = false
  }
}

async function testRecipes() {
  isLoading.value = true
  result.value = null
  try {
    result.value = await searchRecipes(['tomato', 'cheese'], {
      diets: ['vegetarian'],
      allergies: ['peanut'],
      excludedIngredients: ['mushroom'],
    })
  } catch (error) {
    result.value = { erro: 'Falha ao procurar receitas.' }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="app-container">
    <header class="main-header">
      <h1>🛒 SmartPantry</h1>
      <p class="subtitle">Adiciona, edita e remove itens da tua despensa</p>
    </header>

    <main class="content-wrapper">
      <!-- ZONA 1: FORMULÁRIO DE ADICIONAR / EDITAR -->
      <section class="card pantry-card">
        <div class="card-header">
          <h2>{{ editingId ? '✏️ Editar Ingrediente' : '📦 Novo Ingrediente' }}</h2>
          <button
            v-if="!editingId"
            type="button"
            @click="toggleScanner"
            class="btn-icon"
            :class="{ active: isScannerOpen }"
            title="Ler código de barras"
            aria-label="Ler código de barras"
          >
            📷
          </button>
        </div>

        <div v-if="isScannerOpen && !editingId" class="scanner-wrapper">
          <BarcodeScanner @scanned="handleScan" />
        </div>

        <form @submit.prevent="handleAddItem" class="modern-form" novalidate>
          <div class="form-row">
            <div class="form-group flex-2">
              <label for="item-name">Produto</label>
              <input
                id="item-name"
                v-model="newItemName"
                type="text"
                placeholder="Ex: Arroz agulha..."
                autocomplete="off"
                enterkeyhint="next"
                :class="{ 'has-error': formErrors.name }"
              />
              <span v-if="formErrors.name" class="error-text">{{ formErrors.name }}</span>
            </div>

            <div class="form-group flex-1">
              <label for="item-category">Categoria</label>
              <select id="item-category" v-model="newItemCategory" :class="{ 'has-error': formErrors.category }">
                <option value="Dairy">Laticínios</option>
                <option value="Beverages">Bebidas</option>
                <option value="Other">Outro</option>
              </select>
              <span v-if="formErrors.category" class="error-text">{{ formErrors.category }}</span>
            </div>
          </div>

          <div class="form-row form-row-inline">
            <div class="form-group flex-1">
              <label for="item-qty">Quantidade</label>
              <input
                id="item-qty"
                v-model.number="newItemQty"
                type="number"
                inputmode="decimal"
                min="0.1"
                step="0.1"
                :class="{ 'has-error': formErrors.quantity }"
              />
              <span v-if="formErrors.quantity" class="error-text">{{ formErrors.quantity }}</span>
            </div>

            <div class="form-group flex-1">
              <label for="item-unit">Unidade</label>
              <select id="item-unit" v-model="newItemUnit" :class="{ 'has-error': formErrors.unit }">
                <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
              </select>
              <span v-if="formErrors.unit" class="error-text">{{ formErrors.unit }}</span>
            </div>
          </div>

          <!-- Botões dinâmicos consoante estejas a adicionar ou editar -->
          <div class="button-group">
            <button v-if="editingId" type="button" class="btn-secondary" @click="resetForm">Cancelar</button>
            <button type="submit" class="btn-primary" :class="{ 'btn-update': editingId }">
              {{ editingId ? 'Guardar' : 'Adicionar' }}
            </button>
          </div>
        </form>
      </section>

      <!-- ZONA 2: LISTA DA DESPENSA -->
      <section class="card list-card">
        <h2 class="list-title">📋 A Minha Despensa</h2>
        <ul class="pantry-list">
          <li v-if="pantryItems.length === 0" class="empty-msg">
            <div class="empty-icon">🍽️</div>
            A tua despensa está vazia. Adiciona produtos acima.
          </li>

          <li
            v-for="item in pantryItems"
            :key="item.id"
            class="pantry-item"
            :class="{ 'is-editing': editingId === item.id }"
          >
            <div class="item-main">
              <strong class="item-name">{{ item.name }}</strong>
              <span class="category-tag">
                {{ item.category === 'Dairy' ? '🧀 Laticínios' : item.category === 'Beverages' ? '🥤 Bebidas' : '📦 Outro' }}
              </span>
            </div>

            <div class="item-actions">
              <span class="qty-badge">{{ item.quantity }} {{ item.unit }}</span>
              <div class="action-buttons">
                <button type="button" @click="startEdit(item)" class="btn-action edit" title="Editar item" aria-label="Editar item">✏️</button>
                <button type="button" @click="removeItem(item.id)" class="btn-action delete" title="Remover item" aria-label="Remover item">🗑️</button>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <!-- ZONA 3: TESTES DA API -->
      <div class="api-grid">
        <section class="card api-card">
          <h2>🔍 Testar Produto (API)</h2>
          <div class="input-group">
            <input
              v-model="productId"
              type="text"
              inputmode="numeric"
              placeholder="Ex: 3017620422003"
              aria-label="Código de barras"
              @keyup.enter="testProduct"
            />
            <button type="button" class="btn-api" @click="testProduct" :disabled="isLoading">Procurar</button>
          </div>
        </section>

        <section class="card api-card">
          <h2>🍳 Testar Receitas (API)</h2>
          <button type="button" class="btn-api btn-full" @click="testRecipes" :disabled="isLoading">
            Procurar Receitas (Tomate, Queijo)
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
/* =========================================================
   MOBILE FIRST: estilos base = telemóvel.
   Ecrãs maiores via @media (min-width) no fim do ficheiro.
   ========================================================= */

/* CORES E VARIÁVEIS (:root não funciona em <style scoped>) */
.app-container {
  --primary: #42b883;
  --primary-dark: #33a06f;
  --bg-color: #f4f7f6;
  --card-bg: #ffffff;
  --text-main: #2c3e50;
  --text-muted: #7f8c8d;
  --border-color: #e2e8f0;
  --error: #e74c3c;
  --warning: #f39c12;
  --touch: 48px;
}

/* LAYOUT GLOBAL */
.app-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem max(1rem, env(safe-area-inset-right)) max(1.5rem, env(safe-area-inset-bottom))
    max(1rem, env(safe-area-inset-left));
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--text-main);
  box-sizing: border-box;
}

.app-container *,
.app-container *::before,
.app-container *::after {
  box-sizing: border-box;
}

.main-header {
  text-align: center;
  margin-bottom: 1.25rem;
}

.main-header h1 {
  font-size: 1.75rem;
  color: var(--primary);
  margin: 0 0 0.25rem 0;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* CARTÕES */
.card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.card h2 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--text-main);
}

.list-title {
  margin-bottom: 1rem !important;
}

/* BOTÃO CÂMARA */
.btn-icon {
  flex-shrink: 0;
  min-width: var(--touch);
  min-height: var(--touch);
  background: #f8f9fa;
  border: 1px solid var(--border-color);
  font-size: 1.3rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.btn-icon:active {
  background: #e2e8f0;
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

/* SCANNER */
.scanner-wrapper {
  margin-bottom: 1rem;
  border: 2px dashed var(--primary);
  border-radius: 12px;
  padding: 0.5rem;
  background-color: #f0fdf4;
  overflow: hidden;
}

/* FORMULÁRIO */
.modern-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Quantidade + Unidade lado a lado mesmo em mobile */
.form-row-inline {
  flex-direction: row;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

input,
select {
  width: 100%;
  min-height: var(--touch);
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  font-size: 16px; /* evita zoom automático no iOS */
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
  background-color: #fafafa;
  color: var(--text-main);
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--primary);
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.15);
}

input.has-error,
select.has-error {
  border-color: var(--error);
  background-color: #fdf2f2;
}

.error-text {
  color: var(--error);
  font-size: 0.8rem;
  font-weight: 500;
}

/* BOTÕES DO FORMULÁRIO */
.button-group {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
}

.btn-primary,
.btn-secondary {
  min-height: var(--touch);
  padding: 0.8rem 1.25rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.btn-primary {
  flex: 1;
  background-color: var(--primary);
  color: white;
  border: none;
}

.btn-primary:active {
  background-color: var(--primary-dark);
}

.btn-update {
  background-color: var(--warning);
}

.btn-update:active {
  background-color: #e67e22;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #475569;
  border: 1px solid var(--border-color);
}

.btn-secondary:active {
  background-color: #e2e8f0;
}

/* LISTA DA DESPENSA & AÇÕES (US-04) */
.pantry-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pantry-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.pantry-item.is-editing {
  border-color: var(--warning);
  background: #fffcf5;
}

.item-main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.item-name {
  font-size: 1.05rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.category-tag {
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  background: #e2e8f0;
  color: #475569;
  font-weight: 500;
  white-space: nowrap;
}

.item-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.qty-badge {
  background: var(--primary);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(66, 184, 131, 0.2);
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.btn-action {
  min-width: var(--touch);
  min-height: var(--touch);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  border-radius: 10px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.btn-action.edit:active { background: #e0f2fe; }
.btn-action.delete:active { background: #fee2e2; }

.empty-msg {
  text-align: center;
  color: var(--text-muted);
  padding: 2rem 1rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed var(--border-color);
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

/* FERRAMENTAS DA API */
.api-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.api-card h2 {
  font-size: 1.05rem;
  margin-bottom: 1rem;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.input-group input {
  flex: 1;
  min-width: 0;
}

.btn-api {
  min-height: var(--touch);
  background-color: #35495e;
  color: white;
  border: none;
  padding: 0.8rem 1.2rem;
  border-radius: 10px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.btn-api:active:not(:disabled) {
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
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.result-header {
  background: #2d2d2d;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #444;
}

.result-header h2 {
  margin: 0;
  color: #fff;
  font-size: 1rem;
}

.loading {
  padding: 1.5rem;
  text-align: center;
  color: var(--primary);
  font-weight: bold;
}

.json-viewer {
  margin: 0;
  padding: 1rem;
  color: #a6e22e;
  font-family: 'Fira Code', monospace;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 50vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* =========================================================
   DISPOSITIVOS COM RATO (hover real)
   ========================================================= */
@media (hover: hover) {
  .btn-icon:hover {
    background: #e2e8f0;
    transform: translateY(-2px);
  }
  .btn-icon.active:hover {
    background: var(--primary-dark);
  }
  .btn-primary:hover {
    background-color: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(66, 184, 131, 0.2);
  }
  .btn-update:hover {
    background-color: #e67e22;
    box-shadow: 0 4px 12px rgba(243, 156, 18, 0.2);
  }
  .btn-secondary:hover {
    background-color: #e2e8f0;
  }
  .pantry-item:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  }
  .btn-action.edit:hover { background: #e0f2fe; }
  .btn-action.delete:hover { background: #fee2e2; }
  .btn-api:hover:not(:disabled) {
    background-color: #2c3e50;
  }
}

/* =========================================================
   TABLET (>= 600px)
   ========================================================= */
@media (min-width: 600px) {
  .app-container {
    padding: 2rem 1.5rem;
  }

  .main-header {
    margin-bottom: 2.5rem;
  }

  .main-header h1 {
    font-size: 2.5rem;
    letter-spacing: -1px;
  }

  .subtitle {
    font-size: 1.1rem;
  }

  .content-wrapper {
    gap: 2rem;
  }

  .card {
    padding: 2rem;
    border-radius: 16px;
  }

  .card h2 {
    font-size: 1.4rem;
  }

  .card-header {
    margin-bottom: 1.5rem;
  }

  .scanner-wrapper {
    padding: 15px;
    margin-bottom: 1.5rem;
  }

  .form-row {
    flex-direction: row;
    align-items: flex-start;
  }

  .button-group {
    justify-content: flex-end;
  }

  .btn-primary {
    flex: 0 0 auto;
    min-width: 160px;
  }

  .pantry-item {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.2rem;
  }

  .item-main {
    gap: 1rem;
  }

  .item-actions {
    width: auto;
    gap: 1.5rem;
  }

  .btn-action {
    min-width: 40px;
    min-height: 40px;
  }

  .api-card h2 {
    font-size: 1.2rem;
  }

  .result-header {
    padding: 1rem 1.5rem;
  }

  .result-header h2 {
    font-size: 1.1rem;
  }

  .json-viewer {
    padding: 1.5rem;
    font-size: 0.95rem;
    max-height: 500px;
  }
}

/* =========================================================
   DESKTOP (>= 768px)
   ========================================================= */
@media (min-width: 768px) {
  .api-grid {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
}
</style>