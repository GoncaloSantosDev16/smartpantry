<script setup>
// US-21 — Resumo de ingredientes consumidos (SCRUM-129), aberto no fim da receita (SCRUM-130).
//   /receitas/:id/resumo       receita guardada
//   /receitas/preview/resumo   receita ainda não guardada (ex.: gerada pela IA)
// O utilizador confirma ou ajusta o que gastou; ao confirmar, a despensa é descontada.
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePantryStore } from '@/stores/pantry'
import { useRecipesStore } from '@/stores/recipes'
import { formatQuantity } from '@/services/recipeModel'
import {
  buildConsumptionSummary,
  describeConsumption,
  formatAmount,
  planConsumption,
  validateConsumedLine,
} from '@/services/mealSummary'

const route = useRoute()
const router = useRouter()
const pantry = usePantryStore()
const recipes = useRecipesStore()

const recipe = ref(null)
const status = ref('loading') // loading | ready | not-found | done | skipped
const lines = ref([])
const notInPantry = ref([])
const saving = ref(false)
const saveError = ref('')
const changes = ref([]) // US-22: o que mudou na despensa depois de confirmar

const errors = computed(() => Object.fromEntries(lines.value.map((l) => [l.key, validateConsumedLine(l)])))
const hasErrors = computed(() => Object.values(errors.value).some(Boolean))
const usedCount = computed(() => lines.value.filter((l) => l.included).length)
const canConfirm = computed(() => !saving.value && !hasErrors.value && lines.value.length > 0)

async function load() {
  status.value = 'loading'
  saveError.value = ''

  let found = null
  if (route.name === 'meal-summary-preview') {
    found = recipes.preview
  } else {
    const id = Number(route.params.id)
    found = Number.isInteger(id) ? await recipes.getById(id) : null
  }
  if (!found) {
    status.value = 'not-found'
    return
  }

  await pantry.load({ forcar: true })
  const summary = buildConsumptionSummary(found, pantry.items)
  recipe.value = found
  lines.value = summary.lines.map((l) => ({ ...l, quantity: formatAmount(l.quantity) }))
  notInPantry.value = summary.notInPantry
  status.value = 'ready'
}

watch(() => route.fullPath, load, { immediate: true })

async function confirm() {
  if (!canConfirm.value) return
  saving.value = true
  saveError.value = ''
  try {
    const operations = planConsumption(lines.value, pantry.items)
    changes.value = describeConsumption(operations, pantry.items)
    await pantry.consumeItems(operations)
    await recipes.markCooked(recipe.value.id)
    status.value = 'done'
  } catch (error) {
    console.error('Erro ao atualizar a despensa:', error)
    saveError.value = 'Não foi possível atualizar a despensa. Tenta novamente.'
  } finally {
    saving.value = false
  }
}

// US-22 / SCRUM-136 — "Saltar": conclui a refeição sem mexer na despensa.
// Funciona mesmo com quantidades inválidas ou sem ingredientes na despensa.
async function skip() {
  if (saving.value) return
  saving.value = true
  saveError.value = ''
  try {
    await recipes.markCooked(recipe.value.id)
    status.value = 'skipped'
  } catch (error) {
    console.error('Erro ao concluir a refeição:', error)
    saveError.value = 'Não foi possível concluir a refeição. Tenta novamente.'
  } finally {
    saving.value = false
  }
}

function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/')
}

