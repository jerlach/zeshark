/**
 * useAnalyticsQuery Hook
 *
 * Runs SQL aggregation queries against parquet files via DuckDB.
 * Perfect for dashboards, charts, and KPI metrics.
 */

import { useQuery } from '@tanstack/react-query'
import { getDuckDB } from '@/lib/duckdb-client'
import { apiClient } from '@/api/client'

// Cache for registered parquet files
const analyticsFileCache = new Map<string, string>()

/**
 * Fetch and register parquet for analytics queries
 */
async function getAnalyticsParquet(baseUrl: string): Promise<string> {
  const parquetUrl = `${baseUrl}?format=parquet`
  
  if (analyticsFileCache.has(parquetUrl)) {
    return analyticsFileCache.get(parquetUrl)!
  }

  const db = await getDuckDB()
  const response = await apiClient.get(parquetUrl, { responseType: 'arraybuffer' })
  const filename = `analytics_${Date.now()}.parquet`
  
  await db.registerFileBuffer(filename, new Uint8Array(response.data))
  analyticsFileCache.set(parquetUrl, filename)
  
  return filename
}

/**
 * Clear analytics cache (call after mutations)
 */
export function invalidateAnalyticsCache(): void {
  analyticsFileCache.clear()
}

/**
 * Run a raw SQL aggregation query
 */
export interface UseAnalyticsQueryOptions {
  queryKey: unknown[]
  baseUrl: string
  sql: string
  enabled?: boolean
}

export function useAnalyticsQuery<T = Record<string, unknown>[]>(
  options: UseAnalyticsQueryOptions
) {
  const { queryKey, baseUrl, sql, enabled = true } = options

  return useQuery<T>({
    queryKey: [...queryKey, 'analytics', sql],
    queryFn: async () => {
      const db = await getDuckDB()
      const conn = await db.connect()
      
      try {
        const filename = await getAnalyticsParquet(baseUrl)
        
        // Replace {{TABLE}} placeholder with actual parquet file
        const finalSql = sql.replace(/\{\{TABLE\}\}/g, `read_parquet('${filename}')`)
        
        const result = await conn.query(finalSql)
        // Convert BigInt to number (DuckDB returns BigInt for aggregates)
        return result.toArray().map(row => {
          const obj = row.toJSON()
          for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'bigint') {
              obj[key] = Number(obj[key])
            }
          }
          return obj
        }) as T
      } finally {
        await conn.close()
      }
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Pre-built analytics queries for common patterns
 */

export interface KPIMetric {
  label: string
  value: number | string
  change?: number
  format?: 'number' | 'currency' | 'percent'
}

export interface UseKPIMetricsOptions {
  baseUrl: string
  metrics: Array<{
    name: string
    sql: string
    label: string
    format?: 'number' | 'currency' | 'percent'
  }>
  enabled?: boolean
}

export function useKPIMetrics(options: UseKPIMetricsOptions) {
  const { baseUrl, metrics, enabled = true } = options

  // Build a single query that computes all metrics
  const selectClauses = metrics.map(m => `${m.sql} as ${m.name}`).join(', ')
  const sql = `SELECT ${selectClauses} FROM {{TABLE}}`

  const query = useAnalyticsQuery<Record<string, number>[]>({
    queryKey: ['kpi', baseUrl],
    baseUrl,
    sql,
    enabled,
  })

  // Transform to KPIMetric array
  const data: KPIMetric[] = metrics.map(m => ({
    label: m.label,
    value: query.data?.[0]?.[m.name] ?? 0,
    format: m.format ?? 'number',
  }))

  return {
    ...query,
    data,
  }
}

export interface GroupedDataPoint {
  name: string
  value: number
  [key: string]: unknown
}

export interface UseGroupedAnalyticsOptions {
  baseUrl: string
  groupBy: string
  metric: string
  metricSql?: string
  orderBy?: 'value' | 'name'
  order?: 'asc' | 'desc'
  limit?: number
  enabled?: boolean
}

export function useGroupedAnalytics(options: UseGroupedAnalyticsOptions) {
  const {
    baseUrl,
    groupBy,
    metric,
    metricSql = `COUNT(*)`,
    orderBy = 'value',
    order = 'desc',
    limit = 10,
    enabled = true,
  } = options

  const orderClause = orderBy === 'value' ? metric : groupBy
  const sql = `
    SELECT 
      COALESCE(${groupBy}, 'Unknown') as name,
      ${metricSql} as value
    FROM {{TABLE}}
    GROUP BY ${groupBy}
    ORDER BY ${orderClause} ${order.toUpperCase()}
    LIMIT ${limit}
  `

  return useAnalyticsQuery<GroupedDataPoint[]>({
    queryKey: ['grouped', baseUrl, groupBy, metric],
    baseUrl,
    sql,
    enabled,
  })
}

export interface TimeSeriesDataPoint {
  date: string
  value: number
  [key: string]: unknown
}

export interface UseTimeSeriesOptions {
  baseUrl: string
  dateField: string
  metric: string
  metricSql?: string
  granularity?: 'day' | 'week' | 'month' | 'year'
  enabled?: boolean
}

export function useTimeSeriesAnalytics(options: UseTimeSeriesOptions) {
  const {
    baseUrl,
    dateField,
    metric,
    metricSql = `COUNT(*)`,
    granularity = 'month',
    enabled = true,
  } = options

  const truncFn = granularity === 'day' ? 'DATE' : `DATE_TRUNC('${granularity}', `
  const truncEnd = granularity === 'day' ? '' : '::DATE)'
  
  const sql = `
    SELECT 
      ${truncFn}${dateField}${truncEnd} as date,
      ${metricSql} as value
    FROM {{TABLE}}
    WHERE ${dateField} IS NOT NULL
    GROUP BY 1
    ORDER BY 1
  `

  return useAnalyticsQuery<TimeSeriesDataPoint[]>({
    queryKey: ['timeseries', baseUrl, dateField, metric, granularity],
    baseUrl,
    sql,
    enabled,
  })
}
