<script setup>
// TS-04 / SCRUM-94: estados de loading e de erro dos pedidos à IA.
// Uso: <GenAIStatus :loading="loading" :error="error" @cancel="cancel" @retry="gerar" />
import { computed } from 'vue'

const props = defineProps({
  loading: { type: Boolean, default: false },
  error: { type: Object, default: null }, // { code, message }
  loadingText: { type: String, default: 'O Sous-Chef está a criar uma receita…' },
})
defineEmits(['cancel', 'retry'])

// Repetir só faz sentido quando o problema pode desaparecer sozinho
const RETRYABLE = ['timeout', 'network', 'rate-limit', 'server', 'empty', 'invalid-response']
const canRetry = computed(() => props.error !== null && RETRYABLE.includes(props.error.code))
</script>

<template>
  <div v-if="loading" class="flex flex-col items-center gap-3 py-6 text-center" role="status" data-testid="genai-loading">
    <span class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#42b883]" aria-hidden="true"></span>
    <p class="m-0 text-gray-600">{{ loadingText }}</p>
    <button type="button" class="btn-ghost" data-testid="genai-cancel" @click="$emit('cancel')">Cancelar</button>
  </div>

  <div
    v-else-if="error"
    class="flex flex-col items-center gap-3 rounded-xl bg-red-50 p-4 text-center"
    role="alert"
    data-testid="genai-error"
  >
    <p class="m-0 font-medium text-red-600">{{ error.message }}</p>
    <button v-if="canRetry" type="button" class="btn-primary" data-testid="genai-retry" @click="$emit('retry')">
      Tentar novamente
    </button>
  </div>
</template>
