import { NextRequest, NextResponse } from "next/server";
import { boostHistoryRepository } from "@/lib/db/repositories/boost-history";
import { objectToSnakeCase, objectToCamelCase } from "@/lib/utils/case-transform";

export async function GET() {
  try {
    const history = await boostHistoryRepository.findAll();
    const camelCasedData = history.map((h) => objectToCamelCase(h));
    return NextResponse.json({ success: true, data: camelCasedData });
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
    const snakeCasedBody = objectToSnakeCase(body) as any;
    const boost = await boostHistoryRepository.create(snakeCasedBody);
    const camelCasedData = objectToCamelCase(boost);
    return NextResponse.json({ success: true, data: camelCasedData });
  } catch (error) {
    console.error("Failed to create boost history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create boost history" },
      { status: 500 }
    );
  }
}
