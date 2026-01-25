# Zeshark Architecture

This document explains how Zeshark's components work together.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    React Application                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │  TanStack   │  │  TanStack   │  │    TanStack     │   │   │
│  │  │   Router    │  │    Form     │  │     Table       │   │   │
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │   │
│  │         │                │                   │            │   │
│  │         └────────────────┼───────────────────┘            │   │
│  │                          │                                │   │
│  │  ┌───────────────────────┴───────────────────────────┐   │   │
│  │  │                  State Layer                       │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │   │
│  │  │  │ TanStack DB │  │  TanStack   │  │  Zustand  │  │   │   │
│  │  │  │ Collections │  │    Query    │  │  Stores   │  │   │   │
│  │  │  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │   │   │
│  │  └─────────┼────────────────┼───────────────┼────────┘   │   │
│  │            │                │               │             │   │
│  │  ┌─────────┴────────────────┴───────────────┘            │   │
│  │  │              Data Layer                                │   │
│  │  │  ┌─────────────────┐  ┌────────────────────────┐      │   │
│  │  │  │   Axios Client  │  │  DuckDB WASM          │      │   │
│  │  │  │   (JSON APIs)   │  │  (Parquet Queries)    │      │   │
│  │  │  └────────┬────────┘  └───────────┬───────────┘      │   │
│  │  └───────────┼───────────────────────┼──────────────────┘   │
│  └──────────────┼───────────────────────┼──────────────────────┘
└─────────────────┼───────────────────────┼──────────────────────┘
                  │                       │
                  ▼                       ▼
          ┌───────────────┐       ┌───────────────┐
          │   REST API    │       │ Parquet Files │
          │   (JSON)      │       │ (Binary)      │
          └───────────────┘       └───────────────┘
```

## State Management Strategy

Zeshark uses different state solutions for different types of state:

| State Type | Solution | Use Case |
|------------|----------|----------|
| **Entity/Domain Data** | TanStack DB | Customer records, orders, products |
| **Server State** | TanStack Query | API responses, caching, mutations |
| **URL State** | TanStack Router | Filters, pagination, search params |
| **UI State** | Zustand | Sidebar open, modals, toasts |
| **Form State** | TanStack Form | Input values, validation, submission |

### Why This Split?

1. **Entity Data (TanStack DB)**
   - Normalized storage (no duplicates)
   - Live queries that auto-update
   - Optimistic updates
   - Works offline

2. **Server State (TanStack Query)**
   - Handles loading/error states
   - Automatic caching and refetching
   - Request deduplication
   - Background updates

3. **URL State (TanStack Router)**
   - Shareable/bookmarkable URLs
   - Browser back/forward works
   - Type-safe search params
   - SSR-friendly

4. **UI State (Zustand)**
   - Fast updates (no re-renders)
   - Persisted to localStorage if needed
   - Simple API
   - Devtools support

---

## Data Flow

### JSON Resources (TanStack DB)

```
1. Component mounts
         │
         ▼
2. useLiveQuery() subscribes to collection
         │
         ▼
3. Collection checks sync status
         │
         ▼
4. If stale → TanStack Query fetches from API
         │
         ▼
5. API response inserted into TanStack DB
         │
         ▼
6. Live query re-runs, component re-renders
         │
         ▼
7. User makes mutation (create/update/delete)
         │
         ▼
8. Optimistic update to TanStack DB
         │
         ▼
9. TanStack Query sends mutation to API
         │
         ▼
10. On success: sync confirmed
    On error: rollback optimistic update
```

### Parquet Resources (DuckDB)

```
1. Component mounts
         │
         ▼
2. useDuckDBQuery() called with options
         │
         ▼
3. TanStack Query checks cache
         │
         ▼
4. If cache miss → fetch parquet via axios
         │
         ▼
5. Parquet file registered with DuckDB WASM
         │
         ▼
6. SQL query executed in browser
         │
         ▼
7. Results returned to component
         │
         ▼
