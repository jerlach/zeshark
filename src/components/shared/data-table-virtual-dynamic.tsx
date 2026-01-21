/**
 * DataTableVirtualDynamic
 *
 * High-performance table for large datasets (50k+ rows).
 * Uses chunk-based loading + DOM virtualization.
 * Does NOT use TanStack Table for row rendering (too slow for 50k+ rows).
 */

import { useRef, useState, useEffect, useCallback, memo } from 'react'
import { ColumnDef, flexRender, AccessorFn } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2 } from 'lucide-react'
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
  /** Number of rows to fetch per chunk (default: 1000) */
  chunkSize?: number
  /** Estimated row height in pixels */
  rowHeight?: number
  /** Number of rows to render outside visible area (default: 5) */
  overscan?: number
}

export function DataTableVirtualDynamic<TData, TValue>({
  columns,
  totalCount,
  fetchRows,
  isLoading,
  maxHeight = '600px',
  onRowClick,
  chunkSize = 1000,
  rowHeight = 40,
  overscan = 5,
}: DataTableVirtualDynamicProps<TData, TValue>) {
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Cache of loaded rows: Map<index, row>
  const rowCacheRef = useRef<Map<number, TData>>(new Map())
  const [cacheVersion, setCacheVersion] = useState(0) // trigger re-render when cache updates
  
  // Track which chunks have been loaded or are loading
  const loadedChunksRef = useRef<Set<number>>(new Set())
  const loadingChunksRef = useRef<Set<number>>(new Set())
  const [loadingCount, setLoadingCount] = useState(0)

  // Virtualizer for efficient rendering
  const rowVirtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => rowHeight,
    overscan,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const firstIndex = virtualItems[0]?.index ?? 0
  const lastIndex = virtualItems[virtualItems.length - 1]?.index ?? 0
  const middleIndex = Math.floor((firstIndex + lastIndex) / 2)

  // Fetch a chunk of rows
  const fetchChunk = useCallback(
    async (chunkIndex: number) => {
      // Skip if already loaded or loading
      if (loadedChunksRef.current.has(chunkIndex) || loadingChunksRef.current.has(chunkIndex)) return

      const start = chunkIndex * chunkSize
      const limit = Math.min(chunkSize, totalCount - start)
      
      if (limit <= 0) return

      loadingChunksRef.current.add(chunkIndex)
      setLoadingCount((c) => c + 1)

      try {
        const fetchedRows = await fetchRows(start, limit)

        // Update cache
        fetchedRows.forEach((row, i) => {
          rowCacheRef.current.set(start + i, row)
        })

        loadedChunksRef.current.add(chunkIndex)
        setCacheVersion((v) => v + 1) // trigger re-render
      } catch (error) {
        console.error('Failed to fetch chunk:', error)
      } finally {
        loadingChunksRef.current.delete(chunkIndex)
        setLoadingCount((c) => c - 1)
      }
    },
    [fetchRows, chunkSize, totalCount]
  )

  // Prefetch chunks based on scroll position
  const totalChunks = Math.ceil(totalCount / chunkSize)
  
  useEffect(() => {
    if (totalCount === 0 || totalChunks === 0) return

    // Clamp to valid chunk range
    const currentChunk = Math.min(
      Math.floor(middleIndex / chunkSize),
      totalChunks - 1
    )

    // Always load current chunk
    if (currentChunk >= 0 && currentChunk < totalChunks) {
      fetchChunk(currentChunk)
    }

    // Prefetch previous chunk
    if (currentChunk > 0) {
      fetchChunk(currentChunk - 1)
    }

    // Prefetch next chunk
    if (currentChunk + 1 < totalChunks) {
      fetchChunk(currentChunk + 1)
    }
  }, [middleIndex, chunkSize, totalCount, totalChunks, fetchChunk])

  // Get cell value from row data
  const getCellValue = (row: TData, column: ColumnDef<TData, TValue>): unknown => {
    if ('accessorKey' in column && column.accessorKey) {
      return (row as Record<string, unknown>)[column.accessorKey as string]
    }
    if ('accessorFn' in column && column.accessorFn) {
      return (column.accessorFn as AccessorFn<TData, unknown>)(row, 0)
    }
    return null
  }

  // Render cell content
  const renderCell = (row: TData, column: ColumnDef<TData, TValue>, index: number) => {
    const value = getCellValue(row, column)
    
    if (column.cell && typeof column.cell === 'function') {
      // Simple cell renderer - pass minimal context
      return column.cell({
        getValue: () => value,
        row: { original: row, index } as any,
        column: { id: ('accessorKey' in column ? column.accessorKey : column.id) as string } as any,
        table: {} as any,
        cell: {} as any,
        renderValue: () => value,
      } as any)
    }
    
    return String(value ?? '')
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
            <TableRow>
              {columns.map((column, i) => (
                <TableHead key={i}>
                  {typeof column.header === 'string' ? column.header : 
                   ('accessorKey' in column ? String(column.accessorKey) : '')}
                </TableHead>
              ))}
            </TableRow>
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

  const totalSize = rowVirtualizer.getTotalSize()
  const topPadding = virtualItems[0]?.start ?? 0
  const bottomPadding = totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0)

  return (
    <div className="rounded-md border">
      <div
        ref={tableContainerRef}
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <Table style={{ height: totalSize }}>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {columns.map((column, i) => (
                <TableHead key={i}>
                  {typeof column.header === 'string' ? column.header : 
                   ('accessorKey' in column ? String(column.accessorKey) : '')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Top spacer */}
            {topPadding > 0 && (
              <tr><td style={{ height: topPadding }} /></tr>
            )}

            {virtualItems.map((virtualRow) => {
              const rowData = rowCacheRef.current.get(virtualRow.index)
              const isPlaceholder = !rowData

              return (
                <TableRow
                  key={virtualRow.index}
                  data-index={virtualRow.index}
                  style={{ height: rowHeight }}
                  className={cn(
                    onRowClick && !isPlaceholder && 'cursor-pointer hover:bg-muted/50',
                    isPlaceholder && 'animate-pulse'
                  )}
                  onClick={() => {
                    if (rowData && onRowClick) {
                      onRowClick(rowData)
                    }
                  }}
                >
                  {isPlaceholder ? (
                    <TableCell colSpan={columns.length}>
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </TableCell>
                  ) : (
                    columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        {renderCell(rowData, column, virtualRow.index)}
                      </TableCell>
                    ))
                  )}
                </TableRow>
              )
            })}

            {/* Bottom spacer */}
            {bottomPadding > 0 && (
              <tr><td style={{ height: bottomPadding }} /></tr>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {totalCount.toLocaleString()} rows • {rowCacheRef.current.size.toLocaleString()} loaded
          {loadingCount > 0 && ' • Loading...'}
        </span>
        <span>
          Chunk {Math.min(Math.floor(middleIndex / chunkSize) + 1, totalChunks)}/{totalChunks}
        </span>
      </div>
    </div>
  )
}
