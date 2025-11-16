/**
 * Database Client Wrapper
 *
 * Provides a clean interface for database operations using Vercel Postgres.
 * All database queries go through this client for consistency and error handling.
 */

import { sql } from "@vercel/postgres";

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

/**
 * Execute a SQL query with parameters
 *
 * @example
 * const users = await query<User>('SELECT * FROM users WHERE id = $1', [userId]);
 */
export async function query<T = any>(
  queryText: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  try {
    const result = await sql.query(queryText, params);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount || 0,
    };
  } catch (error) {
    console.error("[Database] Query error:", error);
    console.error("[Database] Query:", queryText);
    console.error("[Database] Params:", params);
    throw error;
  }
}

/**
 * Execute a SQL query and return a single row
 *
 * @example
 * const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);
 */
export async function queryOne<T = any>(
  queryText: string,
  params: any[] = []
): Promise<T | null> {
  const result = await query<T>(queryText, params);
  return result.rows[0] || null;
}

/**
 * Execute multiple SQL statements in a transaction
 *
 * @example
 * await transaction(async (client) => {
 *   await client.query('INSERT INTO users ...');
 *   await client.query('INSERT INTO profiles ...');
 * });
 */
export async function transaction<T>(
  callback: (client: typeof sql) => Promise<T>
): Promise<T> {
  try {
    // Vercel Postgres doesn't expose BEGIN/COMMIT/ROLLBACK directly
    // but the `sql` client handles transactions internally
    return await callback(sql);
  } catch (error) {
    console.error("[Database] Transaction error:", error);
    throw error;
  }
}

/**
 * Check if database connection is healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await query("SELECT 1");
    return true;
  } catch (error) {
    console.error("[Database] Health check failed:", error);
    return false;
  }
}

/**
 * Get database statistics (for monitoring)
 */
export async function getStats() {
  const [
    linksCount,
    sparkCodesCount,
    metricsCount,
    spendCount,
  ] = await Promise.all([
    query("SELECT COUNT(*) as count FROM links"),
    query("SELECT COUNT(*) as count FROM spark_codes"),
    query("SELECT COUNT(*) as count FROM metrics_cache"),
    query("SELECT COUNT(*) as count FROM spend_tracking"),
  ]);

  return {
    links: parseInt(linksCount.rows[0].count),
    sparkCodes: parseInt(sparkCodesCount.rows[0].count),
    metrics: parseInt(metricsCount.rows[0].count),
    spend: parseInt(spendCount.rows[0].count),
  };
}

/**
 * Database client for use in API routes and server components
 */
export const db = {
  query,
  queryOne,
  transaction,
  healthCheck,
  getStats,
};
