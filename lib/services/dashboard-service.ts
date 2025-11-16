/**
 * Dashboard Service
 *
 * Provides aggregated metrics for link performance, ROI tracking, and analytics.
 */

import { db } from "@/lib/db/client";

export interface LinkPerformance {
  slug: string;
  offerName: string;
  accountNumber: string;
  sparkCodeId?: string;
  platform: "tiktok" | "facebook";
  createdAt: Date;

  // Metrics
  clicks: number;
  conversions: number;
  revenue: number;
  spend: number;
  profit: number;
  roi: number;
  cvr: number;
  epc: number;

  // Status
  isKilled: boolean;
}

export class DashboardService {
  /**
   * Get link performance with ROI calculations
   */
  async getLinkPerformance(days: 7 | 30 = 7): Promise<LinkPerformance[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = `
      SELECT
        l.slug,
        l.offer_name,
        l.account_number,
        l.spark_code_id,
        l.platform,
        l.created_at,
        l.is_killed,
        COALESCE(SUM(m.clicks), 0) as clicks,
        COALESCE(SUM(m.conversions), 0) as conversions,
        COALESCE(SUM(m.revenue), 0) as revenue,
        COALESCE(AVG(m.cvr), 0) as cvr,
        COALESCE(AVG(m.epc), 0) as epc,
        COALESCE(SUM(s.amount), 0) as spend
      FROM links l
      LEFT JOIN metrics_cache m
        ON m.source_id = l.slug
        AND m.source_type = 'link'
        AND m.date >= $1
        AND m.date <= $2
      LEFT JOIN spend_tracking s
        ON s.source_id = l.account_number
        AND s.source_type = 'account'
        AND s.date >= $1
        AND s.date <= $2
        AND s.platform = l.platform
      WHERE l.created_at >= $1
      GROUP BY
        l.slug, l.offer_name, l.account_number,
        l.spark_code_id, l.platform, l.created_at, l.is_killed
      ORDER BY
        (COALESCE(SUM(m.revenue), 0) - COALESCE(SUM(s.amount), 0)) DESC
    `;

    const result = await db.query<any>(query, [
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
    ]);

    return result.rows.map((row) => {
      const revenue = parseFloat(row.revenue) || 0;
      const spend = parseFloat(row.spend) || 0;
      const profit = revenue - spend;
      const roi = spend > 0 ? ((profit / spend) * 100) : 0;

      return {
        slug: row.slug,
        offerName: row.offer_name,
        accountNumber: row.account_number,
        sparkCodeId: row.spark_code_id,
        platform: row.platform,
        createdAt: new Date(row.created_at),
        clicks: parseInt(row.clicks) || 0,
        conversions: parseInt(row.conversions) || 0,
        revenue,
        spend,
        profit,
        roi,
        cvr: parseFloat(row.cvr) || 0,
        epc: parseFloat(row.epc) || 0,
        isKilled: row.is_killed,
      };
    });
  }

  /**
   * Get platform comparison (TikTok vs Facebook)
   */
  async getPlatformComparison(days: 7 | 30 = 7): Promise<{
    tiktok: { revenue: number; spend: number; profit: number; roi: number };
    facebook: { revenue: number; spend: number; profit: number; roi: number };
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = `
      SELECT
        l.platform,
        COALESCE(SUM(m.revenue), 0) as revenue,
        COALESCE(SUM(s.amount), 0) as spend
      FROM links l
      LEFT JOIN metrics_cache m
        ON m.source_id = l.slug
        AND m.source_type = 'link'
        AND m.date >= $1
        AND m.date <= $2
      LEFT JOIN spend_tracking s
        ON s.source_id = l.account_number
        AND s.source_type = 'account'
        AND s.date >= $1
        AND s.date <= $2
        AND s.platform = l.platform
      WHERE l.created_at >= $1
      GROUP BY l.platform
    `;

    const result = await db.query<{
      platform: string;
      revenue: string;
      spend: string;
    }>(query, [
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
    ]);

    const tiktokRow = result.rows.find((r) => r.platform === "tiktok");
    const facebookRow = result.rows.find((r) => r.platform === "facebook");

    const calculateMetrics = (row?: { revenue: string; spend: string }) => {
      const revenue = parseFloat(row?.revenue || "0");
      const spend = parseFloat(row?.spend || "0");
      const profit = revenue - spend;
      const roi = spend > 0 ? ((profit / spend) * 100) : 0;

      return { revenue, spend, profit, roi };
    };

    return {
      tiktok: calculateMetrics(tiktokRow),
      facebook: calculateMetrics(facebookRow),
    };
  }

  /**
   * Get top performing spark codes
   */
  async getTopSparkCodes(limit: number = 10, days: 7 | 30 = 7): Promise<Array<{
    sparkCodeId: string;
    revenue: number;
    clicks: number;
    conversions: number;
    cvr: number;
  }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = `
      SELECT
        m.source_id as spark_code_id,
        SUM(m.revenue) as revenue,
        SUM(m.clicks) as clicks,
        SUM(m.conversions) as conversions,
        AVG(m.cvr) as cvr
      FROM metrics_cache m
      WHERE m.source_type = 'spark_code'
        AND m.date >= $1
        AND m.date <= $2
      GROUP BY m.source_id
      ORDER BY SUM(m.revenue) DESC
      LIMIT $3
    `;

    const result = await db.query<{
      spark_code_id: string;
      revenue: string;
      clicks: string;
      conversions: string;
      cvr: string;
    }>(query, [
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
      limit,
    ]);

    return result.rows.map((row) => ({
      sparkCodeId: row.spark_code_id,
      revenue: parseFloat(row.revenue),
      clicks: parseInt(row.clicks),
      conversions: parseInt(row.conversions),
      cvr: parseFloat(row.cvr),
    }));
  }

  /**
   * Get daily metrics summary
   */
  async getDailySummary(): Promise<{
    today: { revenue: number; spend: number; profit: number; clicks: number };
    yesterday: { revenue: number; spend: number; profit: number; clicks: number };
  }> {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const query = `
      SELECT
        m.date,
        SUM(m.revenue) as revenue,
        SUM(m.clicks) as clicks
      FROM metrics_cache m
      WHERE m.date IN ($1, $2)
      GROUP BY m.date
    `;

    const metricsResult = await db.query<{
      date: string;
      revenue: string;
      clicks: string;
    }>(query, [today, yesterday]);

    const spendQuery = `
      SELECT
        s.date,
        SUM(s.amount) as spend
      FROM spend_tracking s
      WHERE s.date IN ($1, $2)
      GROUP BY s.date
    `;

    const spendResult = await db.query<{
      date: string;
      spend: string;
    }>(spendQuery, [today, yesterday]);

    const getMetrics = (date: string) => {
      const metrics = metricsResult.rows.find((r) => r.date === date);
      const spend = spendResult.rows.find((r) => r.date === date);

      const revenue = parseFloat(metrics?.revenue || "0");
      const spendAmount = parseFloat(spend?.spend || "0");
      const clicks = parseInt(metrics?.clicks || "0");

      return {
        revenue,
        spend: spendAmount,
        profit: revenue - spendAmount,
        clicks,
      };
    };

    return {
      today: getMetrics(today),
      yesterday: getMetrics(yesterday),
    };
  }
}

// Export singleton
export const dashboardService = new DashboardService();
