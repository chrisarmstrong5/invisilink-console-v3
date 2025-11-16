import { NextRequest, NextResponse } from "next/server";
import { sparkCodesRepository } from "@/lib/db/repositories/spark-codes";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sparkCode = await sparkCodesRepository.findById(id);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const sparkCode = await sparkCodesRepository.update(id, body);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await sparkCodesRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete spark code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete spark code" },
      { status: 500 }
    );
  }
}
