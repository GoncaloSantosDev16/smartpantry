import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import { db } from "@/db";
import { useProfilesStore } from "@/stores/profiles";
import * as dataExport from "@/services/dataExport";
import SettingsView from "./SettingsView.vue";

function criarRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div>Home</div>" } },
      { path: "/definicoes", name: "settings", component: SettingsView },
    ],
  });
}

describe("SettingsView (SCRUM-141 & SCRUM-148)", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await db.profiles.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lista os perfis e desativa o botão eliminar quando existe apenas um perfil", async () => {
    const store = useProfilesStore();
    await store.createProfile({
      name: "Casa",
      servings: 2,
      diets: [],
      allergies: [],
      excludedIngredients: [],
    });

    const router = criarRouter();
    await router.push("/definicoes");
    await router.isReady();

    const wrapper = mount(SettingsView, { global: { plugins: [router] } });
    await flushPromises();

    expect(
      wrapper.find('[data-testid="profile-card"]').attributes("data-profile-name"),
    ).toBe("Casa");
    expect(
      wrapper.find('[data-testid="delete-profile-btn"]').attributes("disabled"),
    ).toBeDefined();
  });

  it("permite criar e editar um perfil pelo formulário", async () => {
    const store = useProfilesStore();
    await store.createProfile({
      name: "Casa",
      servings: 2,
      diets: [],
      allergies: [],
      excludedIngredients: [],
    });

    const router = criarRouter();
    await router.push("/definicoes");
    await router.isReady();

    const wrapper = mount(SettingsView, { global: { plugins: [router] } });
    await flushPromises();

    // Criar novo perfil
    await wrapper.find('[data-testid="new-profile-btn"]').trigger("click");
    await wrapper.find('[data-testid="profile-name"]').setValue("Ana");
    await wrapper.find('[data-testid="servings-minus"]').trigger("click");
    await wrapper.find('[data-testid="diet-vegetarian"]').setValue(true);
    await wrapper.find('[data-testid="profile-form"]').trigger("submit");

    await vi.waitFor(() => {
      expect(store.profiles).toHaveLength(2);
    });
    await flushPromises();
    expect(wrapper.findAll('[data-testid="profile-card"]')).toHaveLength(2);

    // Editar o primeiro perfil
    await wrapper.findAll('[data-testid="edit-profile-btn"]')[0].trigger("click");
    await wrapper.find('[data-testid="profile-name"]').setValue("Família");
    await wrapper.find('[data-testid="profile-form"]').trigger("submit");

    await vi.waitFor(() => {
      expect(store.profiles[0].name).toBe("Família");
    });
  });

  it("exporta os dados para JSON e apresenta confirmação visual (SCRUM-148)", async () => {
    const exportSpy = vi
      .spyOn(dataExport, "exportAllDataToJson")
      .mockResolvedValueOnce({
        filename: "smartpantry-backup-2026-11-26.json",
        data: { app: "SmartPantry" },
      });

    const router = criarRouter();
    await router.push("/definicoes");
    await router.isReady();

    const wrapper = mount(SettingsView, { global: { plugins: [router] } });
    await flushPromises();

    await wrapper.find('[data-testid="export-json-btn"]').trigger("click");
    await flushPromises();

    expect(exportSpy).toHaveBeenCalledTimes(1);
    const status = wrapper.find('[data-testid="export-status"]');
    expect(status.exists()).toBe(true);
    expect(status.text()).toContain("smartpantry-backup-2026-11-26.json");
  });

  it("apresenta mensagem de erro se a exportação JSON falhar (SCRUM-148)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(dataExport, "exportAllDataToJson").mockRejectedValueOnce(
      new Error("erro de escrita"),
    );

    const router = criarRouter();
    await router.push("/definicoes");
    await router.isReady();

    const wrapper = mount(SettingsView, { global: { plugins: [router] } });
    await flushPromises();

    await wrapper.find('[data-testid="export-json-btn"]').trigger("click");
    await flushPromises();

    const status = wrapper.find('[data-testid="export-status"]');
    expect(status.exists()).toBe(true);
    expect(status.text()).toContain("Não foi possível exportar");
  });
});