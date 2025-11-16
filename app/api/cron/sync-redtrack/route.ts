/**
 * RedTrack Auto-Sync Cron Endpoint
 *
 * Called by Vercel Cron every 30 minutes to sync RedTrack metrics to database.
 * Can also be triggered manually from dashboard.
 */

import { NextResponse } from "next/server";
import { redtrackSync } from "@/lib/services/redtrack-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log("[Cron] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting RedTrack sync...");

    const result = await redtrackSync.syncAll();

    if (result.success) {
      console.log(`[Cron] ✅ Sync complete: ${result.synced.total} metrics synced`);
      return NextResponse.json({
        success: true,
        synced: result.synced,
        timestamp: result.timestamp,
        duration: result.duration,
      });
    } else {
      console.error(`[Cron] ⚠️ Sync completed with errors:`, result.errors);
      return NextResponse.json(
        {
          success: false,
          synced: result.synced,
          errors: result.errors,
          timestamp: result.timestamp,
          duration: result.duration,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Cron] ❌ Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request);
}
