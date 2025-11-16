/**
 * LocalStorage → Database Migration Service
 *
 * Migrates all data from browser localStorage to Vercel Postgres database.
 * Safe to run multiple times (idempotent).
 */

import { linksRepository, sparkCodesRepository, spendRepository } from "./repositories";
import type { LinkHistoryItem, SparkCode } from "@/lib/config";

export interface MigrationResult {
  success: boolean;
  migrated: {
    links: number;
    sparkCodes: number;
    spend: number;
  };
  errors: string[];
  timestamp: string;
}

export class MigrationService {
  /**
   * Run complete migration from localStorage to database
   */
  async migrateAll(): Promise<MigrationResult> {
    const errors: string[] = [];
    const migrated = {
      links: 0,
      sparkCodes: 0,
      spend: 0,
    };

    try {
      // 1. Migrate link history
      console.log("[Migration] Starting link history migration...");
      migrated.links = await this.migrateLinks();
      console.log(`[Migration] ✅ Migrated ${migrated.links} links`);
    } catch (error) {
      const msg = `Failed to migrate links: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`[Migration] ❌ ${msg}`);
      errors.push(msg);
    }

    try {
      // 2. Migrate spark codes
      console.log("[Migration] Starting spark codes migration...");
      migrated.sparkCodes = await this.migrateSparkCodes();
      console.log(`[Migration] ✅ Migrated ${migrated.sparkCodes} spark codes`);
    } catch (error) {
      const msg = `Failed to migrate spark codes: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`[Migration] ❌ ${msg}`);
      errors.push(msg);
    }

    try {
      // 3. Migrate spend data (if exists)
      console.log("[Migration] Starting spend migration...");
      migrated.spend = await this.migrateSpend();
      console.log(`[Migration] ✅ Migrated ${migrated.spend} spend records`);
    } catch (error) {
      const msg = `Failed to migrate spend: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`[Migration] ❌ ${msg}`);
      errors.push(msg);
    }

    // Mark migration as complete
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "migration-completed",
        JSON.stringify({
          timestamp: new Date().toISOString(),
          migrated,
        })
      );
    }

    return {
      success: errors.length === 0,
      migrated,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Migrate link history from localStorage
   */
  private async migrateLinks(): Promise<number> {
    if (typeof window === "undefined") return 0;

    const historyJson = localStorage.getItem("link-history");
    if (!historyJson) return 0;

    const history: LinkHistoryItem[] = JSON.parse(historyJson);
    if (history.length === 0) return 0;

    console.log(`[Migration] Found ${history.length} links in localStorage`);

    // Transform localStorage format to database format
    const links = history.map((item) => ({
      id: item.id,
      offer_key: this.getOfferKeyFromName(item.offer),
      offer_name: item.offer,
      account_number: item.account,
      domain_id: item.domain,
      slug: this.extractSlugFromUrl(item.whitePageUrl),
      tracking_url: item.trackingUrl,
      white_page_url: item.whitePageUrl,
      campaign_name: item.campaignName,
      template_name: item.templateName,
      spark_code_id: item.sparkCode || undefined,
      platform: (item.platform as "tiktok" | "facebook") || "tiktok",
      custom_url: item.customUrl,
      filter_type: item.filterType || "params-only",
      disable_cloaking: item.disableCloaking || false,
      geo_enabled: item.geoTargeting?.enabled || false,
      geo_countries: item.geoTargeting?.countries || undefined,
      tiktok_pixel_enabled: item.tiktok?.pixelEnabled || false,
      tiktok_pixel_id: item.tiktok?.pixelId,
      tiktok_browser_redirect: item.tiktok?.browserRedirectEnabled || false,
      tiktok_strict_bot: item.tiktok?.strictBotDetectionEnabled || false,
      is_killed: item.isKilled || false,
    }));

    // Bulk insert
    return await linksRepository.bulkInsert(links);
  }

  /**
   * Migrate spark codes from localStorage
   */
  private async migrateSparkCodes(): Promise<number> {
    if (typeof window === "undefined") return 0;

    const sparkCodesJson = localStorage.getItem("spark-codes");
    if (!sparkCodesJson) return 0;

    const sparkCodes: SparkCode[] = JSON.parse(sparkCodesJson);
    if (sparkCodes.length === 0) return 0;

    console.log(`[Migration] Found ${sparkCodes.length} spark codes in localStorage`);

    // Transform localStorage format to database format
    const records = sparkCodes.map((sc) => ({
      id: sc.id,
      name: sc.name,
      spark_code: sc.sparkCode,
      video_url: sc.videoUrl,
      platform: sc.platform,
      offer_code: sc.offerCode,
      content_type: sc.contentType,
      media_urls: sc.mediaUrls,
      tags: sc.tags,
    }));

    // Bulk insert
    return await sparkCodesRepository.bulkInsert(records);
  }

  /**
   * Migrate spend data from localStorage (if exists)
   */
  private async migrateSpend(): Promise<number> {
    if (typeof window === "undefined") return 0;

    // Check for any spend-related localStorage keys
    const spendKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith("source-spend-")
    );

    if (spendKeys.length === 0) return 0;

    console.log(`[Migration] Found ${spendKeys.length} spend records in localStorage`);

    let migrated = 0;

    for (const key of spendKeys) {
      try {
        const sourceId = key.replace("source-spend-", "");
        const amount = parseFloat(localStorage.getItem(key) || "0");

        if (amount > 0) {
          await spendRepository.upsert({
            source_type: "account",
            source_id: sourceId,
            date: new Date(), // Use today's date for historical data
            amount,
            platform: "tiktok", // Default to TikTok for old data
            import_method: "manual",
            notes: "Migrated from localStorage",
          });
          migrated++;
        }
      } catch (error) {
        console.error(`[Migration] Failed to migrate spend for ${key}:`, error);
      }
    }

    return migrated;
  }

  /**
   * Check if migration has been completed
   */
  static isCompleted(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("migration-completed") !== null;
  }

  /**
   * Get migration status
   */
  static getStatus(): {
    completed: boolean;
    timestamp?: string;
    migrated?: { links: number; sparkCodes: number; spend: number };
  } {
    if (typeof window === "undefined") {
      return { completed: false };
    }

    const statusJson = localStorage.getItem("migration-completed");
    if (!statusJson) {
      return { completed: false };
    }

    const status = JSON.parse(statusJson);
    return {
      completed: true,
      timestamp: status.timestamp,
      migrated: status.migrated,
    };
  }

  /**
   * Reset migration status (for testing)
   */
  static reset(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("migration-completed");
    }
  }

  /**
   * Extract slug from white page URL
   */
  private extractSlugFromUrl(url: string): string {
    // Extract slug from URL like "https://domain.com/slug?params"
    const match = url.match(/\/([^/?]+)(\?|$)/);
    return match ? match[1] : url;
  }

  /**
   * Get offer key from offer name
   */
  private getOfferKeyFromName(offerName: string): string {
    // Map common offer names to keys
    const mapping: Record<string, string> = {
      "Apple Pay": "apple",
      "Cash App": "cashapp",
      "Shein": "shein",
      "Venmo": "venmo",
      "Freecash Main": "freecash-main",
      "Freecash Videos": "freecash-videos",
      "Freecash Ads": "freecash-ads",
      "Freecash Games": "freecash-games",
      "Freecash Surveys": "freecash-surveys",
      "Freecash PayPal": "freecash-paypal",
      "Swift Venmo": "swift-venmo",
      "Swift Amazon": "swift-amazon",
    };

    return mapping[offerName] || offerName.toLowerCase().replace(/\s+/g, "-");
  }
}
