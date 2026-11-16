<script setup>
// SCRUM-107 — Aviso no ecrã de início com os produtos a expirar nas próximas 48h.
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { usePantryStore } from '@/stores/pantry'
import { expiryLabel, isExpired } from '@/services/expiration'

const pantry = usePantryStore()
let timer = null

// Atualiza a hora de referência a cada minuto: um produto pode entrar na janela
// das 48h (ou expirar) com a app aberta.
onMounted(() => {
  pantry.load()
  timer = setInterval(() => pantry.refreshNow(), 60 * 1000)
})
onBeforeUnmount(() => clearInterval(timer))

const title = computed(() =>
  pantry.expiringCount === 1
    ? '1 produto a expirar nas próximas 48h'
    : `${pantry.expiringCount} produtos a expirar nas próximas 48h`,
)
</script>

<template>
  <section
    v-if="pantry.expiringCount > 0"
    data-testid="expiring-alert"
    role="alert"
    class="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm"
  >
    <h2 class="m-0 flex items-center gap-2 text-lg font-bold text-amber-800">
      <span aria-hidden="true">⚠️</span>
      <span data-testid="expiring-alert-title">{{ title }}</span>
    </h2>

    <ul class="m-0 mt-3 flex list-none flex-col gap-2 p-0">
      <li
        v-for="item in pantry.expiringItems"
        :key="item.id"
        data-testid="expiring-item"
        :data-name="item.name"
        class="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
      >
        <span class="font-semibold">
          {{ item.name }}
          <span class="font-normal text-gray-500">· {{ item.quantity }} {{ item.unit }}</span>
        </span>
        <span
          class="whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold"
          :class="isExpired(item, pantry.now) ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'"
        >
          {{ expiryLabel(item.expirationDate, pantry.now) }}
        </span>
      </li>
    </ul>
  </section>
</template>
