import { NextRequest, NextResponse } from "next/server";
import { spendRepository } from "@/lib/db/repositories/spend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, accountId, platform, amount, campaignName, notes } = body;

    // Validation
    if (!date || !accountId || !platform || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Create spend record
    await spendRepository.upsert({
      sourceType: "account",
      sourceId: accountId,
      date,
      amount,
      platform,
      accountId,
      campaignName,
      importMethod: "manual",
      notes,
    });

    return NextResponse.json({
      success: true,
      message: "Spend record added successfully",
    });
  } catch (error) {
    console.error("Failed to add spend record:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add spend record" },
      { status: 500 }
    );
  }
}
