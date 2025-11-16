import { db } from "@/lib/db/client";

export interface BoostHistoryInput {
  id?: string;
  tiktokLink: string;
  likes: number;
  saves: number;
  views?: number;
  orderIds: number[];
  cost?: number;
}

export interface BoostHistoryRecord extends BoostHistoryInput {
  id: string;
  date: Date;
}

export const boostHistoryRepository = {
  async create(input: BoostHistoryInput): Promise<BoostHistoryRecord> {
    const id = input.id || `BOOST${Date.now()}`;
    const now = new Date();

    const result = await db.queryOne<BoostHistoryRecord>(
      `INSERT INTO boost_history (
        id, tiktok_link, likes, saves, views, order_ids, cost, date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        id,
        input.tiktokLink,
        input.likes,
        input.saves,
        input.views,
        input.orderIds,
        input.cost,
        now,
      ]
    );

    return result!;
  },

  async findAll(): Promise<BoostHistoryRecord[]> {
    const result = await db.query<BoostHistoryRecord>(
      `SELECT * FROM boost_history ORDER BY date DESC`
    );
    return result.rows;
  },

  async findById(id: string): Promise<BoostHistoryRecord | null> {
    return await db.queryOne<BoostHistoryRecord>(
      `SELECT * FROM boost_history WHERE id = $1`,
      [id]
    );
  },

  async delete(id: string): Promise<void> {
    await db.query(`DELETE FROM boost_history WHERE id = $1`, [id]);
  },
};
