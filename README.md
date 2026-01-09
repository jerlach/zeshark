# 🦈 Zeshark

A schema-first, codegen-powered template for building data-driven SPAs with TanStack libraries.

## Stack

| Library | Purpose |
|---------|---------|
| **TanStack Router** | Type-safe routing with file-based routes |
| **TanStack DB** | Client-side normalized state with live queries |
| **TanStack Query** | Server state management |
| **TanStack Form** | Type-safe forms |
| **TanStack Table** | Headless table logic |
| **Zustand** | UI state |
| **Zod** | Schema validation |
| **shadcn/ui** | UI components |

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Install UI components
pnpm setup-ui

# 3. Start dev server
pnpm dev
```

## Creating a Resource

### 1. Define the Schema

Create a schema file in `src/schemas/`:

```typescript
// src/schemas/customer.schema.ts
import { z } from 'zod'
import { defineResource } from './_resource.schema'

export const customerResource = defineResource(
  {
    name: 'customer',
    icon: 'Users',
    description: 'Manage customer accounts',
    syncMode: 'eager',
    
    search: {
      enabled: true,
      searchableFields: ['name', 'email'],
      resultLabelField: 'name',
      resultDescriptionField: 'email',
    },
    
    table: {
      columns: ['name', 'email', 'status'],
      defaultSort: { field: 'name', order: 'asc' },
      searchableFields: ['name', 'email'],
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
    status: z.enum(['active', 'inactive']).default('active').meta({
      label: 'Status',
      inputType: 'select',
    }),
  }
)

export type Customer = typeof customerResource.type
```

### 2. Generate Code

```bash
pnpm generate customer
```

This generates:
- `src/collections/customers.collection.ts` - TanStack DB collection
- `src/routes/_app/customers/index.tsx` - List page
- `src/routes/_app/customers/new.tsx` - Create page
- `src/routes/_app/customers/$customerId.tsx` - Edit page
- `src/components/forms/customer-form.tsx` - Form component
- `src/components/tables/customer-columns.tsx` - Table columns

And updates:
- `src/schemas/index.ts` - Schema export
- `src/collections/index.ts` - Collection export
- `src/lib/registry.ts` - Resource registry
- `src/lib/db-client.ts` - DB client
- `src/lib/navigation.ts` - Navigation

### 3. Connect Your API

Update `src/api/client.ts` with your API base URL:

```typescript
export const apiClient = axios.create({
  baseURL: 'https://your-api.com',
})
```

## CLI Commands

```bash
# Generate a resource
pnpm generate <resource-name>

# Generate with force overwrite
pnpm generate <resource-name> --force

# Generate specific parts only
pnpm generate <resource-name> --only=collection
pnpm generate <resource-name> --only=routes
pnpm generate <resource-name> --only=form
pnpm generate <resource-name> --only=columns

# Generate all resources
pnpm generate:all

# Add shadcn component
pnpm dlx shadcn@latest add <component-name>
```

## Field Metadata

Use `.meta()` to configure field behavior:

```typescript
z.string().meta({
  label: 'Display Name',
  placeholder: 'Enter name...',
  description: 'Help text',
  
  // Display
  hidden: false,
  readOnly: false,
  
  // Table
  sortable: true,
  filterable: true,
  columnWidth: 200,
  
  // Form input type
  inputType: 'text' | 'number' | 'email' | 'textarea' | 
             'select' | 'combobox' | 'date' | 'currency',
  
  // Relation (foreign key)
  relation: {
    resource: 'customer',
    labelField: 'name',
    searchFields: ['name', 'email'],
  },
})
```

## Project Structure

```
src/
├── schemas/           # 🎯 SOURCE OF TRUTH
│   ├── _resource.schema.ts
│   └── *.schema.ts
├── collections/       # 🔄 GENERATED
│   └── *.collection.ts
├── routes/            # 🔄 GENERATED
│   ├── __root.tsx
│   ├── _app.tsx
│   └── _app/*/
├── components/
│   ├── ui/            # shadcn components
│   ├── forms/         # 🔄 GENERATED
│   ├── tables/        # 🔄 GENERATED
│   └── shared/
├── lib/               # 🔄 AUTO-UPDATED
│   ├── registry.ts
│   ├── db-client.ts
│   └── navigation.ts
├── stores/            # Zustand stores
├── api/               # API client
└── codegen/           # Code generation
```

## Architecture

### State Management

| State Type | Solution |
|------------|----------|
| Entity/Domain Data | TanStack DB (collections + live queries) |
| URL State | TanStack Router (search params) |
| UI State | Zustand (sidebar, modals) |

### Data Flow

1. **Schema** defines validation and metadata
2. **Codegen** generates collection, routes, forms, tables
3. **Collection** loads data from API into TanStack DB
4. **Live Query** reactively queries collection
5. **Components** render data and handle mutations

## Environment Variables

```env
VITE_API_URL=http://localhost:3000
```

## License

MIT
