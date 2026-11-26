<script setup>
// SCRUM-145 — Carrossel "Cook Mode": um passo de cada vez, com os ingredientes
// desse passo (SCRUM-144) e o temporizador, navegação Anterior/Seguinte e
// deslizar com o dedo. No último passo o botão "Concluir" usa o mesmo
// data-testid="finish-recipe" do detalhe da receita (US-21): emite "finish" e é
// a página que abre o resumo dos ingredientes consumidos.
import { computed, ref } from "vue";
import { formatQuantity, formatTimer } from "@/services/recipeModel";
import { stepsWithIngredients } from "@/services/stepIngredients";

const props = defineProps({
  recipe: { type: Object, required: true },
});
const emit = defineEmits(["close", "finish"]);

// Distância mínima (px) para um gesto contar como deslizar.
const SWIPE_DISTANCE = 50;

const steps = computed(() => stepsWithIngredients(props.recipe));
const index = ref(0);
const step = computed(() => steps.value[index.value]);
const isFirst = computed(() => index.value === 0);
const isLast = computed(() => index.value === steps.value.length - 1);
const progress = computed(() =>
  Math.round(((index.value + 1) / steps.value.length) * 100),
);

function next() {
  if (!isLast.value) index.value++;
}

function previous() {
  if (!isFirst.value) index.value--;
}

// Deslizar: para a esquerda avança, para a direita recua.
let startX = null;

function onPointerDown(event) {
  startX = event.clientX;
}

function onPointerUp(event) {
  if (startX === null) return;
  const distance = event.clientX - startX;
  startX = null;
  if (distance <= -SWIPE_DISTANCE) next();
  else if (distance >= SWIPE_DISTANCE) previous();
}
</script>

<template>
  <section
    v-if="step"
    class="card flex flex-col gap-5"
    data-testid="cooking-carousel"
    :data-step="index + 1"
    :data-total="steps.length"
  >
    <header class="flex items-center justify-between gap-3">
      <div class="flex flex-col">
        <span class="text-sm font-semibold text-gray-500">{{
          recipe.title
        }}</span>
        <h2
          class="m-0 text-xl font-bold text-gray-800"
          data-testid="cooking-step-counter"
        >
          Passo {{ index + 1 }} de {{ steps.length }}
        </h2>
      </div>
      <button
        type="button"
        class="cursor-pointer rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-500 hover:text-gray-800"
        data-testid="cooking-close"
        @click="emit('close')"
      >
        ✕ Sair
      </button>
    </header>

    <div
      class="h-2 overflow-hidden rounded-full bg-slate-100"
      aria-hidden="true"
    >
      <div
        class="h-full rounded-full bg-[#42b883] transition-all"
        :style="{ width: `${progress}%` }"
      />
    </div>

    <div
      class="flex min-h-48 select-none flex-col gap-4 rounded-2xl bg-slate-50 p-5"
      style="touch-action: pan-y"
      data-testid="cooking-step"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointercancel="startX = null"
    >
      <p
        class="m-0 text-lg leading-relaxed text-gray-800"
        data-testid="cooking-step-text"
      >
        {{ step.text }}
      </p>

      <span
        v-if="step.timerSeconds"
        class="self-start rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700"
        data-testid="cooking-step-timer"
      >
        ⏱ {{ formatTimer(step.timerSeconds) }}
      </span>

      <div>
        <h3
          class="m-0 mb-2 text-sm font-bold uppercase tracking-wide text-gray-500"
        >
          Ingredientes deste passo
        </h3>
        <ul
          v-if="step.ingredients.length > 0"
          class="m-0 flex list-none flex-wrap gap-2 p-0"
        >
          <li
            v-for="(ingredient, i) in step.ingredients"
            :key="`${i}-${ingredient.name}`"
            class="flex gap-1 rounded-full border border-green-200 bg-white px-3 py-1 text-sm"
            data-testid="cooking-step-ingredient"
            :data-name="ingredient.name"
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
        <p
          v-else
          class="m-0 text-sm text-gray-500"
          data-testid="cooking-step-no-ingredients"
        >
          Este passo não usa ingredientes da lista.
        </p>
      </div>
    </div>

    <footer class="flex gap-3">
      <button
        type="button"
        class="flex-1 cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
        data-testid="cooking-previous"
        :disabled="isFirst"
        @click="previous"
      >
        ← Anterior
      </button>
      <button
        v-if="!isLast"
        type="button"
        class="btn-primary flex-1"
        data-testid="cooking-next"
        @click="next"
      >
        Seguinte →
      </button>
      <!-- Mesmo data-testid do botão do detalhe: os testes da US-21 entram por aqui. -->
      <button
        v-else
        type="button"
        class="btn-primary flex-1"
        data-testid="finish-recipe"
        @click="emit('finish')"
      >
        ✓ Concluir
      </button>
    </footer>
  </section>
</template>
