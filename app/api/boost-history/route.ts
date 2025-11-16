import { NextRequest, NextResponse } from "next/server";
import { boostHistoryRepository } from "@/lib/db/repositories/boost-history";

export async function GET() {
  try {
    const history = await boostHistoryRepository.findAll();
    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error("Failed to fetch boost history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch boost history" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const boost = await boostHistoryRepository.create(body);
    return NextResponse.json({ success: true, data: boost });
  } catch (error) {
    console.error("Failed to create boost history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create boost history" },
      { status: 500 }
    );
  }
}
