<script setup>
import { computed } from "vue";
import { useProfilesStore } from "@/stores/profiles";
import { restricoesDoPerfil } from "@/services/personalFilters";

// SCRUM-122 — Toggle dos filtros pessoais na pesquisa de receitas.
// Mostra também que restrições do perfil ativo estão a ser aplicadas.

const profiles = useProfilesStore();

const DIETAS = {
  vegetarian: "Vegetariano",
  vegan: "Vegano",
  pescatarian: "Pescetariano",
};

const ligado = computed(() => profiles.personalFiltersEnabled);

// Restrições do perfil, mesmo com os filtros desligados, para se saber o que
// o toggle está a deixar de aplicar.
const doPerfil = computed(() =>
  restricoesDoPerfil(profiles.activeProfile, true),
);

const etiquetas = computed(() => [
  ...doPerfil.value.diets.map((d) => ({ valor: d, texto: DIETAS[d] ?? d })),
  ...doPerfil.value.allergies.map((a) => ({ valor: a, texto: `Sem ${a}` })),
  ...doPerfil.value.excludedIngredients.map((e) => ({
    valor: e,
    texto: `Sem ${e}`,
  })),
]);

function alternar() {
  profiles.setPersonalFilters(!ligado.value);
}
</script>

<template>
  <section class="card mb-6" data-testid="personal-filters">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="m-0 text-lg font-bold">🛡️ Filtros pessoais</h2>
        <p class="m-0 text-sm text-gray-500">
          Aplica as restrições do perfil ativo às receitas.
        </p>
      </div>

      <button
        type="button"
        role="switch"
        :aria-checked="ligado"
        aria-label="Filtros pessoais"
        data-testid="personal-filters-toggle"
        class="relative h-7 w-12 shrink-0 rounded-full transition-colors"
        :class="ligado ? 'bg-[#42b883]' : 'bg-gray-300'"
        @click="alternar"
      >
        <span
          aria-hidden="true"
          class="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform"
          :class="ligado ? 'translate-x-5' : 'translate-x-0'"
        />
      </button>
    </div>

    <p
      v-if="!ligado"
      data-testid="personal-filters-off"
      class="m-0 mt-3 text-sm text-amber-700"
    >
      Filtros desligados: as receitas não têm em conta as restrições do perfil.
    </p>

    <p
      v-else-if="etiquetas.length === 0"
      data-testid="personal-restrictions-none"
      class="m-0 mt-3 text-sm text-gray-500"
    >
      Este perfil não tem restrições alimentares.
    </p>

    <ul v-else class="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0">
      <li
        v-for="etiqueta in etiquetas"
        :key="etiqueta.valor"
        data-testid="personal-restriction"
        :data-restriction="etiqueta.valor"
        class="rounded-full bg-green-50 px-2.5 py-1 text-sm text-green-800"
      >
        {{ etiqueta.texto }}
      </li>
    </ul>
  </section>
</template>
