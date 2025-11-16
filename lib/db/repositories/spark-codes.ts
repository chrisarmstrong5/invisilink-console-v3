/**
 * Spark Codes Repository
 *
 * Database operations for spark codes (creator/ad attribution).
 */

import { db } from "../client";
import type { SparkCode } from "@/lib/config";

export interface SparkCodeRecord {
  id: string;
  name: string;
  spark_code: string;
  video_url?: string;
  platform: string;
  offer_code: string;
  created_at: Date;
  content_type?: string;
  media_urls?: string[];
  tags?: string[];
}

export const sparkCodesRepository = {
  /**
   * Create a new spark code
   */
  async create(sparkCode: Omit<SparkCodeRecord, "created_at">): Promise<SparkCodeRecord> {
    const result = await db.queryOne<SparkCodeRecord>(
      `
      INSERT INTO spark_codes (
        id, name, spark_code, video_url, platform, offer_code,
        content_type, media_urls, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        sparkCode.id,
        sparkCode.name,
        sparkCode.spark_code,
        sparkCode.video_url || null,
        sparkCode.platform,
        sparkCode.offer_code,
        sparkCode.content_type || null,
        sparkCode.media_urls || null,
        sparkCode.tags || null,
      ]
    );

    if (!result) {
      throw new Error("Failed to create spark code");
    }

    return result;
  },

  /**
   * Get all spark codes
   */
  async findAll(platform?: "tiktok" | "facebook"): Promise<SparkCodeRecord[]> {
    const query = platform
      ? "SELECT * FROM spark_codes WHERE platform = $1 ORDER BY created_at DESC"
      : "SELECT * FROM spark_codes ORDER BY created_at DESC";

    const params = platform ? [platform] : [];
    const result = await db.query<SparkCodeRecord>(query, params);
    return result.rows;
  },

  /**
   * Get spark code by ID
   */
  async findById(id: string): Promise<SparkCodeRecord | null> {
    return await db.queryOne<SparkCodeRecord>(
      "SELECT * FROM spark_codes WHERE id = $1",
      [id]
    );
  },

  /**
   * Update spark code
   */
  async update(id: string, updates: Partial<SparkCodeRecord>): Promise<SparkCodeRecord | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.spark_code !== undefined) {
      fields.push(`spark_code = $${paramIndex++}`);
      values.push(updates.spark_code);
    }
    if (updates.video_url !== undefined) {
      fields.push(`video_url = $${paramIndex++}`);
      values.push(updates.video_url);
    }
    if (updates.content_type !== undefined) {
      fields.push(`content_type = $${paramIndex++}`);
      values.push(updates.content_type);
    }
    if (updates.media_urls !== undefined) {
      fields.push(`media_urls = $${paramIndex++}`);
      values.push(updates.media_urls);
    }
    if (updates.tags !== undefined) {
      fields.push(`tags = $${paramIndex++}`);
      values.push(updates.tags);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    values.push(id);

    return await db.queryOne<SparkCodeRecord>(
      `UPDATE spark_codes SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
  },

  /**
   * Delete spark code
   */
  async delete(id: string): Promise<void> {
    await db.query("DELETE FROM spark_codes WHERE id = $1", [id]);
  },

  /**
   * Bulk insert spark codes (for migration)
   */
  async bulkInsert(sparkCodes: Omit<SparkCodeRecord, "created_at">[]): Promise<number> {
    if (sparkCodes.length === 0) return 0;

    let inserted = 0;

    for (const sc of sparkCodes) {
      try {
        await this.create(sc);
        inserted++;
      } catch (error) {
        // Skip duplicates
        if (error instanceof Error && error.message.includes("duplicate")) {
          console.log(`[SparkCodes] Skipping duplicate: ${sc.id}`);
          continue;
        }
        throw error;
      }
    }

    return inserted;
  },

  /**
   * Get spark codes by offer
   */
  async findByOffer(offerCode: string): Promise<SparkCodeRecord[]> {
    const result = await db.query<SparkCodeRecord>(
      "SELECT * FROM spark_codes WHERE offer_code = $1 ORDER BY created_at DESC",
      [offerCode]
    );
    return result.rows;
  },

  /**
   * Search spark codes by tag
   */
  async findByTag(tag: string): Promise<SparkCodeRecord[]> {
    const result = await db.query<SparkCodeRecord>(
      "SELECT * FROM spark_codes WHERE $1 = ANY(tags) ORDER BY created_at DESC",
      [tag]
    );
    return result.rows;
  },
};
