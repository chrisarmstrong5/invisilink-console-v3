/**
 * RedTrack Auto-Sync Service
 *
 * Automatically syncs RedTrack metrics to database every 30 minutes.
 * Fetches data grouped by link (sub9), spark code (sub1), and source (sub20).
 */

import { redtrackApi } from "@/lib/api/redtrack";
import { metricsRepository } from "@/lib/db/repositories";
import type { MetricRecord } from "@/lib/db/repositories/metrics";

export interface SyncResult {
  success: boolean;
  synced: {
    links: number;
    sparkCodes: number;
    sources: number;
    total: number;
  };
  errors: string[];
  timestamp: string;
  duration: number;
}

export class RedTrackSyncService {
  /**
   * Sync all RedTrack data to database
   */
  async syncAll(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const synced = {
      links: 0,
      sparkCodes: 0,
      sources: 0,
      total: 0,
    };

    try {
      console.log("[RedTrack Sync] Starting sync...");

      // Get today's date range
      const today = new Date().toISOString().split("T")[0];
      const dateRange = { from: today, to: today };

      // Fetch reports grouped by different dimensions
      console.log("[RedTrack Sync] Fetching link-level metrics (sub9)...");
      try {
        const linkMetrics = await this.syncLinkMetrics(dateRange);
        synced.links = linkMetrics;
        console.log(`[RedTrack Sync] ✅ Synced ${linkMetrics} link metrics`);
      } catch (error) {
        const msg = `Failed to sync link metrics: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[RedTrack Sync] ❌ ${msg}`);
        errors.push(msg);
      }

      console.log("[RedTrack Sync] Fetching spark code metrics (sub1)...");
      try {
        const sparkMetrics = await this.syncSparkCodeMetrics(dateRange);
        synced.sparkCodes = sparkMetrics;
        console.log(`[RedTrack Sync] ✅ Synced ${sparkMetrics} spark code metrics`);
      } catch (error) {
        const msg = `Failed to sync spark code metrics: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[RedTrack Sync] ❌ ${msg}`);
        errors.push(msg);
      }

      console.log("[RedTrack Sync] Fetching source metrics (sub20)...");
      try {
        const sourceMetrics = await this.syncSourceMetrics(dateRange);
        synced.sources = sourceMetrics;
        console.log(`[RedTrack Sync] ✅ Synced ${sourceMetrics} source metrics`);
      } catch (error) {
        const msg = `Failed to sync source metrics: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[RedTrack Sync] ❌ ${msg}`);
        errors.push(msg);
      }

      synced.total = synced.links + synced.sparkCodes + synced.sources;

      const duration = Date.now() - startTime;
      console.log(`[RedTrack Sync] ✅ Sync complete in ${duration}ms`);

      return {
        success: errors.length === 0,
        synced,
        errors,
        timestamp: new Date().toISOString(),
        duration,
      };
    } catch (error) {
      console.error("[RedTrack Sync] ❌ Fatal sync error:", error);
      return {
        success: false,
        synced,
        errors: [error instanceof Error ? error.message : String(error)],
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync link-level metrics (grouped by sub9)
   */
  private async syncLinkMetrics(dateRange: { from: string; to: string }): Promise<number> {
    // Fetch reports grouped by sub9 (link slug)
    const reports = await redtrackApi.getReports(dateRange, ["sub9"]);

    const metrics: Omit<MetricRecord, "id" | "synced_at">[] = [];

    for (const report of reports) {
      // Skip if no sub9 (link slug not set)
      if (!report.sub9) continue;

      metrics.push({
        source_type: "link",
        source_id: report.sub9,
        date: new Date(dateRange.from),
        platform: undefined, // Will be determined from link record
        clicks: report.clicks,
        conversions: report.conversions,
        revenue: report.revenue,
        cvr: report.cvr,
        epc: report.epc,
      });
    }

    // Bulk upsert
    return await metricsRepository.bulkUpsert(metrics);
  }

  /**
   * Sync spark code metrics (grouped by sub1)
   */
  private async syncSparkCodeMetrics(dateRange: { from: string; to: string }): Promise<number> {
    // Fetch reports grouped by sub1 (spark code ID)
    const reports = await redtrackApi.getReports(dateRange, ["sub1"]);

    const metrics: Omit<MetricRecord, "id" | "synced_at">[] = [];

    for (const report of reports) {
      // Skip if no sub1 (spark code not set)
      if (!report.sub1) continue;

      metrics.push({
        source_type: "spark_code",
        source_id: report.sub1,
        date: new Date(dateRange.from),
        platform: undefined, // Will be determined from spark code record
        clicks: report.clicks,
        conversions: report.conversions,
        revenue: report.revenue,
        cvr: report.cvr,
        epc: report.epc,
      });
    }

    // Bulk upsert
    return await metricsRepository.bulkUpsert(metrics);
  }

  /**
   * Sync source/account metrics (grouped by sub20)
   */
  private async syncSourceMetrics(dateRange: { from: string; to: string }): Promise<number> {
    // Fetch reports grouped by sub20 (source parameter)
    const reports = await redtrackApi.getReports(dateRange, ["sub20"]);

    const metrics: Omit<MetricRecord, "id" | "synced_at">[] = [];

    for (const report of reports) {
      // Skip if no sub20 (source not set)
      if (!report.sub20) continue;

      metrics.push({
        source_type: "account",
        source_id: report.sub20,
        date: new Date(dateRange.from),
        platform: undefined, // Mixed TikTok/Facebook
        clicks: report.clicks,
        conversions: report.conversions,
        revenue: report.revenue,
        cvr: report.cvr,
        epc: report.epc,
      });
    }

    // Bulk upsert
    return await metricsRepository.bulkUpsert(metrics);
  }

  /**
   * Sync historical data (last N days)
   */
  async syncHistorical(days: number = 7): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let totalSynced = 0;

    console.log(`[RedTrack Sync] Starting historical sync (${days} days)...`);

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      console.log(`[RedTrack Sync] Syncing ${dateStr}...`);

      try {
        const result = await this.syncAll();
        totalSynced += result.synced.total;
        errors.push(...result.errors);
      } catch (error) {
        errors.push(`Failed to sync ${dateStr}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      success: errors.length === 0,
      synced: {
        links: 0,
        sparkCodes: 0,
        sources: 0,
        total: totalSynced,
      },
      errors,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };
  }
}

// Export singleton instance
export const redtrackSync = new RedTrackSyncService();
