import { NextRequest, NextResponse } from "next/server";
import { sparkCodesRepository } from "@/lib/db/repositories/spark-codes";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sparkCode = await sparkCodesRepository.findById(params.id);

    if (!sparkCode) {
      return NextResponse.json(
        { success: false, error: "Spark code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: sparkCode });
  } catch (error) {
    console.error("Failed to fetch spark code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch spark code" },
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
    const sparkCode = await sparkCodesRepository.update(params.id, body);

    if (!sparkCode) {
      return NextResponse.json(
        { success: false, error: "Spark code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: sparkCode });
  } catch (error) {
    console.error("Failed to update spark code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update spark code" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await sparkCodesRepository.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete spark code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete spark code" },
      { status: 500 }
    );
  }
}
