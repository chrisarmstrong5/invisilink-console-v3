import { NextRequest, NextResponse } from "next/server";
import { competitorAdsRepository } from "@/lib/db/repositories/competitors";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ad = await competitorAdsRepository.findById(params.id);

    if (!ad) {
      return NextResponse.json(
        { success: false, error: "Competitor ad not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: ad });
  } catch (error) {
    console.error("Failed to fetch competitor ad:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch competitor ad" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const ad = await competitorAdsRepository.update(params.id, body);

    if (!ad) {
      return NextResponse.json(
        { success: false, error: "Competitor ad not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: ad });
  } catch (error) {
    console.error("Failed to update competitor ad:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update competitor ad" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await competitorAdsRepository.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete competitor ad:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete competitor ad" },
      { status: 500 }
    );
  }
}
