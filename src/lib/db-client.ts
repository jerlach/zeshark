// 🔄 AUTO-UPDATED by codegen - collection imports added here

import { createDbClient } from '@tanstack/db'
import { queryClient } from './query-client'

// Create the DB client with all collections registered
export const db = createDbClient({
  queryClient,
  collections: {
    // === COLLECTIONS ===
  },
})

// Type helper for accessing collections
export type DbCollections = typeof db.collections
