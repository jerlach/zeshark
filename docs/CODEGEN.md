# Code Generation

This document explains how Zeshark's code generation system works and how to customize it.

## Overview

The codegen system transforms Zod schemas into fully functional CRUD interfaces:

```
Schema Definition → Parser → Templates → Generated Files
```

## CLI Usage

```bash
# Generate all files for a resource
pnpm generate <resource-name>

# Options
pnpm generate <resource-name> --force        # Overwrite existing files
pnpm generate <resource-name> --only=form    # Generate only specific part
pnpm generate <resource-name> --skip-wiring  # Don't update barrel files

# Generate all resources
pnpm generate:all
```

### Available `--only` Values

| Value | Generated File(s) |
|-------|-------------------|
| `collection` | `src/collections/{plural}.collection.ts` |
| `routes` | List, New, Edit routes in `src/routes/_app/{plural}/` |
| `form` | `src/components/forms/{name}-form.tsx` |
| `columns` | `src/components/tables/{name}-columns.tsx` |

---

## How It Works

### 1. Schema Parsing

The parser (`src/codegen/utils/schema-parser.ts`) uses [ts-morph](https://ts-morph.com/) to analyze your schema file:

```typescript
// What the parser extracts:
{
  config: ResourceConfig,      // From defineResource() first arg
  fields: ParsedField[],       // From defineResource() second arg
  resourceVarName: string,     // e.g., "customerResource"
  typeName: string,            // e.g., "Customer"
}
```

### 2. Template Execution

Each template is a function that receives parsed resource data and returns a string:

```typescript
// src/codegen/templates/form.template.ts
export function generateForm(resource: ParsedResource): string {
  const { config, fields } = resource
  
  return `
// Generated form component
import { useForm } from '@tanstack/react-form'

export function ${capitalize(config.name)}Form({ ... }) {
  // Generated form implementation
}
`
}
```

### 3. File Writing

The file writer (`src/codegen/utils/file-writer.ts`) handles:

- Creating directories
- Writing files with proper formatting
- Skipping existing files (unless `--force`)
- Logging output

### 4. Barrel Updates

Barrel updaters (`src/codegen/utils/barrel-updater.ts`) modify shared files:

- `src/schemas/index.ts` - Export schema
- `src/collections/index.ts` - Export collection
- `src/lib/registry.ts` - Register resource
- `src/lib/db-client.ts` - Add to DB client
- `src/lib/navigation.ts` - Add nav item

---

## Templates Reference

### Collection Template

**File:** `src/codegen/templates/collection.template.ts`  
**Output:** `src/collections/{plural}.collection.ts`

Generates TanStack DB collection with:
- Type definitions
- Sync configuration (fetchAll)
- API integration

```typescript
// Generated output example
import { Collection } from '@tanstack/db'
import { Customer } from '@/schemas/customer.schema'
import { apiClient } from '@/api/client'

export const customersCollection = new Collection<Customer>({
  name: 'customers',
  primaryKey: 'id',
  sync: {
    fetchAll: async () => {
      const response = await apiClient.get('/customers')
      return response.data
    },
  },
})
```

### Parquet Collection Template

**File:** `src/codegen/templates/collection-parquet.template.ts`  
**Output:** `src/collections/{plural}.collection.ts`

Generates DuckDB-based collection for parquet resources:

```typescript
// Generated output example
import { useDuckDBQuery } from '@/hooks/use-duckdb-query'

export function useOrdersQuery(options = {}) {
  return useDuckDBQuery({
    queryKey: ['orders'],
    baseUrl: '/api/orders',
    ...options,
  })
}
```

### Route Templates

#### Index (List) Route

**File:** `src/codegen/templates/route-index.template.ts`  
**Output:** `src/routes/_app/{plural}/index.tsx`

Generates:
- Data table with columns
- Search/filter UI
- Pagination
- Create button

#### New (Create) Route

**File:** `src/codegen/templates/route-new.template.ts`  
**Output:** `src/routes/_app/{plural}/new.tsx`

Generates:
- Form component
- Create mutation
- Navigation back to list

#### Edit Route

**File:** `src/codegen/templates/route-edit.template.ts`  
**Output:** `src/routes/_app/{plural}/${ name}Id.tsx`

Generates:
- Data loading
- Form with existing values
- Update mutation
- Delete action

#### Analytics Route (Parquet only)

**File:** `src/codegen/templates/route-analytics.template.ts`  
**Output:** `src/routes/_app/{plural}/analytics.tsx`

Generates:
- KPI cards
- Charts (bar, pie, line)
- Date range filters

### Form Template

**File:** `src/codegen/templates/form.template.ts`  
**Output:** `src/components/forms/{name}-form.tsx`

Generates form with:
- TanStack Form integration
- Field components based on metadata
- Validation from Zod schema
- Section grouping

### Columns Template

**File:** `src/codegen/templates/columns.template.ts`  
**Output:** `src/components/tables/{name}-columns.tsx`

Generates TanStack Table columns:
- Header labels from metadata
- Cell formatters
- Sorting configuration
- Action column

---

## Customizing Templates

### Modifying Existing Templates

Edit files in `src/codegen/templates/`:

```typescript
// src/codegen/templates/form.template.ts
export function generateForm(resource: ParsedResource): string {
  // Add your customizations here
  return `
    // Your custom template
  `
}
```

### Adding New Templates

1. Create the template file:

```typescript
// src/codegen/templates/my-custom.template.ts
import { ParsedResource } from '../utils/schema-parser'

export function generateMyCustom(resource: ParsedResource): string {
  const { config, fields } = resource
  
  return `
// Custom generated file for ${config.name}
export const ${config.name}Custom = {
  // ...
}
`
}
```

2. Register in generator:

```typescript
// src/codegen/generate.ts
import { generateMyCustom } from './templates/my-custom.template'

const generators = [
  // ... existing generators
  {
    name: 'custom',
    path: `./src/custom/${config.name}.custom.ts`,
    generate: () => generateMyCustom(resource),
  },
]
```

3. Add `--only` option if desired:

```typescript
type GenerateOptions = {
  only?: 'collection' | 'routes' | 'form' | 'columns' | 'custom'
}
```

---

## Template Helpers

### Field Iteration

```typescript
function generateFields(resource: ParsedResource): string {
  return resource.fields
    .filter(f => !f.meta.hidden)
    .map(field => `
      <FormField
        name="${field.name}"
        label="${field.meta.label ?? field.name}"
        inputType="${field.meta.inputType ?? 'text'}"
      />
    `)
    .join('\n')
}
```

### Type Inference

```typescript
function getFieldType(field: ParsedField): string {
  const { zodType } = field
  
  if (zodType.startsWith('z.string')) return 'string'
  if (zodType.startsWith('z.number')) return 'number'
  if (zodType.startsWith('z.boolean')) return 'boolean'
  if (zodType.startsWith('z.enum')) return extractEnumType(zodType)
  if (zodType.startsWith('z.array')) return `${getInnerType(zodType)}[]`
  
  return 'unknown'
}
```

### Naming Conventions

```typescript
import { capitalize, pluralize, camelCase, kebabCase } from './utils'

// customer → Customer
capitalize(config.name)

// customer → customers  
pluralize(config.name)

// CustomerResource → customerResource
camelCase(resourceVarName)

// CustomerForm → customer-form
kebabCase(formName)
```

---

## Parsed Resource Structure

```typescript
interface ParsedResource {
  // From ResourceConfig
  config: {
    name: string           // 'customer'
    pluralName: string     // 'customers'
    icon?: string          // 'Users'
    description?: string   // 'Manage customers'
    dataSource: 'json' | 'parquet'
    syncMode?: 'eager' | 'on-demand'
    
    search?: {
      enabled: boolean
      searchableFields: string[]
      resultLabelField: string
      resultDescriptionField?: string
    }
    
    table?: {
      columns: string[]
      defaultSort?: { field: string, order: 'asc' | 'desc' }
      searchableFields?: string[]
      filterableFields?: string[]
    }
    
    form?: {
      sections?: Array<{
        title: string
        description?: string
        fields: string[]
      }>
    }
    
    analytics?: {
      enabled: boolean
      kpis?: KpiConfig[]
      groupedCharts?: ChartConfig[]
      timeSeriesCharts?: TimeSeriesConfig[]
    }
  }
  
  // Parsed fields
  fields: Array<{
    name: string           // 'email'
    zodType: string        // 'z.string().email()'
    isOptional: boolean
    hasDefault: boolean
    defaultValue?: string
    
    meta: {
      label?: string       // 'Email Address'
      placeholder?: string
      description?: string
      hidden?: boolean
      readOnly?: boolean
      inputType?: string   // 'email'
      sortable?: boolean
      filterable?: boolean
      columnWidth?: number
      relation?: {
        resource: string
        labelField: string
        searchFields?: string[]
      }
    }
  }>
  
  // Derived names
  resourceVarName: string  // 'customerResource'
  typeName: string         // 'Customer'
  formName: string         // 'CustomerForm'
  columnsName: string      // 'customerColumns'
}
```

---

## Regenerating Resources

### Full Regeneration

To regenerate a resource from scratch:

```bash
# This overwrites all generated files
pnpm generate customer --force
```

### Partial Regeneration

To regenerate only specific parts:

```bash
# Only regenerate the form
pnpm generate customer --only=form --force

# Only regenerate routes
pnpm generate customer --only=routes --force
```

### Regenerate All

To regenerate all resources:

```bash
pnpm generate:all --force
```

---

## Best Practices

### 1. Keep Schemas Clean

The parser works best with straightforward schemas:

```typescript
// ✅ Good - clean, parseable
export const customerResource = defineResource(
  { name: 'customer', ... },
  { email: z.string().email().meta({ label: 'Email' }) }
)

// ❌ Avoid - dynamic or complex
const fields = getFieldsFromSomewhere()
export const customerResource = defineResource(
  { name: 'customer' },
  fields  // Parser can't analyze this
)
```

### 2. Use Metadata Consistently

```typescript
// ✅ Good - all fields have labels
email: z.string().meta({ label: 'Email' }),
phone: z.string().meta({ label: 'Phone' }),

// ❌ Avoid - inconsistent metadata
email: z.string().meta({ label: 'Email' }),
phone: z.string(),  // No label - will use field name
```

### 3. Customize After Generation

Generated files are starting points. Customize them:

```typescript
// src/components/forms/customer-form.tsx
// Add custom validation, conditional fields, etc.
```

### 4. Version Control Generated Files

Keep generated files in git:
- Allows diffing changes
- Works without running codegen
- CI/CD doesn't need codegen step
