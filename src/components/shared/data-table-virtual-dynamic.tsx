/**
 * DataTableVirtualDynamic
 *
 * Table component for large datasets (50k+ rows) with on-demand row fetching.
 * Only fetches and renders rows that are visible or about to be visible.
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  Row,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DataTableVirtualDynamicProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  /** Total number of rows (from count query) */
  totalCount: number
  /** Function to fetch rows for a given range */
  fetchRows: (start: number, limit: number) => Promise<TData[]>
  /** Whether initial count is loading */
  isLoading?: boolean
  /** Max height of the scrollable area */
  maxHeight?: string
  /** Callback when row is clicked */
  onRowClick?: (row: TData) => void
  /** Number of rows to fetch per batch */
  batchSize?: number
  /** Estimated row height in pixels */
  rowHeight?: number
}

// Placeholder for loading rows
const LOADING_PLACEHOLDER = Symbol('loading')

export function DataTableVirtualDynamic<TData, TValue>({
  columns,
  totalCount,
  fetchRows,
  isLoading,
  maxHeight = '600px',
  onRowClick,
  batchSize = 50,
  rowHeight = 48,
}: DataTableVirtualDynamicProps<TData, TValue>) {
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Cache of loaded rows: Map<index, row>
  const [rowCache, setRowCache] = useState<Map<number, TData>>(new Map())
  // Set of ranges currently being fetched
  const [loadingRanges, setLoadingRanges] = useState<Set<string>>(new Set())

  // Create placeholder data array for the table
  // This lets TanStack Table work with "virtual" rows that may not be loaded yet
  const placeholderData = Array.from({ length: totalCount }, (_, i) => {
    return rowCache.get(i) ?? ({ __placeholder: true, __index: i } as TData)
  })

  const table = useReactTable({
    data: placeholderData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  // Virtualizer for efficient rendering
  const rowVirtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  })

  // Fetch missing rows when visible range changes
  const fetchMissingRows = useCallback(
    async (startIndex: number, endIndex: number) => {
      // Find which rows in this range need to be fetched
      const missingIndices: number[] = []
      for (let i = startIndex; i <= endIndex; i++) {
        if (!rowCache.has(i)) {
          missingIndices.push(i)
        }
      }

      if (missingIndices.length === 0) return

      // Group missing indices into batches
      const batches: { start: number; end: number }[] = []
      let batchStart = missingIndices[0]
      let batchEnd = missingIndices[0]

      for (let i = 1; i < missingIndices.length; i++) {
        if (missingIndices[i] === batchEnd + 1 && batchEnd - batchStart < batchSize - 1) {
          batchEnd = missingIndices[i]
        } else {
          batches.push({ start: batchStart, end: batchEnd })
          batchStart = missingIndices[i]
          batchEnd = missingIndices[i]
        }
      }
      batches.push({ start: batchStart, end: batchEnd })

      // Fetch each batch
      for (const batch of batches) {
        const rangeKey = `${batch.start}-${batch.end}`

        // Skip if already loading this range
        if (loadingRanges.has(rangeKey)) continue

        setLoadingRanges((prev) => new Set(prev).add(rangeKey))

        try {
          const limit = batch.end - batch.start + 1
          const fetchedRows = await fetchRows(batch.start, limit)

          // Update cache with fetched rows
          setRowCache((prev) => {
            const next = new Map(prev)
            fetchedRows.forEach((row, i) => {
              next.set(batch.start + i, row)
            })
            return next
          })
        } catch (error) {
          console.error('Failed to fetch rows:', error)
        } finally {
          setLoadingRanges((prev) => {
            const next = new Set(prev)
            next.delete(rangeKey)
            return next
          })
        }
      }
    },
    [rowCache, loadingRanges, fetchRows, batchSize]
  )

  // Watch for visible range changes
  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems()
    if (virtualItems.length === 0) return

    const startIndex = virtualItems[0].index
    const endIndex = virtualItems[virtualItems.length - 1].index

    // Add buffer for smoother scrolling
    const bufferStart = Math.max(0, startIndex - batchSize)
    const bufferEnd = Math.min(totalCount - 1, endIndex + batchSize)

    fetchMissingRows(bufferStart, bufferEnd)
  }, [rowVirtualizer.getVirtualItems(), fetchMissingRows, batchSize, totalCount])

  // Check if a row is a placeholder (not yet loaded)
  const isPlaceholderRow = (row: TData): boolean => {
    return (row as { __placeholder?: boolean }).__placeholder === true
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (totalCount === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div
        ref={tableContainerRef}
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {/* Spacer for virtual items above visible range */}
            {rowVirtualizer.getVirtualItems().length > 0 && (
              <tr>
                <td
                  style={{
                    height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px`,
                  }}
                />
              </tr>
            )}

            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index]
              const rowData = row?.original
              const isPlaceholder = rowData && isPlaceholderRow(rowData)

              return (
                <TableRow
                  key={virtualRow.index}
                  data-index={virtualRow.index}
                  className={cn(
                    onRowClick && !isPlaceholder && 'cursor-pointer',
                    isPlaceholder && 'animate-pulse'
                  )}
                  onClick={() => {
                    if (rowData && !isPlaceholder && onRowClick) {
                      onRowClick(rowData)
                    }
                  }}
                >
                  {isPlaceholder ? (
                    // Loading placeholder row
                    <TableCell colSpan={columns.length}>
                      <div className="h-4 bg-muted rounded w-full" />
                    </TableCell>
                  ) : (
                    // Actual data row
                    row?.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))
                  )}
                </TableRow>
              )
            })}

            {/* Spacer for virtual items below visible range */}
            {rowVirtualizer.getVirtualItems().length > 0 && (
              <tr>
                <td
                  style={{
                    height: `${
                      rowVirtualizer.getTotalSize() -
                      (rowVirtualizer.getVirtualItems().at(-1)?.end ?? 0)
                    }px`,
                  }}
                />
              </tr>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with row count */}
      <div className="border-t px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalCount.toLocaleString()} total rows • {rowCache.size.toLocaleString()} loaded
        </div>
        <div className="text-xs text-muted-foreground">
          Scroll to load more
        </div>
      </div>
    </div>
  )
}
