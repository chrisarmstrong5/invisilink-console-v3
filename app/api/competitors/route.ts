import { NextRequest, NextResponse } from "next/server";
import { competitorAdsRepository } from "@/lib/db/repositories/competitors";
import { objectToSnakeCase, objectToCamelCase } from "@/lib/utils/case-transform";

export async function GET() {
  try {
    const ads = await competitorAdsRepository.findAll();
    const camelCasedData = ads.map((ad) => objectToCamelCase(ad));
    return NextResponse.json({ success: true, data: camelCasedData });
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
    const camelCasedData = objectToCamelCase(ad);
    return NextResponse.json({ success: true, data: camelCasedData });
  } catch (error) {
    console.error("Failed to create competitor ad:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create competitor ad" },
      { status: 500 }
    );
  }
}
