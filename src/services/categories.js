import { db } from '@/db'

export async function loadCustomCategories() {
  try {
    return (await db.categories.toArray()).map((c) => c.name)
  } catch (error) {
    console.error('Erro ao carregar as categorias:', error)
    return []
  }
}

export async function saveCustomCategory(name) {
  await db.categories.add({ name })
}