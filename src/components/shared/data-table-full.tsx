import * as React from 'react'
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconLoader,
  IconX,
} from '@tabler/icons-react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { FacetedFilter } from './faceted-filter'

// Types for filter options
export interface FilterOption {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface FilterConfig {
  column: string
  title: string
  options: FilterOption[]
}

export interface TabConfig {
  column: string
  options: Array<{
    value: string
    label: string
    filterValue?: string | string[]
  }>
}

interface DataTableFullProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  onRowClick?: (row: TData) => void
  // Search
  searchColumn?: string
  searchPlaceholder?: string
  // Tabs
  tabConfig?: TabConfig
  // Faceted filters
  filterConfigs?: FilterConfig[]
  // Features
  showColumnVisibility?: boolean
  showRowSelection?: boolean
  showPagination?: boolean
  // Custom header actions
  headerActions?: React.ReactNode
}

// Selection column generator
export function getSelectColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  }
}

export function DataTableFull<TData, TValue>({
  columns,
  data,
  isLoading = false,
  onRowClick,
  searchColumn,
  searchPlaceholder = 'Search...',
  tabConfig,
  filterConfigs = [],
  showColumnVisibility = true,
  showRowSelection = false,
  showPagination = true,
  headerActions,
}: DataTableFullProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [activeTab, setActiveTab] = React.useState('all')
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Prepend select column if row selection is enabled
  const finalColumns = React.useMemo(() => {
    if (showRowSelection) {
      return [getSelectColumn<TData>(), ...columns]
    }
    return columns
  }, [columns, showRowSelection])

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    enableRowSelection: showRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // Handle tab change - filter by the tab column
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (tabConfig) {
      if (value === 'all') {
        // Clear the tab column filter
        table.getColumn(tabConfig.column)?.setFilterValue(undefined)
      } else {
        const tabOption = tabConfig.options.find((o) => o.value === value)
        if (tabOption?.filterValue) {
          table.getColumn(tabConfig.column)?.setFilterValue(tabOption.filterValue)
        } else {
          table.getColumn(tabConfig.column)?.setFilterValue(value)
        }
      }
    }
  }

  // Count items per tab
  const getTabCount = (tabValue: string) => {
    if (!tabConfig) return 0
    if (tabValue === 'all') return data.length
    const option = tabConfig.options.find((o) => o.value === tabValue)
    const filterVal = option?.filterValue ?? tabValue
    return data.filter((item) => {
      const val = (item as Record<string, unknown>)[tabConfig.column]
      if (Array.isArray(filterVal)) {
        return filterVal.includes(val as string)
      }
      return val === filterVal
    }).length
  }

  const isFiltered = columnFilters.length > 0 || globalFilter.length > 0

  // Table content
  const tableContent = (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          {searchColumn && (
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(searchColumn)?.setFilterValue(event.target.value)
              }
              className="h-8 w-[150px] lg:w-[250px]"
            />
          )}
          {/* Faceted filters */}
          {filterConfigs.map((config) => {
            const column = table.getColumn(config.column)
            if (!column) return null
            return (
              <FacetedFilter
                key={config.column}
                column={column}
                title={config.title}
                options={config.options}
              />
            )
          })}
          {/* Clear filters */}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => {
                table.resetColumnFilters()
                setGlobalFilter('')
              }}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <IconX className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Column visibility */}
          {showColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <IconLayoutColumns className="mr-2 h-4 w-4" />
                  <span className="hidden lg:inline">Columns</span>
                  <IconChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== 'undefined' && column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id.replace(/_/g, ' ')}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* Custom header actions */}
          {headerActions}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={finalColumns.length} className="h-24 text-center">
                  <IconLoader className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(onRowClick && 'cursor-pointer')}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={finalColumns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between px-2">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {showRowSelection && (
              <>
                {table.getFilteredSelectedRowModel().rows.length} of{' '}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </>
            )}
          </div>
          <div className="flex w-full items-center gap-6 lg:w-fit lg:gap-8">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // If tabs are configured, wrap in Tabs
  if (tabConfig) {
    return (
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between mb-4">
          {/* Mobile: Select */}
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="flex w-fit @4xl:hidden" size="sm">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({data.length})</SelectItem>
              {tabConfig.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} ({getTabCount(option.value)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Desktop: TabsList */}
          <TabsList className="hidden @4xl:flex">
            <TabsTrigger value="all">
              All <Badge variant="secondary" className="ml-1.5">{data.length}</Badge>
            </TabsTrigger>
            {tabConfig.options.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}{' '}
                <Badge variant="secondary" className="ml-1.5">
                  {getTabCount(option.value)}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value={activeTab} className="mt-0">
          {tableContent}
        </TabsContent>
      </Tabs>
    )
  }

  return tableContent
}
