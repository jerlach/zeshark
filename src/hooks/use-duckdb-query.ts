/**
 * useDuckDBQuery Hook
 *
 * React hook for querying parquet files via DuckDB WASM.
 * Integrates with TanStack Query for caching and state management.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import {
  queryParquetPaginated,
  type PaginatedQueryResult,
} from '@/lib/duckdb-client'

export interface UseDuckDBQueryOptions<T> {
  /** Query key for TanStack Query caching */
  queryKey: unknown[]
  /** Base URL for the parquet endpoint (e.g., '/api/orders') */
  baseUrl: string
  /** Columns to select (default: '*') */
  select?: string
  /** WHERE clause without 'WHERE' keyword */
  where?: string
  /** ORDER BY clause without 'ORDER BY' keyword */
  orderBy?: string
  /** Page size for pagination */
  pageSize?: number
  /** Current page (0-indexed) */
  page?: number
  /** Enable/disable the query */
  enabled?: boolean
}

export interface UseDuckDBQueryResult<T> {
  /** Query data rows */
  data: T[]
  /** Total count of rows matching filters */
  totalCount: number
  /** Whether data is loading */
  isLoading: boolean
  /** Whether initial fetch is pending */
  isPending: boolean
  /** Error if query failed */
  error: Error | null
  /** Refetch data */
  refetch: () => void
  /** Current page */
  page: number
  /** Total pages */
  totalPages: number
  /** Page size */
  pageSize: number
  /** Go to next page */
  nextPage: () => void
  /** Go to previous page */
  prevPage: () => void
  /** Go to specific page */
  goToPage: (page: number) => void
  /** Whether there's a next page */
  hasNextPage: boolean
  /** Whether there's a previous page */
  hasPrevPage: boolean
}

/**
 * Hook for querying parquet files with pagination.
 *
 * @example
 * const { data, totalCount, isLoading, nextPage } = useDuckDBQuery({
 *   queryKey: ['orders'],
 *   baseUrl: '/api/orders',
 *   where: "status = 'pending'",
 *   orderBy: 'created_at DESC',
 *   pageSize: 50,
 * })
 */
export function useDuckDBQuery<T = Record<string, unknown>>(
  options: UseDuckDBQueryOptions<T>
): UseDuckDBQueryResult<T> {
  const {
    queryKey,
    baseUrl,
    select = '*',
    where,
    orderBy,
    pageSize = 100,
    page = 0,
    enabled = true,
  } = options

  const queryClient = useQueryClient()

  // Build full query key including pagination/filter params
  const fullQueryKey = useMemo(
    () => [...queryKey, { select, where, orderBy, pageSize, page }],
    [queryKey, select, where, orderBy, pageSize, page]
  )

  const query = useQuery<PaginatedQueryResult<T>, Error>({
    queryKey: fullQueryKey,
    queryFn: async () => {
      const result = await queryParquetPaginated<T>({
        baseUrl,
        select,
        where,
        orderBy,
        limit: pageSize,
        offset: page * pageSize,
      })
      return result
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })

  const totalCount = query.data?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / pageSize)

  const goToPage = useCallback(
    (newPage: number) => {
      // Prefetch new page data
      const clampedPage = Math.max(0, Math.min(newPage, totalPages - 1))
      queryClient.prefetchQuery({
        queryKey: [...queryKey, { select, where, orderBy, pageSize, page: clampedPage }],
        queryFn: async () => {
          return queryParquetPaginated<T>({
            baseUrl,
            select,
            where,
            orderBy,
            limit: pageSize,
            offset: clampedPage * pageSize,
          })
        },
      })
    },
    [queryClient, queryKey, baseUrl, select, where, orderBy, pageSize, totalPages]
  )

  const nextPage = useCallback(() => {
    if (page < totalPages - 1) {
      goToPage(page + 1)
    }
  }, [page, totalPages, goToPage])

  const prevPage = useCallback(() => {
    if (page > 0) {
      goToPage(page - 1)
    }
  }, [page, goToPage])

  return {
    data: query.data?.rows ?? [],
    totalCount,
    isLoading: query.isLoading,
    isPending: query.isPending,
    error: query.error,
    refetch: query.refetch,
    page,
    totalPages,
    pageSize,
    nextPage,
    prevPage,
    goToPage,
    hasNextPage: page < totalPages - 1,
    hasPrevPage: page > 0,
  }
}

/**
 * Hook for windowed/virtual scrolling queries.
 * Returns a fetch function for on-demand row loading.
 */
export interface UseWindowedQueryOptions {
  /** Query key prefix for caching */
  queryKey: unknown[]
  /** Base URL for the parquet endpoint */
  baseUrl: string
  /** Columns to select */
  select?: string
  /** WHERE clause */
  where?: string
  /** ORDER BY clause */
  orderBy?: string
}

export interface UseWindowedQueryResult<T> {
  /** Fetch rows for a specific range */
  fetchRows: (start: number, limit: number) => Promise<T[]>
  /** Get total count */
  getTotalCount: () => Promise<number>
  /** Invalidate cached data */
  invalidate: () => void
}

/**
 * Hook for windowed/virtual scroll queries.
 * Returns callbacks for fetching specific row ranges on-demand.
 *
 * @example
 * const { fetchRows, getTotalCount } = useWindowedQuery({
 *   queryKey: ['orders'],
 *   baseUrl: '/api/orders',
 *   orderBy: 'created_at DESC',
 * })
 *
 * // In virtualizer
 * const rows = await fetchRows(startIndex, 50)
 */
export function useWindowedQuery<T = Record<string, unknown>>(
  options: UseWindowedQueryOptions
): UseWindowedQueryResult<T> {
  const { queryKey, baseUrl, select = '*', where, orderBy } = options
  const queryClient = useQueryClient()

  const fetchRows = useCallback(
    async (start: number, limit: number): Promise<T[]> => {
      const rangeKey = [...queryKey, 'range', { start, limit, where, orderBy }]

      // Use queryClient to cache range queries
      const result = await queryClient.fetchQuery({
        queryKey: rangeKey,
        queryFn: async () => {
          const data = await queryParquetPaginated<T>({
            baseUrl,
            select,
            where,
            orderBy,
            limit,
            offset: start,
          })
          return data.rows
        },
        staleTime: 1000 * 60 * 5,
      })

      return result
    },
    [queryClient, queryKey, baseUrl, select, where, orderBy]
  )

  const getTotalCount = useCallback(async (): Promise<number> => {
    const countKey = [...queryKey, 'count', { where }]

    const result = await queryClient.fetchQuery({
      queryKey: countKey,
      queryFn: async () => {
        const data = await queryParquetPaginated<T>({
          baseUrl,
          select: 'COUNT(*) as count',
          where,
          limit: 1,
          offset: 0,
        })
        return data.totalCount
      },
      staleTime: 1000 * 60 * 5,
    })

    return result
  }, [queryClient, queryKey, baseUrl, where])

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey])

  return {
    fetchRows,
    getTotalCount,
    invalidate,
  }
}
