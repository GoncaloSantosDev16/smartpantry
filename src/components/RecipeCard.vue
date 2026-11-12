<script setup>
// SCRUM-118 — Cartão de uma receita encontrada no Spoonacular.
defineProps({
  card: { type: Object, required: true },
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

      <div class="flex flex-wrap gap-2 text-xs font-medium text-gray-600">
        <span
          data-testid="recipe-match"
          class="rounded-full px-2 py-1"
          :class="card.missing === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
        >
          {{ card.percent }}% na despensa · {{ card.matched }}/{{ card.ingredients.length }}
        </span>
        <span v-if="card.totalMinutes !== null" class="rounded-full bg-slate-100 px-2 py-1">⏱ {{ card.totalMinutes }} min</span>
        <span v-if="card.servings" class="rounded-full bg-slate-100 px-2 py-1">🍽 {{ card.servings }} doses</span>
      </div>

      <ul class="m-0 flex list-none flex-wrap gap-1.5 p-0">
        <li
          v-for="(ingredient, index) in card.ingredients"
          :key="`${index}-${ingredient.name}`"
          data-testid="recipe-ingredient"
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
