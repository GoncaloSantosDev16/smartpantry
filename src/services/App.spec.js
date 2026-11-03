import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { db } from '@/db'
import App from '@/App.vue'
import router from '@/router'

async function openApp() {
  const pinia = createPinia()
  setActivePinia(pinia)
  await router.push('/')
  const wrapper = mount(App, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return wrapper
}

describe('App', () => {
  beforeEach(async () => {
    await db.profiles.clear()
  })

  it('sem perfil, abre o onboarding', async () => {
    const wrapper = await openApp()
    expect(wrapper.find('[data-testid="onboarding"]').exists()).toBe(true)
  })

  it('com perfil, abre a página inicial', async () => {
    await db.profiles.add({ name: 'Casa', servings: 2, isDefault: true })
    const wrapper = await openApp()
    expect(wrapper.text()).toContain('SmartPantry')
  })
})