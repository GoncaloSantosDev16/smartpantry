import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { useProfilesStore } from "@/stores/profiles";
import { useRecipesStore } from "@/stores/recipes";
import { DEMO_RECIPE } from "@/services/recipeModel";
import { decidirArranque } from "@/services/startup";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "home", component: HomeView },
    {
      path: "/onboarding",
      name: "onboarding",
      component: () => import("../views/OnboardingView.vue"),
    },
    {
      path: "/receitas",
      name: "recipes",
      component: () => import("../views/RecipeSuggestionsView.vue"),
    },
    {
      path: "/scanner",
      name: "scanner",
      component: () => import("../components/BarcodeScanner.vue"),
    },
    // US-16: receitas guardadas (a rota "recipes" é das sugestões, US-09)
    {
      path: "/receitas/guardadas",
      name: "saved-recipes",
      component: () => import("../views/SavedRecipesView.vue"),
    },
    // US-13: detalhes e gravação de receitas
    {
      path: "/receitas/preview",
      name: "recipe-preview",
      component: () => import("../views/RecipeDetailView.vue"),
    },
    {
      path: "/receitas/:id(\\d+)",
      name: "recipe-detail",
      component: () => import("../views/RecipeDetailView.vue"),
    },
    {
      path: "/definicoes",
      name: "settings",
      component: () => import("../views/SettingsView.vue"),
    },
  ],
});

// Só em desenvolvimento: abre uma receita "gerada pela IA" de exemplo, para testar
// o ecrã de detalhes e a gravação (Katalon) sem depender do ecrã do Sous-Chef.
if (import.meta.env.DEV) {
  router.addRoute({
    path: "/receitas/demo",
    name: "recipe-demo",
    redirect: () => {
      useRecipesStore().openPreview(DEMO_RECIPE);
      return { name: "recipe-preview" };
    },
  });
}

router.beforeEach(async (to) => {
  const profiles = useProfilesStore();

  // load() trata os próprios erros e nunca rejeita, por isso uma falha de
  // armazenamento já não aborta a navegação nem deixa o ecrã em branco.
  await profiles.load();

  const destino = decidirArranque({
    temPerfilDefault: profiles.hasDefaultProfile,
    erroPersistencia: profiles.error !== null,
    rotaDestino: to.name,
  });

  if (destino) return destino;
});

export default router;
