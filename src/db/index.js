import Dexie from 'dexie'

export const db = new Dexie('smartpantry')

db.version(1).stores({
  profiles: '++id, isDefault',
  pantryItems: '++id, name, category, expirationDate',
  categories: '++id, &name',
  shoppingItems: '++id, checked',
  recipes: '++id, externalId, source',
  collections: '++id, &name',
})

// booleanos não são indexáveis no IndexedDB: removemos esses índices
db.version(2).stores({
  profiles: '++id',
  shoppingItems: '++id, name',
})