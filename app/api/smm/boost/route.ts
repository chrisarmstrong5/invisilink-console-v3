/**
 * SMM Panel Engagement Boost API
 *
 * Endpoint for boosting engagement on TikTok videos via SMM panel.
 * Called when user clicks "Quick Add Engagement" button on spark codes.
 */

import { NextResponse } from "next/server";
import { smmPanelApi } from "@/lib/api/smm-panel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tiktokLink, likes, saves, views } = body;

    // Validation
    if (!tiktokLink || !tiktokLink.includes("tiktok.com")) {
      return NextResponse.json(
        { error: "Invalid TikTok link" },
        { status: 400 }
      );
    }

    if (!likes && !saves && !views) {
      return NextResponse.json(
        { error: "At least one engagement metric (likes, saves, or views) is required" },
        { status: 400 }
      );
    }

    console.log("[SMM Boost] Boosting engagement:", {
      link: tiktokLink,
      likes,
      saves,
      views,
    });

    // Place orders
    const result = await smmPanelApi.boostEngagement(
      tiktokLink,
      likes || 0,
      saves || 0,
      views || 0
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully placed ${result.orders.length} order(s)`,
        orders: result.orders,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Some orders failed",
          orders: result.orders,
          errors: result.errors,
        },
        { status: 207 } // Multi-Status (some succeeded, some failed)
      );
    }
  } catch (error) {
    console.error("[SMM Boost] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to boost engagement",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
