"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Database } from "lucide-react";

export default function SetupPage() {
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function runMigration() {
    setStatus("running");
    setMessage("Creating database tables...");

    try {
      const response = await fetch("/api/db/migrate", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage("✅ Database tables created successfully!");
      } else {
        setStatus("error");
        setMessage(`❌ Migration failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      setStatus("error");
      setMessage(`❌ Failed to run migration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <Database className="w-16 h-16 text-blue-400" />

          <div>
            <h1 className="text-2xl font-bold mb-2">Database Setup</h1>
            <p className="text-sm text-muted-foreground">
              Initialize your Vercel Postgres database
            </p>
          </div>

          {status === "idle" && (
            <Button
              onClick={runMigration}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Create Database Tables
            </Button>
          )}

          {status === "running" && (
            <div className="flex items-center gap-3 text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{message}</span>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4 w-full">
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">{message}</span>
              </div>
              <Button
                onClick={() => window.location.href = "/"}
                size="lg"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4 w-full">
              <div className="flex items-start gap-3 text-red-400">
                <XCircle className="w-5 h-5 mt-0.5" />
                <span className="text-sm text-left">{message}</span>
              </div>
              <Button
                onClick={runMigration}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-4 border-t w-full">
            This will create the following tables:
            <ul className="mt-2 space-y-1 text-left">
              <li>• links</li>
              <li>• spark_codes</li>
              <li>• metrics_cache</li>
              <li>• spend_tracking</li>
              <li>• kill_list</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
