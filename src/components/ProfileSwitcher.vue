<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useProfilesStore } from "@/stores/profiles";

// SCRUM-103 — Menu do cabeçalho para trocar o perfil ativo.
// A escolha é feita na store (SCRUM-104), que a guarda entre arranques.

const profiles = useProfilesStore();
const aberto = ref(false);
const raiz = ref(null);

const ativo = computed(() => profiles.activeProfile);

function alternar() {
  aberto.value = !aberto.value;
}

function fechar() {
  aberto.value = false;
}

function escolher(perfil) {
  profiles.setActiveProfile(perfil.id);
  fechar();
}

// Fecha ao clicar fora do menu ou ao carregar em Escape.
function aoClicarFora(evento) {
  if (aberto.value && raiz.value && !raiz.value.contains(evento.target))
    fechar();
}

function aoCarregarTecla(evento) {
  if (evento.key === "Escape") fechar();
}

onMounted(() => {
  document.addEventListener("click", aoClicarFora);
  document.addEventListener("keydown", aoCarregarTecla);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", aoClicarFora);
  document.removeEventListener("keydown", aoCarregarTecla);
});
</script>

<template>
  <div
    v-if="ativo"
    ref="raiz"
    class="relative inline-block text-left"
    data-testid="profile-switcher"
  >
    <button
      type="button"
      class="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
      aria-haspopup="listbox"
      :aria-expanded="aberto"
      data-testid="profile-switcher-toggle"
      @click="alternar"
    >
      <span aria-hidden="true">👤</span>
      <span data-testid="active-profile-name">{{ ativo.name }}</span>
      <span aria-hidden="true" class="text-xs text-gray-400">▾</span>
    </button>

    <ul
      v-if="aberto"
      role="listbox"
      aria-label="Perfis"
      class="absolute right-0 z-20 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
      data-testid="profile-menu"
    >
      <li v-for="perfil in profiles.profiles" :key="perfil.id" role="none">
        <button
          type="button"
          role="option"
          :aria-selected="perfil.id === ativo.id"
          class="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50"
          :class="
            perfil.id === ativo.id
              ? 'font-semibold text-[#42b883]'
              : 'text-gray-700'
          "
          data-testid="profile-option"
          :data-profile-name="perfil.name"
          @click="escolher(perfil)"
        >
          <span>{{ perfil.name }}</span>
          <span v-if="perfil.isDefault" class="text-xs text-gray-400"
            >predefinido</span
          >
        </button>
      </li>
    </ul>
  </div>
</template>
