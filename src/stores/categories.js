import { defineStore } from 'pinia'
import { db } from '@/db'

const DEFAULT_CATEGORIES = [
  'Laticínios', 'Bebidas', 'Cereais', 'Snacks', 
  'Carne', 'Fruta', 'Vegetais', 'Outro'
]

export const useCategoriesStore = defineStore('categories', {
  state: () => ({ custom: [], loaded: false }),
  
  getters: {
    all: (state) => Array.from(new Set([...DEFAULT_CATEGORIES, ...state.custom])),
  },

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
      
      if (this.all.some((c) => c.toLowerCase() === value.toLowerCase())) {
        throw new Error('Categoria duplicada')
      }
      
      await db.categories.add({ name: value })
      this.custom.push(value)
      return value
    },
  },
})