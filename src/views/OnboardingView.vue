<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import TagInput from '@/components/TagInput.vue'
import { useProfilesStore } from '@/stores/profiles'

const router = useRouter()
const profiles = useProfilesStore()
const step = ref(1)
const totalSteps = 3

const DIETS = [
  { value: 'vegetarian', label: 'Vegetariano' },
  { value: 'vegan', label: 'Vegano' },
  { value: 'pescatarian', label: 'Pescetariano' },
]

const form = reactive({
  name: 'Casa',
  servings: 2,
  diets: [],
  allergies: [],
  excludedIngredients: [],
})

const canContinue = computed(() => {
  if (step.value === 1) return form.name.trim().length > 0 && form.servings >= 1
  return true
})

async function finish() {
  await profiles.createProfile({
    name: form.name.trim(),
    servings: form.servings,
    diets: [...form.diets],
    allergies: [...form.allergies],
    excludedIngredients: [...form.excludedIngredients],
  })
  router.push({ name: 'home' })
}
</script>

<template>
  <main class="flex min-h-screen flex-col p-6" data-testid="onboarding">
    <p class="text-sm text-gray-500" data-testid="onboarding-step">
      Passo {{ step }} de {{ totalSteps }}
    </p>

    <section class="mt-4 flex-1 space-y-4">
      <template v-if="step === 1">
        <h1 class="text-2xl font-bold">Bem-vindo ao SmartPantry</h1>
        <label class="block">
          <span class="text-sm font-medium">Nome do perfil</span>
          <input
            v-model="form.name"
            data-testid="profile-name"
            class="mt-1 w-full rounded-lg border border-gray-300 p-3"
          />
        </label>
        <div>
          <span class="text-sm font-medium">Doses habituais</span>
          <div class="mt-1 flex items-center gap-4">
            <button
              type="button"
              data-testid="servings-minus"
              class="h-12 w-12 rounded-full border text-xl disabled:opacity-40"
              :disabled="form.servings <= 1"
              @click="form.servings--"
            >
              −
            </button>
            <span class="text-xl font-semibold" data-testid="servings-value">
              {{ form.servings }}
            </span>
            <button
              type="button"
              data-testid="servings-plus"
              class="h-12 w-12 rounded-full border text-xl"
              @click="form.servings++"
            >
              +
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="step === 2">
        <h1 class="text-2xl font-bold">Estilo alimentar</h1>
        <label
          v-for="d in DIETS"
          :key="d.value"
          class="flex items-center gap-3 rounded-lg border border-gray-300 p-3"
        >
          <input
            v-model="form.diets"
            type="checkbox"
            :value="d.value"
            :data-testid="`diet-${d.value}`"
          />
          {{ d.label }}
        </label>
      </template>

      <template v-else>
        <h1 class="text-2xl font-bold">Alergias e exclusões</h1>
        <TagInput v-model="form.allergies" label="Alergias" testid="allergy" />
        <TagInput
          v-model="form.excludedIngredients"
          label="Ingredientes excluídos"
          testid="excluded"
        />
      </template>
    </section>

    <footer class="mt-6 flex gap-3">
      <button
        v-if="step > 1"
        type="button"
        data-testid="onboarding-back"
        class="flex-1 rounded-lg border border-gray-300 py-3"
        @click="step--"
      >
        Voltar
      </button>
      <button
        v-if="step < totalSteps"
        type="button"
        data-testid="onboarding-next"
        class="flex-1 rounded-lg bg-green-600 py-3 text-white disabled:opacity-50"
        :disabled="!canContinue"
        @click="step++"
      >
        Continuar
      </button>
      <button
        v-else
        type="button"
        data-testid="onboarding-finish"
        class="flex-1 rounded-lg bg-green-600 py-3 text-white"
        @click="finish"
      >
        Concluir
      </button>
    </footer>
  </main>
</template>