<script setup>
import { ref } from 'vue'

defineProps({ label: String, testid: String })
const tags = defineModel({ type: Array, default: () => [] })
const text = ref('')

function add() {
  const value = text.value.trim().toLowerCase()
  if (value && !tags.value.includes(value)) tags.value = [...tags.value, value]
  text.value = ''
}

function remove(tag) {
  tags.value = tags.value.filter((t) => t !== tag)
}
</script>

<template>
  <div>
    <span class="text-sm font-medium">{{ label }}</span>
    <div class="mt-1 flex gap-2">
      <input v-model="text" :aria-label="label" :data-testid="`${testid}-input`"
        class="min-w-0 flex-1 rounded-lg border border-gray-300 p-3" @keydown.enter.prevent="add" />
      <button type="button" :data-testid="`${testid}-add`" class="rounded-lg bg-green-600 px-4 text-white" @click="add">
        Adicionar
      </button>
    </div>
    <ul class="mt-2 flex flex-wrap gap-2">
      <li v-for="tag in tags" :key="tag" class="flex items-center gap-2 rounded-full bg-gray-200 px-3 py-1 text-sm">
        {{ tag }}
        <button type="button" :aria-label="`Remover ${tag}`" @click="remove(tag)">×</button>
      </li>
    </ul>
  </div>
</template>