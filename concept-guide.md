# TanStack SPA Framework Guide

A schema-first, codegen-powered framework for building data-driven SPAs with TanStack libraries.

---

## Table of Contents

1. [Stack Overview](#stack-overview)
2. [Project Structure](#project-structure)
3. [Schema Definition Format](#schema-definition-format)
4. [Registration & Wiring System](#registration--wiring-system)
5. [Relationships & Data Loading](#relationships--data-loading)
6. [Global Search / Command Palette](#global-search--command-palette)
7. [Codegen System](#codegen-system)
8. [Generated File Patterns](#generated-file-patterns)
9. [Manual/Shared Code Patterns](#manualshared-code-patterns)
10. [Configuration Files](#configuration-files)
11. [Type Flow](#type-flow)

---

## Stack Overview

### Core Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **TanStack Router** | v1 | File-based routing, type-safe search params |
| **TanStack DB** | v0.5+ (beta) | Client-side normalized state, live queries, optimistic mutations |
| **TanStack Query** | v5 | Integrated with DB for API sync |
| **TanStack Form** | v1 | Type-safe forms with validation |
| **TanStack Table** | v8 | Headless table logic |
| **TanStack Virtual** | v3 | Virtualized lists (large datasets) |
| **Zustand** | v5 | Minimal UI state |
| **Zod** | v3.24+ | Schema validation, codegen source |

### Architecture Principles

1. **Schema-first**: Zod schemas are the single source of truth
2. **Codegen over boilerplate**: Generate repetitive code, customize as needed
3. **State has clear boundaries**:
   - TanStack DB → All domain/entity data
   - Router search params → URL state (filters, pagination, sort)
   - Zustand → Ephemeral UI state (modals, sidebar)
4. **Type safety end-to-end**: Types flow from schema → collection → query → component
5. **Collections are independent**: Relationships defined at query time, not collection time

---

## Project Structure

```
src/
├── main.tsx                          # App entry
├── router.tsx                        # Router instance
├── routeTree.gen.ts                  # Auto-generated route tree
│
├── schemas/                          # 🎯 SOURCE OF TRUTH
│   ├── index.ts                      # 🔄 AUTO-UPDATED barrel export
│   ├── _resource.schema.ts           # Base resource schema utilities
│   ├── product.schema.ts             # Example: Product schema
│   ├── customer.schema.ts            # Example: Customer schema
│   └── invoice.schema.ts             # Example: Invoice schema
│
├── collections/                      # 🔄 GENERATED (customizable)
│   ├── index.ts                      # 🔄 AUTO-UPDATED barrel export
│   ├── products.collection.ts
│   ├── customers.collection.ts
│   ├── invoices.collection.ts
│   └── queries/                      # Live queries with joins
│       ├── index.ts
│       └── invoices-with-customer.ts
│
├── routes/                           # 🔄 GENERATED (customizable)
│   ├── __root.tsx                    # Root layout (providers)
│   ├── index.tsx                     # Landing/dashboard
│   ├── _app.tsx                      # Authenticated app layout
│   └── _app/
│       ├── products/
│       │   ├── index.tsx
│       │   ├── new.tsx
│       │   └── $productId.tsx
│       ├── customers/
│       │   └── ...
│       └── invoices/
│           └── ...
│
├── components/
│   ├── ui/                           # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── combobox.tsx
│   │   ├── command.tsx               # For global search (cmdk)
│   │   ├── dialog.tsx
│   │   └── data-table.tsx
│   │
│   ├── forms/                        # 🔄 GENERATED form components
│   │   ├── _form-field.tsx           # Generic field wrapper
│   │   ├── _relation-combobox.tsx    # Relation field component
│   │   ├── product-form.tsx
│   │   └── invoice-form.tsx
│   │
│   ├── tables/                       # 🔄 GENERATED column definitions
│   │   ├── _column-helpers.tsx
│   │   ├── product-columns.tsx
│   │   └── invoice-columns.tsx
│   │
│   └── shared/
│       ├── command-menu.tsx          # Global search component
│       ├── page-header.tsx
│       ├── data-table-toolbar.tsx
│       └── loading-skeleton.tsx
│
├── stores/                           # Zustand (UI state only)
│   ├── ui.store.ts
│   └── command-menu.store.ts         # Global search state
│
├── api/
│   ├── client.ts
│   └── types.ts
│
├── lib/                              # 🔄 AUTO-UPDATED utilities
│   ├── utils.ts
│   ├── query-client.ts               # TanStack Query client
│   ├── db-client.ts                  # 🔄 AUTO-UPDATED TanStack DB setup
│   ├── registry.ts                   # 🔄 AUTO-UPDATED resource registry
│   └── navigation.ts                 # 🔄 AUTO-UPDATED navigation config
│
├── codegen/
│   ├── generate.ts
│   ├── templates/
│   │   └── ...
│   └── utils/
│       ├── schema-parser.ts
│       ├── file-writer.ts
│       └── barrel-updater.ts         # Updates barrel exports
│
└── types/
    └── index.ts
```

---

## Schema Definition Format

Schemas are the single source of truth. They include both validation AND metadata for codegen.

### Base Schema Utilities

```typescript
// schemas/_resource.schema.ts
import { z } from 'zod'

// Field metadata for codegen
export type FieldMeta = {
  label?: string
  placeholder?: string
  description?: string
  
  // Display hints
  hidden?: boolean
  readOnly?: boolean
  
  // Table hints
  columnWidth?: number
  sortable?: boolean
  filterable?: boolean
  
  // Form hints
  inputType?: 'text' | 'number' | 'email' | 'password' | 'textarea' | 
              'select' | 'combobox' | 'date' | 'datetime' | 'checkbox' |
              'currency' | 'phone' | 'url'
  
  // Relation hints (for foreign keys)
  relation?: {
    resource: string        // e.g., 'customer'
    labelField: string      // e.g., 'name'
    searchFields?: string[] // Fields to search in combobox
  }
}

// Extend Zod with metadata
declare module 'zod' {
  interface ZodType {
    meta(metadata: FieldMeta): this
  }
}

// Add .meta() method to Zod types
const originalZodType = z.ZodType.prototype
originalZodType.meta = function(metadata: FieldMeta) {
  (this as any)._meta = metadata
  return this
}

// Extract metadata from a schema
export function getFieldMeta(field: z.ZodTypeAny): FieldMeta {
  return (field as any)._meta ?? {}
}

// Resource schema config
export type ResourceConfig = {
  name: string                    // Singular: 'product'
  pluralName?: string             // Plural: 'products' (auto-derived if not set)
  
  // Display configuration (for registry/navigation)
  icon?: string                   // Lucide icon name: 'Package', 'Users'
  description?: string            // Short description for search
  
  // API configuration
  apiBasePath?: string            // Override API path (default: /api/{pluralName})
  
  // Primary key
  primaryKey?: string             // Default: 'id'
  
  // TanStack DB sync mode
  syncMode?: 'eager' | 'on-demand' | 'progressive'
  
  // Global search configuration
  search?: {
    enabled?: boolean             // Include in global search (default: true)
    searchableFields: string[]    // Fields to search
    resultLabelField: string      // Field to show in search results
    resultDescriptionField?: string // Secondary field for results
  }
  
  // Table configuration
  table?: {
    columns: string[]
    defaultSort?: { field: string; order: 'asc' | 'desc' }
    searchableFields?: string[]
    filterableFields?: string[]
  }
  
  // Form configuration
  form?: {
    sections?: Array<{
      title: string
      description?: string
      fields: string[]
    }>
  }
  
  // Search params for list view
  searchParams?: {
    filters?: string[]
    defaultPageSize?: number
  }
}

// Helper to create resource schema
export function defineResource<T extends z.ZodRawShape>(
  config: ResourceConfig,
  shape: T
) {
  const schema = z.object({
    id: z.string().uuid().meta({ hidden: true }),
    created_at: z.string().datetime().meta({ hidden: true, readOnly: true }),
    updated_at: z.string().datetime().meta({ hidden: true, readOnly: true }),
    ...shape,
  })
  
  return {
    config: {
      ...config,
      pluralName: config.pluralName ?? `${config.name}s`,
    },
    schema,
    // Type helpers
    type: {} as z.infer<typeof schema>,
    createSchema: schema.omit({ id: true, created_at: true, updated_at: true }),
    updateSchema: schema.partial().required({ id: true }),
  }
}
```

### Example Resource Schemas

```typescript
// schemas/customer.schema.ts
import { z } from 'zod'
import { defineResource } from './_resource.schema'

export const customerResource = defineResource(
  {
    name: 'customer',
    icon: 'Users',
    description: 'Manage customer accounts',
    syncMode: 'eager', // Small table, load all upfront
    
    search: {
      enabled: true,
      searchableFields: ['name', 'email', 'company'],
      resultLabelField: 'name',
      resultDescriptionField: 'email',
    },
    
    table: {
      columns: ['name', 'email', 'company', 'status'],
      defaultSort: { field: 'name', order: 'asc' },
      searchableFields: ['name', 'email'],
      filterableFields: ['status'],
    },
    
    form: {
      sections: [
        { title: 'Contact Info', fields: ['name', 'email', 'phone'] },
        { title: 'Company', fields: ['company', 'address'] },
        { title: 'Status', fields: ['status'] },
      ],
    },
  },
  {
    name: z.string().min(1).meta({ 
      label: 'Name',
      sortable: true,
    }),
    email: z.string().email().meta({ 
      label: 'Email',
      inputType: 'email',
    }),
    phone: z.string().optional().meta({ 
      label: 'Phone',
      inputType: 'phone',
    }),
    company: z.string().optional().meta({ 
      label: 'Company',
    }),
    address: z.string().optional().meta({ 
      label: 'Address',
      inputType: 'textarea',
    }),
    status: z.enum(['active', 'inactive']).default('active').meta({
      label: 'Status',
      inputType: 'select',
      filterable: true,
    }),
  }
)

export type Customer = typeof customerResource.type
```

```typescript
// schemas/invoice.schema.ts
import { z } from 'zod'
import { defineResource } from './_resource.schema'

export const invoiceResource = defineResource(
  {
    name: 'invoice',
    icon: 'FileText',
    description: 'Track invoices and payments',
    syncMode: 'on-demand', // Large table, load as needed
    
    search: {
      enabled: true,
      searchableFields: ['invoice_number'],
      resultLabelField: 'invoice_number',
      resultDescriptionField: 'status',
    },
    
    table: {
      columns: ['invoice_number', 'customer_id', 'total', 'status', 'due_date'],
      defaultSort: { field: 'created_at', order: 'desc' },
      searchableFields: ['invoice_number'],
      filterableFields: ['status'],
    },
    
    form: {
      sections: [
        { title: 'Invoice Details', fields: ['invoice_number', 'customer_id'] },
        { title: 'Amounts', fields: ['subtotal', 'tax', 'total'] },
        { title: 'Dates & Status', fields: ['issue_date', 'due_date', 'status'] },
      ],
    },
  },
  {
    invoice_number: z.string().min(1).meta({
      label: 'Invoice #',
      readOnly: true,
    }),
    
    // 🔑 FOREIGN KEY with relation metadata
    customer_id: z.string().uuid().meta({
      label: 'Customer',
      inputType: 'combobox',
      relation: {
        resource: 'customer',           // References customerResource
        labelField: 'name',             // Show customer.name in dropdown
        searchFields: ['name', 'email'], // Search by name or email
      },
    }),
    
    subtotal: z.number().min(0).meta({ 
      label: 'Subtotal', 
      inputType: 'currency' 
    }),
    tax: z.number().min(0).meta({ 
      label: 'Tax', 
      inputType: 'currency' 
    }),
    total: z.number().min(0).meta({ 
      label: 'Total', 
      inputType: 'currency', 
      readOnly: true 
    }),
    
    issue_date: z.coerce.date().meta({ 
      label: 'Issue Date', 
      inputType: 'date' 
    }),
    due_date: z.coerce.date().meta({ 
      label: 'Due Date', 
      inputType: 'date' 
    }),
    
    status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
      .default('draft')
      .meta({ 
        label: 'Status', 
        inputType: 'select', 
        filterable: true 
      }),
  }
)

export type Invoice = typeof invoiceResource.type
```

### Schemas Barrel Export

```typescript
// schemas/index.ts
// 🔄 AUTO-UPDATED by codegen - do not edit manually

export * from './product.schema'
export * from './customer.schema'
export * from './invoice.schema'

// All resource definitions for registry
export { productResource } from './product.schema'
export { customerResource } from './customer.schema'
export { invoiceResource } from './invoice.schema'
```

---

## Registration & Wiring System

The framework uses a registration system to wire everything together. Codegen automatically updates these files.

### Resource Registry

The registry is the central place that knows about all resources. Used for navigation, global search, and dynamic features.

```typescript
// lib/registry.ts
// 🔄 AUTO-UPDATED by codegen

import { 
  productResource, 
  customerResource, 
  invoiceResource 
} from '@/schemas'

import {
  productsCollection,
  customersCollection,
  invoicesCollection,
} from '@/collections'

import type { ResourceConfig } from '@/schemas/_resource.schema'

// Resource registry entry
export type ResourceEntry = {
  config: ResourceConfig & { pluralName: string }
  collection: ReturnType<typeof import('@tanstack/react-db').createCollection>
  routes: {
    list: string
    new: string
    edit: (id: string) => string
  }
}

// 🔄 AUTO-GENERATED: Resource registry
export const resourceRegistry: Record<string, ResourceEntry> = {
  product: {
    config: productResource.config,
    collection: productsCollection,
    routes: {
      list: '/products',
      new: '/products/new',
      edit: (id) => `/products/${id}`,
    },
  },
  customer: {
    config: customerResource.config,
    collection: customersCollection,
    routes: {
      list: '/customers',
      new: '/customers/new',
      edit: (id) => `/customers/${id}`,
    },
  },
  invoice: {
    config: invoiceResource.config,
    collection: invoicesCollection,
    routes: {
      list: '/invoices',
      new: '/invoices/new',
      edit: (id) => `/invoices/${id}`,
    },
  },
}

// Helper functions
export function getResource(name: string): ResourceEntry | undefined {
  return resourceRegistry[name]
}

export function getResourceByPlural(pluralName: string): ResourceEntry | undefined {
  return Object.values(resourceRegistry).find(
    r => r.config.pluralName === pluralName
  )
}

export function getAllResources(): ResourceEntry[] {
  return Object.values(resourceRegistry)
}

export function getSearchableResources(): ResourceEntry[] {
  return Object.values(resourceRegistry).filter(
    r => r.config.search?.enabled !== false
  )
}
```

### Collections Barrel Export

```typescript
// collections/index.ts
// 🔄 AUTO-UPDATED by codegen - do not edit manually

export { productsCollection, type Product } from './products.collection'
export { customersCollection, type Customer } from './customers.collection'
export { invoicesCollection, type Invoice } from './invoices.collection'

// Re-export all collections as array for DB client
export const allCollections = [
  // Imported dynamically in db-client.ts
]
```

### DB Client Setup

```typescript
// lib/db-client.ts
// 🔄 AUTO-UPDATED by codegen

import { createDbClient } from '@tanstack/react-db'
import { queryClient } from './query-client'

// 🔄 AUTO-GENERATED: Import all collections
import { 
  productsCollection,
  customersCollection,
  invoicesCollection,
} from '@/collections'

// Create the DB client with all collections registered
export const db = createDbClient({
  queryClient,
  collections: {
    products: productsCollection,
    customers: customersCollection,
    invoices: invoicesCollection,
  },
})

// Type helper for accessing collections
export type DbCollections = typeof db.collections
```

### Navigation Configuration

```typescript
// lib/navigation.ts
// 🔄 AUTO-UPDATED by codegen

import { 
  Package, 
  Users, 
  FileText,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { resourceRegistry } from './registry'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  description?: string
  badge?: string | number
}

export type NavSection = {
  title: string
  items: NavItem[]
}

// Icon mapping (string to component)
const iconMap: Record<string, LucideIcon> = {
  Package,
  Users,
  FileText,
  LayoutDashboard,
  Settings,
}

// 🔄 AUTO-GENERATED: Navigation from registry
export const mainNavigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
        description: 'Overview and analytics',
      },
    ],
  },
  {
    title: 'Resources',
    items: Object.values(resourceRegistry).map(resource => ({
      title: resource.config.pluralName.charAt(0).toUpperCase() + 
             resource.config.pluralName.slice(1),
      href: resource.routes.list,
      icon: iconMap[resource.config.icon ?? 'Package'] ?? Package,
      description: resource.config.description,
    })),
  },
  {
    title: 'System',
    items: [
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'Application settings',
      },
    ],
  },
]

// Flat list for search/command palette
export const allNavItems: NavItem[] = mainNavigation.flatMap(s => s.items)
```

### Codegen Barrel Updater

```typescript
// codegen/utils/barrel-updater.ts

import { readFileSync, writeFileSync, existsSync } from 'fs'

type BarrelConfig = {
  path: string
  exportPattern: (resourceName: string, pluralName: string) => string
  marker?: string // Comment marker to identify auto-generated section
}

const barrelConfigs: Record<string, BarrelConfig> = {
  schemas: {
    path: './src/schemas/index.ts',
    exportPattern: (name) => `export * from './${name}.schema'`,
  },
  collections: {
    path: './src/collections/index.ts',
    exportPattern: (name, plural) => 
      `export { ${plural}Collection, type ${capitalize(name)} } from './${plural}.collection'`,
  },
}

export function updateBarrelExport(
  barrelType: 'schemas' | 'collections',
  resourceName: string,
  pluralName: string
) {
  const config = barrelConfigs[barrelType]
  const exportLine = config.exportPattern(resourceName, pluralName)
  
  if (!existsSync(config.path)) {
    // Create new barrel file
    writeFileSync(config.path, `// 🔄 AUTO-UPDATED by codegen\n\n${exportLine}\n`)
    return
  }
  
  const content = readFileSync(config.path, 'utf-8')
  
  // Check if export already exists
  if (content.includes(exportLine)) {
    return // Already exported
  }
  
  // Append new export
  const newContent = content.trimEnd() + '\n' + exportLine + '\n'
  writeFileSync(config.path, newContent)
  console.log(`  ✓ Updated ${config.path}`)
}

export function updateRegistry(resourceName: string, pluralName: string) {
  const registryPath = './src/lib/registry.ts'
  // ... similar logic to add new resource to registry
}

export function updateDbClient(resourceName: string, pluralName: string) {
  const dbClientPath = './src/lib/db-client.ts'
  // ... similar logic to add collection import and registration
}

export function updateNavigation(resourceName: string, pluralName: string) {
  const navPath = './src/lib/navigation.ts'
  // ... similar logic to add navigation item
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
```

---

## Relationships & Data Loading

### How TanStack DB Handles Relationships

**Key Insight**: Collections are independent data stores. Relationships are defined at query time, not at collection definition time.

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Component                           │
│                                                             │
│   const { data } = useLiveQuery(q => q                      │
│     .from(invoicesCollection)                               │
│     .join(customersCollection, ...)  ← Relationship HERE    │
│     .where(...)                                             │
│   )                                                         │
│                                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │  Reactive - re-runs when data changes
                           ▼
       ┌───────────────────────────────────────┐
       │                                       │
┌──────▼──────┐                     ┌──────────▼───┐
│  invoices   │                     │  customers   │
│ collection  │                     │  collection  │
│             │  NO dependencies    │              │
│ (loads from │  between these →    │ (loads from  │
│  API async) │                     │  API async)  │
└─────────────┘                     └──────────────┘
```

### Data Loading Flow

When a component needs data from multiple collections:

```
Page opens (needs invoices + customers)
         │
         ├──→ invoicesCollection starts loading ──→ GET /api/invoices
         │
         └──→ customersCollection starts loading ──→ GET /api/customers
                        │
                        ▼
            Live query state: { data: [], isLoading: true }
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
   Invoices arrive              Customers arrive
   (query re-runs)              (query re-runs)
         │                             │
         └──────────────┬──────────────┘
                        ▼
            Live query state: { data: [...joined], isLoading: false }
```

**What you DON'T need to worry about:**
- Loading order — doesn't matter, both load in parallel
- Circular references — collections have no dependencies
- Race conditions — TanStack DB's differential dataflow handles this
- Manual refetching — live queries are reactive

### Sync Mode Strategy for Relations

```typescript
// Small lookup tables: eager (load all upfront)
const customersCollection = createCollection(
  queryCollectionOptions({
    syncMode: 'eager',  // < 10k rows, used as FK target
    // ...
  })
)

// Large transactional tables: on-demand
const invoicesCollection = createCollection(
  queryCollectionOptions({
    syncMode: 'on-demand',  // > 50k rows, query-driven
    // ...
  })
)
```

**Rule of thumb:**
- **eager**: Tables used as foreign key targets (customers, products, categories)
- **on-demand**: Large transactional tables (orders, invoices, logs)
- **progressive**: Medium tables where you want instant display + background sync

### Handling Partial Data (Loading States)

What if invoices load but customers haven't yet?

```typescript
// collections/queries/invoices-with-customer.ts

import { useLiveQuery, eq } from '@tanstack/react-db'
import { invoicesCollection } from '../invoices.collection'
import { customersCollection } from '../customers.collection'

export function useInvoicesWithCustomer(filters?: { status?: string }) {
  return useLiveQuery((q) =>
    q.from({ invoice: invoicesCollection })
      // Use LEFT JOIN to show invoices even if customer not loaded yet
      .leftJoin(
        { customer: customersCollection },
        ({ invoice, customer }) => eq(invoice.customer_id, customer.id)
      )
      .where(({ invoice }) => {
        if (filters?.status) return eq(invoice.status, filters.status)
        return true
      })
      .orderBy(({ invoice }) => invoice.created_at, 'desc')
      .select(({ invoice, customer }) => ({
        ...invoice,
        // Handle null customer gracefully
        customer_name: customer?.name ?? 'Loading...',
        customer_email: customer?.email,
      }))
  )
}
```

### Preloading Related Collections

For forms with foreign key dropdowns, preload the related collection:

```typescript
// Option A: Layout-level preloading
// routes/_app/invoices/_layout.tsx

import { useLiveQuery } from '@tanstack/react-db'
import { customersCollection } from '@/collections'
import { Outlet } from '@tanstack/react-router'

export function InvoicesLayout() {
  // This triggers customersCollection to load
  // All child routes will have customers available
  useLiveQuery((q) => q.from({ customer: customersCollection }))
  
  return <Outlet />
}
```

```typescript
// Option B: Component-level preloading with Suspense
// routes/_app/invoices/new.tsx

import { Suspense } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { customersCollection } from '@/collections'
import { InvoiceForm } from '@/components/forms/invoice-form'

export function InvoiceNewPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <InvoiceFormWithData />
    </Suspense>
  )
}

function InvoiceFormWithData() {
  // Customers load here, form won't render until ready
  const { data: customers } = useLiveQuery((q) => 
    q.from({ customer: customersCollection })
      .where(({ customer }) => eq(customer.status, 'active'))
      .orderBy(({ customer }) => customer.name, 'asc')
  )
  
  return <InvoiceForm customers={customers} />
}
```

### Relation Combobox Component

Generic component for foreign key fields:

```typescript
// components/forms/_relation-combobox.tsx

import { useState } from 'react'
import { useLiveQuery, like, or } from '@tanstack/react-db'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getResource } from '@/lib/registry'

export type RelationComboboxProps = {
  // From field metadata
  resourceName: string           // 'customer'
  labelField: string             // 'name'
  searchFields?: string[]        // ['name', 'email']
  
  // Form state
  value: string | null           // Selected ID
  onChange: (value: string | null) => void
  
  // Optional
  placeholder?: string
  disabled?: boolean
  error?: string
}

export function RelationCombobox({
  resourceName,
  labelField,
  searchFields = [labelField],
  value,
  onChange,
  placeholder = 'Select...',
  disabled,
  error,
}: RelationComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  // Get collection from registry
  const resource = getResource(resourceName)
  if (!resource) {
    console.error(`Resource "${resourceName}" not found in registry`)
    return null
  }
  
  // Query the related collection
  const { data: items, isLoading } = useLiveQuery((q) => {
    let query = q.from({ item: resource.collection })
    
    // Apply search filter if searching
    if (search) {
      query = query.where(({ item }) => 
        or(
          ...searchFields.map(field => 
            like(item[field], `%${search}%`)
          )
        )
      )
    }
    
    // Order by label field
    query = query.orderBy(({ item }) => item[labelField], 'asc')
    
    // Limit results for performance
    query = query.limit(50)
    
    return query
  })
  
  // Find selected item for display
  const selectedItem = items?.find(item => item.id === value)
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between',
            !value && 'text-muted-foreground',
            error && 'border-destructive'
          )}
        >
          {selectedItem ? selectedItem[labelField] : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={`Search ${resourceName}...`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : items?.length === 0 ? (
              <CommandEmpty>No {resourceName} found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {items?.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      onChange(item.id === value ? null : item.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === item.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{item[labelField]}</span>
                      {searchFields.length > 1 && searchFields[1] !== labelField && (
                        <span className="text-xs text-muted-foreground">
                          {item[searchFields[1]]}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

### Using Relations in Generated Forms

```typescript
// components/forms/invoice-form.tsx (GENERATED)

import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { invoiceResource } from '@/schemas/invoice.schema'
import { FormField } from './_form-field'
import { RelationCombobox } from './_relation-combobox'
import { getFieldMeta } from '@/schemas/_resource.schema'

export function InvoiceForm({ defaultValues, onSubmit }) {
  const form = useForm({
    defaultValues: {
      customer_id: defaultValues?.customer_id ?? '',
      // ... other fields
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: invoiceResource.createSchema,
    },
  })
  
  // Get field metadata for customer_id
  const customerFieldMeta = getFieldMeta(
    invoiceResource.schema.shape.customer_id
  )
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      {/* Customer field with relation */}
      <form.Field
        name="customer_id"
        children={(field) => (
          <div className="space-y-2">
            <label>{customerFieldMeta.label ?? 'Customer'}</label>
            <RelationCombobox
              resourceName={customerFieldMeta.relation!.resource}
              labelField={customerFieldMeta.relation!.labelField}
              searchFields={customerFieldMeta.relation!.searchFields}
              value={field.state.value}
              onChange={(v) => field.handleChange(v ?? '')}
              error={field.state.meta.errors[0]}
            />
            {field.state.meta.errors[0] && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      />
      
      {/* ... other fields */}
    </form>
  )
}
```

### Displaying Relations in Tables

```typescript
// components/tables/invoice-columns.tsx (GENERATED)

import { ColumnDef } from '@tanstack/react-table'
import { useLiveQuery, eq } from '@tanstack/react-db'
import { customersCollection } from '@/collections'
import type { Invoice } from '@/schemas/invoice.schema'

// Helper component for relation display
function CustomerCell({ customerId }: { customerId: string }) {
  const { data } = useLiveQuery((q) =>
    q.from({ customer: customersCollection })
      .where(({ customer }) => eq(customer.id, customerId))
  )
  
  const customer = data?.[0]
  
  if (!customer) return <span className="text-muted-foreground">-</span>
  
  return <span>{customer.name}</span>
}

export const invoiceColumns: ColumnDef<Invoice>[] = [
  {
    accessorKey: 'invoice_number',
    header: 'Invoice #',
  },
  {
    accessorKey: 'customer_id',
    header: 'Customer',
    cell: ({ row }) => <CustomerCell customerId={row.original.customer_id} />,
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => formatCurrency(row.original.total),
  },
  // ... other columns
]
```

---

## Global Search / Command Palette

A unified search across all resources using the registry.

### Command Menu Store

```typescript
// stores/command-menu.store.ts

import { create } from 'zustand'

type CommandMenuState = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useCommandMenuStore = create<CommandMenuState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))
```

### Command Menu Component

```typescript
// components/shared/command-menu.tsx

import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useLiveQuery, like, or } from '@tanstack/react-db'
import { 
  Search, 
  FileText, 
  Plus, 
  ArrowRight,
  Package,
  Users,
  type LucideIcon,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useCommandMenuStore } from '@/stores/command-menu.store'
import { getSearchableResources, type ResourceEntry } from '@/lib/registry'

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Package,
  Users,
  FileText,
}

export function CommandMenu() {
  const { isOpen, close } = useCommandMenuStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  
  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        useCommandMenuStore.getState().toggle()
      }
    }
    
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])
  
  // Get searchable resources from registry
  const searchableResources = useMemo(() => getSearchableResources(), [])
  
  const handleSelect = (callback: () => void) => {
    close()
    callback()
  }
  
  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <CommandInput 
        placeholder="Search everything..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {searchableResources.map((resource) => (
            <CommandItem
              key={`new-${resource.config.name}`}
              onSelect={() => handleSelect(() => 
                navigate({ to: resource.routes.new })
              )}
            >
              <Plus className="mr-2 h-4 w-4" />
              New {resource.config.name}
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />
        
        {/* Navigation */}
        <CommandGroup heading="Go to">
          {searchableResources.map((resource) => {
            const Icon = iconMap[resource.config.icon ?? 'Package'] ?? Package
            return (
              <CommandItem
                key={`goto-${resource.config.name}`}
                onSelect={() => handleSelect(() => 
                  navigate({ to: resource.routes.list })
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {resource.config.pluralName.charAt(0).toUpperCase() + 
                 resource.config.pluralName.slice(1)}
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </CommandItem>
            )
          })}
        </CommandGroup>
        
        {/* Search Results (only when searching) */}
        {search.length >= 2 && (
          <>
            <CommandSeparator />
            {searchableResources.map((resource) => (
              <SearchResultsGroup
                key={`results-${resource.config.name}`}
                resource={resource}
                search={search}
                onSelect={(id) => handleSelect(() => 
                  navigate({ to: resource.routes.edit(id) })
                )}
              />
            ))}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

// Search results for a single resource
function SearchResultsGroup({ 
  resource, 
  search, 
  onSelect 
}: { 
  resource: ResourceEntry
  search: string
  onSelect: (id: string) => void
}) {
  const searchConfig = resource.config.search
  if (!searchConfig) return null
  
  // Query this resource's collection with search
  const { data: results, isLoading } = useLiveQuery((q) => {
    const searchFields = searchConfig.searchableFields
    
    return q
      .from({ item: resource.collection })
      .where(({ item }) => 
        or(
          ...searchFields.map(field => 
            like(item[field], `%${search}%`)
          )
        )
      )
      .limit(5)
  })
  
  if (isLoading || !results?.length) return null
  
  const Icon = iconMap[resource.config.icon ?? 'Package'] ?? Package
  
  return (
    <CommandGroup 
      heading={
        resource.config.pluralName.charAt(0).toUpperCase() + 
        resource.config.pluralName.slice(1)
      }
    >
      {results.map((item) => (
        <CommandItem
          key={item.id}
          onSelect={() => onSelect(item.id)}
        >
          <Icon className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>{item[searchConfig.resultLabelField]}</span>
            {searchConfig.resultDescriptionField && (
              <span className="text-xs text-muted-foreground">
                {item[searchConfig.resultDescriptionField]}
              </span>
            )}
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  )
}
```

### Integrating Command Menu

```typescript
// routes/__root.tsx

import { Outlet, createRootRoute } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { DbProvider } from '@tanstack/react-db'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query-client'
import { db } from '@/lib/db-client'
import { CommandMenu } from '@/components/shared/command-menu'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <DbProvider db={db}>
        <Outlet />
        <CommandMenu />
        <Toaster />
      </DbProvider>
    </QueryClientProvider>
  )
}
```

### Search Trigger Button

```typescript
// components/shared/search-trigger.tsx

import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCommandMenuStore } from '@/stores/command-menu.store'

export function SearchTrigger() {
  const { open } = useCommandMenuStore()
  
  return (
    <Button
      variant="outline"
      className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
      onClick={open}
    >
      <Search className="mr-2 h-4 w-4" />
      Search...
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  )
}
```

---

## Codegen System

### Generator CLI

```bash
# Generate all files for a resource
pnpm generate product

# Generate specific parts
pnpm generate product --only=collection
pnpm generate product --only=routes
pnpm generate product --only=form
pnpm generate product --only=columns

# Regenerate all resources
pnpm generate:all

# Generate with force overwrite
pnpm generate product --force
```

### Updated Generator Script

```typescript
// codegen/generate.ts

import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { parseResourceSchema } from './utils/schema-parser'
import { generateCollection } from './templates/collection.template'
import { generateRouteIndex } from './templates/route-index.template'
import { generateRouteNew } from './templates/route-new.template'
import { generateRouteEdit } from './templates/route-edit.template'
import { generateForm } from './templates/form.template'
import { generateColumns } from './templates/columns.template'
import { 
  updateBarrelExport, 
  updateRegistry, 
  updateDbClient,
  updateNavigation,
} from './utils/barrel-updater'

type GenerateOptions = {
  force?: boolean
  only?: 'collection' | 'routes' | 'form' | 'columns'
  skipWiring?: boolean // Skip barrel/registry updates
}

export async function generateResource(
  resourceName: string,
  options: GenerateOptions = {}
) {
  // 1. Load and parse the schema
  const schemaPath = `./src/schemas/${resourceName}.schema.ts`
  if (!existsSync(schemaPath)) {
    throw new Error(`Schema not found: ${schemaPath}`)
  }
  
  const resource = await parseResourceSchema(schemaPath)
  const { config, fields } = resource
  
  console.log(`\nGenerating ${config.name}...`)
  
  // 2. Generate files
  const generators = [
    {
      name: 'collection',
      path: `./src/collections/${config.pluralName}.collection.ts`,
      generate: () => generateCollection(resource),
    },
    {
      name: 'routes',
      files: [
        {
          path: `./src/routes/_app/${config.pluralName}/index.tsx`,
          generate: () => generateRouteIndex(resource),
        },
        {
          path: `./src/routes/_app/${config.pluralName}/new.tsx`,
          generate: () => generateRouteNew(resource),
        },
        {
          path: `./src/routes/_app/${config.pluralName}/$${config.name}Id.tsx`,
          generate: () => generateRouteEdit(resource),
        },
      ],
    },
    {
      name: 'form',
      path: `./src/components/forms/${config.name}-form.tsx`,
      generate: () => generateForm(resource),
    },
    {
      name: 'columns',
      path: `./src/components/tables/${config.name}-columns.tsx`,
      generate: () => generateColumns(resource),
    },
  ]
  
  for (const gen of generators) {
    if (options.only && gen.name !== options.only) continue
    
    if ('files' in gen) {
      for (const file of gen.files) {
        writeGenerated(file.path, file.generate(), options.force)
      }
    } else {
      writeGenerated(gen.path, gen.generate(), options.force)
    }
  }
  
  // 3. Update wiring files (unless skipped)
  if (!options.skipWiring) {
    console.log('\nUpdating wiring...')
    
    // Update barrel exports
    updateBarrelExport('schemas', config.name, config.pluralName)
    updateBarrelExport('collections', config.name, config.pluralName)
    
    // Update registry
    updateRegistry(config.name, config.pluralName)
    
    // Update DB client
    updateDbClient(config.name, config.pluralName)
    
    // Update navigation
    updateNavigation(config.name, config.pluralName)
  }
  
  console.log(`\n✓ ${config.name} generated successfully\n`)
}

function writeGenerated(path: string, content: string, force?: boolean) {
  const dir = join(path, '..')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  
  if (existsSync(path) && !force) {
    console.log(`  ⊘ Skipped (exists): ${path}`)
    return
  }
  
  writeFileSync(path, content)
  console.log(`  ✓ Generated: ${path}`)
}

// CLI entry point
const args = process.argv.slice(2)
const resourceName = args[0]

if (!resourceName) {
  console.error('Usage: pnpm generate <resource-name> [--force] [--only=<type>]')
  process.exit(1)
}

const options: GenerateOptions = {
  force: args.includes('--force'),
  only: args.find(a => a.startsWith('--only='))?.split('=')[1] as any,
}

generateResource(resourceName, options)
```

### What Gets Generated (Summary)

For a resource called `invoice`:

| File | Purpose |
|------|---------|
| `collections/invoices.collection.ts` | TanStack DB collection with CRUD handlers |
| `routes/_app/invoices/index.tsx` | Table view with search params |
| `routes/_app/invoices/new.tsx` | Create form page |
| `routes/_app/invoices/$invoiceId.tsx` | Edit form page |
| `components/forms/invoice-form.tsx` | TanStack Form with relations |
| `components/tables/invoice-columns.tsx` | TanStack Table columns |

### What Gets Updated (Wiring)

| File | Update |
|------|--------|
| `schemas/index.ts` | Add export for new schema |
| `collections/index.ts` | Add export for new collection |
| `lib/registry.ts` | Add resource entry |
| `lib/db-client.ts` | Import and register collection |
| `lib/navigation.ts` | Add navigation item |

---

## Generated File Patterns

### Collections (TanStack DB)

```typescript
// collections/invoices.collection.ts
// 🔄 GENERATED - modifications may be overwritten

import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { invoiceResource, type Invoice } from '@/schemas/invoice.schema'
import { apiClient } from '@/api/client'

const { config, schema } = invoiceResource

export const invoicesCollection = createCollection(
  queryCollectionOptions({
    queryKey: [config.pluralName],
    schema,
    getKey: (item) => item.id,
    syncMode: config.syncMode ?? 'eager',
    
    queryFn: async (ctx) => {
      const params = ctx.meta?.loadSubsetOptions
      const response = await apiClient.get<Invoice[]>(
        `/api/${config.pluralName}`,
        { params }
      )
      return response.data
    },
    
    onInsert: async ({ transaction }) => {
      const { modified } = transaction.mutations[0]
      await apiClient.post(`/api/${config.pluralName}`, modified)
    },
    
    onUpdate: async ({ transaction }) => {
      const { original, modified } = transaction.mutations[0]
      await apiClient.patch(
        `/api/${config.pluralName}/${original.id}`, 
        modified
      )
    },
    
    onDelete: async ({ transaction }) => {
      const { original } = transaction.mutations[0]
      await apiClient.delete(`/api/${config.pluralName}/${original.id}`)
    },
  })
)

export type { Invoice }
```

### Routes - Index (Table View)

```typescript
// routes/_app/invoices/index.tsx
// 🔄 GENERATED

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useLiveQuery, eq, like } from '@tanstack/react-db'
import { invoicesCollection } from '@/collections'
import { customersCollection } from '@/collections' // For JOIN
import { invoiceColumns } from '@/components/tables/invoice-columns'
import { DataTable } from '@/components/ui/data-table'
import { DataTableToolbar } from '@/components/shared/data-table-toolbar'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const searchParamsSchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(20),
  search: z.string().optional(),
  sort: z.string().default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
})

export const Route = createFileRoute('/_app/invoices/')({
  validateSearch: searchParamsSchema,
  component: InvoicesIndexPage,
})

function InvoicesIndexPage() {
  const navigate = Route.useNavigate()
  const { page, pageSize, search, sort, order, status } = Route.useSearch()
  
  // Live query with customer join
  const { data: invoices, isLoading } = useLiveQuery((q) => {
    let query = q
      .from({ invoice: invoicesCollection })
      .leftJoin(
        { customer: customersCollection },
        ({ invoice, customer }) => eq(invoice.customer_id, customer.id)
      )
    
    if (search) {
      query = query.where(({ invoice }) => 
        like(invoice.invoice_number, `%${search}%`)
      )
    }
    
    if (status) {
      query = query.where(({ invoice }) => eq(invoice.status, status))
    }
    
    query = query.orderBy(({ invoice }) => invoice[sort], order)
    
    return query.select(({ invoice, customer }) => ({
      ...invoice,
      customer_name: customer?.name ?? 'Loading...',
    }))
  })
  
  const totalCount = invoices?.length ?? 0
  const paginatedData = invoices?.slice(
    (page - 1) * pageSize, 
    page * pageSize
  ) ?? []
  
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Invoices"
        description="Manage invoices and payments"
        action={
          <Button onClick={() => navigate({ to: '/invoices/new' })}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        }
      />
      
      <DataTableToolbar
        searchValue={search ?? ''}
        onSearchChange={(v) => navigate({ 
          search: (prev) => ({ ...prev, search: v || undefined, page: 1 }) 
        })}
        searchPlaceholder="Search invoices..."
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            options: [
              { label: 'Draft', value: 'draft' },
              { label: 'Sent', value: 'sent' },
              { label: 'Paid', value: 'paid' },
              { label: 'Overdue', value: 'overdue' },
              { label: 'Cancelled', value: 'cancelled' },
            ],
          },
        ]}
        onFilterChange={(key, value) => navigate({ 
          search: (prev) => ({ ...prev, [key]: value, page: 1 }) 
        })}
      />
      
      <DataTable
        columns={invoiceColumns}
        data={paginatedData}
        isLoading={isLoading}
      />
      
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={(p) => navigate({ 
          search: (prev) => ({ ...prev, page: p }) 
        })}
      />
    </div>
  )
}
```

### Forms with Relations

```typescript
// components/forms/invoice-form.tsx
// 🔄 GENERATED

import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { invoiceResource, type Invoice, type CreateInvoice } from '@/schemas/invoice.schema'
import { FormField } from './_form-field'
import { RelationCombobox } from './_relation-combobox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type InvoiceFormProps = {
  defaultValues?: Partial<Invoice>
  onSubmit: (data: CreateInvoice) => Promise<void>
}

export function InvoiceForm({ defaultValues, onSubmit }: InvoiceFormProps) {
  const form = useForm({
    defaultValues: {
      invoice_number: defaultValues?.invoice_number ?? '',
      customer_id: defaultValues?.customer_id ?? '',
      subtotal: defaultValues?.subtotal ?? 0,
      tax: defaultValues?.tax ?? 0,
      total: defaultValues?.total ?? 0,
      issue_date: defaultValues?.issue_date ?? new Date(),
      due_date: defaultValues?.due_date ?? new Date(),
      status: defaultValues?.status ?? 'draft',
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value as CreateInvoice)
    },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: invoiceResource.createSchema,
    },
  })
  
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
      className="space-y-6"
    >
      {/* Section: Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form.Field
            name="invoice_number"
            children={(field) => (
              <FormField
                label="Invoice #"
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
                readOnly
                description="Auto-generated"
              />
            )}
          />
          
          {/* 🔑 RELATION FIELD */}
          <form.Field
            name="customer_id"
            children={(field) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer</label>
                <RelationCombobox
                  resourceName="customer"
                  labelField="name"
                  searchFields={['name', 'email']}
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v ?? '')}
                  placeholder="Select customer..."
                  error={field.state.meta.errors[0]}
                />
                {field.state.meta.errors[0] && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          />
        </CardContent>
      </Card>
      
      {/* Section: Amounts */}
      <Card>
        <CardHeader>
          <CardTitle>Amounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <form.Field
              name="subtotal"
              children={(field) => (
                <FormField
                  label="Subtotal"
                  inputType="currency"
                  value={field.state.value}
                  onChange={(v) => field.handleChange(Number(v))}
                />
              )}
            />
            <form.Field
              name="tax"
              children={(field) => (
                <FormField
                  label="Tax"
                  inputType="currency"
                  value={field.state.value}
                  onChange={(v) => field.handleChange(Number(v))}
                />
              )}
            />
            <form.Field
              name="total"
              children={(field) => (
                <FormField
                  label="Total"
                  inputType="currency"
                  value={field.state.value}
                  readOnly
                />
              )}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Section: Dates & Status */}
      <Card>
        <CardHeader>
          <CardTitle>Dates & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="issue_date"
              children={(field) => (
                <FormField
                  label="Issue Date"
                  inputType="date"
                  value={field.state.value?.toISOString().split('T')[0] ?? ''}
                  onChange={(v) => field.handleChange(new Date(v))}
                />
              )}
            />
            <form.Field
              name="due_date"
              children={(field) => (
                <FormField
                  label="Due Date"
                  inputType="date"
                  value={field.state.value?.toISOString().split('T')[0] ?? ''}
                  onChange={(v) => field.handleChange(new Date(v))}
                />
              )}
            />
          </div>
          
          <form.Field
            name="status"
            children={(field) => (
              <FormField
                label="Status"
                inputType="select"
                options={[
                  { label: 'Draft', value: 'draft' },
                  { label: 'Sent', value: 'sent' },
                  { label: 'Paid', value: 'paid' },
                  { label: 'Overdue', value: 'overdue' },
                  { label: 'Cancelled', value: 'cancelled' },
                ]}
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
              />
            )}
          />
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Invoice'}
            </Button>
          )}
        />
      </div>
    </form>
  )
}
```

---

## Manual/Shared Code Patterns

### UI State (Zustand)

```typescript
// stores/ui.store.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UIState = {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'ui-store' }
  )
)
```

### API Client

```typescript
// api/client.ts

