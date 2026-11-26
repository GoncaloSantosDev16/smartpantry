<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import TagInput from "@/components/TagInput.vue";
import { exportAllDataToJson } from "@/services/dataExport";
import { useProfilesStore } from "@/stores/profiles";

const router = useRouter();
const profiles = useProfilesStore();

const DIETS = [
  { value: "vegetarian", label: "Vegetariano" },
  { value: "vegan", label: "Vegano" },
  { value: "pescatarian", label: "Pescetariano" },
];

const formOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);

const exporting = ref(false);
const exportStatus = ref("");
const exportError = ref(false);

const form = reactive({
  name: "",
  servings: 2,
  diets: [],
  allergies: [],
  excludedIngredients: [],
});

const canSave = computed(
  () => form.name.trim().length > 0 && form.servings >= 1,
);

function resetForm() {
  form.name = "";
  form.servings = 2;
  form.diets = [];
  form.allergies = [];
  form.excludedIngredients = [];
  editingId.value = null;
}

function openCreateForm() {
  resetForm();
  formOpen.value = true;
}

function openEditForm(perfil) {
  editingId.value = perfil.id;
  form.name = perfil.name;
  form.servings = perfil.servings ?? 2;
  form.diets = [...(perfil.diets ?? [])];
  form.allergies = [...(perfil.allergies ?? [])];
  form.excludedIngredients = [...(perfil.excludedIngredients ?? [])];
  formOpen.value = true;
}

function cancelForm() {
  formOpen.value = false;
  resetForm();
}

async function saveProfile() {
  if (!canSave.value || saving.value) return;
  saving.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      servings: form.servings,
      diets: [...form.diets],
      allergies: [...form.allergies],
      excludedIngredients: [...form.excludedIngredients],
    };

    if (editingId.value !== null) {
      await profiles.updateProfile(editingId.value, payload);
    } else {
      await profiles.createProfile(payload);
    }

    formOpen.value = false;
    resetForm();
  } finally {
    saving.value = false;
  }
}

async function removeProfile(id) {
  await profiles.deleteProfile(id);
}