const recipeHint = (line) => line.recipeIngredients.map((i) => [formatQuantity(i), i.name].filter(Boolean).join(' ')).join(' + ')
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-6" data-testid="meal-summary">
    <button
      v-if="status !== 'done' && status !== 'skipped'"
      type="button"
      class="mb-4 cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-gray-500 hover:text-gray-800"
      data-testid="meal-summary-back"
      @click="goBack"
    >
      ← Voltar à receita
    </button>

    <p v-if="status === 'loading'" class="text-gray-500">A preparar o resumo…</p>

    <div v-else-if="status === 'not-found'" class="card text-center" data-testid="meal-summary-not-found">
      <p class="mt-0">Receita não encontrada.</p>
      <RouterLink to="/" class="font-semibold text-[#33a06f]">Voltar ao início</RouterLink>
    </div>

    <div v-else-if="status === 'done'" class="card flex flex-col items-center gap-3 text-center" data-testid="meal-summary-done" role="status">
      <p class="m-0 text-4xl">✅</p>
      <h1 class="m-0 text-2xl font-extrabold text-gray-800">Despensa atualizada</h1>
      <p class="m-0 text-gray-500">Descontámos os ingredientes que usaste em «{{ recipe.title }}».</p>
      <ul v-if="changes.length" class="m-0 flex w-full list-none flex-col gap-1 p-0 text-left text-sm" data-testid="stock-changes">
        <li
          v-for="change in changes"
          :key="change.name + change.unit"
          class="flex justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
          data-testid="stock-change"
          :data-name="change.name"
          :data-removed="String(change.removed)"
        >
          <span class="font-semibold text-gray-800">{{ change.name }}</span>
          <span v-if="change.removed" class="font-medium text-red-500">acabou · removido</span>
          <span v-else class="text-gray-600">
            {{ formatAmount(change.before) }} → <strong>{{ formatAmount(change.after) }}</strong> {{ change.unit }}
          </span>
        </li>
      </ul>
      <RouterLink to="/" class="btn-primary no-underline" data-testid="meal-summary-home">Ver despensa</RouterLink>
    </div>

    <div v-else-if="status === 'skipped'" class="card flex flex-col items-center gap-3 text-center" data-testid="meal-summary-skipped" role="status">
      <p class="m-0 text-4xl">🍽️</p>
      <h1 class="m-0 text-2xl font-extrabold text-gray-800">Bom apetite!</h1>
      <p class="m-0 text-gray-500">A despensa não foi alterada.</p>
      <RouterLink to="/" class="btn-primary no-underline" data-testid="meal-summary-home">Ver despensa</RouterLink>
    </div>

    <article v-else class="card flex flex-col gap-6">
      <header class="flex flex-col gap-1">
        <p class="m-0 text-sm font-semibold uppercase tracking-wide text-[#33a06f]">Refeição concluída</p>
        <h1 class="m-0 text-2xl font-extrabold text-gray-800" data-testid="meal-summary-title">{{ recipe.title }}</h1>
        <p class="m-0 text-gray-500">Confirma ou ajusta o que gastaste. Vamos descontar da despensa.</p>
      </header>

      <p v-if="lines.length === 0" class="m-0 rounded-lg bg-slate-50 px-3 py-3 text-gray-500" data-testid="meal-summary-empty">
        Nenhum ingrediente desta receita está na despensa.
      </p>

      <ul v-else class="m-0 flex list-none flex-col gap-3 p-0">
        <li
          v-for="line in lines"
          :key="line.key"
          class="flex flex-col gap-2 rounded-xl border px-3 py-3 transition-colors"
          :class="line.included ? 'border-slate-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50 opacity-60'"
          data-testid="consumed-item"
          :data-name="line.name"
          :data-included="String(line.included)"
        >
          <div class="flex items-center gap-3">
            <input
              :id="`used-${line.key}`"
              v-model="line.included"
              type="checkbox"
              class="h-5 w-5 shrink-0 cursor-pointer accent-[#33a06f]"
              data-testid="consumed-item-toggle"
              :aria-label="`Usei ${line.name}`"
            />
            <label :for="`used-${line.key}`" class="flex min-w-0 flex-1 cursor-pointer flex-col">
              <span class="font-semibold text-gray-800" data-testid="consumed-item-name">{{ line.name }}</span>
              <span class="text-xs text-gray-500" data-testid="consumed-item-recipe">
                Receita: {{ recipeHint(line) }}
              </span>
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="line.quantity"
                type="text"
                inputmode="decimal"
                class="w-20 px-2! py-1.5! text-right"
                :class="{ 'has-error': errors[line.key] }"
                :disabled="!line.included"
                data-testid="consumed-item-qty"
                :aria-label="`Quantidade usada de ${line.name}`"
                :aria-invalid="Boolean(errors[line.key])"
              />
              <span class="w-6 text-sm text-gray-600" data-testid="consumed-item-unit">{{ line.unit }}</span>
            </div>
          </div>
          <div class="flex justify-between gap-2 pl-8 text-xs">
            <span class="text-gray-500" data-testid="consumed-item-available">
              Na despensa: {{ formatAmount(line.available) }} {{ line.unit }}
            </span>
            <span v-if="errors[line.key]" class="font-medium text-red-500" role="alert" data-testid="consumed-item-error">
              {{ errors[line.key] }}
            </span>
          </div>
        </li>
      </ul>

      <section v-if="notInPantry.length" data-testid="not-in-pantry">
        <h2 class="mt-0 mb-2 text-sm font-bold text-gray-600">Não estavam na despensa</h2>
        <ul class="m-0 flex list-none flex-wrap gap-2 p-0">
          <li
            v-for="(ingredient, index) in notInPantry"
            :key="index"
            class="rounded-full bg-slate-100 px-3 py-1 text-sm text-gray-500"
            data-testid="not-in-pantry-item"
            :data-name="ingredient.name"
          >
            {{ ingredient.name }}
          </li>
        </ul>
      </section>

      <footer class="flex flex-col gap-2">
        <button
          type="button"
          class="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="meal-summary-confirm"
          :disabled="!canConfirm"
          @click="confirm"
        >
          {{ saving ? 'A atualizar…' : `Confirmar e descontar (${usedCount})` }}
        </button>
        <button
          type="button"
          class="cursor-pointer rounded-[10px] border-2 border-slate-200 bg-white px-4 py-3 font-semibold text-gray-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="meal-summary-skip"
          :disabled="saving"
          @click="skip"
        >
          Saltar — não mexer na despensa
        </button>
        <p v-if="saveError" class="m-0 text-sm font-medium text-red-500" role="alert" data-testid="meal-summary-error">
          {{ saveError }}
        </p>
      </footer>
    </article>
  </div>
</template>
