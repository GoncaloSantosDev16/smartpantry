<script setup>
// US-09 — Pesquisar receitas com base na despensa (Spoonacular).
//   SCRUM-116: lista de ingredientes da despensa -> buildPantryIngredientList
//   SCRUM-117: pesquisa no Spoonacular            -> discoverRecipes
//   SCRUM-118: resultados em grelha               -> toRecipeCards + RecipeCard
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { db } from '@/db'
import { useProfilesStore } from '@/stores/profiles'
import { useRecipeGenerator } from '@/composables/useRecipeGenerator'
import { discoverRecipes } from '@/services/recipeDiscovery'
import { buildPantryIngredientList } from '@/services/pantryIngredients'
import { toRecipeCards } from '@/services/recipeCards'
import GenAIStatus from '@/components/GenAIStatus.vue'
import RecipeCard from '@/components/RecipeCard.vue'

const profiles = useProfilesStore()

const pantry = ref([])
const pantryLoaded = ref(false)
const pantryError = ref(false)

// O composable só gere loading/erro/cancelamento; a resposta fica em `result`.
const { loading, error, recipe: result, generate, cancel } = useRecipeGenerator(async (input, options) => {
  const response = await discoverRecipes(input, options)
  return response.status === 'ok' ? { status: 'ok', recipe: response } : response
})

const cards = computed(() => (result.value ? toRecipeCards(result.value.recipes, result.value.pantryNames) : []))
const noResults = computed(() => !loading.value && result.value !== null && cards.value.length === 0)
const canSearch = computed(() => pantry.value.length > 0 && !loading.value)

onMounted(async () => {
  try {
    pantry.value = buildPantryIngredientList(await db.pantryItems.toArray())
  } catch (err) {
    pantryError.value = true
    console.error('Erro ao carregar a despensa:', err)
  } finally {
    pantryLoaded.value = true
  }
})

onBeforeUnmount(cancel)

function search() {
  if (!canSearch.value) return
  const p = profiles.activeProfile ?? {}
  generate({
    ingredients: pantry.value,
    profile: { diets: p.diets, allergies: p.allergies, excludedIngredients: p.excludedIngredients },
  })
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-6 font-sans text-gray-800" data-testid="recipes-view">
    <header class="mb-6 flex items-center gap-3">
      <RouterLink
        to="/"
        data-testid="recipes-back"
        aria-label="Voltar"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-lg"
      >
        ←
      </RouterLink>
      <div>
        <h1 class="m-0 text-2xl font-extrabold text-[#42b883]">🍳 Receitas com a tua despensa</h1>
        <p v-if="profiles.activeProfile" class="m-0 text-sm text-gray-500">
          Perfil: {{ profiles.activeProfile.name }}
        </p>
      </div>
    </header>

    <section class="card mb-6">
      <h2 class="m-0 mb-3 text-lg font-bold">
        📦 Na despensa <span class="font-normal text-gray-500">({{ pantry.length }})</span>
      </h2>

      <p v-if="pantryError" class="m-0 text-red-600" role="alert">Não foi possível ler a despensa.</p>

      <p
        v-else-if="pantryLoaded && pantry.length === 0"
        data-testid="recipes-empty-pantry"
        class="m-0 text-gray-500"
      >
        A tua despensa está vazia. Adiciona produtos para procurar receitas.
      </p>

      <ul v-else class="m-0 flex list-none flex-wrap gap-1.5 p-0">
        <li
          v-for="item in pantry"
          :key="`${item.name}|${item.unit}`"
          data-testid="pantry-ingredient"
          class="rounded-full bg-slate-100 px-2.5 py-1 text-sm"
        >
          {{ item.name }} <span class="text-gray-500">· {{ item.quantity }} {{ item.unit }}</span>
        </li>
      </ul>

      <button
        type="button"
        data-testid="recipes-search"
        class="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        :disabled="!canSearch"
        @click="search"
      >
        🔍 Procurar receitas
      </button>
    </section>

    <GenAIStatus
      :loading="loading"
      :error="error"
      loading-text="A procurar receitas com a tua despensa…"
      @cancel="cancel"
      @retry="search"
    />

    <p v-if="noResults" data-testid="recipes-no-results" class="py-8 text-center text-gray-500">
      Não foram encontradas receitas com estes ingredientes.
    </p>

    <section
      v-if="!loading && cards.length > 0"
      data-testid="recipes-grid"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <RecipeCard v-for="card in cards" :key="card.id" :card="card" />
    </section>
  </div>
</template>
