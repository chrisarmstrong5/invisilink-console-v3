/**
 * Database Migration API Endpoint
 *
 * POST /api/db/migrate - Run database migrations
 *
 * This endpoint allows running migrations from the browser during initial setup.
 * In production, you should protect this with authentication or disable it.
 */

import { NextResponse } from "next/server";
import { runMigrations } from "@/lib/db/migrate";

export async function POST(request: Request) {
  try {
    // In production, you might want to check an auth header here
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log("[API] Running database migrations...");

    const result = await runMigrations();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[API] Migration endpoint error:", error);
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
    message: "Use POST to run migrations",
    endpoint: "/api/db/migrate",
  });
}
