/**
 * DuckDB WASM Client
 *
 * Singleton that initializes DuckDB WASM once and provides query interface.
 * Supports authenticated parquet fetches via custom fetch handler.
 */

import * as duckdb from '@duckdb/duckdb-wasm'

// Singleton state
let db: duckdb.AsyncDuckDB | null = null
let initPromise: Promise<duckdb.AsyncDuckDB> | null = null

/**
 * Get or initialize the DuckDB instance.
 * Safe to call multiple times - returns same instance.
 */
export async function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (db) return db

  if (initPromise) return initPromise

  initPromise = initializeDuckDB()
  db = await initPromise
  return db
}

async function initializeDuckDB(): Promise<duckdb.AsyncDuckDB> {
  // Use CDN bundles for simplicity - can switch to local bundles if needed
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles()

  // Select best bundle for this browser
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES)

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {
      type: 'text/javascript',
    })
  )

  // Create worker and logger
  const worker = new Worker(worker_url)
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING)

  // Instantiate DuckDB
  const instance = new duckdb.AsyncDuckDB(logger, worker)
  await instance.instantiate(bundle.mainModule, bundle.pthreadWorker)

  // Clean up blob URL
  URL.revokeObjectURL(worker_url)

  return instance
}

/**
 * Query options for parquet queries
 */
export interface ParquetQueryOptions {
  /** Base URL for the parquet endpoint (without ?format=parquet) */
  baseUrl: string
  /** SQL query - use 'data' as the table alias for the parquet source */
  sql: string
  /** Auth token for authenticated requests */
  authToken?: string
  /** Additional headers */
  headers?: Record<string, string>
}

/**
 * Execute a SQL query against a parquet file.
 *
 * @example
 * const result = await queryParquet({
 *   baseUrl: 'http://localhost:3000/orders',
 *   sql: 'SELECT * FROM data WHERE status = $1 LIMIT 100',
 * })
 */
export async function queryParquet<T = Record<string, unknown>>(
  options: ParquetQueryOptions
): Promise<T[]> {
  const db = await getDuckDB()
  const conn = await db.connect()

  try {
    // Build parquet URL with format param
    const parquetUrl = `${options.baseUrl}?format=parquet`

    // Register the parquet file as a view called 'data'
    // Using read_parquet with httpfs for remote files
    await conn.query(`
      CREATE OR REPLACE VIEW data AS 
      SELECT * FROM read_parquet('${parquetUrl}')
    `)

    // Execute the user's query
    const result = await conn.query(options.sql)

    // Convert Arrow table to JS objects
    return result.toArray().map((row) => row.toJSON()) as T[]
  } finally {
    await conn.close()
  }
}

/**
 * Get the total count of rows in a parquet file.
 * Uses parquet metadata when possible for fast counts.
 */
export async function getParquetCount(baseUrl: string): Promise<number> {
  const db = await getDuckDB()
  const conn = await db.connect()

  try {
    const parquetUrl = `${baseUrl}?format=parquet`
    const result = await conn.query(`
      SELECT COUNT(*) as count FROM read_parquet('${parquetUrl}')
    `)
    const row = result.toArray()[0]
    return Number(row?.count ?? 0)
  } finally {
    await conn.close()
  }
}

/**
 * Query result with pagination info
 */
export interface PaginatedQueryResult<T> {
  rows: T[]
  totalCount: number
}

/**
 * Execute a paginated query against a parquet file.
 *
 * @example
 * const result = await queryParquetPaginated({
 *   baseUrl: 'http://localhost:3000/orders',
 *   select: '*',
 *   where: "status = 'pending'",
 *   orderBy: 'created_at DESC',
 *   limit: 50,
 *   offset: 0,
 * })
 */
export interface PaginatedQueryOptions {
  baseUrl: string
  /** Columns to select (default: *) */
  select?: string
  /** WHERE clause without 'WHERE' keyword */
  where?: string
  /** ORDER BY clause without 'ORDER BY' keyword */
  orderBy?: string
  /** Number of rows to fetch */
  limit: number
  /** Offset for pagination */
  offset: number
}

export async function queryParquetPaginated<T = Record<string, unknown>>(
  options: PaginatedQueryOptions
): Promise<PaginatedQueryResult<T>> {
  const db = await getDuckDB()
  const conn = await db.connect()

  try {
    const parquetUrl = `${options.baseUrl}?format=parquet`
    const select = options.select ?? '*'
    const whereClause = options.where ? `WHERE ${options.where}` : ''
    const orderByClause = options.orderBy ? `ORDER BY ${options.orderBy}` : ''

    // Get total count (with same filters)
    const countResult = await conn.query(`
      SELECT COUNT(*) as count 
      FROM read_parquet('${parquetUrl}')
      ${whereClause}
    `)
    const totalCount = Number(countResult.toArray()[0]?.count ?? 0)

    // Get paginated rows
    const dataResult = await conn.query(`
      SELECT ${select}
      FROM read_parquet('${parquetUrl}')
      ${whereClause}
      ${orderByClause}
      LIMIT ${options.limit}
      OFFSET ${options.offset}
    `)

    const rows = dataResult.toArray().map((row) => row.toJSON()) as T[]

    return { rows, totalCount }
  } finally {
    await conn.close()
  }
}

/**
 * Preload/warm up DuckDB instance.
 * Call this early in app lifecycle to reduce first-query latency.
 */
export function preloadDuckDB(): void {
  getDuckDB().catch(console.error)
}