import axios from 'axios'
import { toast } from 'sonner'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor (add auth token)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor (handle errors)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message ?? 'An error occurred'
    
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    }
    
    return Promise.reject(error)
  }
)
```

### Generic Form Field

```typescript
// components/forms/_form-field.tsx

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type FormFieldProps = {
  label: string
  description?: string
  placeholder?: string
  error?: string
  inputType?: 'text' | 'number' | 'email' | 'password' | 'textarea' | 
              'select' | 'currency' | 'date'
  options?: { label: string; value: string }[]
  value: string | number
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  readOnly?: boolean
}

export function FormField({
  label,
  description,
  placeholder,
  error,
  inputType = 'text',
  options,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
}: FormFieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-')
  
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={cn(error && 'text-destructive')}>
        {label}
      </Label>
      
      {inputType === 'textarea' ? (
        <Textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(error && 'border-destructive')}
        />
      ) : inputType === 'select' ? (
        <Select
          value={String(value)}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger className={cn(error && 'border-destructive')}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : inputType === 'currency' ? (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id={id}
            type="number"
            step="0.01"
            min="0"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            readOnly={readOnly}
            className={cn('pl-7', error && 'border-destructive')}
          />
        </div>
      ) : (
        <Input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(error && 'border-destructive')}
        />
      )}
      
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
```

---

## Configuration Files

### Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "generate": "tsx ./src/codegen/generate.ts",
    "generate:all": "tsx ./src/codegen/generate-all.ts"
  }
}
```

