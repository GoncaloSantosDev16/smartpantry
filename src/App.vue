<script setup>
import { ref } from 'vue'
import { lookupProduct } from '@/services/productsApi'
import { searchRecipes } from '@/services/recipesApi'

const result = ref(null)

async function testProduct() {
  result.value = await lookupProduct('3017620422003')
}

async function testRecipes() {
  result.value = await searchRecipes(['eggs', 'tomato', 'cheese'], {
    diets: ['vegetarian'],
    allergies: ['peanut'],
    excludedIngredients: ['mushroom'],
  })
}
</script>

<template>
  <h1>SmartPantry</h1>
  <button @click="testProduct">Testar produto</button>
  <button @click="testRecipes">Testar receitas</button>
  <pre>{{ result }}</pre>
</template>