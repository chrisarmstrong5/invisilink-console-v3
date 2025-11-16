import { NextRequest, NextResponse } from "next/server";
import { sparkCodesRepository } from "@/lib/db/repositories/spark-codes";
import { objectToSnakeCase, objectToCamelCase } from "@/lib/utils/case-transform";

export async function GET() {
  try {
    const sparkCodes = await sparkCodesRepository.findAll();
    // Transform from snake_case to camelCase for frontend
    const camelCasedData = sparkCodes.map((sc) => objectToCamelCase(sc));
    return NextResponse.json({ success: true, data: camelCasedData });
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
      const snakeCasedCodes = body.sparkCodes.map((sc: any) => objectToSnakeCase(sc));
      await sparkCodesRepository.bulkInsert(snakeCasedCodes);
      return NextResponse.json({
        success: true,
        message: `Imported ${body.sparkCodes.length} spark codes`
      });
    }

    // Handle single spark code creation - transform to snake_case
    const snakeCasedBody = objectToSnakeCase(body) as any;
    const sparkCode = await sparkCodesRepository.create(snakeCasedBody);
    // Transform back to camelCase for response
    const camelCasedData = objectToCamelCase(sparkCode);
    return NextResponse.json({ success: true, data: camelCasedData });
  } catch (error) {
    console.error("Failed to create spark code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create spark code" },
      { status: 500 }
    );
  }
}
