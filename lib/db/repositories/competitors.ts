import { db } from "@/lib/db/client";

export interface CompetitorAdInput {
  id?: string;
  creatorName: string;
  platform: string;
  contentType: string;
  mediaUrls: string[];
  adContent?: string;
  sparkCode?: string;
  productName?: string;
  productLink?: string;
  capturedDate?: Date;
  tags?: string[];
}

export interface CompetitorAdRecord extends CompetitorAdInput {
  id: string;
  createdAt: Date;
}

export const competitorAdsRepository = {
  async create(input: CompetitorAdInput): Promise<CompetitorAdRecord> {
    const id = input.id || `CA${Date.now()}`;
    const now = new Date();

    const result = await db.queryOne<CompetitorAdRecord>(
      `INSERT INTO competitor_ads (
        id, creator_name, platform, content_type, media_urls,
        ad_content, spark_code, product_name, product_link,
        captured_date, tags, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        id,
        input.creatorName,
        input.platform,
        input.contentType,
        input.mediaUrls,
        input.adContent,
        input.sparkCode,
        input.productName,
        input.productLink,
        input.capturedDate || now,
        input.tags,
        now,
      ]
    );

    return result!;
  },

  async findAll(): Promise<CompetitorAdRecord[]> {
    const result = await db.query<CompetitorAdRecord>(
      `SELECT * FROM competitor_ads ORDER BY captured_date DESC`
    );
    return result.rows;
  },

  async findById(id: string): Promise<CompetitorAdRecord | null> {
    return await db.queryOne<CompetitorAdRecord>(
      `SELECT * FROM competitor_ads WHERE id = $1`,
      [id]
    );
  },

  async update(
    id: string,
    input: Partial<CompetitorAdInput>
  ): Promise<CompetitorAdRecord | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);

    return await db.queryOne<CompetitorAdRecord>(
      `UPDATE competitor_ads SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    await db.query(`DELETE FROM competitor_ads WHERE id = $1`, [id]);
  },

  async bulkInsert(ads: CompetitorAdInput[]): Promise<void> {
    const now = new Date();

    for (const ad of ads) {
      const id = ad.id || `CA${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await db.query(
        `INSERT INTO competitor_ads (
          id, creator_name, platform, content_type, media_urls,
          ad_content, spark_code, product_name, product_link,
          captured_date, tags, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          ad.creatorName,
          ad.platform,
          ad.contentType,
          ad.mediaUrls,
          ad.adContent,
          ad.sparkCode,
          ad.productName,
          ad.productLink,
          ad.capturedDate || now,
          ad.tags,
          now,
        ]
      );
    }
  },
};
