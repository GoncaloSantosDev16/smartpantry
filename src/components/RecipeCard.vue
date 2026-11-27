<script setup>
// SCRUM-118 — Cartão de uma receita encontrada no Spoonacular.
// SCRUM-125 — Botão "Adicionar N à lista de compras" com os ingredientes em falta.
// SCRUM-126 — O botão envia-os para a Store da Lista de Compras.
// SCRUM-128 — O "+" de cada ingrediente em falta pede para o pôr na despensa.
// SCRUM-115 — Indicador da % de ingredientes que já existem na despensa.
import { computed, onMounted, ref } from "vue";
import { missingIngredients } from "@/services/missingIngredients";
import {
  notOnShoppingList,
  sendToShoppingList,
} from "@/services/recipeShopping";
import { useShoppingListStore } from "@/stores/shoppingList";

const props = defineProps({
  card: { type: Object, required: true },
});
const emit = defineEmits(["added-to-shopping-list", "add-to-pantry"]);

const shopping = useShoppingListStore();
const sending = ref(false);
const sendError = ref("");

// Para saber o que já está na lista, mesmo antes de se abrir o carrinho.
onMounted(() => shopping.load());

// SCRUM-124: ingredientes da receita que não estão na despensa.
const missing = computed(() => missingIngredients(props.card));
// Os que ainda não estão na lista por comprar (são esses que o botão envia).
const toAdd = computed(() =>
  notOnShoppingList(missing.value, shopping.pendingItems),
);
const toAddNames = computed(() => toAdd.value.map((i) => i.name).join(", "));

async function addMissing() {
  if (sending.value || toAdd.value.length === 0) return;
  sending.value = true;
  sendError.value = "";
  try {
    const added = await sendToShoppingList(shopping, toAdd.value);
    emit("added-to-shopping-list", added);
  } catch (err) {
    console.error("Erro ao adicionar à lista de compras:", err);
    sendError.value = "Não foi possível adicionar à lista de compras.";
  } finally {
    sending.value = false;
  }
}

// SCRUM-115 — Verde: tens tudo; âmbar: metade ou mais; cinzento: menos de metade.
const coverageTone = computed(() => {
  if (props.card.percent >= 100) return { text: "text-green-700", bar: "bg-green-500" };
  if (props.card.percent >= 50) return { text: "text-amber-700", bar: "bg-amber-400" };
  return { text: "text-gray-600", bar: "bg-gray-400" };
});
</script>

<template>
  <article
    data-testid="recipe-card"
    :data-title="card.title"
    :data-matched="card.matched"
    :data-total="card.ingredients.length"
    :data-percent="card.percent"
    class="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
  >
    <img
      v-if="card.image"
      :src="card.image"
      :alt="card.title"
      loading="lazy"
      class="aspect-[4/3] w-full object-cover"
    />

    <div class="flex flex-1 flex-col gap-3 p-4">
      <h3
        class="m-0 text-lg font-bold text-gray-800"
        data-testid="recipe-title"
      >
        {{ card.title }}
      </h3>

      <!-- SCRUM-115: indicador de progresso -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-sm">
          <span data-testid="recipe-coverage-text" class="font-semibold" :class="coverageTone.text">{{ card.coverageText }}</span>
          <span class="text-xs text-gray-500">{{ card.matched }}/{{ card.ingredients.length }}</span>
        </div>
        <div
          data-testid="recipe-coverage-bar"
          role="progressbar"
          :aria-valuenow="card.percent"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="card.coverageText"
          class="h-2 w-full overflow-hidden rounded-full bg-gray-100"
        >
          <div class="h-full rounded-full transition-[width] duration-500" :class="coverageTone.bar" :style="{ width: `${card.percent}%` }"></div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 text-xs font-medium text-gray-600">
        <span
          v-if="card.totalMinutes !== null"
          class="rounded-full bg-slate-100 px-2 py-1"
          >⏱ {{ card.totalMinutes }} min</span
        >
        <span v-if="card.servings" class="rounded-full bg-slate-100 px-2 py-1"
          >🍽 {{ card.servings }} doses</span
        >
      </div>

      <ul class="m-0 flex list-none flex-wrap gap-1.5 p-0">
        <li
          v-for="(ingredient, index) in card.ingredients"
          :key="`${index}-${ingredient.name}`"
          data-testid="recipe-ingredient"
          :data-name="ingredient.name"
          :data-in-pantry="ingredient.inPantry"
          class="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
          :class="
            ingredient.inPantry
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-gray-200 text-gray-400'
          "
          :title="
            ingredient.inPantry ? 'Tens na despensa' : 'Falta na despensa'
          "
        >
          <span v-if="ingredient.inPantry">✓</span>
          <!-- SCRUM-128: o "+" manda o ingrediente diretamente para a despensa. -->
          <button
            v-else
            type="button"
            data-testid="recipe-ingredient-to-pantry"
            :aria-label="`Adicionar ${ingredient.name} à despensa`"
            title="Adicionar à despensa"
            class="-ml-1 flex h-5 w-5 items-center justify-center rounded-full font-bold text-[#42b883] hover:bg-green-50 active:scale-90"
            @click="emit('add-to-pantry', ingredient)"
          >
            +
          </button>
          {{ ingredient.name }}
          <span v-if="ingredient.amount" class="opacity-70"
            >· {{ ingredient.amount }}</span
          >
        </li>
      </ul>

      <template v-if="missing.length > 0">
        <button
          v-if="toAdd.length > 0"
          type="button"
          data-testid="recipe-add-missing"
          :data-count="toAdd.length"
          :title="toAddNames"
          :disabled="sending"
          class="rounded-xl border border-[#42b883] px-3 py-2 text-sm font-semibold text-[#42b883] active:scale-95 disabled:opacity-50"
          @click="addMissing"
        >
          🛒 Adicionar {{ toAdd.length }} à lista de compras
        </button>
        <p
          v-else
          data-testid="recipe-missing-on-list"
          class="m-0 rounded-xl bg-green-50 px-3 py-2 text-center text-sm font-semibold text-green-700"
        >
          ✓ Na lista de compras
        </p>
        <p
          v-if="sendError"
          data-testid="recipe-add-missing-error"
          class="m-0 text-sm text-red-600"
          role="alert"
        >
          {{ sendError }}
        </p>
      </template>

      <details v-if="card.steps.length" class="mt-auto text-sm">
        <summary
          class="cursor-pointer font-semibold text-[#42b883]"
          data-testid="recipe-steps-toggle"
        >
          Ver passos ({{ card.steps.length }})
        </summary>
        <ol class="mt-2 flex flex-col gap-1.5 pl-5">
          <li v-for="(step, index) in card.steps" :key="index">
            {{ step.text }}
          </li>
        </ol>
      </details>
    </div>
  </article>
</template>