8. TanStack Query caches results
```

---

## File-Based Routing

Zeshark uses TanStack Router's file-based routing:

```
src/routes/
├── __root.tsx          # Root layout (providers)
├── index.tsx           # Landing page (/)
├── _app.tsx            # App shell with sidebar (/_app/*)
└── _app/
    └── customers/
        ├── index.tsx       # /customers (list)
        ├── new.tsx         # /customers/new (create)
        └── $customerId.tsx # /customers/:id (edit)
```

### Route Conventions

| Pattern | Example | Description |
|---------|---------|-------------|
| `__root.tsx` | - | Root layout, wraps all routes |
| `_app.tsx` | - | Layout route (underscore prefix) |
| `index.tsx` | `/customers` | Index route for directory |
| `$param.tsx` | `/customers/123` | Dynamic segment |
| `new.tsx` | `/customers/new` | Static segment |

### Generated Route Structure

When you run `pnpm generate customer`, it creates:

```typescript
// src/routes/_app/customers/index.tsx
export const Route = createFileRoute('/_app/customers/')({
  component: CustomersPage,
  validateSearch: customerSearchSchema,  // URL search params
})

// src/routes/_app/customers/$customerId.tsx
export const Route = createFileRoute('/_app/customers/$customerId')({
  component: CustomerEditPage,
  loader: ({ params }) => loadCustomer(params.customerId),
})
```

---

## Collections (TanStack DB)

Collections provide normalized client-side storage with live queries.

### Collection Definition

```typescript
// src/collections/customers.collection.ts
import { Collection } from '@tanstack/db'

export const customersCollection = new Collection({
  name: 'customers',
  primaryKey: 'id',
  
  // Sync configuration
  sync: {
    fetchAll: async () => {
      const response = await apiClient.get('/customers')
      return response.data
    },
  },
})
```

### Live Queries

```typescript
// In a component
const customers = useLiveQuery(
  customersCollection.query()
    .where('status', '==', 'active')
    .orderBy('name')
    .limit(50)
)

// Automatically re-renders when data changes
```

### Mutations

```typescript
// Create
await customersCollection.insert({
  id: crypto.randomUUID(),
  name: 'John Doe',
  email: 'john@example.com',
})

// Update
await customersCollection.update('customer-id', {
  name: 'Jane Doe',
})

// Delete
await customersCollection.delete('customer-id')
```

---

## DuckDB Integration

For large datasets, Zeshark uses DuckDB WASM to run SQL directly in the browser.

### How It Works

1. **Fetch**: Parquet file fetched via axios (with auth headers)
2. **Register**: File registered with DuckDB WASM
3. **Query**: SQL executed against the parquet file
4. **Cache**: Results cached by TanStack Query

### Query Hook

```typescript
const { data, isLoading, totalCount } = useDuckDBQuery({
  queryKey: ['orders'],
  baseUrl: '/api/orders',
  where: "status = 'pending'",
  orderBy: 'created_at DESC',
  pageSize: 100,
  page: 0,
})
```

### Virtual Scrolling

For extremely large datasets, use windowed queries:

```typescript
const { fetchRows, getTotalCount } = useWindowedQuery({
  queryKey: ['orders'],
  baseUrl: '/api/orders',
})

// Fetch only visible rows
const visibleRows = await fetchRows(startIndex, 50)
```

### Performance

DuckDB WASM can handle:
- **100k+ rows** with instant filtering
- **Complex aggregations** (GROUP BY, SUM, AVG)
- **Joins** between parquet files
- **Window functions** for analytics

---

## Code Generation

The codegen system reads Zod schemas and generates code.

### Pipeline

```
Schema File (.schema.ts)
         │
         ▼
Schema Parser (ts-morph)
         │
         ├── Extract ResourceConfig
         ├── Extract field definitions
         └── Extract metadata
         │
         ▼
