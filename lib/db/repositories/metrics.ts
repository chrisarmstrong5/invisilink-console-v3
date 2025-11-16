/**
 * Metrics Repository
 *
 * Database operations for RedTrack metrics cache.
 */

import { db } from "../client";

export interface MetricRecord {
  id: number;
  source_type: "link" | "spark_code" | "campaign" | "account";
  source_id: string;
  date: Date;
  platform?: "tiktok" | "facebook" | "both";
  clicks: number;
  conversions: number;
  revenue: number;
  cvr: number;
  epc: number;
  synced_at: Date;
}

export const metricsRepository = {
  /**
   * Upsert metrics (insert or update)
   */
  async upsert(metric: Omit<MetricRecord, "id" | "synced_at">): Promise<MetricRecord> {
    const result = await db.queryOne<MetricRecord>(
      `
      INSERT INTO metrics_cache (
        source_type, source_id, date, platform,
        clicks, conversions, revenue, cvr, epc
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (source_type, source_id, date, platform)
      DO UPDATE SET
        clicks = EXCLUDED.clicks,
        conversions = EXCLUDED.conversions,
        revenue = EXCLUDED.revenue,
        cvr = EXCLUDED.cvr,
        epc = EXCLUDED.epc,
        synced_at = NOW()
      RETURNING *
    `,
      [
        metric.source_type,
        metric.source_id,
        metric.date,
        metric.platform || null,
        metric.clicks,
        metric.conversions,
        metric.revenue,
        metric.cvr,
        metric.epc,
      ]
    );

    if (!result) {
      throw new Error("Failed to upsert metric");
    }

    return result;
  },

  /**
   * Get metrics for a specific source
   */
  async findBySource(
    sourceType: string,
    sourceId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<MetricRecord[]> {
    let query = `
      SELECT * FROM metrics_cache
      WHERE source_type = $1 AND source_id = $2
    `;
    const params: any[] = [sourceType, sourceId];

    if (dateRange) {
      query += " AND date >= $3 AND date <= $4";
      params.push(dateRange.from, dateRange.to);
    }

    query += " ORDER BY date DESC";

    const result = await db.query<MetricRecord>(query, params);
    return result.rows;
  },

  /**
   * Get aggregated metrics for a source over a date range
   */
  async getAggregated(
    sourceType: string,
    sourceId: string,
    dateRange: { from: Date; to: Date }
  ): Promise<{
    clicks: number;
    conversions: number;
    revenue: number;
    avgCvr: number;
    avgEpc: number;
  } | null> {
    const result = await db.queryOne<{
      clicks: string;
      conversions: string;
      revenue: string;
      avg_cvr: string;
      avg_epc: string;
    }>(
      `
      SELECT
        COALESCE(SUM(clicks), 0) as clicks,
        COALESCE(SUM(conversions), 0) as conversions,
        COALESCE(SUM(revenue), 0) as revenue,
        COALESCE(AVG(cvr), 0) as avg_cvr,
        COALESCE(AVG(epc), 0) as avg_epc
      FROM metrics_cache
      WHERE source_type = $1
        AND source_id = $2
        AND date >= $3
        AND date <= $4
    `,
      [sourceType, sourceId, dateRange.from, dateRange.to]
    );

    if (!result) return null;

    return {
      clicks: parseInt(result.clicks),
      conversions: parseInt(result.conversions),
      revenue: parseFloat(result.revenue),
      avgCvr: parseFloat(result.avg_cvr),
      avgEpc: parseFloat(result.avg_epc),
    };
  },

  /**
   * Get metrics for all sources of a type
   */
  async findAllByType(
    sourceType: string,
    dateRange: { from: Date; to: Date },
    platform?: "tiktok" | "facebook"
  ): Promise<MetricRecord[]> {
    let query = `
      SELECT * FROM metrics_cache
      WHERE source_type = $1
        AND date >= $2
        AND date <= $3
    `;
    const params: any[] = [sourceType, dateRange.from, dateRange.to];

    if (platform) {
      query += " AND platform = $4";
      params.push(platform);
    }

    query += " ORDER BY date DESC";

    const result = await db.query<MetricRecord>(query, params);
    return result.rows;
  },

  /**
   * Get today's metrics summary
   */
  async getTodaySummary(platform?: "tiktok" | "facebook"): Promise<{
    clicks: number;
    conversions: number;
    revenue: number;
    avgCvr: number;
    avgEpc: number;
  } | null> {
    const today = new Date().toISOString().split("T")[0];

    let query = `
      SELECT
        COALESCE(SUM(clicks), 0) as clicks,
        COALESCE(SUM(conversions), 0) as conversions,
        COALESCE(SUM(revenue), 0) as revenue,
        COALESCE(AVG(cvr), 0) as avg_cvr,
        COALESCE(AVG(epc), 0) as avg_epc
      FROM metrics_cache
      WHERE date = $1
    `;
    const params: any[] = [today];

    if (platform) {
      query += " AND platform = $2";
      params.push(platform);
    }

    const result = await db.queryOne<{
      clicks: string;
      conversions: string;
      revenue: string;
      avg_cvr: string;
      avg_epc: string;
    }>(query, params);

    if (!result) return null;

    return {
      clicks: parseInt(result.clicks),
      conversions: parseInt(result.conversions),
      revenue: parseFloat(result.revenue),
      avgCvr: parseFloat(result.avg_cvr),
      avgEpc: parseFloat(result.avg_epc),
    };
  },

  /**
   * Bulk insert metrics (for migration or sync)
   */
  async bulkUpsert(metrics: Omit<MetricRecord, "id" | "synced_at">[]): Promise<number> {
    if (metrics.length === 0) return 0;

    let upserted = 0;

    for (const metric of metrics) {
      try {
        await this.upsert(metric);
        upserted++;
      } catch (error) {
        console.error("[Metrics] Failed to upsert metric:", error);
      }
    }

    return upserted;
  },

  /**
   * Delete old metrics (for cleanup)
   */
  async deleteOlderThan(days: number): Promise<number> {
    const result = await db.query(
      `
      DELETE FROM metrics_cache
      WHERE date < CURRENT_DATE - INTERVAL '${days} days'
      RETURNING id
    `
    );

    return result.rowCount;
  },

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<Date | null> {
    const result = await db.queryOne<{ synced_at: Date }>(
      "SELECT synced_at FROM metrics_cache ORDER BY synced_at DESC LIMIT 1"
    );

    return result?.synced_at || null;
  },
};
