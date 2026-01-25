# Zeshark User Guide

This guide covers everything you need to build data-driven applications with Zeshark.

## Table of Contents

1. [Installation](#installation)
2. [Your First Resource](#your-first-resource)
3. [Data Sources](#data-sources)
4. [Working with Tables](#working-with-tables)
5. [Working with Forms](#working-with-forms)
6. [Relations](#relations)
7. [Analytics Dashboards](#analytics-dashboards)
8. [Command Palette](#command-palette)
9. [Customizing Generated Code](#customizing-generated-code)
10. [Deployment](#deployment)

---

## Installation

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
# Clone the template
git clone <your-repo> my-app
cd my-app

# Install dependencies
pnpm install

# Install shadcn UI components
pnpm setup-ui

# Copy environment file
cp .env.example .env

# Start development server
pnpm dev
```

Your app is now running at `http://localhost:5173`.

### Environment Configuration

Edit `.env` to configure your API:

```env
# Your API base URL
VITE_API_URL=https://api.example.com

# Optional: Development auth token (bypasses login)
VITE_API_TOKEN=your-dev-token
```

---

## Your First Resource

A "resource" in Zeshark represents a data entity (like customers, products, orders). Each resource gets:

- A Zod schema for validation
- CRUD routes (list, create, edit)
- Form components
- Table columns
- Navigation entry
- Command palette integration

### Step 1: Create the Schema

Create a new file in `src/schemas/`:

```typescript
// src/schemas/customer.schema.ts
import { z } from 'zod'
import { defineResource } from './_resource.schema'

export const customerResource = defineResource(
  {
    // Metadata
    name: 'customer',           // Singular name (used for routes, forms)
    icon: 'Users',              // Lucide icon name
    description: 'Manage customers',
    
    // Data source (see "Data Sources" section)
    dataSource: 'json',         // 'json' or 'parquet'
    
    // Table configuration
    table: {
      columns: ['name', 'email', 'status', 'created_at'],
      defaultSort: { field: 'created_at', order: 'desc' },
      searchableFields: ['name', 'email'],
      filterableFields: ['status'],
    },
    
    // Global search configuration
    search: {
      enabled: true,
      searchableFields: ['name', 'email'],
      resultLabelField: 'name',
      resultDescriptionField: 'email',
    },
  },
  {
    // Field definitions with metadata
    name: z.string().min(1).meta({
      label: 'Full Name',
      placeholder: 'John Doe',
      sortable: true,
    }),
    
    email: z.string().email().meta({
      label: 'Email Address',
      inputType: 'email',
    }),
    
    phone: z.string().optional().meta({
      label: 'Phone',
      inputType: 'phone',
    }),
    
    status: z.enum(['active', 'inactive', 'pending']).default('active').meta({
      label: 'Status',
      inputType: 'select',
      filterable: true,
    }),
    
    notes: z.string().optional().meta({
      label: 'Notes',
      inputType: 'textarea',
    }),
  }
)

// Export the inferred type
export type Customer = typeof customerResource.type
```

### Step 2: Generate

Run the generator:

```bash
pnpm generate customer
```

This creates:

| File | Purpose |
|------|---------|
| `src/collections/customers.collection.ts` | TanStack DB collection |
| `src/routes/_app/customers/index.tsx` | List page |
| `src/routes/_app/customers/new.tsx` | Create page |
| `src/routes/_app/customers/$customerId.tsx` | Edit page |
| `src/components/forms/customer-form.tsx` | Form component |
| `src/components/tables/customer-columns.tsx` | Table column definitions |

And updates these files:
- `src/schemas/index.ts` - Exports your schema
- `src/collections/index.ts` - Exports your collection
- `src/lib/registry.ts` - Registers the resource
- `src/lib/db-client.ts` - Adds to DB client
- `src/lib/navigation.ts` - Adds nav entry

### Step 3: Use It

Navigate to `http://localhost:5173/customers`. You now have:

- A searchable, sortable data table
- Create and edit forms with validation
- Navigation in the sidebar
- Command palette integration (⌘K → type "customer")

---

## Data Sources

Zeshark supports two data sources:

### JSON (Default)

Standard REST API with JSON responses. Uses TanStack DB for client-side state.

```typescript
defineResource({
  dataSource: 'json',  // or omit (default)
  syncMode: 'eager',   // Load all data upfront
  // ...
})
```

**Best for:**
- Small to medium datasets (< 10k rows)
- Real-time data
- Full CRUD operations

### Parquet

Uses DuckDB WASM to query parquet files directly in the browser.

```typescript
defineResource({
  dataSource: 'parquet',
  // ...
})
```

**Best for:**
- Large datasets (50k+ rows)
- Analytics and reporting
- Read-heavy workloads
- Aggregations and complex queries

### API Requirements

For **JSON** resources, your API should provide:

```
GET    /api/customers          → List all (or paginated)
GET    /api/customers/:id      → Get one
POST   /api/customers          → Create
PUT    /api/customers/:id      → Update
DELETE /api/customers/:id      → Delete
```

For **Parquet** resources, your API should provide:

```
GET /api/orders?format=parquet → Returns .parquet file
```

The parquet file is fetched once and cached in the browser. DuckDB executes SQL queries directly against it.

---

## Working with Tables

### Generated Table

The generated list page uses TanStack Table with:

- Sortable columns (click header)
- Row selection
- Pagination
- Search filtering

### Customizing Columns

Edit the generated column file to customize:

```typescript
// src/components/tables/customer-columns.tsx
import { ColumnDef } from '@tanstack/react-table'
import { Customer } from '@/schemas/customer.schema'
import { Badge } from '@/components/ui/badge'

export const customerColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
          {status}
        </Badge>
      )
    },
  },
  // Add custom columns...
]
```

### Virtual Scrolling

For large datasets (parquet), use the virtual table:

```typescript
import { DataTableVirtual } from '@/components/shared/data-table-virtual'

<DataTableVirtual
  columns={columns}
  data={data}
  estimateSize={48}  // Row height in pixels
/>
```

---

## Working with Forms

### Generated Forms

Forms use TanStack Form with:

- Field-level validation (from Zod schema)
- Error messages
- Loading states
- Type-safe values

### Form Sections

Group fields into sections:

```typescript
defineResource({
  form: {
    sections: [
      {
        title: 'Basic Information',
        description: 'Customer contact details',
        fields: ['name', 'email', 'phone'],
      },
      {
        title: 'Settings',
        fields: ['status', 'notes'],
      },
    ],
  },
  // ...
})
```

### Input Types

Set the input type via field metadata:

```typescript
{
  email: z.string().meta({ inputType: 'email' }),
  price: z.number().meta({ inputType: 'currency' }),
  bio: z.string().meta({ inputType: 'textarea' }),
  status: z.enum(['a', 'b']).meta({ inputType: 'select' }),
  birthDate: z.string().meta({ inputType: 'date' }),
  createdAt: z.string().meta({ inputType: 'datetime' }),
}
```

Available input types:
- `text` (default)
- `number`
- `email`
- `password`
- `textarea`
- `select` (for enums)
- `combobox` (searchable select)
- `date`
- `datetime`
- `currency`
- `phone`
- `url`
- `checkbox`

---

## Relations

Link resources together with the `relation` metadata:

```typescript
// src/schemas/order.schema.ts
defineResource({
  name: 'order',
  // ...
}, {
  // Foreign key to customer
  customer_id: z.string().uuid().meta({
    label: 'Customer',
    inputType: 'combobox',
    relation: {
      resource: 'customer',       // Target resource name
      labelField: 'name',         // Field to display
      searchFields: ['name', 'email'],  // Fields to search
    },
  }),
})
```

This generates a searchable combobox that:
- Searches customers as you type
- Displays the customer name
- Stores the customer ID

---

## Analytics Dashboards

Parquet resources can have analytics dashboards with KPIs and charts.

### Enabling Analytics

```typescript
defineResource({
  dataSource: 'parquet',
  analytics: {
    enabled: true,
    
    // KPI cards at the top
    kpis: [
      {
        name: 'totalRevenue',
        label: 'Total Revenue',
        sql: 'SUM(total)',
        format: 'currency',
        icon: 'DollarSign',
      },
      {
        name: 'orderCount',
        label: 'Total Orders',
        sql: 'COUNT(*)',
        format: 'number',
        icon: 'ShoppingCart',
      },
    ],
    
    // Grouped charts
    groupedCharts: [
      {
        title: 'Orders by Status',
        groupBy: 'status',
        metric: 'count',
        metricSql: 'COUNT(*)',
        type: 'pie',  // or 'bar', 'horizontal-bar', 'donut'
      },
    ],
    
    // Time series charts
    timeSeriesCharts: [
      {
        title: 'Revenue Over Time',
        dateField: 'created_at',
        metric: 'revenue',
        metricSql: 'SUM(total)',
        granularity: 'month',  // 'day', 'week', 'month', 'year'
        type: 'line',  // or 'area', 'bar'
      },
    ],
  },
})
```

### Accessing Analytics

After generation, the analytics route is available at:
```
/orders/analytics
```

---

## Command Palette

Press `⌘K` (or `Ctrl+K`) to open the command palette.

### Features

- **Search resources** - Find any record by searchable fields
- **Quick navigation** - Jump to any page
- **Actions** - Create new records

### Configuration

Configure search behavior per resource:

```typescript
defineResource({
  search: {
    enabled: true,  // Include in command palette (default: true)
    searchableFields: ['name', 'email', 'phone'],
    resultLabelField: 'name',           // Main result text
    resultDescriptionField: 'email',    // Secondary text
  },
})
```

---

## Customizing Generated Code

Generated files have a comment at the top:

```typescript
// 🔄 GENERATED - Modifications will be overwritten on regenerate
```

### Safe to Edit

These files are safe to modify (won't be overwritten):

- Form components (`src/components/forms/*-form.tsx`)
- Column definitions (`src/components/tables/*-columns.tsx`)
- Route pages (after initial generation)

### Force Regenerate

To regenerate and overwrite:

```bash
pnpm generate customer --force
```

### Partial Generation

Generate only specific parts:

```bash
pnpm generate customer --only=form      # Only form component
pnpm generate customer --only=columns   # Only table columns
pnpm generate customer --only=routes    # Only route files
pnpm generate customer --only=collection # Only collection
```

---

## Deployment

### Build

```bash
pnpm build
```

Output is in `dist/`.

### Environment Variables

Set `VITE_API_URL` in your deployment environment:

```bash
VITE_API_URL=https://api.production.com
```

### Static Hosting

The build output is a static SPA. Deploy to:

- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- Any static host

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## Next Steps

- [Architecture Guide](ARCHITECTURE.md) - Understand how the pieces fit together
- [Schema Reference](SCHEMAS.md) - Complete field metadata reference
- [Code Generation](CODEGEN.md) - How templates work
- [API Integration](API_INTEGRATION.md) - Backend requirements
