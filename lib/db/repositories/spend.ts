/**
 * Spend Tracking Repository
 *
 * Database operations for spend tracking (CSV imports and manual entries).
 */

import { db } from "../client";

export interface SpendRecord {
  id: number;
  source_type: "link" | "account" | "campaign";
  source_id: string;
  date: Date;
  amount: number;
  platform: "tiktok" | "facebook";
  account_id?: string;
  campaign_name?: string;
  import_method?: "manual" | "csv";
  notes?: string;
  created_at: Date;
}

export const spendRepository = {
  /**
   * Upsert spend (insert or update)
   */
  async upsert(spend: Omit<SpendRecord, "id" | "created_at">): Promise<SpendRecord> {
    const result = await db.queryOne<SpendRecord>(
      `
      INSERT INTO spend_tracking (
        source_type, source_id, date, amount, platform,
        account_id, campaign_name, import_method, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (source_type, source_id, date, platform)
      DO UPDATE SET
        amount = EXCLUDED.amount,
        account_id = EXCLUDED.account_id,
        campaign_name = EXCLUDED.campaign_name,
        import_method = EXCLUDED.import_method,
        notes = EXCLUDED.notes
      RETURNING *
    `,
      [
        spend.source_type,
        spend.source_id,
        spend.date,
        spend.amount,
        spend.platform,
        spend.account_id || null,
        spend.campaign_name || null,
        spend.import_method || null,
        spend.notes || null,
      ]
    );

    if (!result) {
      throw new Error("Failed to upsert spend");
    }

    return result;
  },

  /**
   * Get spend for a specific source
   */
  async findBySource(
    sourceType: string,
    sourceId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<SpendRecord[]> {
    let query = `
      SELECT * FROM spend_tracking
      WHERE source_type = $1 AND source_id = $2
    `;
    const params: any[] = [sourceType, sourceId];

    if (dateRange) {
      query += " AND date >= $3 AND date <= $4";
      params.push(dateRange.from, dateRange.to);
    }

    query += " ORDER BY date DESC";

    const result = await db.query<SpendRecord>(query, params);
    return result.rows;
  },

  /**
   * Get total spend for a source
   */
  async getTotalSpend(
    sourceType: string,
    sourceId: string,
    dateRange: { from: Date; to: Date }
  ): Promise<number> {
    const result = await db.queryOne<{ total: string }>(
      `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM spend_tracking
      WHERE source_type = $1
        AND source_id = $2
        AND date >= $3
        AND date <= $4
    `,
      [sourceType, sourceId, dateRange.from, dateRange.to]
    );

    return parseFloat(result?.total || "0");
  },

  /**
   * Get yesterday's spend for all accounts (for pre-filling)
   */
  async getYesterday(): Promise<Record<string, number>> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];

    const result = await db.query<{ source_id: string; amount: string }>(
      `
      SELECT source_id, amount
      FROM spend_tracking
      WHERE date = $1 AND source_type = 'account'
    `,
      [dateStr]
    );

    const spend: Record<string, number> = {};
    for (const row of result.rows) {
      spend[row.source_id] = parseFloat(row.amount);
    }

    return spend;
  },

  /**
   * Get today's total spend
   */
  async getTodayTotal(platform?: "tiktok" | "facebook"): Promise<number> {
    const today = new Date().toISOString().split("T")[0];

    let query = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM spend_tracking
      WHERE date = $1
    `;
    const params: any[] = [today];

    if (platform) {
      query += " AND platform = $2";
      params.push(platform);
    }

    const result = await db.queryOne<{ total: string }>(query, params);
    return parseFloat(result?.total || "0");
  },

  /**
   * Bulk insert spend records (for CSV import)
   */
  async bulkUpsert(spends: Omit<SpendRecord, "id" | "created_at">[]): Promise<number> {
    if (spends.length === 0) return 0;

    let upserted = 0;

    for (const spend of spends) {
      try {
        await this.upsert(spend);
        upserted++;
      } catch (error) {
        console.error("[Spend] Failed to upsert spend:", error);
      }
    }

    return upserted;
  },

  /**
   * Get spend by date range (for charts)
   */
  async getByDateRange(
    dateRange: { from: Date; to: Date },
    platform?: "tiktok" | "facebook"
  ): Promise<{ date: string; amount: number }[]> {
    let query = `
      SELECT
        date::text as date,
        SUM(amount) as amount
      FROM spend_tracking
      WHERE date >= $1 AND date <= $2
    `;
    const params: any[] = [dateRange.from, dateRange.to];

    if (platform) {
      query += " AND platform = $3";
      params.push(platform);
    }

    query += " GROUP BY date ORDER BY date DESC";

    const result = await db.query<{ date: string; amount: string }>(query, params);

    return result.rows.map((row) => ({
      date: row.date,
      amount: parseFloat(row.amount),
    }));
  },

  /**
   * Get spend per account (for comparison)
   */
  async getPerAccount(
    dateRange: { from: Date; to: Date },
    platform?: "tiktok" | "facebook"
  ): Promise<{ account: string; spend: number }[]> {
    let query = `
      SELECT
        source_id as account,
        SUM(amount) as spend
      FROM spend_tracking
      WHERE source_type = 'account'
        AND date >= $1
        AND date <= $2
    `;
    const params: any[] = [dateRange.from, dateRange.to];

    if (platform) {
      query += " AND platform = $3";
      params.push(platform);
    }

    query += " GROUP BY source_id ORDER BY spend DESC";

    const result = await db.query<{ account: string; spend: string }>(query, params);

    return result.rows.map((row) => ({
      account: row.account,
      spend: parseFloat(row.spend),
    }));
  },

  /**
   * Delete spend records
   */
  async delete(
    sourceType: string,
    sourceId: string,
    date: Date
  ): Promise<void> {
    await db.query(
      `
      DELETE FROM spend_tracking
      WHERE source_type = $1
        AND source_id = $2
        AND date = $3
    `,
      [sourceType, sourceId, date]
    );
  },

  /**
   * Delete old spend records (for cleanup)
   */
  async deleteOlderThan(days: number): Promise<number> {
    const result = await db.query(
      `
      DELETE FROM spend_tracking
      WHERE date < CURRENT_DATE - INTERVAL '${days} days'
      RETURNING id
    `
    );

    return result.rowCount;
  },
};
