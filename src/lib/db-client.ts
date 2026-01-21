// 🔄 AUTO-UPDATED by codegen - collection imports added here
// TanStack DB collections are imported and used directly via useLiveQuery
// Note: Parquet-backed resources use hooks from @/collections instead

// Re-export hooks from react-db for convenience
export { useLiveQuery, useLiveSuspenseQuery } from '@tanstack/react-db'
export { createCollection, createTransaction } from '@tanstack/db'

// Collections registry - codegen adds JSON-backed collection imports here
// Parquet-backed collections are NOT added here (they use DuckDB hooks instead)
export const collections = {
  // === COLLECTIONS ===
} as const

export type DbCollections = typeof collections
