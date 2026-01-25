# Schema Reference

This document covers everything about defining resource schemas in Zeshark.

## Overview

Schemas are the **source of truth** for your data. They define:

1. **Validation rules** - Using Zod
2. **Field metadata** - Labels, input types, display hints
3. **Resource configuration** - Table, search, form settings
4. **Type safety** - TypeScript types are inferred automatically

---

## Basic Schema Structure

```typescript
// src/schemas/product.schema.ts
import { z } from 'zod'
import { defineResource } from './_resource.schema'

export const productResource = defineResource(
  // 1. Resource Configuration
  {
    name: 'product',
    icon: 'Package',
    description: 'Product catalog',
    // ... more config
  },
  // 2. Field Definitions
  {
    name: z.string().min(1).meta({ label: 'Product Name' }),
    price: z.number().positive().meta({ label: 'Price', inputType: 'currency' }),
    // ... more fields
  }
)

// 3. Export the inferred type
export type Product = typeof productResource.type
```

---

## Resource Configuration

The first argument to `defineResource()` is the resource configuration:

```typescript
defineResource({
  // Required
  name: 'customer',              // Singular name (used in code, URLs)
  
  // Optional - Display
  pluralName: 'customers',       // Auto-derived if not set
  icon: 'Users',                 // Lucide icon name
  description: 'Manage customers',
  
  // Optional - Data Source
  dataSource: 'json',            // 'json' (default) or 'parquet'
  syncMode: 'eager',             // 'eager', 'on-demand', 'progressive'
  primaryKey: 'id',              // Default: 'id'
  apiBasePath: '/api/customers', // Default: /api/{pluralName}
  
  // Optional - Features
  search: { ... },               // Command palette config
  table: { ... },                // Table/list view config
  form: { ... },                 // Form layout config
  searchParams: { ... },         // URL param config
  analytics: { ... },            // Analytics dashboard (parquet only)
}, fields)
```

### Search Configuration

Controls how the resource appears in the command palette:

```typescript
search: {
  enabled: true,                    // Include in search (default: true)
  searchableFields: ['name', 'email', 'phone'],  // Fields to search
  resultLabelField: 'name',         // Primary text in results
  resultDescriptionField: 'email',  // Secondary text
}
```

### Table Configuration

Controls the list view/data table:

```typescript
table: {
  // Which columns to show (in order)
  columns: ['name', 'email', 'status', 'created_at'],
  
  // Default sorting
  defaultSort: { field: 'created_at', order: 'desc' },
  
  // Fields searchable via table search bar
  searchableFields: ['name', 'email'],
  
  // Fields with filter dropdowns
  filterableFields: ['status', 'role'],
}
```

### Form Configuration

Controls form layout with sections:

```typescript
form: {
  sections: [
    {
      title: 'Basic Information',
      description: 'Customer contact details',  // Optional
      fields: ['name', 'email', 'phone'],
    },
    {
      title: 'Account Settings',
      fields: ['status', 'role'],
    },
    {
      title: 'Notes',
      fields: ['internal_notes'],
    },
  ],
}
```

### Search Params Configuration

Controls URL parameters for the list view:

```typescript
searchParams: {
  filters: ['status', 'role'],  // Expose these as URL params
  defaultPageSize: 25,          // Default pagination size
}
```

### Analytics Configuration (Parquet only)

Enables analytics dashboard with KPIs and charts:

```typescript
analytics: {
  enabled: true,
  
  // KPI cards
  kpis: [
    {
      name: 'totalRevenue',       // Unique identifier
      label: 'Total Revenue',     // Display label
      sql: 'SUM(total)',          // SQL aggregation
      format: 'currency',         // 'number', 'currency', 'percent'
      icon: 'DollarSign',         // Lucide icon
    },
  ],
  
  // Grouped/categorical charts
  groupedCharts: [
    {
      title: 'Sales by Category',
      description: 'Optional description',
      groupBy: 'category',        // Field to group by
      metric: 'revenue',          // Metric name
      metricSql: 'SUM(total)',    // SQL expression
      type: 'pie',                // 'bar', 'horizontal-bar', 'pie', 'donut'
      limit: 10,                  // Max items to show
    },
  ],
  
  // Time series charts
  timeSeriesCharts: [
    {
      title: 'Revenue Over Time',
      dateField: 'created_at',    // Date column
      metric: 'revenue',
      metricSql: 'SUM(total)',
      granularity: 'month',       // 'day', 'week', 'month', 'year'
      type: 'line',               // 'line', 'area', 'bar'
    },
  ],
}
```

---

## Field Definitions

The second argument to `defineResource()` contains field definitions using Zod:

```typescript
defineResource(config, {
  // Basic types
  name: z.string(),
  age: z.number(),
  active: z.boolean(),
  
  // With validation
  email: z.string().email(),
  price: z.number().positive().max(10000),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  
  // Optional and defaults
  nickname: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  
  // With metadata
  phone: z.string().optional().meta({
    label: 'Phone Number',
    inputType: 'phone',
    placeholder: '+1 (555) 123-4567',
  }),
})
```

### Base Fields (Automatic)

