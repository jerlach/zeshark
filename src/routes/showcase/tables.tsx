import { createFileRoute } from '@tanstack/react-router'
import { ColumnDef } from '@tanstack/react-table'
import { IconDotsVertical, IconArrowsSort } from '@tabler/icons-react'
import { DataTableEnhanced } from '@/components/shared/data-table-enhanced'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/showcase/tables')({
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

// Status badge using the Badge component
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    fulfilled: 'default',
    cancelled: 'destructive',
    active: 'default',
    draft: 'outline',
    archived: 'secondary',
  }

  return (
    <Badge variant={variants[status] ?? 'outline'}>
      {status}
    </Badge>
  )
}

// Order columns - matching codegen output pattern
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
        <IconArrowsSort className="ml-2 h-4 w-4" />
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
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <IconDotsVertical className="h-4 w-4" />
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
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <IconDotsVertical className="h-4 w-4" />
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

function TablesShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tables</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Data tables with pagination, column visibility, and actions - matching codegen output
        </p>
      </div>

      {/* Orders Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Orders Table</h2>
          <p className="text-sm text-muted-foreground">With status badges, currency formatting, and row actions</p>
        </div>
        <DataTableEnhanced 
          columns={orderColumns} 
          data={mockOrders}
          onRowClick={(row) => console.log('Clicked:', row)}
        />
      </div>

      {/* Products Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Products Table</h2>
          <p className="text-sm text-muted-foreground">With composite cells and stock indicators</p>
        </div>
        <DataTableEnhanced 
          columns={productColumns} 
          data={mockProducts}
        />
      </div>

      {/* Empty State */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Empty State</h2>
          <p className="text-sm text-muted-foreground">How the table looks with no data</p>
        </div>
        <DataTableEnhanced 
          columns={orderColumns} 
          data={[]} 
          showColumnVisibility={false}
        />
      </div>

      {/* Loading State */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Loading State</h2>
          <p className="text-sm text-muted-foreground">Spinner shown while data is loading</p>
        </div>
        <DataTableEnhanced 
          columns={orderColumns} 
          data={[]} 
          isLoading 
          showColumnVisibility={false}
        />
      </div>
    </div>
  )
}
