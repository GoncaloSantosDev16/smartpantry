<script setup>
// US-16 / SCRUM-100: ecrã "Receitas Guardadas". Lê sempre diretamente do IndexedDB
// (Dexie), por isso funciona sem ligação à internet.
import { onMounted, ref } from 'vue'
import { useRecipesStore } from '@/stores/recipes'
import { formatDuration, totalMinutes } from '@/services/recipeModel'

const store = useRecipesStore()
const loading = ref(true)

onMounted(async () => {
  await store.load({ forcar: true })
  loading.value = false
})

function summary(recipe) {
  const parts = []
  const total = totalMinutes(recipe)
  if (total !== null) parts.push(formatDuration(total))
  if (recipe.servings) parts.push(`${recipe.servings} ${recipe.servings === 1 ? 'dose' : 'doses'}`)
  parts.push(`${recipe.ingredients.length} ${recipe.ingredients.length === 1 ? 'ingrediente' : 'ingredientes'}`)
  return parts.join(' · ')
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-6" data-testid="recipes-screen">
    <RouterLink to="/" class="mb-4 inline-block text-sm font-semibold text-gray-500 hover:text-gray-800">
      ← Início
    </RouterLink>
    <h1 class="mb-6 mt-0 text-3xl font-extrabold text-gray-800">📖 Receitas Guardadas</h1>

    <p v-if="loading" class="text-gray-500" data-testid="recipes-loading">A carregar receitas…</p>

    <p v-else-if="store.error" class="font-medium text-red-500" role="alert" data-testid="recipes-error">
      Não foi possível ler as receitas guardadas neste dispositivo.
    </p>

    <div
      v-else-if="store.recipes.length === 0"
      class="rounded-xl border-2 border-dashed border-gray-200 bg-slate-50 px-4 py-12 text-center text-gray-500"
      data-testid="recipes-empty"
    >
      <div class="mb-2 text-4xl opacity-50">📖</div>
      Ainda não guardaste nenhuma receita.
    </div>

    <ul v-else class="m-0 flex list-none flex-col gap-3 p-0">
      <li v-for="recipe in store.recipes" :key="recipe.id">
        <RouterLink
          :to="{ name: 'recipe-detail', params: { id: recipe.id } }"
          class="flex flex-col gap-1 rounded-xl border border-gray-200 bg-slate-50 p-4 text-inherit no-underline transition-colors hover:border-slate-300"
          data-testid="recipe-card"
        >
          <strong class="text-lg text-gray-800" data-testid="recipe-card-title">{{ recipe.title }}</strong>
          <span class="text-sm text-gray-500" data-testid="recipe-card-summary">{{ summary(recipe) }}</span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
