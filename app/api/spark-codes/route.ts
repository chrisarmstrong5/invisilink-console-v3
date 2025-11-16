import { NextRequest, NextResponse } from "next/server";
import { sparkCodesRepository } from "@/lib/db/repositories/spark-codes";

export async function GET() {
  try {
    const sparkCodes = await sparkCodesRepository.findAll();
    return NextResponse.json({ success: true, data: sparkCodes });
  } catch (error) {
    console.error("Failed to fetch spark codes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch spark codes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle bulk import
    if (body.bulk && Array.isArray(body.sparkCodes)) {
      await sparkCodesRepository.bulkInsert(body.sparkCodes);
      return NextResponse.json({
        success: true,
        message: `Imported ${body.sparkCodes.length} spark codes`
      });
    }

    // Handle single spark code creation
    const sparkCode = await sparkCodesRepository.create(body);
    return NextResponse.json({ success: true, data: sparkCode });
  } catch (error) {
    console.error("Failed to create spark code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create spark code" },
      { status: 500 }
    );
  }
}
