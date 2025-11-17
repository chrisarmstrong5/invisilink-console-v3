/**
 * Database Reset Endpoint
 *
 * WARNING: This endpoint drops ALL tables in the database.
 * Only use this in development or when you want a completely fresh start.
 *
 * Usage:
 * POST /api/db/reset
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export async function POST() {
  try {
    console.log("[DB Reset] Starting database reset...");

    // Drop all tables in reverse order of dependencies
    const dropStatements = [
      // Drop tables in order (reverse of creation to handle foreign keys)
      "DROP TABLE IF EXISTS metrics_cache CASCADE",
      "DROP TABLE IF EXISTS competitor_ads CASCADE",
      "DROP TABLE IF EXISTS boost_history CASCADE",
      "DROP TABLE IF EXISTS spend_tracking CASCADE",
      "DROP TABLE IF EXISTS spark_codes CASCADE",
      "DROP TABLE IF EXISTS links CASCADE",
    ];

    let droppedCount = 0;
    const droppedTables: string[] = [];

    for (const statement of dropStatements) {
      try {
        await db.query(statement);
        const tableName = statement.match(/DROP TABLE IF EXISTS (\w+)/)?.[1];
        if (tableName) {
          droppedTables.push(tableName);
          droppedCount++;
          console.log(`[DB Reset] ✓ Dropped table: ${tableName}`);
        }
      } catch (error) {
        console.error(`[DB Reset] Error dropping table:`, error);
        // Continue even if drop fails (table might not exist)
      }
    }

    console.log(`[DB Reset] ✓ Reset complete. Dropped ${droppedCount} tables`);

    return NextResponse.json({
      success: true,
      message: `Database reset complete. Dropped ${droppedCount} tables.`,
      droppedTables,
      nextSteps: [
        "Run POST /api/db/migrate to recreate all tables",
        "Your database is now completely clean"
      ]
    });
  } catch (error) {
    console.error("[DB Reset] Error during reset:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to reset the database (drop all tables)",
    warning: "This will DELETE ALL DATA. Only use in development.",
    endpoint: "/api/db/reset",
    method: "POST"
  });
}
