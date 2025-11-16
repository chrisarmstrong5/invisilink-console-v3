import { NextRequest, NextResponse } from "next/server";
import { spendRepository } from "@/lib/db/repositories/spend";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);

    // Get data for both platforms
    const [tiktokData, facebookData] = await Promise.all([
      spendRepository.getByDateRange(
        { from: startDate, to: today },
        "tiktok"
      ),
      spendRepository.getByDateRange(
        { from: startDate, to: today },
        "facebook"
      ),
    ]);

    // Create a map of all dates in range
    const dateMap: Record<string, { tiktok: number; facebook: number; total: number }> = {};

    // Fill in all dates (even if no spend)
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      dateMap[dateStr] = { tiktok: 0, facebook: 0, total: 0 };
    }

    // Add TikTok data
    tiktokData.forEach((record) => {
      if (dateMap[record.date]) {
        dateMap[record.date].tiktok = record.amount;
        dateMap[record.date].total += record.amount;
      }
    });

    // Add Facebook data
    facebookData.forEach((record) => {
      if (dateMap[record.date]) {
        dateMap[record.date].facebook = record.amount;
        dateMap[record.date].total += record.amount;
      }
    });

    // Convert to array and sort by date
    const chartData = Object.entries(dateMap)
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error("Failed to fetch chart data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch chart data" },
      { status: 500 }
    );
  }
}
