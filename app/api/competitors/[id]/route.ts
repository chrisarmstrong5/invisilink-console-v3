import { NextRequest, NextResponse } from "next/server";
import { competitorAdsRepository } from "@/lib/db/repositories/competitors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ad = await competitorAdsRepository.findById(id);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const ad = await competitorAdsRepository.update(id, body);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await competitorAdsRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete competitor ad:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete competitor ad" },
      { status: 500 }
    );
  }
}
