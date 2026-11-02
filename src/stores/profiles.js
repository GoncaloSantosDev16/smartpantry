import { defineStore } from 'pinia'
import { db } from '@/db'

export const useProfilesStore = defineStore('profiles', {
  state: () => ({ profiles: [], loaded: false }),
  getters: {
    hasProfiles: (s) => s.profiles.length > 0,
    defaultProfile: (s) => s.profiles.find((p) => p.isDefault) ?? null,
  },
  actions: {
    async load() {
      this.profiles = await db.profiles.toArray()
      this.loaded = true
    },
    async createProfile(data) {
      const isDefault = this.profiles.length === 0
      const profile = { ...data, isDefault }
      const id = await db.profiles.add(profile)
      this.profiles.push({ ...profile, id })
    },
  },
})