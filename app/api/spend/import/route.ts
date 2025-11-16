/**
 * CSV Spend Import API Endpoint
 *
 * POST /api/spend/import
 * Accepts CSV file content and imports spend data to database
 */

import { NextResponse } from "next/server";
import { csvParser } from "@/lib/services/csv-parser";
import { spendRepository } from "@/lib/db/repositories";

export async function POST(request: Request) {
  try {
    const { csvContent } = await request.json();

    if (!csvContent) {
      return NextResponse.json(
        { error: "No CSV content provided" },
        { status: 400 }
      );
    }

    console.log("[Spend Import] Parsing CSV...");

    // Parse CSV
    const parseResult = await csvParser.parse(csvContent);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse CSV",
          errors: parseResult.errors,
        },
        { status: 400 }
      );
    }

    console.log(`[Spend Import] Parsed ${parseResult.records.length} records`);
    console.log(`[Spend Import] Total spend: $${parseResult.totalSpend.toFixed(2)}`);
    console.log(`[Spend Import] Detected format: ${parseResult.detectedFormat}`);

    // Import to database
    const spendRecords = parseResult.records.map((record) => ({
      source_type: "account" as const,
      source_id: record.account || "unknown",
      date: new Date(record.date),
      amount: record.spend,
      platform: record.platform,
      campaign_name: record.campaignName,
      import_method: "csv" as const,
    }));

    const imported = await spendRepository.bulkUpsert(spendRecords);

    console.log(`[Spend Import] ✅ Imported ${imported} records to database`);

    return NextResponse.json({
      success: true,
      imported,
      totalSpend: parseResult.totalSpend,
      detectedFormat: parseResult.detectedFormat,
      preview: parseResult.records.slice(0, 5), // Show first 5 for preview
    });
  } catch (error) {
    console.error("[Spend Import] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
