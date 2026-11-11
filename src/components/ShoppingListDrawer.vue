<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useShoppingListStore } from "@/stores/shoppingList";
import { UNITS } from "@/services/pantryHelpers";

const open = defineModel("open", { type: Boolean, default: false });
const store = useShoppingListStore();

const name = ref("");
const quantity = ref(1);
const unit = ref("un");
const error = ref("");
const nameInput = ref(null);

// "un" só aceita inteiros: ao mudar para unidades arredonda a quantidade.
watch(unit, (u) => {
  if (u === "un") quantity.value = Math.max(1, Math.round(Number(quantity.value) || 1));
});

async function add() {
  try {
    await store.addItem({ name: name.value, quantity: quantity.value, unit: unit.value });
    name.value = "";
    quantity.value = 1;
    unit.value = "un";
    error.value = "";
    nameInput.value?.focus();
  } catch (err) {
    error.value = err.message;
  }
}

const close = () => (open.value = false);
const onKey = (e) => e.key === "Escape" && open.value && close();

watch(open, (v) => {
  if (v) store.load();
  document.body.style.overflow = v ? "hidden" : "";
});

onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
    >
      <div v-if="open" class="fixed inset-0 z-40 bg-black/40" @click="close" />
    </Transition>

    <Transition
      enter-from-class="translate-x-full"
      leave-to-class="translate-x-full"
      enter-active-class="transition-transform duration-200"
      leave-active-class="transition-transform duration-200"
    >
      <aside
        v-if="open"
        data-testid="shopping-list-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shopping-list-title"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl"
      >
        <header class="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 id="shopping-list-title" class="text-lg font-bold">
            🛒 Lista de compras
            <span class="text-sm font-normal text-gray-500">({{ store.pendingCount }})</span>
          </h2>
          <button
            type="button"
            data-testid="shopping-list-close"
            aria-label="Fechar"
            class="h-10 w-10 rounded-full text-xl hover:bg-gray-100"
            @click="close"
          >
            ✕
          </button>
        </header>

        <form class="space-y-2 border-b border-gray-200 p-4" @submit.prevent="add">
          <input
            ref="nameInput"
            v-model="name"
            data-testid="shopping-item-name"
            placeholder="Ex: Leite"
            class="w-full rounded-lg border border-gray-300 p-3"
            :class="{ 'border-red-500': error }"
          />
          <div class="flex gap-2">
            <input
              v-model.number="quantity"
              data-testid="shopping-item-qty"
              type="number"
              :min="unit === 'un' ? 1 : 0.1"
              :step="unit === 'un' ? 1 : 0.1"
              class="w-20 rounded-lg border border-gray-300 p-3"
            />
            <select
              v-model="unit"
              data-testid="shopping-item-unit"
              class="rounded-lg border border-gray-300 p-3"
            >
              <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
            </select>
            <button
              type="submit"
              data-testid="shopping-item-add"
              class="flex-1 rounded-lg bg-green-600 py-3 font-semibold text-white"
            >
              Adicionar
            </button>
          </div>
          <p v-if="error" data-testid="shopping-item-error" class="text-sm text-red-600">{{ error }}</p>
        </form>

        <div class="flex-1 overflow-y-auto p-4">
          <p
            v-if="store.items.length === 0"
            data-testid="shopping-list-empty"
            class="py-10 text-center text-gray-500"
          >
            A lista de compras está vazia.
          </p>

          <ul class="space-y-2">
            <li
              v-for="item in [...store.pendingItems, ...store.checkedItems]"
              :key="item.id"
              data-testid="shopping-item"
              :data-name="item.name"
              :data-checked="item.checked"
              class="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
              :class="{ 'bg-gray-50': item.checked }"
            >
              <input
                type="checkbox"
                data-testid="shopping-item-toggle"
                class="h-5 w-5 accent-green-600"
                :checked="item.checked"
                :aria-label="`Marcar ${item.name} como comprado`"
                @change="store.toggleChecked(item.id)"
              />
              <span class="flex-1" :class="{ 'text-gray-400 line-through': item.checked }">
                {{ item.name }}
              </span>
              <span class="text-sm text-gray-500">{{ item.quantity }} {{ item.unit }}</span>
              <button
                type="button"
                data-testid="shopping-item-remove"
                class="h-9 w-9 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600"
                :aria-label="`Remover ${item.name}`"
                @click="store.removeItem(item.id)"
              >
                🗑
              </button>
            </li>
          </ul>
        </div>

        <footer v-if="store.checkedItems.length" class="border-t border-gray-200 p-4">
          <button
            type="button"
            data-testid="shopping-clear-checked"
            class="w-full rounded-lg border border-gray-300 py-3"
            @click="store.clearChecked()"
          >
            Limpar comprados ({{ store.checkedItems.length }})
          </button>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>
