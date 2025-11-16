"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Database, CheckCircle2, AlertTriangle } from "lucide-react";
import { MigrationService } from "@/lib/db/migration-service";
import { toast } from "sonner";

export function MigrationBanner() {
  const [status, setStatus] = useState<"checking" | "needed" | "migrating" | "complete" | "error">("checking");
  const [migratedCounts, setMigratedCounts] = useState<{ links: number; sparkCodes: number; spend: number } | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  function checkMigrationStatus() {
    // Check if migration has already been completed
    const migrationStatus = MigrationService.getStatus();

    if (migrationStatus.completed) {
      setStatus("complete");
      setMigratedCounts(migrationStatus.migrated || null);
      return;
    }

    // Check if there's data to migrate
    const hasData = checkForLocalStorageData();

    if (hasData) {
      setStatus("needed");
    } else {
      setStatus("complete"); // No data to migrate
    }
  }

  function checkForLocalStorageData(): boolean {
    if (typeof window === "undefined") return false;

    const linkHistory = localStorage.getItem("link-history");
    const sparkCodes = localStorage.getItem("spark-codes");

    const hasLinks = linkHistory && JSON.parse(linkHistory).length > 0;
    const hasSparkCodes = sparkCodes && JSON.parse(sparkCodes).length > 0;

    return Boolean(hasLinks || hasSparkCodes);
  }

  async function runMigration() {
    setStatus("migrating");
    setError("");

    try {
      const service = new MigrationService();
      const result = await service.migrateAll();

      if (result.success) {
        setStatus("complete");
        setMigratedCounts(result.migrated);
        toast.success(
          `Migration complete! Migrated ${result.migrated.links} links and ${result.migrated.sparkCodes} spark codes.`
        );
      } else {
        setStatus("error");
        setError(result.errors.join(", "));
        toast.error("Migration failed. Check console for details.");
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
      toast.error("Migration failed. Your data is still safe in your browser.");
    }
  }

  // Don't show banner if checking or already complete
  if (status === "checking" || status === "complete") {
    return null;
  }

  return (
    <div className="mb-6">
      {status === "needed" && (
        <Alert className="bg-yellow-500/10 border-yellow-500/30">
          <Database className="h-5 w-5 text-yellow-400" />
          <AlertTitle className="text-yellow-400 font-semibold">
            Database Upgrade Available
          </AlertTitle>
          <AlertDescription className="text-sm text-slate-300 mt-2">
            <p className="mb-3">
              Migrate your data to the new database system to prevent data loss and unlock new features.
              This takes 10 seconds and is completely safe - your browser data stays as backup.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={runMigration}
                size="sm"
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                Migrate Now (Recommended)
              </Button>
              <Button
                onClick={() => setStatus("complete")}
                variant="outline"
                size="sm"
                className="border-yellow-500/30 hover:bg-yellow-500/10"
              >
                Skip for Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {status === "migrating" && (
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
          <AlertTitle className="text-blue-400 font-semibold">
            Migration in Progress
          </AlertTitle>
          <AlertDescription className="text-sm text-slate-300 mt-2">
            Migrating your data to the database... Please don't close this tab.
          </AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert className="bg-red-500/10 border-red-500/30">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <AlertTitle className="text-red-400 font-semibold">
            Migration Failed
          </AlertTitle>
          <AlertDescription className="text-sm text-slate-300 mt-2">
            <p className="mb-3">
              {error || "An error occurred during migration. Your data is still safe in your browser."}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={runMigration}
                size="sm"
                variant="outline"
                className="border-red-500/30 hover:bg-red-500/10"
              >
                Try Again
              </Button>
              <Button
                onClick={() => setStatus("complete")}
                variant="outline"
                size="sm"
                className="border-red-500/30 hover:bg-red-500/10"
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