These fields are automatically added by `defineResource()`:

```typescript
{
  id: z.string().uuid(),           // Primary key
  created_at: z.string().datetime(),  // Creation timestamp
  updated_at: z.string().datetime(),  // Last update timestamp
}
```

You don't need to define these in your schema.

---

## Field Metadata

Use `.meta()` to add metadata to any field:

```typescript
z.string().meta({
  // Display
  label: 'Email Address',          // Form/table label
  placeholder: 'user@example.com', // Input placeholder
  description: 'We will never share your email',  // Help text
  
  // Visibility
  hidden: false,                   // Hide from forms and tables
  readOnly: false,                 // Make read-only in forms
  
  // Table behavior
  sortable: true,                  // Allow column sorting
  filterable: true,                // Show filter dropdown
  columnWidth: 200,                // Column width in pixels
  
  // Form behavior
  inputType: 'email',              // See "Input Types" below
  
  // Relations
  relation: {                      // Foreign key configuration
    resource: 'customer',
    labelField: 'name',
    searchFields: ['name', 'email'],
  },
})
```

### Input Types

| Type | Zod Type | Description |
|------|----------|-------------|
| `text` | `z.string()` | Default text input |
| `number` | `z.number()` | Numeric input |
| `email` | `z.string().email()` | Email input |
| `password` | `z.string()` | Password input |
| `textarea` | `z.string()` | Multi-line text |
| `select` | `z.enum([...])` | Dropdown select |
| `combobox` | `z.string()` | Searchable select (for relations) |
| `date` | `z.string()` | Date picker |
| `datetime` | `z.string()` | Date + time picker |
| `currency` | `z.number()` | Currency input with formatting |
| `phone` | `z.string()` | Phone number input |
| `url` | `z.string().url()` | URL input |
| `checkbox` | `z.boolean()` | Checkbox |

### Inferred Input Types

If you don't specify `inputType`, it's inferred from the Zod type:

```typescript
z.string()                    → 'text'
z.string().email()            → 'email'
z.string().url()              → 'url'
z.number()                    → 'number'
z.boolean()                   → 'checkbox'
z.enum(['a', 'b'])            → 'select'
z.string() + relation         → 'combobox'
```

---

## Relations

Link resources together with the `relation` metadata:

### One-to-Many (Foreign Key)

```typescript
// Order belongs to Customer
// src/schemas/order.schema.ts
defineResource({
  name: 'order',
}, {
  customer_id: z.string().uuid().meta({
    label: 'Customer',
    inputType: 'combobox',
    relation: {
      resource: 'customer',           // Target resource
      labelField: 'name',             // Field to display
      searchFields: ['name', 'email'], // Fields to search
    },
  }),
})
```

This generates:
- Combobox that searches customers
- Displays customer name
- Stores customer UUID

### Many-to-One Display

To display related data in tables:

```typescript
// In columns template, fetch related data
{
  accessorKey: 'customer_id',
  header: 'Customer',
  cell: ({ row }) => {
    const customerId = row.getValue('customer_id')
    const customer = useCustomer(customerId)  // Custom hook
    return customer?.name ?? '—'
  },
}
```

---

## Enums

For fields with a fixed set of values:

```typescript
// Define enum separately for reuse
export const orderStatusEnum = z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])

// Use in schema
defineResource(config, {
  status: orderStatusEnum.meta({
    label: 'Order Status',
    inputType: 'select',
    filterable: true,
  }),
})

// Export the type
export type OrderStatus = z.infer<typeof orderStatusEnum>
```

---

## Nested Objects

For complex embedded data:

```typescript
// Define embedded schema
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
})

// Use in resource
defineResource(config, {
  shipping_address: addressSchema.optional().meta({
    label: 'Shipping Address',
    hidden: true,  // Handle in custom form section
  }),
})
```

For nested objects, you'll typically:
1. Mark them as `hidden: true`
2. Create custom form UI to edit them
3. Handle them specially in columns

---

## Arrays

For array fields:

```typescript
const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
})

defineResource(config, {
  tags: z.array(tagSchema).optional().meta({
    label: 'Tags',
    hidden: true,  // Handle with custom UI
  }),
})
```

Arrays typically need custom UI for adding/removing items.

---

## Validation

Zod validation is automatically used in forms:

```typescript
defineResource(config, {
  // Required field
  name: z.string().min(1, 'Name is required'),
  
  // Email validation
  email: z.string().email('Invalid email address'),
  
  // Number range
  quantity: z.number()
    .int('Must be a whole number')
    .min(1, 'Minimum 1')
    .max(100, 'Maximum 100'),
  
  // String pattern
  sku: z.string().regex(/^[A-Z]{3}-\d{4}$/, 'Format: ABC-1234'),
  
  // Custom validation
  password: z.string()
    .min(8, 'At least 8 characters')
    .refine(
      val => /[A-Z]/.test(val),
      'Must contain uppercase letter'
    ),
})
```

---

## Complete Example

Here's a full schema with all features:

