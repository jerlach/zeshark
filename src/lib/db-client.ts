import { ordersCollection } from '@/collections'
// 🔄 AUTO-UPDATED by codegen - collection imports added here
// TanStack DB collections are imported and used directly via useLiveQuery

// Re-export hooks from react-db for convenience
export { useLiveQuery, useLiveSuspenseQuery } from '@tanstack/react-db'
export { createCollection, createTransaction } from '@tanstack/db'

// Collections registry - codegen adds collection imports here
export const collections = {
  // === COLLECTIONS ===
    orders: ordersCollection,
} as const

export type DbCollections = typeof collections
