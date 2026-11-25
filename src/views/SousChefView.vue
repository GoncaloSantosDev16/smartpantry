<script setup>
// US-17 — GenAI Sous-Chef: escolhe as sobras da despensa e gera uma receita original
// que respeita o perfil ativo (doses, dietas, alergias e ingredientes excluídos).
// A receita gerada abre na pré-visualização (US-13), onde se pode guardar e concluir.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePantryStore } from '@/stores/pantry'
import { useProfilesStore } from '@/stores/profiles'
import { useRecipesStore } from '@/stores/recipes'
import { useRecipeGenerator } from '@/composables/useRecipeGenerator'
import { expiringLeftoverIds, expiryLabel, expiryTone, sortLeftovers, toLeftoverIngredients } from '@/services/sousChef'
import GenAIStatus from '@/components/GenAIStatus.vue'
import PersonalFiltersToggle from '@/components/PersonalFiltersToggle.vue'

const router = useRouter()
const pantry = usePantryStore()
const profiles = useProfilesStore()
const recipes = useRecipesStore()
const { loading, error, generate, cancel } = useRecipeGenerator()

const loaded = ref(false)
const selectedIds = ref([])
const incompleteError = ref('')

onMounted(async () => {
  // Lê sempre da base de dados: a despensa pode ter mudado noutro ecrã.
  await pantry.load({ forcar: true })
  loaded.value = true
})
onBeforeUnmount(cancel)

const leftovers = computed(() => sortLeftovers(pantry.items))
const expiringIds = computed(() => expiringLeftoverIds(pantry.items, pantry.now))
const selectedCount = computed(() => selectedIds.value.length)
const canGenerate = computed(() => selectedCount.value > 0 && !loading.value)

const isSelected = (id) => selectedIds.value.includes(id)

function toggle(id) {
  selectedIds.value = isSelected(id) ? selectedIds.value.filter((x) => x !== id) : [...selectedIds.value, id]
}
function selectExpiring() {
  selectedIds.value = [...new Set([...selectedIds.value, ...expiringIds.value])]
}
function clearSelection() {
  selectedIds.value = []
}

async function generateFromLeftovers() {
  if (!canGenerate.value) return
  incompleteError.value = ''

  const recipe = await generate({
    ingredients: toLeftoverIngredients(pantry.items, selectedIds.value),
    // Doses e restrições do perfil ativo (vazias se os filtros pessoais estiverem desligados)
    profile: profiles.activeRequestProfile,
  })
  if (!recipe) return // erro, cancelamento ou pedido já em curso: o GenAIStatus trata disso

  if (!recipes.openPreview(recipe, { source: 'genai' })) {
    incompleteError.value = 'A IA devolveu uma receita incompleta. Tenta novamente.'
    return
  }
  await router.push({ name: 'recipe-preview' })
}

const toneClass = {
  expired: 'bg-red-100 text-red-700',
  soon: 'bg-amber-100 text-amber-700',
  ok: 'bg-slate-100 text-gray-500',
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-6 font-sans text-gray-800" data-testid="sous-chef-view">
    <header class="mb-6 flex items-center gap-3">
      <RouterLink
        to="/"
        data-testid="sous-chef-back"
        aria-label="Voltar"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-lg"
      >
        ←
      </RouterLink>
      <div>
        <h1 class="m-0 text-2xl font-extrabold text-[#42b883]">🧑‍🍳 Sous-Chef</h1>
        <p class="m-0 text-sm text-gray-500">Escolhe as sobras e cria uma receita original.</p>
      </div>
    </header>

    <PersonalFiltersToggle />

    <section class="card mb-6">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 class="m-0 text-lg font-bold">📦 Sobras da despensa</h2>
        <span class="text-sm text-gray-500" data-testid="sous-chef-selected-count">
          {{ selectedCount }} {{ selectedCount === 1 ? 'selecionado' : 'selecionados' }}
        </span>
      </div>

      <p v-if="!loaded" class="m-0 text-gray-500" data-testid="sous-chef-loading-pantry">A ler a despensa…</p>

      <p v-else-if="leftovers.length === 0" class="m-0 text-gray-500" data-testid="sous-chef-empty">
        A tua despensa está vazia. Adiciona produtos para criar uma receita.
      </p>

      <template v-else>
        <div class="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            class="btn-ghost"
            data-testid="sous-chef-select-expiring"
            :disabled="expiringIds.length === 0"
            @click="selectExpiring"
          >
            ⏰ Selecionar o que expira
          </button>
          <button
            type="button"
            class="btn-ghost"
            data-testid="sous-chef-clear"
            :disabled="selectedCount === 0"
            @click="clearSelection"
          >
            Limpar
          </button>
        </div>

        <ul class="m-0 flex list-none flex-col gap-2 p-0">
          <li v-for="item in leftovers" :key="item.id" data-testid="leftover-item">
            <label
              class="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2"
              :class="isSelected(item.id) ? 'border-[#42b883] bg-green-50' : 'border-gray-200 bg-white'"
            >
              <input
                type="checkbox"
                class="h-5 w-5 accent-[#42b883]"
                data-testid="leftover-checkbox"
                :checked="isSelected(item.id)"
                :disabled="loading"
                @change="toggle(item.id)"
              />
              <span class="flex-1 font-semibold" data-testid="leftover-name">{{ item.name }}</span>
              <span class="text-sm text-gray-500" data-testid="leftover-qty">{{ item.quantity }} {{ item.unit }}</span>
              <span
                v-if="expiryLabel(item, pantry.now)"
                class="rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="toneClass[expiryTone(item, pantry.now)]"
                data-testid="leftover-expiry"
              >
                {{ expiryLabel(item, pantry.now) }}
              </span>
            </label>
          </li>
        </ul>
      </template>

      <button
        type="button"
        data-testid="sous-chef-generate"
        class="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        :disabled="!canGenerate"
        @click="generateFromLeftovers"
      >
        ✨ Gerar receita
      </button>
    </section>

    <GenAIStatus
      :loading="loading"
      :error="error"
      loading-text="O Sous-Chef está a criar uma receita com as tuas sobras…"
      @cancel="cancel"
      @retry="generateFromLeftovers"
    />

    <p v-if="incompleteError" class="text-center font-medium text-red-600" role="alert" data-testid="sous-chef-incomplete">
      {{ incompleteError }}
    </p>
  </div>
</template>
