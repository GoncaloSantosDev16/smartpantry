<script setup>
// US-13: detalhes de uma receita (SCRUM-97) e botão "Guardar" (SCRUM-98).
//   /recipes/:id      receita já guardada, lida do IndexedDB
//   /recipes/preview  receita ainda não guardada (ex.: acabada de gerar pela IA)
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useRecipesStore } from "@/stores/recipes";
import {
  formatDuration,
  formatQuantity,
  formatTimer,
  totalMinutes,
} from "@/services/recipeModel";
import { mealSummaryRoute } from "@/services/mealSummary";
import CookingCarousel from "@/components/CookingCarousel.vue";

const route = useRoute();
const router = useRouter();
const store = useRecipesStore();

const recipe = ref(null);
const status = ref("loading"); // loading | ready | not-found
const saving = ref(false);
const saveError = ref("");
// SCRUM-145: true enquanto o carrossel (Cook Mode) está aberto
const cooking = ref(false);

const isSaved = computed(() => recipe.value?.id !== undefined);
const total = computed(() => formatDuration(totalMinutes(recipe.value)));

async function loadRecipe() {
  saveError.value = "";
  cooking.value = false;

  if (route.name === "recipe-preview") {
    if (!store.preview) {
      // Sem receita para mostrar (ex.: recarregaram a página): volta ao início
      router.replace("/");
      return;
    }
    recipe.value = store.preview;
    status.value = "ready";
    return;
  }

  status.value = "loading";
  const id = Number(route.params.id);
  const found = Number.isInteger(id) ? await store.getById(id) : null;
  recipe.value = found;
  status.value = found ? "ready" : "not-found";
}

watch(() => route.fullPath, loadRecipe, { immediate: true });

async function save() {
  if (saving.value || isSaved.value) return;
  saving.value = true;
  saveError.value = "";
  try {
    const saved = await store.saveRecipe(recipe.value, {
      source: recipe.value.source,
    });
    recipe.value = saved;
    store.clearPreview();
    // O URL passa a apontar para a receita guardada: sobrevive a recarregar a página
    await router.replace({ name: "recipe-detail", params: { id: saved.id } });
  } catch (error) {
    console.error("Erro ao guardar a receita:", error);
    saveError.value = "Não foi possível guardar a receita. Tenta novamente.";
  } finally {
    saving.value = false;
  }
}

// SCRUM-130: fim da receita -> resumo dos ingredientes consumidos (o Cook Mode usa a mesma rota)
function finishRecipe() {
  router.push(mealSummaryRoute(recipe.value));
}

function goBack() {
  if (window.history.state?.back) router.back();
  else router.push("/");
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-6" data-testid="recipe-detail">
    <button
      type="button"
      class="mb-4 cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-gray-500 hover:text-gray-800"
      data-testid="recipe-back"
      @click="goBack"
    >
      ← Voltar
    </button>

    <p
      v-if="status === 'loading'"
      class="text-gray-500"
      data-testid="recipe-loading"
    >
      A carregar receita…
    </p>

    <div
      v-else-if="status === 'not-found'"
      class="card text-center"
      data-testid="recipe-not-found"
    >
      <p class="mt-0">Receita não encontrada.</p>
      <RouterLink to="/" class="font-semibold text-[#33a06f]"
        >Voltar ao início</RouterLink
      >
    </div>

    <!-- SCRUM-145: o carrossel ocupa o lugar do detalhe; o "Concluir" do último passo
         usa o mesmo finishRecipe (e o mesmo data-testid) que o botão do detalhe. -->
    <CookingCarousel
      v-else-if="cooking"
      :recipe="recipe"
      @close="cooking = false"
      @finish="finishRecipe"
    />

    <article v-else class="card flex flex-col gap-6">
      <header class="flex flex-col gap-3">
        <h1
          class="m-0 text-3xl font-extrabold text-gray-800"
          data-testid="recipe-title"
        >
          {{ recipe.title }}
        </h1>
        <p
          v-if="recipe.description"
          class="m-0 text-gray-500"
          data-testid="recipe-description"
        >
          {{ recipe.description }}
        </p>

        <ul
          class="m-0 flex list-none flex-wrap gap-2 p-0 text-sm"
          data-testid="recipe-meta"
        >
          <li
            v-if="recipe.prepTimeMinutes != null"
            class="rounded-full bg-slate-100 px-3 py-1"
          >
            Preparação: {{ formatDuration(recipe.prepTimeMinutes) }}
          </li>
          <li
            v-if="recipe.cookTimeMinutes != null"
            class="rounded-full bg-slate-100 px-3 py-1"
          >
            Cozedura: {{ formatDuration(recipe.cookTimeMinutes) }}
          </li>
          <li v-if="total" class="rounded-full bg-slate-100 px-3 py-1">
            Total: {{ total }}
          </li>
          <li
            v-if="recipe.servings"
            class="rounded-full bg-slate-100 px-3 py-1"
          >
            {{ recipe.servings }} {{ recipe.servings === 1 ? "dose" : "doses" }}
          </li>
        </ul>

        <div class="flex flex-col gap-2">
          <span
            v-if="isSaved"
            class="font-semibold text-[#33a06f]"
            data-testid="saved-badge"
            >✓ Receita guardada</span
          >
          <button
            v-else
            type="button"
            class="btn-primary self-start"
            data-testid="save-recipe"
            :disabled="saving"
            @click="save"
          >
            {{ saving ? "A guardar…" : "Guardar receita" }}
          </button>
          <p
            v-if="saveError"
            class="m-0 text-sm font-medium text-red-500"
            role="alert"
            data-testid="save-error"
          >
            {{ saveError }}
          </p>
        </div>
      </header>

      <section>
        <h2 class="mt-0 text-xl font-bold text-gray-800">Ingredientes</h2>
        <ul class="m-0 flex list-none flex-col gap-2 p-0">
          <li
            v-for="(ingredient, index) in recipe.ingredients"
            :key="index"
            class="flex gap-2 rounded-lg bg-slate-50 px-3 py-2"
            data-testid="recipe-ingredient"
          >
            <span
              v-if="formatQuantity(ingredient)"
              class="font-semibold text-[#33a06f]"
            >
              {{ formatQuantity(ingredient) }}
            </span>
            <span>{{ ingredient.name }}</span>
          </li>
        </ul>
      </section>

      <section>
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 class="m-0 text-xl font-bold text-gray-800">Passos</h2>
          <button
            v-if="recipe.steps.length > 0"
            type="button"
            class="btn-primary"
            data-testid="start-cooking"
            @click="cooking = true"
          >
            👨‍🍳 Começar a cozinhar
          </button>
        </div>
        <p
          v-if="recipe.steps.length === 0"
          class="m-0 text-gray-500"
          data-testid="recipe-no-steps"
        >
          Esta receita não tem passos.
        </p>
        <ol v-else class="m-0 flex list-decimal flex-col gap-3 pl-6">
          <li
            v-for="(step, index) in recipe.steps"
            :key="index"
            data-testid="recipe-step"
          >
            {{ step.text }}
            <span
              v-if="step.timerSeconds"
              class="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
              data-testid="recipe-step-timer"
            >
              ⏱ {{ formatTimer(step.timerSeconds) }}
            </span>
          </li>
        </ol>
      </section>

      <footer class="border-t border-slate-100 pt-4">
        <button
          type="button"
          class="btn-primary w-full"
          data-testid="finish-recipe"
          @click="finishRecipe"
        >
          🍽️ Concluir receita
        </button>
      </footer>
    </article>
  </div>
</template>
