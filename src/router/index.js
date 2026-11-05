import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { useProfilesStore } from "@/stores/profiles";
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
      path: "/scanner",
      name: "scanner",
      component: () => import("../components/BarcodeScanner.vue"),
    },
  ],
});

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
