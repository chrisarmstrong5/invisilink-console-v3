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
  sub20?: string; // Source parameter (s= in URL, e.g., "apple3527")
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
    this.baseUrl = "https://api.redtrack.io";
  }

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    // Use Next.js API route proxy to avoid CORS issues
    const searchParams = new URLSearchParams({
      endpoint,
      api_key: this.apiKey,
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
   * @param groupBy - Group results by: 'source', 'sub1', 'campaign', 'date', etc.
   */
  async getReports(
    dateRange: DateRange,
    groupBy: string[] = ["campaign"]
  ): Promise<RedTrackMetrics[]> {
    const data = await this.request<any>("/report", {
      date_from: dateRange.from,
      date_to: dateRange.to,
      group: groupBy.join(","),
    });

    // Transform API response to our metrics format
    return (data.data || data || []).map((row: any) => ({
      source: row.source || row.s,
      sub1: row.sub1,
      sub20: row.sub20,
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
   * Get active campaigns with metrics (grouped by source/sub20)
   * Sorted by link generation history (most recent first)
   */
  async getActiveCampaigns(dateRange: DateRange): Promise<Array<{
    source: string;
    offer: string;
    epc: number;
    clicks: number;
    cvr: number;
    revenue: number;
    spend: number;
    roi: number;
  }>> {
    // Get aggregated metrics per source
    const reports = await this.getReports(dateRange, ["sub20"]);

    // Get link history from localStorage to determine source creation order
    const linkHistory = JSON.parse(localStorage.getItem("link-history") || "[]");

    // Build map of source -> first appearance timestamp (from link generator)
    const sourceFirstSeen = new Map<string, number>();
    linkHistory.forEach((item: any) => {
      if (!item.account || !item.offer) return;

      // Reconstruct source from offer + account (e.g., "Apple Pay" + "1639" -> "apple1639")
      const offerKey = Object.entries(config.offers).find(([_, v]) =>
        (v as any).name === item.offer
      )?.[0];
      if (!offerKey) return;

      const offerCode = config.offerCodes[offerKey as keyof typeof config.offerCodes];
      const source = `${item.account}${offerCode}`.toLowerCase();

      const timestamp = new Date(item.timestamp).getTime();
      if (!sourceFirstSeen.has(source) || timestamp < sourceFirstSeen.get(source)!) {
        sourceFirstSeen.set(source, timestamp);
      }
    });

    const campaigns = reports.map((r) => {
      const source = r.sub20 || "unknown";

      // Extract offer from sub20 (e.g., "apple3527" -> "apple", "cashapp1639" -> "cashapp")
      let offerKey = "unknown";
      const sourceLower = source.toLowerCase();

      // Check against known offer prefixes
      if (sourceLower.startsWith("apple")) offerKey = "apple";
      else if (sourceLower.startsWith("cashapp")) offerKey = "cashapp";
      else if (sourceLower.startsWith("shein")) offerKey = "shein";
      else if (sourceLower.startsWith("venmo")) offerKey = "venmo";
      else if (sourceLower.startsWith("freecash")) {
        // Determine freecash variant
        if (sourceLower.includes("video")) offerKey = "freecash-videos";
        else if (sourceLower.includes("ad")) offerKey = "freecash-ads";
        else if (sourceLower.includes("game")) offerKey = "freecash-games";
        else if (sourceLower.includes("survey")) offerKey = "freecash-surveys";
        else if (sourceLower.includes("paypal")) offerKey = "freecash-paypal";
        else offerKey = "freecash-main";
      }
      else if (sourceLower.startsWith("swift")) {
        if (sourceLower.includes("venmo")) offerKey = "swift-venmo";
        else if (sourceLower.includes("amazon")) offerKey = "swift-amazon";
      }

      const offerName = config.offers[offerKey as keyof typeof config.offers]?.name || source;

      // Get stored spend from localStorage (keyed by source)
      const spendKey = `source-spend-${source}`;
      const spend = parseFloat(localStorage.getItem(spendKey) || "0");

      // Calculate EPC based on clicks (not lander views like RedTrack does)
      const epc = r.clicks > 0 ? r.revenue / r.clicks : 0;

      // Calculate ROI with manual spend
      const roi = spend > 0 ? ((r.revenue - spend) / spend) * 100 : 0;

      return {
        source,
        offer: offerName,
        epc,
        clicks: r.clicks,
        cvr: r.cvr,
        revenue: r.revenue,
        spend,
        roi,
        firstSeen: sourceFirstSeen.get(sourceLower) || 0, // For sorting
      };
    }).filter(c => c.clicks > 0); // Only show sources with traffic

    // Sort by first appearance in link generator (most recent first)
    // If no history, sort alphabetically (reverse)
    campaigns.sort((a, b) => {
      if (a.firstSeen === 0 && b.firstSeen === 0) {
        return b.source.localeCompare(a.source); // Reverse alphabetical
      }
      return b.firstSeen - a.firstSeen; // Most recent first
    });

    // Remove firstSeen from return value
    return campaigns.map(({ firstSeen, ...rest }) => rest);
  }
}

// Export singleton instance
export const redtrackApi = new RedTrackAPI();
