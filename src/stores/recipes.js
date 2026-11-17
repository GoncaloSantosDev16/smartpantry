import { defineStore } from 'pinia'
import { db } from '@/db'
import { normalizeRecipe } from '@/services/recipeModel'

// US-13 / SCRUM-96: livro de receitas guardadas. Usa a tabela `recipes` do Dexie
// (criada no TS-05), por isso não é preciso alterar o esquema da base de dados.

// Carregamento em curso, partilhado por todas as chamadas (mesmo padrão do store de perfis)
let carregamentoEmCurso = null

const maisRecentesPrimeiro = (a, b) =>
  String(b.savedAt ?? '').localeCompare(String(a.savedAt ?? '')) || (b.id ?? 0) - (a.id ?? 0)

export const useRecipesStore = defineStore('recipes', {
  state: () => ({
    recipes: [], // receitas guardadas, mais recentes primeiro
    loaded: false,
    error: null,
    preview: null, // receita aberta mas ainda não guardada (ex.: acabada de gerar pela IA)
  }),

  actions: {
    /** Lê as receitas diretamente do IndexedDB. Nunca rejeita. */
    async load({ forcar = false } = {}) {
      if (this.loaded && !forcar) return
      if (carregamentoEmCurso) return carregamentoEmCurso

      carregamentoEmCurso = (async () => {
        try {
          this.recipes = (await db.recipes.toArray()).sort(maisRecentesPrimeiro)
          this.error = null
        } catch (err) {
          // Armazenamento indisponível (navegação privada, quota, permissões)
          this.recipes = []
          this.error = err
          console.error('Não foi possível ler as receitas guardadas:', err)
        } finally {
          this.loaded = true
          carregamentoEmCurso = null
        }
      })()

      return carregamentoEmCurso
    },

    /** Receita por id: primeiro na memória, depois no IndexedDB. null se não existir. */
    async getById(id) {
      const emMemoria = this.recipes.find((r) => r.id === id)
      if (emMemoria) return emMemoria
      try {
        return (await db.recipes.get(id)) ?? null
      } catch (err) {
        console.error('Não foi possível ler a receita:', err)
        return null
      }
    },

    /** Abre uma receita para ver (sem guardar). Devolve false se for inválida. */
    openPreview(raw, { source } = {}) {
      this.preview = normalizeRecipe(raw, { source })
      return this.preview !== null
    },

    clearPreview() {
      this.preview = null
    },

    /**
     * Guarda a receita no IndexedDB e devolve o registo (com id).
     * Receitas do Spoonacular não se duplicam (mesma origem + externalId).
     * Lança erro se a receita for inválida ou se a escrita falhar.
     */
    async saveRecipe(raw, { source } = {}) {
      const recipe = normalizeRecipe(raw, { source })
      if (!recipe) throw new Error('Receita inválida: faltam o título ou os ingredientes.')

      if (recipe.externalId !== undefined) {
        const existente = await db.recipes
          .where('externalId')
          .equals(recipe.externalId)
          .and((r) => r.source === recipe.source)
          .first()
        if (existente) return existente
      }

      const registo = { ...recipe, savedAt: new Date().toISOString(), timesCooked: 0 }
      const id = await db.recipes.add(registo)
      const guardada = { ...registo, id }
      this.recipes.unshift(guardada)
      return guardada
    },
  },
})
