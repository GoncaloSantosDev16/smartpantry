<script setup>
// US-09 — Pesquisar receitas com base na despensa (Spoonacular).
//   SCRUM-116: lista de ingredientes da despensa -> buildPantryIngredientList
//   SCRUM-117: pesquisa no Spoonacular            -> discoverRecipes
//   SCRUM-118: resultados em grelha               -> toRecipeCards + RecipeCard
//   SCRUM-128: o "+" de um ingrediente em falta põe-no na despensa -> addToPantry
//   SCRUM-41 / SCRUM-37: guardar sugestão no livro de receitas -> saveRecipe
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { db } from "@/db";
import { useProfilesStore } from "@/stores/profiles";
import { usePantryStore } from "@/stores/pantry";
import { useRecipesStore } from "@/stores/recipes";
import { useRecipeGenerator } from "@/composables/useRecipeGenerator";
import { discoverRecipes } from "@/services/recipeDiscovery";
import { buildPantryIngredientList } from "@/services/pantryIngredients";
import { toRecipeCards } from "@/services/recipeCards";
import { toPantryItem } from "@/services/recipePantry";
import GenAIStatus from "@/components/GenAIStatus.vue";
import RecipeCard from "@/components/RecipeCard.vue";
import PersonalFiltersToggle from "@/components/PersonalFiltersToggle.vue";
import ShoppingListButton from "@/components/ShoppingListButton.vue";
import ShoppingListDrawer from "@/components/ShoppingListDrawer.vue";

const profiles = useProfilesStore();
const pantryStore = usePantryStore();
const recipesStore = useRecipesStore();

const pantry = ref([]);
const pantryLoaded = ref(false);
const pantryError = ref(false);

const addedToPantry = ref([]);
const addingToPantry = new Set();
const pantryAddError = ref("");
const isShoppingListOpen = ref(false);
const savingRecipeIds = ref(new Set());

const {
  loading,
  error,
  recipe: result,
  generate,
  cancel,
} = useRecipeGenerator(async (input, options) => {
  const response = await discoverRecipes(input, options);
  return response.status === "ok"
    ? { status: "ok", recipe: response }
    : response;
});

const cards = computed(() =>
  result.value
    ? toRecipeCards(result.value.recipes, [
        ...result.value.pantryNames,
        ...addedToPantry.value,
      ])
    : [],
);
const noResults = computed(
  () => !loading.value && result.value !== null && cards.value.length === 0,
);
const canSearch = computed(() => pantry.value.length > 0 && !loading.value);

const savedExternalIds = computed(() => {
  const ids = new Set();
  for (const r of recipesStore.recipes) {
    if (r.externalId !== undefined && r.externalId !== null) {
      ids.add(String(r.externalId));
    }
  }
  return ids;
});

function isRecipeSaved(card) {
  return savedExternalIds.value.has(String(card.id));
}

async function handleSaveRecipe(card) {
  const key = String(card.id);
  if (savingRecipeIds.value.has(key) || isRecipeSaved(card)) return;

  const next = new Set(savingRecipeIds.value);
  next.add(key);
  savingRecipeIds.value = next;

  try {
    const raw =
      result.value?.recipes?.find((r) => String(r.id) === key) ?? card;
    await recipesStore.saveRecipe(raw, { source: "spoonacular" });
  } catch (err) {
    console.error("Erro ao guardar receita:", err);
  } finally {
    const after = new Set(savingRecipeIds.value);
    after.delete(key);
    savingRecipeIds.value = after;
  }
}

async function readPantry() {
  pantry.value = buildPantryIngredientList(await db.pantryItems.toArray());
}

onMounted(async () => {
  try {
    await Promise.all([readPantry(), recipesStore.load({ forcar: true })]);
  } catch (err) {
    pantryError.value = true;
    console.error("Erro ao carregar a despensa:", err);
  } finally {
    pantryLoaded.value = true;
  }
});

onBeforeUnmount(cancel);

async function addToPantry(ingredient) {
  const item = toPantryItem(ingredient?.name);
  if (!item || addingToPantry.has(ingredient.name)) return;
  addingToPantry.add(ingredient.name);
  pantryAddError.value = "";
  try {
    await pantryStore.addItem(item);
    addedToPantry.value.push(ingredient.name);
    await readPantry();
  } catch (err) {
    console.error("Erro ao adicionar à despensa:", err);
    pantryAddError.value = `Não foi possível adicionar ${item.name} à despensa.`;
  } finally {
    addingToPantry.delete(ingredient.name);
  }
}

function search() {
  if (!canSearch.value) return;
  generate({
    ingredients: pantry.value,
    profile: profiles.activeRequestProfile,
  });
}
</script>

<template>
  <div
    class="mx-auto max-w-5xl px-4 py-6 font-sans text-gray-800"
    data-testid="recipes-view"
  >
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
        <h1 class="m-0 text-2xl font-extrabold text-[#42b883]">
          🍳 Receitas com a tua despensa
        </h1>
        <p v-if="profiles.activeProfile" class="m-0 text-sm text-gray-500">
          Perfil: {{ profiles.activeProfile.name }}
        </p>
      </div>

      <div class="ml-auto">
        <ShoppingListButton @open="isShoppingListOpen = true" />
      </div>
    </header>

    <ShoppingListDrawer v-model:open="isShoppingListOpen" />

    <PersonalFiltersToggle />
    <section class="card mb-6">
      <h2 class="m-0 mb-3 text-lg font-bold">
        📦 Na despensa
        <span class="font-normal text-gray-500">({{ pantry.length }})</span>
      </h2>

      <p v-if="pantryError" class="m-0 text-red-600" role="alert">
        Não foi possível ler a despensa.
      </p>

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
          {{ item.name }}
          <span class="text-gray-500"
            >· {{ item.quantity }} {{ item.unit }}</span
          >
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

    <p
      v-if="noResults"
      data-testid="recipes-no-results"
      class="py-8 text-center text-gray-500"
    >
      Não foram encontradas receitas com estes ingredientes.
    </p>

    <p
      v-if="pantryAddError"
      data-testid="recipes-pantry-add-error"
      class="mb-4 text-red-600"
      role="alert"
    >
      {{ pantryAddError }}
    </p>

    <section
      v-if="!loading && cards.length > 0"
      data-testid="recipes-grid"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <RecipeCard
        v-for="card in cards"
        :key="card.id"
        :card="card"
        :saved="isRecipeSaved(card)"
        :saving="savingRecipeIds.has(String(card.id))"
        @add-to-pantry="addToPantry"
        @save="handleSaveRecipe"
      />
    </section>
  </div>
</template>