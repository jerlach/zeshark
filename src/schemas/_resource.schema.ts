import { z } from 'zod'

// ============================================================================
// FIELD METADATA
// ============================================================================

/**
 * Metadata for codegen - attached to Zod fields via .meta()
 */
export type FieldMeta = {
  /** Display label for forms/tables */
  label?: string
  /** Placeholder text for inputs */
  placeholder?: string
  /** Help text / description */
  description?: string

  // Display hints
  /** Hide from forms and tables */
  hidden?: boolean
  /** Make field read-only in forms */
  readOnly?: boolean

  // Table hints
  /** Column width in pixels */
  columnWidth?: number
  /** Allow sorting by this field */
  sortable?: boolean
  /** Allow filtering by this field */
  filterable?: boolean

  // Form hints
  /** Input type for form rendering */
  inputType?:
    | 'text'
    | 'number'
    | 'email'
    | 'password'
    | 'textarea'
    | 'select'
    | 'combobox'
    | 'date'
    | 'datetime'
    | 'checkbox'
    | 'currency'
    | 'phone'
    | 'url'

  // Relation hints (for foreign keys)
  /** Defines a relation to another resource */
  relation?: {
    /** Resource name (singular), e.g., 'customer' */
    resource: string
    /** Field to display as label, e.g., 'name' */
    labelField: string
    /** Fields to search when using combobox */
    searchFields?: string[]
  }
}

// ============================================================================
// ZOD EXTENSION
// ============================================================================

// Store metadata in a WeakMap to avoid polluting Zod types
const metadataStore = new WeakMap<z.ZodTypeAny, FieldMeta>()

/**
 * Extend Zod types with .meta() method
 */
declare module 'zod' {
  interface ZodType {
    meta(metadata: FieldMeta): this
    _meta?: FieldMeta
  }
}

// Extend ZodType prototype with meta method
const originalZodType = z.ZodType.prototype
if (!originalZodType.meta) {
  originalZodType.meta = function (this: z.ZodTypeAny, metadata: FieldMeta) {
    metadataStore.set(this, metadata)
    // Also store on the type itself for easier access
    ;(this as z.ZodTypeAny & { _meta?: FieldMeta })._meta = metadata
    return this
  }
}

/**
 * Extract metadata from a Zod field
 */
export function getFieldMeta(field: z.ZodTypeAny): FieldMeta {
  // Check WeakMap first, then fall back to direct property
  return metadataStore.get(field) ?? (field as { _meta?: FieldMeta })._meta ?? {}
}

// ============================================================================
// RESOURCE CONFIG
// ============================================================================

/**
 * Configuration for a resource - defines behavior for codegen
 */
export type ResourceConfig = {
  /** Singular name: 'product', 'customer' */
  name: string
  /** Plural name: 'products' (auto-derived if not set) */
  pluralName?: string

  // Display
  /** Lucide icon name: 'Package', 'Users', 'FileText' */
  icon?: string
  /** Short description for navigation/search */
  description?: string

  // API
  /** Override API base path (default: /api/{pluralName}) */
  apiBasePath?: string

  // Primary key
  /** Primary key field (default: 'id') */
  primaryKey?: string

  // TanStack DB sync mode
  /** How to sync data: 'eager' (load all), 'on-demand' (query-driven), 'progressive' */
  syncMode?: 'eager' | 'on-demand' | 'progressive'

  // Global search configuration
  /** Global search / command palette settings */
  search?: {
    /** Include in global search (default: true) */
    enabled?: boolean
    /** Fields to search */
    searchableFields: string[]
    /** Field to show as result label */
    resultLabelField: string
    /** Secondary field for results */
    resultDescriptionField?: string
  }

  // Table configuration
  /** Table view settings */
  table?: {
    /** Columns to display */
    columns: string[]
    /** Default sort */
    defaultSort?: { field: string; order: 'asc' | 'desc' }
    /** Fields searchable in table */
    searchableFields?: string[]
    /** Fields with filter dropdowns */
    filterableFields?: string[]
  }

  // Form configuration
  /** Form layout settings */
  form?: {
    /** Group fields into sections */
    sections?: Array<{
      title: string
      description?: string
      fields: string[]
    }>
  }

  // Search params for list view
  /** URL search param configuration */
  searchParams?: {
    /** Filter fields exposed in URL */
    filters?: string[]
    /** Default page size */
    defaultPageSize?: number
  }
}

// ============================================================================
// RESOURCE DEFINITION HELPER
// ============================================================================

/**
 * Helper to define a resource with schema and config
 */
export function defineResource<T extends z.ZodRawShape>(
  config: ResourceConfig,
  shape: T
) {
  // Create the full schema with base fields
  const schema = z.object({
    id: z.string().uuid().meta({ hidden: true }),
    created_at: z.string().datetime().meta({ hidden: true, readOnly: true }),
    updated_at: z.string().datetime().meta({ hidden: true, readOnly: true }),
    ...shape,
  })

  // Derive plural name if not provided
  const pluralName = config.pluralName ?? `${config.name}s`

  return {
    config: {
      ...config,
      pluralName,
    } as ResourceConfig & { pluralName: string },

    /** Full schema including id, created_at, updated_at */
    schema,

    /** Type inferred from schema */
    type: {} as z.infer<typeof schema>,

    /** Schema for creating (without id, timestamps) */
    createSchema: schema.omit({
      id: true,
      created_at: true,
      updated_at: true,
    }),

    /** Schema for updating (partial, requires id) */
    updateSchema: schema.partial().required({ id: true }),
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Infer the type from a resource definition */
export type InferResourceType<R extends ReturnType<typeof defineResource>> =
  R['type']

/** Infer the create input type from a resource definition */
export type InferCreateType<R extends ReturnType<typeof defineResource>> =
  z.infer<R['createSchema']>

/** Infer the update input type from a resource definition */
export type InferUpdateType<R extends ReturnType<typeof defineResource>> =
  z.infer<R['updateSchema']>
