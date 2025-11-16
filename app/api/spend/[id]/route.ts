import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.query("DELETE FROM spend_tracking WHERE id = $1", [params.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete spend record:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete spend record" },
      { status: 500 }
    );
  }
}
