<script setup>
import { computed, onMounted } from "vue";
import { useShoppingListStore } from "@/stores/shoppingList";

const emit = defineEmits(["open"]);
const store = useShoppingListStore();

onMounted(() => store.load());

const badge = computed(() => (store.pendingCount > 99 ? "99+" : String(store.pendingCount)));
</script>

<template>
  <button
    type="button"
    data-testid="shopping-list-button"
    class="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-xl shadow-sm active:scale-95"
    :aria-label="`Lista de compras (${store.pendingCount} por comprar)`"
    @click="emit('open')"
  >
    🛒
    <span
      v-if="store.pendingCount > 0"
      data-testid="shopping-list-badge"
      class="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-xs font-bold leading-5 text-white"
    >
      {{ badge }}
    </span>
  </button>
</template>
