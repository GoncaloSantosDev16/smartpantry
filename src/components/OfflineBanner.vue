<script setup>
// US-16 / SCRUM-101: indicador visual de "Modo Offline", visível em todos os ecrãs.
import { useOnlineStatus } from '@/composables/useOnlineStatus'

const { online } = useOnlineStatus()
</script>

<template>
  <div
    v-if="!online"
    class="sticky top-0 z-50 bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-800"
    role="status"
    data-testid="offline-banner"
  >
    📴 Modo offline: estás a ver os dados guardados neste dispositivo.
  </div>
</template>