async function handleExportJson() {
  if (exporting.value) return;
  exporting.value = true;
  exportError.value = false;
  exportStatus.value = "";
  try {
    const { filename } = await exportAllDataToJson();
    exportStatus.value = `Cópia de segurança exportada (${filename}).`;
  } catch (err) {
    exportError.value = true;
    exportStatus.value = "Não foi possível exportar os dados para JSON.";
    console.error("Erro ao exportar dados:", err);
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <main
    class="mx-auto min-h-screen max-w-lg space-y-8 p-4 pb-12 sm:p-6"
    data-testid="settings-view"
  >
    <header class="flex items-center gap-3">
      <button
        type="button"
        class="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        data-testid="settings-back-btn"
        @click="router.push({ name: 'home' })"
      >
        ← Voltar
      </button>
      <h1 class="text-2xl font-bold text-gray-900">Definições</h1>
    </header>

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">
            Perfis Familiares
          </h2>
          <p class="text-xs text-gray-500">
            Gere doses habituais, dietas, alergias e exclusões
          </p>
        </div>
        <button
          type="button"
          class="rounded-xl bg-[#42b883] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#38a373]"
          data-testid="new-profile-btn"
          @click="openCreateForm"
        >
          + Novo Perfil
        </button>
      </div>

      <form
        v-if="formOpen"
        class="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        data-testid="profile-form"
        @submit.prevent="saveProfile"
      >
        <h3 class="text-base font-bold text-gray-900">
          {{ editingId !== null ? "Editar Perfil" : "Novo Perfil" }}
        </h3>

        <label class="block">
          <span class="text-sm font-medium text-gray-700">Nome do perfil</span>
          <input
            v-model="form.name"
            type="text"
            placeholder="Ex: Ana"
            data-testid="profile-name"
            class="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm"
          />
        </label>

        <div>
          <span class="text-sm font-medium text-gray-700">Doses habituais</span>
          <div class="mt-1 flex items-center gap-4">
            <button
              type="button"
              data-testid="servings-minus"
              class="h-10 w-10 rounded-full border border-gray-300 text-lg disabled:opacity-40"
              :disabled="form.servings <= 1"
              @click="form.servings--"
            >
              −
            </button>
            <span class="text-lg font-semibold" data-testid="servings-value">
              {{ form.servings }}
            </span>
            <button
              type="button"
              data-testid="servings-plus"
              class="h-10 w-10 rounded-full border border-gray-300 text-lg"
              @click="form.servings++"
            >
              +
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <span class="block text-sm font-medium text-gray-700"
            >Estilo alimentar</span
          >
          <label
            v-for="d in DIETS"
            :key="d.value"
            class="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5 text-sm"
          >
            <input
              v-model="form.diets"
              type="checkbox"
              :value="d.value"
              :data-testid="`diet-${d.value}`"
            />
            {{ d.label }}
          </label>
        </div>

        <TagInput v-model="form.allergies" label="Alergias" testid="allergy" />
        <TagInput
          v-model="form.excludedIngredients"
          label="Ingredientes excluídos"
          testid="excluded"
        />

        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            data-testid="cancel-profile-btn"
            @click="cancelForm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="flex-1 rounded-xl bg-[#42b883] py-2.5 text-sm font-semibold text-white hover:bg-[#38a373] disabled:opacity-50"
            :disabled="!canSave || saving"
            data-testid="save-profile-btn"
          >
            Guardar
          </button>
        </div>
      </form>

      <div class="space-y-3" data-testid="profiles-list">
        <article
          v-for="perfil in profiles.profiles"
          :key="perfil.id"
          class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          data-testid="profile-card"
          :data-profile-name="perfil.name"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-bold text-gray-900">
                  {{ perfil.name }}
                </h3>
                <span
                  v-if="perfil.id === profiles.activeProfile?.id"
                  class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                >
                  Ativo
                </span>
                <span
                  v-if="perfil.isDefault"
                  class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  Predefinido
                </span>
              </div>
              <p class="mt-1 text-sm text-gray-600">
                {{ perfil.servings }}
                {{ perfil.servings === 1 ? "dose" : "doses" }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                data-testid="edit-profile-btn"
                @click="openEditForm(perfil)"
              >
                Editar
              </button>
              <button
                type="button"
                class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="profiles.profiles.length <= 1"
                data-testid="delete-profile-btn"
                @click="removeProfile(perfil.id)"
              >
                Eliminar
              </button>
            </div>
          </div>

          <div
            v-if="
              perfil.diets?.length ||
              perfil.allergies?.length ||
              perfil.excludedIngredients?.length
            "
            class="mt-3 flex flex-wrap gap-1.5 text-xs"
          >
            <span
              v-for="diet in perfil.diets"
              :key="diet"
              class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700"
            >
              {{ diet }}
            </span>
            <span
              v-for="allergy in perfil.allergies"
              :key="allergy"
              class="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-800"
            >
              Alergia: {{ allergy }}
            </span>
            <span
              v-for="excl in perfil.excludedIngredients"
              :key="excl"
              class="rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-700"
            >
              Sem {{ excl }}
            </span>
          </div>
        </article>
      </div>
    </section>

    <section
      class="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      data-testid="backup-section"
    >
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">
            Dados e Cópia de Segurança
          </h2>
          <p class="text-xs text-gray-500">
            Transfere uma cópia em JSON com a tua despensa, perfis e
            preferências
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          :disabled="exporting"
          data-testid="export-json-btn"
          @click="handleExportJson"
        >
          {{ exporting ? "A exportar..." : "Exportar JSON" }}
        </button>
      </div>

      <p
        v-if="exportStatus"
        class="rounded-lg px-3 py-2 text-xs font-medium"
        :class="
          exportError
            ? 'bg-red-50 text-red-700'
            : 'bg-emerald-50 text-emerald-700'
        "
        data-testid="export-status"
      >
        {{ exportStatus }}
      </p>
    </section>
  </main>
</template>