Template Engine
         │
         ├── collection.template.ts
         ├── route-*.template.ts
         ├── form.template.ts
         └── columns.template.ts
         │
         ▼
File Writer
         │
         ├── Write generated files
         └── Update barrel files
```

### Template System

Templates are TypeScript functions that return strings:

```typescript
// src/codegen/templates/form.template.ts
export function generateForm(resource: ParsedResource): string {
  return `
import { useForm } from '@tanstack/react-form'
import { ${resource.typeName} } from '@/schemas/${resource.config.name}.schema'

export function ${resource.formName}({ initialData }: Props) {
  const form = useForm<${resource.typeName}>({
    defaultValues: initialData,
  })
  
  return (
    <form onSubmit={form.handleSubmit}>
      ${resource.fields.map(generateField).join('\n')}
    </form>
  )
}
`
}
```

---

## Component Architecture

### Shared Components

```
src/components/
├── ui/                 # shadcn/ui primitives
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── shared/             # App-specific reusables
│   ├── data-table.tsx       # Standard table
│   ├── data-table-virtual.tsx # Virtual scrolling
│   ├── page-header.tsx
│   └── command-menu.tsx
├── forms/              # Generated per resource
│   ├── _form-field.tsx      # Base field component
│   └── customer-form.tsx    # Generated
└── tables/             # Generated per resource
    ├── _column-helpers.tsx  # Shared column utilities
    └── customer-columns.tsx # Generated
```

### Form Field Component

The `_form-field.tsx` handles all input types:

```typescript
<FormField
  label="Email"
  inputType="email"
  value={value}
  onChange={onChange}
  error={error}
/>
```

### Data Table Component

The `data-table.tsx` wraps TanStack Table:

```typescript
<DataTable
  columns={customerColumns}
  data={customers}
  isLoading={isLoading}
/>
```

---

## Registry Pattern

The resource registry provides runtime access to all resources:

```typescript
// src/lib/registry.ts
export const resourceRegistry = {
  customer: {
    config: customerResource.config,
    collection: customersCollection,
    dataSource: 'json',
    routes: {
      list: '/customers',
      new: '/customers/new',
      edit: (id) => `/customers/${id}`,
    },
  },
  order: {
    config: orderResource.config,
    dataSource: 'parquet',
    routes: { ... },
  },
}
```

This enables:
- Command palette searching all resources
- Dynamic navigation generation
- Runtime resource lookup

---

## Performance Optimizations

### Lazy Loading

Routes are code-split automatically by TanStack Router.

### Query Caching

TanStack Query caches API responses:

```typescript
const query = useQuery({
  queryKey: ['customers'],
  staleTime: 5 * 60 * 1000,  // Fresh for 5 minutes
  gcTime: 30 * 60 * 1000,    // Keep in cache 30 minutes
})
```

### Parquet Caching

DuckDB keeps parquet files in memory:

```typescript
// File cached after first fetch
const registeredFiles = new Map<string, string>()
```

### Virtual Scrolling

Large tables use virtualization:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: data.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 48,
})
```

---

## Security Considerations

### API Authentication

Axios interceptor adds auth headers:

```typescript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Environment Variables

Sensitive values use Vite's env:

```typescript
// Only VITE_ prefixed vars are exposed to client
const apiUrl = import.meta.env.VITE_API_URL
```

### XSS Prevention

React handles escaping. For raw HTML:

```typescript
// Avoid unless necessary
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

---

## Extending Zeshark

### Adding a New Field Type

1. Add to `FieldMeta.inputType` union
2. Update `_form-field.tsx` to render it
3. Update `form.template.ts` to generate it

### Adding a New Template

1. Create `src/codegen/templates/my-thing.template.ts`
2. Add to generator list in `generate.ts`
3. Add barrel updater if needed

### Custom Collection Sync

Override sync behavior per collection:

```typescript
const customersCollection = new Collection({
  sync: {
    fetchAll: myCustomFetcher,
    fetchOne: myCustomSingleFetcher,
  },
})
```
