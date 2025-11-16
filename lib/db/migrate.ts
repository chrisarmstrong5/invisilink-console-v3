/**
 * Database Migration Runner
 *
 * Run this script to initialize or update the database schema.
 * Safe to run multiple times (uses CREATE TABLE IF NOT EXISTS).
 */

import { sql } from "@vercel/postgres";
import * as fs from "fs";
import * as path from "path";

export async function runMigrations(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    console.log("[Migration] Starting database migration...");

    // Read schema file
    const schemaPath = path.join(process.cwd(), "lib/db/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    // Split into individual statements (separated by semicolons)
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`[Migration] Found ${statements.length} SQL statements`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[Migration] Executing statement ${i + 1}/${statements.length}...`);

      try {
        await sql.query(statement);
      } catch (error) {
        // Ignore "already exists" errors (safe to re-run migrations)
        if (
          error instanceof Error &&
          (error.message.includes("already exists") ||
            error.message.includes("duplicate"))
        ) {
          console.log(`[Migration] Skipping (already exists): ${statement.substring(0, 50)}...`);
          continue;
        }
        throw error;
      }
    }

    console.log("[Migration] ✅ Migration completed successfully!");

    return {
      success: true,
      message: `Successfully executed ${statements.length} SQL statements`,
    };
  } catch (error) {
    console.error("[Migration] ❌ Migration failed:", error);
    return {
      success: false,
      message: "Migration failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Allow running directly with ts-node or tsx
if (require.main === module) {
  runMigrations()
    .then((result) => {
      console.log(result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}
