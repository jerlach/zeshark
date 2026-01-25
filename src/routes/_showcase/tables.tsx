import { createFileRoute } from '@tanstack/react-router'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, ArrowUpDown } from 'lucide-react'

export const Route = createFileRoute('/_showcase/tables')({
  component: TablesShowcase,
})

// Mock data types
type Order = {
  id: string
  reference: string
  customer: string
  status: 'pending' | 'fulfilled' | 'cancelled'
  total: number
  date: string
}

type Product = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: 'active' | 'draft' | 'archived'
}

// Mock data
const mockOrders: Order[] = [
  { id: '1', reference: 'ORD-001', customer: 'John Doe', status: 'pending', total: 1250.00, date: '2024-01-15' },
  { id: '2', reference: 'ORD-002', customer: 'Jane Smith', status: 'fulfilled', total: 3420.50, date: '2024-01-14' },
  { id: '3', reference: 'ORD-003', customer: 'Bob Wilson', status: 'cancelled', total: 890.00, date: '2024-01-13' },
  { id: '4', reference: 'ORD-004', customer: 'Alice Brown', status: 'fulfilled', total: 5200.00, date: '2024-01-12' },
  { id: '5', reference: 'ORD-005', customer: 'Charlie Davis', status: 'pending', total: 750.25, date: '2024-01-11' },
  { id: '6', reference: 'ORD-006', customer: 'Diana Miller', status: 'fulfilled', total: 2100.00, date: '2024-01-10' },
  { id: '7', reference: 'ORD-007', customer: 'Edward Garcia', status: 'pending', total: 4500.00, date: '2024-01-09' },
  { id: '8', reference: 'ORD-008', customer: 'Fiona Martinez', status: 'fulfilled', total: 1800.75, date: '2024-01-08' },
]

const mockProducts: Product[] = [
  { id: '1', name: 'Premium Widget', category: 'Electronics', price: 299.99, stock: 45, status: 'active' },
  { id: '2', name: 'Basic Gadget', category: 'Electronics', price: 149.99, stock: 120, status: 'active' },
  { id: '3', name: 'Luxury Item', category: 'Premium', price: 899.99, stock: 12, status: 'active' },
  { id: '4', name: 'Budget Option', category: 'Value', price: 49.99, stock: 200, status: 'active' },
  { id: '5', name: 'New Product', category: 'Electronics', price: 399.99, stock: 0, status: 'draft' },
  { id: '6', name: 'Discontinued', category: 'Legacy', price: 199.99, stock: 5, status: 'archived' },
]

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    fulfilled: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    archived: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  )
}

// Order columns
const orderColumns: ColumnDef<Order>[] = [
  {
    accessorKey: 'reference',
    header: 'Reference',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('reference')}</span>
    ),
  },
  {
    accessorKey: 'customer',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Customer
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  {
    accessorKey: 'total',
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('total'))
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'))
      return date.toLocaleDateString()
    },
  },
  {
    id: 'actions',
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>Edit order</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Cancel order</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

// Product columns
const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: 'Product',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue('name')}</div>
        <div className="text-xs text-muted-foreground">{row.original.category}</div>
      </div>
    ),
  },
  {
    accessorKey: 'price',
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('price'))
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)
      return <div className="text-right">{formatted}</div>
    },
  },
  {
    accessorKey: 'stock',
    header: () => <div className="text-right">Stock</div>,
    cell: ({ row }) => {
      const stock = row.getValue('stock') as number
      return (
        <div className={`text-right ${stock === 0 ? 'text-destructive' : ''}`}>
          {stock === 0 ? 'Out of stock' : stock}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  {
    id: 'actions',
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

function Section({ title, description, children }: { 
  title: string
  description?: string
  children: React.ReactNode 
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="border rounded-lg">{children}</div>
    </div>
  )
}

function TablesShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tables</h1>
        <p className="text-muted-foreground mt-2">
          Data tables with sorting, filtering, and actions
        </p>
      </div>

      <Section 
        title="Orders Table" 
        description="With status badges, currency formatting, and row actions"
      >
        <DataTable columns={orderColumns} data={mockOrders} />
      </Section>

      <Section 
        title="Products Table" 
        description="With composite cells and stock indicators"
      >
        <DataTable columns={productColumns} data={mockProducts} />
      </Section>

      <Section 
        title="Empty State"
        description="How the table looks with no data"
      >
        <DataTable columns={orderColumns} data={[]} />
      </Section>

      <Section 
        title="Loading State"
        description="Spinner shown while data is loading"
      >
        <DataTable columns={orderColumns} data={[]} isLoading />
      </Section>
    </div>
  )
}
