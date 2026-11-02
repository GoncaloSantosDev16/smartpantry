import { useProfilesStore } from '@/stores/profiles'

const profiles = useProfilesStore()

async function finish() {
  await profiles.createProfile({
    name: form.name.trim(),
    servings: form.servings,
    diets: [...form.diets],
    allergies: [...form.allergies],
    excludedIngredients: [...form.excludedIngredients],
  })
  router.push({ name: 'home' })
}