<script setup>
// SCRUM-118 — Cartão de uma receita encontrada no Spoonacular.
// SCRUM-115 — Indicador da % de ingredientes que já existem na despensa.
import { computed } from 'vue'

const props = defineProps({
  card: { type: Object, required: true },
})

// Verde: tens tudo; âmbar: metade ou mais; cinzento: menos de metade.
const coverageTone = computed(() => {
  if (props.card.percent >= 100) return { text: 'text-green-700', bar: 'bg-green-500' }
  if (props.card.percent >= 50) return { text: 'text-amber-700', bar: 'bg-amber-400' }
  return { text: 'text-gray-600', bar: 'bg-gray-400' }
})
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
      <h3 class="m-0 text-lg font-bold text-gray-800" data-testid="recipe-title">{{ card.title }}</h3>

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
        <span v-if="card.totalMinutes !== null" class="rounded-full bg-slate-100 px-2 py-1">⏱ {{ card.totalMinutes }} min</span>
        <span v-if="card.servings" class="rounded-full bg-slate-100 px-2 py-1">🍽 {{ card.servings }} doses</span>
      </div>

      <ul class="m-0 flex list-none flex-wrap gap-1.5 p-0">
        <li
          v-for="(ingredient, index) in card.ingredients"
          :key="`${index}-${ingredient.name}`"
          data-testid="recipe-ingredient"
          :data-name="ingredient.name"
          :data-in-pantry="ingredient.inPantry"
          class="rounded-full border px-2 py-0.5 text-xs"
          :class="ingredient.inPantry ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400'"
          :title="ingredient.inPantry ? 'Tens na despensa' : 'Falta na despensa'"
        >
          {{ ingredient.inPantry ? '✓' : '+' }} {{ ingredient.name }}
          <span v-if="ingredient.amount" class="opacity-70">· {{ ingredient.amount }}</span>
        </li>
      </ul>

      <details v-if="card.steps.length" class="mt-auto text-sm">
        <summary class="cursor-pointer font-semibold text-[#42b883]" data-testid="recipe-steps-toggle">
          Ver passos ({{ card.steps.length }})
        </summary>
        <ol class="mt-2 flex flex-col gap-1.5 pl-5">
          <li v-for="(step, index) in card.steps" :key="index">{{ step.text }}</li>
        </ol>
      </details>
    </div>
  </article>
</template>
