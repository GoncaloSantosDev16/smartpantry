import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { useProfilesStore } from "@/stores/profiles";

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
  if (!profiles.loaded) await profiles.load();

  if (!profiles.hasProfiles && to.name !== "onboarding") {
    return { name: "onboarding" };
  }
  if (profiles.hasProfiles && to.name === "onboarding") {
    return { name: "home" };
  }
});

export default router;