/**
 * Link Performance API Endpoint
 *
 * GET /api/performance?days=7
 * Returns link performance metrics with ROI calculations
 */

import { NextResponse } from "next/server";
import { dashboardService } from "@/lib/services/dashboard-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days") === "30" ? 30 : 7;

    console.log(`[Performance API] Fetching ${days} day performance data...`);

    const links = await dashboardService.getLinkPerformance(days);

    console.log(`[Performance API] ✅ Loaded ${links.length} links`);

    return NextResponse.json({
      success: true,
      links,
      days,
    });
  } catch (error) {
    console.error("[Performance API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
