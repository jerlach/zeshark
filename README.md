# 🦈 Zeshark

**Schema-first, codegen-powered framework for building data-driven SPAs with the TanStack ecosystem.**

Define your data schema once, generate everything else: routes, forms, tables, collections, and navigation. Supports both traditional REST APIs and high-performance parquet files for large datasets.

## ✨ Features

- **Schema-First Development** - Define schemas with Zod, generate UI automatically
- **Dual Data Sources** - REST/JSON for typical CRUD, DuckDB + Parquet for 50k+ row datasets
- **Full TanStack Integration** - Router, Query, Table, Form, and DB working together
- **Built-in Analytics** - KPI dashboards and charts for parquet resources
- **Command Palette** - Global search across all resources (⌘K)
- **Type-Safe Everything** - End-to-end TypeScript from schema to component

## 📚 Documentation

- **[User Guide](docs/USER_GUIDE.md)** - Getting started, workflows, and examples
- **[Architecture](docs/ARCHITECTURE.md)** - How the pieces fit together
- **[Schemas](docs/SCHEMAS.md)** - Defining resources with field metadata
- **[Code Generation](docs/CODEGEN.md)** - How codegen works and customization
- **[API Integration](docs/API_INTEGRATION.md)** - Connecting backends and auth

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone <your-repo>
cd zeshark
pnpm install

# 2. Setup UI components
pnpm setup-ui

# 3. Configure API (copy and edit .env)
cp .env.example .env

# 4. Start development
pnpm dev
```

## 🏗️ Creating a Resource (5 minutes)

### Step 1: Define Schema

```typescript
// src/schemas/product.schema.ts
import { z } from 'zod'
import { defineResource } from './_resource.schema'

export const productResource = defineResource(
  {
    name: 'product',
    icon: 'Package',
    description: 'Product catalog',
    dataSource: 'json', // or 'parquet' for large datasets
    
    table: {
      columns: ['name', 'price', 'status'],
      defaultSort: { field: 'name', order: 'asc' },
    },
    
    search: {
      searchableFields: ['name', 'sku'],
      resultLabelField: 'name',
    },
  },
  {
    name: z.string().min(1).meta({ label: 'Product Name', sortable: true }),
    sku: z.string().meta({ label: 'SKU' }),
    price: z.number().meta({ label: 'Price', inputType: 'currency' }),
    status: z.enum(['active', 'draft', 'archived']).meta({ 
      label: 'Status', 
      inputType: 'select' 
    }),
  }
)
```

### Step 2: Generate

```bash
pnpm generate product
```

This creates:
- **Collection** - `src/collections/products.collection.ts`
- **Routes** - List, Create, Edit pages in `src/routes/_app/products/`
- **Form** - `src/components/forms/product-form.tsx`
- **Table Columns** - `src/components/tables/product-columns.tsx`

And wires everything into navigation, registry, and DB client.

### Step 3: Done!

Your resource is now available at `/products` with full CRUD, search, and filtering.

## 📁 Project Structure

```
src/
├── schemas/           # 🎯 SOURCE OF TRUTH - Your resource definitions
│   ├── _resource.schema.ts    # Base schema helper
│   └── *.schema.ts            # Resource schemas
├── collections/       # 🔄 GENERATED - TanStack DB collections
├── routes/            # 🔄 GENERATED - File-based routing
│   ├── __root.tsx             # Root layout (providers)
│   ├── _app.tsx               # App shell (sidebar, nav)
│   └── _app/*/                # Resource routes
├── components/
│   ├── ui/            # shadcn components
│   ├── forms/         # 🔄 GENERATED - Resource forms
│   ├── tables/        # 🔄 GENERATED - Table column defs
│   └── shared/        # Reusable components
├── lib/               # 🔄 AUTO-UPDATED - Core utilities
├── hooks/             # Custom React hooks
├── stores/            # Zustand UI state
├── api/               # API client (axios)
└── codegen/           # Code generation system
```

## 🛠️ CLI Commands

```bash
# Generate a resource from schema
pnpm generate <resource-name>
pnpm generate <resource-name> --force     # Overwrite existing
pnpm generate <resource-name> --only=form # Generate only form

# Generate all resources
pnpm generate:all

# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm preview          # Preview production build

# UI Components
pnpm setup-ui                          # Initial UI setup
pnpm dlx shadcn@latest add <component> # Add more components
```

## 🔧 Tech Stack

| Library | Purpose |
|---------|----------|
| **TanStack Router** | Type-safe file-based routing |
| **TanStack DB** | Client-side normalized state (JSON sources) |
| **TanStack Query** | Server state and caching |
| **TanStack Form** | Type-safe form handling |
| **TanStack Table** | Headless table logic |
| **DuckDB WASM** | In-browser SQL for parquet files |
| **Zod** | Schema validation + metadata |
| **Zustand** | UI state management |
| **shadcn/ui** | Component library |
| **Tailwind CSS 4** | Styling |

## ⚙️ Environment Variables

```env
# Required
VITE_API_URL=https://api.example.com

# Optional - for development auth bypass
VITE_API_TOKEN=your-dev-token
```

## 📖 Learn More

See the [User Guide](docs/USER_GUIDE.md) for comprehensive documentation on:
- Defining complex schemas with relations
- Using parquet data sources for analytics
- Customizing generated code
- Authentication patterns
- Deployment

## License

MIT
