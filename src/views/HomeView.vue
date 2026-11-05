<script setup>
import { ref } from 'vue'
import { lookupProduct } from '@/services/productsApi'
import { searchRecipes } from '@/services/recipesApi'

const result = ref(null)
const productId = ref('3017620422003') 
const isLoading = ref(false) // Adicionei um estado de carregamento para melhor feedback

async function testProduct() {
  if (!productId.value) return;
  
  isLoading.value = true
  result.value = null // Limpa o resultado anterior
  try {
    result.value = await lookupProduct(productId.value)
  } catch (error) {
    result.value = { erro: "Falha ao procurar o produto." }
  } finally {
    isLoading.value = false
  }
}

async function testRecipes() {
  isLoading.value = true
  result.value = null
  try {
    result.value = await searchRecipes(['eggs', 'tomato', 'cheese'], {
      diets: ['vegetarian'],
      allergies: ['peanut'],
      excludedIngredients: ['mushroom'],
    })
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
      <h1>🛒 SmartPantry <span class="subtitle">API Tester</span></h1>
    </header>

    <main class="grid-layout">
      <!-- Cartão para testar produtos -->
      <section class="card">
        <h2>🔍 Testar Produto</h2>
        <p class="description">Procura por código de barras</p>
        <div class="input-group">
          <input 
            v-model="productId" 
            type="text" 
            placeholder="Ex: 3017620422003" 
          />
          <button @click="testProduct" :disabled="isLoading">
            Procurar
          </button>
        </div>
      </section>

      <!-- Cartão para testar receitas -->
      <section class="card">
        <h2>🍳 Testar Receitas</h2>
        <p class="description">Pesquisa predefinida (ovos, tomate, queijo)</p>
        <button @click="testRecipes" class="btn-secondary" :disabled="isLoading">
          Procurar Receitas
        </button>
      </section>
    </main>

    <!-- Área de resultados -->
    <section class="result-area" v-if="isLoading || result">
      <div class="result-header">
        <h2>📦 Resultado da API:</h2>
      </div>
      
      <div v-if="isLoading" class="loading">A carregar os dados...</div>
      
      <pre v-else class="json-viewer">{{ result }}</pre>
    </section>
  </div>
</template>

<style scoped>
/* Reset básico e tipografia */
.app-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #2c3e50;
}

header h1 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #42b883; /* Verde Vue.js */
}

.subtitle {
  font-weight: 300;
  color: #666;
  font-size: 1.5rem;
}

/* Layout em Grelha */
.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Estilo dos Cartões (Cards) */
.card {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #eaeaea;
  display: flex;
  flex-direction: column;
}

.card h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.description {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

/* Inputs e Botões */
.input-group {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #42b883;
}

button {
  padding: 0.75rem 1.25rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  background-color: #33a06f;
  transform: translateY(-1px);
}

button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #35495e;
  margin-top: auto;
  width: 100%;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #2c3e50;
}

/* Área de Visualização do Resultado */
.result-area {
  background: #1e1e1e;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
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
  color: #42b883;
  font-weight: bold;
}

.json-viewer {
  margin: 0;
  padding: 1.5rem;
  color: #a6e22e; /* Cor típica de código JSON (verde claro) */
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
  font-size: 0.95rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 500px;
  overflow-y: auto;
}
</style>