import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { db } from '@/db'
import { useProfilesStore } from './profiles'

const data = { name: 'Casa', servings: 2, diets: [], allergies: [], excludedIngredients: [] }

describe('profiles store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.profiles.clear()
  })

  it('o primeiro perfil criado fica como default', async () => {
    const store = useProfilesStore()
    await store.createProfile(data)
    expect(store.defaultProfile.name).toBe('Casa')
    expect(await db.profiles.count()).toBe(1)
  })

  it('o segundo perfil não é default', async () => {
    const store = useProfilesStore()
    await store.createProfile(data)
    await store.createProfile({ ...data, name: 'Amigos' })
    expect(store.profiles.filter((p) => p.isDefault)).toHaveLength(1)
  })

  it('load() lê os perfis guardados', async () => {
    await db.profiles.add({ ...data, isDefault: true })
    const store = useProfilesStore()
    await store.load()
    expect(store.hasProfiles).toBe(true)
  })
})