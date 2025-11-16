/**
 * Links Repository
 *
 * Database operations for affiliate links.
 */

import { db } from "../client";
import type { LinkHistoryItem } from "@/lib/config";

export interface Link {
  id: string;
  created_at: Date;
  offer_key: string;
  offer_name: string;
  account_number: string;
  domain_id: string;
  slug: string;
  tracking_url: string;
  white_page_url: string;
  campaign_name: string;
  template_name?: string;
  spark_code_id?: string;
  platform: "tiktok" | "facebook";
  custom_url?: string;
  filter_type: string;
  disable_cloaking: boolean;
  geo_enabled: boolean;
  geo_countries?: string[];
  tiktok_pixel_enabled: boolean;
  tiktok_pixel_id?: string;
  tiktok_browser_redirect: boolean;
  tiktok_strict_bot: boolean;
  facebook_pixel_id?: string;
  facebook_app_id?: string;
  facebook_tracking_mode?: "direct" | "redirect";
  is_killed: boolean;
  killed_at?: Date;
  kill_reason?: string;
}

export const linksRepository = {
  /**
   * Create a new link
   */
  async create(link: Omit<Link, "created_at">): Promise<Link> {
    const result = await db.queryOne<Link>(
      `
      INSERT INTO links (
        id, offer_key, offer_name, account_number, domain_id, slug,
        tracking_url, white_page_url, campaign_name, template_name,
        spark_code_id, platform, custom_url, filter_type, disable_cloaking,
        geo_enabled, geo_countries, tiktok_pixel_enabled, tiktok_pixel_id,
        tiktok_browser_redirect, tiktok_strict_bot, facebook_pixel_id,
        facebook_app_id, facebook_tracking_mode, is_killed
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25
      )
      RETURNING *
    `,
      [
        link.id,
        link.offer_key,
        link.offer_name,
        link.account_number,
        link.domain_id,
        link.slug,
        link.tracking_url,
        link.white_page_url,
        link.campaign_name,
        link.template_name || null,
        link.spark_code_id || null,
        link.platform,
        link.custom_url || null,
        link.filter_type,
        link.disable_cloaking,
        link.geo_enabled,
        link.geo_countries || null,
        link.tiktok_pixel_enabled,
        link.tiktok_pixel_id || null,
        link.tiktok_browser_redirect,
        link.tiktok_strict_bot,
        link.facebook_pixel_id || null,
        link.facebook_app_id || null,
        link.facebook_tracking_mode || null,
        link.is_killed,
      ]
    );

    if (!result) {
      throw new Error("Failed to create link");
    }

    return result;
  },

  /**
   * Get all links
   */
  async findAll(filters?: {
    platform?: "tiktok" | "facebook";
    isKilled?: boolean;
    limit?: number;
  }): Promise<Link[]> {
    let query = "SELECT * FROM links WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.platform) {
      query += ` AND platform = $${paramIndex}`;
      params.push(filters.platform);
      paramIndex++;
    }

    if (filters?.isKilled !== undefined) {
      query += ` AND is_killed = $${paramIndex}`;
      params.push(filters.isKilled);
      paramIndex++;
    }

    query += " ORDER BY created_at DESC";

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
    }

    const result = await db.query<Link>(query, params);
    return result.rows;
  },

  /**
   * Get link by slug
   */
  async findBySlug(slug: string): Promise<Link | null> {
    return await db.queryOne<Link>(
      "SELECT * FROM links WHERE slug = $1",
      [slug]
    );
  },

  /**
   * Get link by ID
   */
  async findById(id: string): Promise<Link | null> {
    return await db.queryOne<Link>(
      "SELECT * FROM links WHERE id = $1",
      [id]
    );
  },

  /**
   * Get active accounts (accounts with links in last N days)
   */
  async getActiveAccounts(days: number = 7): Promise<string[]> {
    const result = await db.query<{ account_number: string }>(
      `
      SELECT DISTINCT account_number
      FROM links
      WHERE created_at >= NOW() - INTERVAL '${days} days'
        AND is_killed = false
      ORDER BY account_number
    `
    );

    return result.rows.map((r) => r.account_number);
  },

  /**
   * Kill a link
   */
  async kill(slug: string, reason?: string): Promise<void> {
    await db.query(
      `
      UPDATE links
      SET is_killed = true,
          killed_at = NOW(),
          kill_reason = $2
      WHERE slug = $1
    `,
      [slug, reason || null]
    );
  },

  /**
   * Restore a killed link
   */
  async restore(slug: string): Promise<void> {
    await db.query(
      `
      UPDATE links
      SET is_killed = false,
          killed_at = NULL,
          kill_reason = NULL
      WHERE slug = $1
    `,
      [slug]
    );
  },

  /**
   * Bulk insert links (for migration)
   */
  async bulkInsert(links: Omit<Link, "created_at">[]): Promise<number> {
    if (links.length === 0) return 0;

    let inserted = 0;

    for (const link of links) {
      try {
        await this.create(link);
        inserted++;
      } catch (error) {
        // Skip duplicates
        if (error instanceof Error && error.message.includes("duplicate")) {
          console.log(`[Links] Skipping duplicate: ${link.slug}`);
          continue;
        }
        throw error;
      }
    }

    return inserted;
  },

  /**
   * Delete old links (for cleanup)
   */
  async deleteOlderThan(days: number): Promise<number> {
    const result = await db.query(
      `
      DELETE FROM links
      WHERE created_at < NOW() - INTERVAL '${days} days'
        AND is_killed = true
      RETURNING id
    `
    );

    return result.rowCount;
  },
};
