<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  open: Boolean,
  existing: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:open', 'created'])

const name = ref('')
const error = ref('')
const inputEl = ref(null)

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    name.value = ''
    error.value = ''
    await nextTick()
    inputEl.value?.focus()
  },
)

function close() {
  emit('update:open', false)
}

function save() {
  const value = name.value.trim()
  if (!value) {
    error.value = 'Escreve o nome da categoria.'
    return
  }
  if (props.existing.some((c) => c.toLowerCase() === value.toLowerCase())) {
    error.value = 'Essa categoria já existe.'
    return
  }
  emit('created', value)
  close()
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
    data-testid="modal-new-category"
    @click.self="close"
    @keydown.esc="close"
  >
    <form
      class="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
      @submit.prevent="save"
    >
      <h3 class="mb-4 text-lg font-bold">Nova categoria</h3>
      <input
        ref="inputEl"
        v-model="name"
        data-testid="input-new-category"
        type="text"
        maxlength="30"
        placeholder="Ex: Temperos"
        class="w-full"
      />
      <p
        v-if="error"
        role="alert"
        data-testid="error-new-category"
        class="mt-2 text-xs font-medium text-red-500"
      >
        {{ error }}
      </p>
      <div class="mt-5 flex gap-3">
        <button
          type="button"
          data-testid="btn-cancel-category"
          class="flex-1 rounded-lg border border-gray-300 py-2"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="submit"
          data-testid="btn-save-category"
          class="flex-1 rounded-lg bg-[#42b883] py-2 font-semibold text-white"
        >
          Guardar
        </button>
      </div>
    </form>
  </div>
</template>