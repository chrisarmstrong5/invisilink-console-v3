/**
 * RedTrack API Client
 *
 * Connects to RedTrack API for fetching campaign metrics and performance data.
 * Reference: v2 implementation in functions/api/campaigns.js
 */

import { config } from "@/lib/config";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

export interface RedTrackMetrics {
  source?: string; // e.g., "1639AP"
  sub1?: string; // Spark code ID
  campaign?: string; // Campaign ID
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
  cvr: number; // Conversion rate percentage
  epc: number; // Earnings per click
  roi: number; // ROI percentage
}

export interface CampaignData {
  id: string;
  title: string;
  status: string;
  trackback_url?: string;
}

class RedTrackAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.tracker.redtrack.apiKey;
    this.baseUrl = "https://api.redtrack.io/v1";
  }

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    // Use Next.js API route proxy to avoid CORS issues
    const searchParams = new URLSearchParams({
      endpoint,
      ...params,
    });

    try {
      const response = await fetch(`/api/redtrack?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error(`RedTrack API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`RedTrack API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(): Promise<CampaignData[]> {
    return this.request<CampaignData[]>("/campaigns");
  }

  /**
   * Get campaign reports with optional filtering
   *
   * @param dateRange - From/to dates
   * @param groupBy - Group results by: 'source', 'sub1', 'campaign', etc.
   */
  async getReports(
    dateRange: DateRange,
    groupBy: string[] = ["campaign"]
  ): Promise<RedTrackMetrics[]> {
    const data = await this.request<any>("/reports/campaigns", {
      from: dateRange.from,
      to: dateRange.to,
      groupBy: groupBy.join(","),
    });

    // Transform API response to our metrics format
    return (data.data || data || []).map((row: any) => ({
      source: row.source || row.s,
      sub1: row.sub1,
      campaign: row.campaign_id || row.campaign,
      clicks: parseInt(row.clicks) || 0,
      conversions: parseInt(row.conversions) || 0,
      revenue: parseFloat(row.revenue) || 0,
      cost: parseFloat(row.cost) || 0,
      cvr: parseFloat(row.cr) || 0,
      epc: parseFloat(row.epc) || 0,
      roi: parseFloat(row.roi) || 0,
    }));
  }

  /**
   * Get metrics for a specific source parameter (e.g., "1639AP")
   */
  async getSourceMetrics(source: string, dateRange: DateRange): Promise<RedTrackMetrics | null> {
    const reports = await this.getReports(dateRange, ["source"]);
    return reports.find((r) => r.source === source) || null;
  }

  /**
   * Get metrics for a specific spark code (sub1 parameter)
   */
  async getSparkCodeMetrics(sparkCodeId: string, dateRange: DateRange): Promise<RedTrackMetrics | null> {
    const reports = await this.getReports(dateRange, ["sub1"]);
    return reports.find((r) => r.sub1 === sparkCodeId) || null;
  }

  /**
   * Get metrics for a specific campaign
   */
  async getCampaignMetrics(campaignId: string, dateRange: DateRange): Promise<RedTrackMetrics | null> {
    const reports = await this.getReports(dateRange, ["campaign"]);
    return reports.find((r) => r.campaign === campaignId) || null;
  }

  /**
   * Get daily metrics (today vs yesterday)
   */
  async getDailyMetrics(): Promise<{
    today: RedTrackMetrics;
    yesterday: RedTrackMetrics;
  }> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    const [todayData, yesterdayData] = await Promise.all([
      this.getReports({
        from: formatDate(today),
        to: formatDate(today),
      }),
      this.getReports({
        from: formatDate(yesterday),
        to: formatDate(yesterday),
      }),
    ]);

    // Aggregate all campaigns
    const aggregate = (data: RedTrackMetrics[]): RedTrackMetrics => {
      return data.reduce(
        (acc, curr) => ({
          clicks: acc.clicks + curr.clicks,
          conversions: acc.conversions + curr.conversions,
          revenue: acc.revenue + curr.revenue,
          cost: acc.cost + curr.cost,
          cvr: 0, // Will calculate after
          epc: 0, // Will calculate after
          roi: 0, // Will calculate after
        }),
        { clicks: 0, conversions: 0, revenue: 0, cost: 0, cvr: 0, epc: 0, roi: 0 }
      );
    };

    const todayAgg = aggregate(todayData);
    const yesterdayAgg = aggregate(yesterdayData);

    // Calculate percentages
    todayAgg.cvr = todayAgg.clicks > 0 ? (todayAgg.conversions / todayAgg.clicks) * 100 : 0;
    todayAgg.epc = todayAgg.clicks > 0 ? todayAgg.revenue / todayAgg.clicks : 0;
    todayAgg.roi = todayAgg.cost > 0 ? ((todayAgg.revenue - todayAgg.cost) / todayAgg.cost) * 100 : 0;

    yesterdayAgg.cvr = yesterdayAgg.clicks > 0 ? (yesterdayAgg.conversions / yesterdayAgg.clicks) * 100 : 0;
    yesterdayAgg.epc = yesterdayAgg.clicks > 0 ? yesterdayAgg.revenue / yesterdayAgg.clicks : 0;
    yesterdayAgg.roi = yesterdayAgg.cost > 0 ? ((yesterdayAgg.revenue - yesterdayAgg.cost) / yesterdayAgg.cost) * 100 : 0;

    return {
      today: todayAgg,
      yesterday: yesterdayAgg,
    };
  }

  /**
   * Get revenue time-series data for charting
   */
  async getRevenueTimeSeries(days: 7 | 30 = 7): Promise<{ date: string; revenue: number }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    const reports = await this.getReports({
      from: formatDate(startDate),
      to: formatDate(endDate),
    }, ["date"]);

    // Group by date
    const dateMap = new Map<string, number>();

    reports.forEach((r: any) => {
      const date = r.date || formatDate(new Date());
      const revenue = r.revenue || 0;
      dateMap.set(date, (dateMap.get(date) || 0) + revenue);
    });

    // Fill in missing dates
    const result: { date: string; revenue: number }[] = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      result.push({
        date: dateStr,
        revenue: dateMap.get(dateStr) || 0,
      });
    }

    return result;
  }

  /**
   * Get active campaigns with metrics
   */
  async getActiveCampaigns(dateRange: DateRange): Promise<Array<{
    campaign: string;
    offer: string;
    epc: number;
    clicks: number;
    cvr: number;
    revenue: number;
    spend: number;
    roi: number;
  }>> {
    const reports = await this.getReports(dateRange, ["campaign"]);

    return reports.map((r) => {
      // Find offer name from campaign ID
      const offerEntry = Object.entries(config.tracker.redtrack.campaigns).find(
        ([_, id]) => id === r.campaign
      );
      const offerKey = offerEntry?.[0] || "unknown";
      const offerName = config.offers[offerKey as keyof typeof config.offers]?.name || offerKey;

      // Get stored spend from localStorage
      const spendKey = `campaign-spend-${r.campaign}`;
      const spend = parseFloat(localStorage.getItem(spendKey) || "0");

      // Calculate ROI with manual spend
      const roi = spend > 0 ? ((r.revenue - spend) / spend) * 100 : 0;

      return {
        campaign: r.campaign || "",
        offer: offerName,
        epc: r.epc,
        clicks: r.clicks,
        cvr: r.cvr,
        revenue: r.revenue,
        spend,
        roi,
      };
    }).filter(c => c.clicks > 0); // Only show campaigns with traffic
  }
}

// Export singleton instance
export const redtrackApi = new RedTrackAPI();
