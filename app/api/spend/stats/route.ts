import { NextRequest, NextResponse } from "next/server";
import { spendRepository } from "@/lib/db/repositories/spend";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today";

    let total = 0;
    const today = new Date();

    switch (period) {
      case "today":
        total = await spendRepository.getTodayTotal();
        break;

      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const yesterdayData = await spendRepository.getByDateRange({
          from: new Date(yesterdayStr),
          to: new Date(yesterdayStr),
        });
        total = yesterdayData.reduce((sum, d) => sum + d.amount, 0);
        break;

      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const weekData = await spendRepository.getByDateRange({
          from: weekAgo,
          to: today,
        });
        total = weekData.reduce((sum, d) => sum + d.amount, 0);
        break;

      case "month":
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);

        const monthData = await spendRepository.getByDateRange({
          from: monthAgo,
          to: today,
        });
        total = monthData.reduce((sum, d) => sum + d.amount, 0);
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid period" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      total,
      period,
    });
  } catch (error) {
    console.error("Failed to fetch spend stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch spend stats" },
      { status: 500 }
    );
  }
}
