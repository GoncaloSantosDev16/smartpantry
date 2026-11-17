import { defineStore } from 'pinia'
import { db } from '@/db'

export const useCategoriesStore = defineStore('categories', {
  state: () => ({ custom: [], loaded: false }),
  actions: {
    async load() {
      try {
        this.custom = (await db.categories.toArray()).map((c) => c.name)
      } catch (error) {
        console.error('Erro ao carregar as categorias:', error)
        this.custom = []
      } finally {
        this.loaded = true
      }
    },
    async add(name) {
      const value = String(name ?? '').trim()
      if (!value) throw new Error('Nome vazio')
      if (this.custom.some((c) => c.toLowerCase() === value.toLowerCase())) {
        throw new Error('Categoria duplicada')
      }
      await db.categories.add({ name: value })
      this.custom.push(value)
      return value
    },
  },
})