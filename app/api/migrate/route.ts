import { NextResponse } from "next/server";
import { runMigrations } from "@/lib/db/migrate";

/**
 * API endpoint to run database migrations
 * Call this once after deploying to initialize the database schema
 * Safe to run multiple times (uses CREATE TABLE IF NOT EXISTS)
 */
export async function POST() {
  try {
    const result = await runMigrations();

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Migration failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
