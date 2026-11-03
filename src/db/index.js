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