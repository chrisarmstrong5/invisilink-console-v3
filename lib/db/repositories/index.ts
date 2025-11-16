/**
 * Database Repositories Index
 *
 * Centralized export for all database repositories.
 */

export { linksRepository, type Link } from "./links";
export { sparkCodesRepository, type SparkCodeRecord } from "./spark-codes";
export { metricsRepository, type MetricRecord } from "./metrics";
export { spendRepository, type SpendRecord } from "./spend";

// Re-export database client
export { db } from "../client";