---

## Type Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     schemas/invoice.schema.ts                        │
│                                                                      │
│   defineResource({                                                   │
│     name: 'invoice',                                                 │
│     ...config                                                        │
│   }, {                                                               │
│     customer_id: z.string().meta({                                   │
│       relation: { resource: 'customer', ... }   ← Relation defined   │
│     }),                                                              │
│     ...                                                              │
│   })                                                                 │
│                                                                      │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Collection   │   │     Form      │   │    Columns    │
│               │   │               │   │               │
│ Invoice type  │   │ Relation      │   │ Relation      │
│ for CRUD      │   │ Combobox      │   │ Cell renders  │
│               │   │ component     │   │ customer.name │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                    Live Query (JOIN)                     │
│                                                         │
│   useLiveQuery(q => q                                   │
│     .from(invoicesCollection)                           │
│     .leftJoin(customersCollection, ...)   ← JOIN here   │
│   )                                                     │
│                                                         │
│   Collections load independently in parallel            │
│   Query re-computes as each collection arrives          │
└─────────────────────────────────────────────────────────┘
```

---

## Summary

### What Gets Generated (per resource)

| File | Description |
|------|-------------|
| `collections/{plural}.collection.ts` | TanStack DB collection with CRUD |
| `routes/_app/{plural}/index.tsx` | Table view with joins |
| `routes/_app/{plural}/new.tsx` | Create form page |
| `routes/_app/{plural}/$id.tsx` | Edit form page |
| `components/forms/{name}-form.tsx` | Form with relation fields |
| `components/tables/{name}-columns.tsx` | Columns with relation display |

### What Gets Updated (wiring)

| File | Update |
|------|--------|
| `schemas/index.ts` | Barrel export |
| `collections/index.ts` | Barrel export |
| `lib/registry.ts` | Resource entry |
| `lib/db-client.ts` | Collection registration |
| `lib/navigation.ts` | Nav item |

### What You Write Manually

| File | Description |
|------|-------------|
| `schemas/{name}.schema.ts` | Zod schema (SOURCE OF TRUTH) |
| `collections/queries/*.ts` | Custom live queries with complex joins |
| `stores/*.ts` | Zustand UI state |
| `api/client.ts` | API configuration |
| `components/ui/*.tsx` | shadcn/ui primitives |
| `components/shared/*.tsx` | Shared components |

### Key Patterns

1. **Schema → Everything**: Define once, generate CRUD + wiring
2. **Collections are independent**: No dependencies, join at query time
3. **Live queries handle loading**: Reactive, re-compute as data arrives
4. **Registry powers features**: Navigation, global search, dynamic routing
5. **URL = Filter State**: TanStack Router search params
6. **Zustand = UI Only**: Modals, sidebar, command palette state
7. **Relations via metadata**: `inputType: 'combobox'` + `relation: {...}`
8. **Optimistic by default**: Mutations apply instantly
