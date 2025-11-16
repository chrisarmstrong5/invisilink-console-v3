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

    // Remove comments and split by semicolons properly
    const cleanedSchema = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // Split into CREATE TABLE and CREATE INDEX statements
    const statements: string[] = [];
    let currentStatement = '';

    for (const line of cleanedSchema.split('\n')) {
      currentStatement += line + '\n';

      // Check if we hit a semicolon at the end of a line
      if (line.trim().endsWith(';')) {
        const stmt = currentStatement.trim();
        if (stmt.length > 0) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }

    console.log(`[Migration] Found ${statements.length} SQL statements`);

    // Execute each statement
    let executed = 0;
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty statements
      if (statement.trim().length === 0) continue;

      console.log(`[Migration] Executing statement ${i + 1}/${statements.length}...`);

      try {
        await sql.query(statement);
        executed++;
      } catch (error) {
        // Ignore "already exists" errors (safe to re-run migrations)
        if (
          error instanceof Error &&
          (error.message.includes("already exists") ||
            error.message.includes("duplicate") ||
            error.message.includes("relation") && error.message.includes("already exists"))
        ) {
          console.log(`[Migration] Skipping (already exists): ${statement.substring(0, 50)}...`);
          executed++;
          continue;
        }
        console.error(`[Migration] Failed on statement: ${statement.substring(0, 100)}...`);
        throw error;
      }
    }

    console.log("[Migration] ✅ Migration completed successfully!");

    return {
      success: true,
      message: `Successfully executed ${executed} SQL statements`,
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
