import { NextRequest, NextResponse} from "next/server";
import { db } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const result = await db.query(
      `SELECT
        id,
        date::text as date,
        source_id as "accountId",
        platform,
        amount,
        campaign_name as "campaignName",
        notes
      FROM spend_tracking
      ORDER BY date DESC, created_at DESC
      LIMIT $1`,
      [limit]
    );

    return NextResponse.json({
      success: true,
      records: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch spend records:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch spend records" },
      { status: 500 }
    );
  }
}