```typescript
// src/schemas/invoice.schema.ts
import { z } from 'zod'
import { defineResource } from './_resource.schema'

// Enums
export const invoiceStatusEnum = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
export const paymentMethodEnum = z.enum(['credit_card', 'bank_transfer', 'cash', 'other'])

// Embedded schemas
const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  total: z.number(),
})

// Main resource
export const invoiceResource = defineResource(
  {
    name: 'invoice',
    icon: 'FileText',
    description: 'Manage invoices',
    dataSource: 'json',
    
    search: {
      searchableFields: ['invoice_number', 'customer_name'],
      resultLabelField: 'invoice_number',
      resultDescriptionField: 'customer_name',
    },
    
    table: {
      columns: ['invoice_number', 'customer_name', 'status', 'total', 'due_date'],
      defaultSort: { field: 'created_at', order: 'desc' },
      searchableFields: ['invoice_number', 'customer_name'],
      filterableFields: ['status'],
    },
    
    form: {
      sections: [
        {
          title: 'Invoice Details',
          fields: ['invoice_number', 'customer_id', 'status'],
        },
        {
          title: 'Dates',
          fields: ['issue_date', 'due_date'],
        },
        {
          title: 'Payment',
          fields: ['payment_method', 'subtotal', 'tax', 'total'],
        },
        {
          title: 'Notes',
          fields: ['notes'],
        },
      ],
    },
  },
  {
    // Basic fields
    invoice_number: z.string().meta({
      label: 'Invoice #',
      placeholder: 'INV-0001',
      sortable: true,
    }),
    
    // Relation
    customer_id: z.string().uuid().meta({
      label: 'Customer',
      inputType: 'combobox',
      relation: {
        resource: 'customer',
        labelField: 'name',
        searchFields: ['name', 'email'],
      },
    }),
    
    // Denormalized for display
    customer_name: z.string().optional().meta({
      label: 'Customer',
      readOnly: true,
    }),
    
    // Status
    status: invoiceStatusEnum.default('draft').meta({
      label: 'Status',
      inputType: 'select',
      filterable: true,
    }),
    
    // Dates
    issue_date: z.string().meta({
      label: 'Issue Date',
      inputType: 'date',
    }),
    
    due_date: z.string().meta({
      label: 'Due Date',
      inputType: 'date',
    }),
    
    // Payment
    payment_method: paymentMethodEnum.optional().meta({
      label: 'Payment Method',
      inputType: 'select',
    }),
    
    // Money fields
    subtotal: z.number().default(0).meta({
      label: 'Subtotal',
      inputType: 'currency',
      readOnly: true,
    }),
    
    tax: z.number().default(0).meta({
      label: 'Tax',
      inputType: 'currency',
    }),
    
    total: z.number().default(0).meta({
      label: 'Total',
      inputType: 'currency',
      readOnly: true,
      sortable: true,
    }),
    
    // Line items (complex - custom UI needed)
    line_items: z.array(lineItemSchema).default([]).meta({
      label: 'Line Items',
      hidden: true,
    }),
    
    // Notes
    notes: z.string().optional().meta({
      label: 'Notes',
      inputType: 'textarea',
      placeholder: 'Internal notes...',
    }),
  }
)

// Export types
export type Invoice = typeof invoiceResource.type
export type InvoiceStatus = z.infer<typeof invoiceStatusEnum>
export type PaymentMethod = z.infer<typeof paymentMethodEnum>
export type LineItem = z.infer<typeof lineItemSchema>
```

---

## Type Helpers

Zeshark exports type helpers for working with resources:

```typescript
import {
  InferResourceType,
  InferCreateType,
  InferUpdateType,
} from '@/schemas/_resource.schema'

// Full type (includes id, created_at, updated_at)
type Invoice = InferResourceType<typeof invoiceResource>

// Create input (without id and timestamps)
type CreateInvoice = InferCreateType<typeof invoiceResource>

// Update input (partial, requires id)
type UpdateInvoice = InferUpdateType<typeof invoiceResource>
```

---

## Best Practices

### 1. Name Fields Consistently

```typescript
// ✅ Good - snake_case matches API
customer_id: z.string()
created_at: z.string()

// ❌ Avoid - camelCase mismatch
customerId: z.string()
createdAt: z.string()
```

### 2. Always Add Labels

```typescript
// ✅ Good - clear labels
email: z.string().meta({ label: 'Email Address' })

// ❌ Avoid - missing label shows "email"
email: z.string()
```

### 3. Use Proper Input Types

```typescript
// ✅ Good - appropriate input type
price: z.number().meta({ inputType: 'currency' })
bio: z.string().meta({ inputType: 'textarea' })

// ❌ Avoid - uses default text input
price: z.number()  // Will render as basic number input
bio: z.string()    // Will render as single-line input
```

### 4. Mark Computed Fields as ReadOnly

```typescript
// ✅ Good - can't be edited
total: z.number().meta({ readOnly: true })

// ❌ Avoid - user might try to edit
total: z.number()
```

### 5. Hide Internal Fields

```typescript
// ✅ Good - hidden from forms/tables
internal_notes: z.string().meta({ hidden: true })

// ❌ Avoid - clutters UI
internal_notes: z.string()
```
