// 🔄 AUTO-UPDATED by codegen - imports and entries added here

import type { ResourceConfig } from '@/schemas/_resource.schema'
import { orderResource } from '@/schemas/order.schema'
// Note: Parquet collections use hooks, not TanStack DB collections

// Resource registry entry type
export type ResourceEntry = {
  config: ResourceConfig & { pluralName: string }
  collection?: unknown // Optional - parquet resources don't have collections
  dataSource: 'json' | 'parquet'
  routes: {
    list: string
    new: string
    edit: (id: string) => string
  }
}

// Resource registry - populated by codegen
export const resourceRegistry: Record<string, ResourceEntry> = {
  // === REGISTRY ENTRIES ===
  order: {
    config: orderResource.config,
    dataSource: 'parquet',
    routes: {
      list: '/orders',
      new: '/orders/new',
      edit: (id: string) => `/orders/${id}`,
    },
  },
}

/**
 * Get a resource by singular name
 */
export function getResource(name: string): ResourceEntry | undefined {
  return resourceRegistry[name]
}

/**
 * Get a resource by plural name
 */
export function getResourceByPlural(pluralName: string): ResourceEntry | undefined {
  return Object.values(resourceRegistry).find(
    (r) => r.config.pluralName === pluralName
  )
}

/**
 * Get all registered resources
 */
export function getAllResources(): ResourceEntry[] {
  return Object.values(resourceRegistry)
}

/**
 * Get resources that are searchable (for command palette)
 */
export function getSearchableResources(): ResourceEntry[] {
  return Object.values(resourceRegistry).filter(
    (r) => r.config.search?.enabled !== false
  )
}
