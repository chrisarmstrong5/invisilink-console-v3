import { NextRequest, NextResponse } from "next/server";
import { boostHistoryRepository } from "@/lib/db/repositories/boost-history";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const boost = await boostHistoryRepository.findById(params.id);

    if (!boost) {
      return NextResponse.json(
        { success: false, error: "Boost history not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: boost });
  } catch (error) {
    console.error("Failed to fetch boost history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch boost history" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await boostHistoryRepository.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete boost history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete boost history" },
      { status: 500 }
    );
  }
}
