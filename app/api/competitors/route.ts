import { NextRequest, NextResponse } from "next/server";
import { competitorAdsRepository } from "@/lib/db/repositories/competitors";

export async function GET() {
  try {
    const ads = await competitorAdsRepository.findAll();
    return NextResponse.json({ success: true, data: ads });
  } catch (error) {
    console.error("Failed to fetch competitor ads:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch competitor ads" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle bulk import
    if (body.bulk && Array.isArray(body.ads)) {
      await competitorAdsRepository.bulkInsert(body.ads);
      return NextResponse.json({
        success: true,
        message: `Imported ${body.ads.length} competitor ads`
      });
    }

    // Handle single ad creation
    const ad = await competitorAdsRepository.create(body);
    return NextResponse.json({ success: true, data: ad });
  } catch (error) {
    console.error("Failed to create competitor ad:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create competitor ad" },
      { status: 500 }
    );
  }
}
