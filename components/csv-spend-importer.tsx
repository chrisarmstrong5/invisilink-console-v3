"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImportResult {
  success: boolean;
  imported: number;
  totalSpend: number;
  detectedFormat: string;
  preview: Array<{
    campaignName: string;
    spend: number;
    date: string;
    account?: string;
  }>;
}

interface CSVSpendImporterProps {
  onImportComplete?: () => void;
}

export function CSVSpendImporter({ onImportComplete }: CSVSpendImporterProps = {}) {
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setStatus("processing");
    setError("");

    try {
      // Read file content
      const csvContent = await file.text();

      // Send to API
      const response = await fetch("/api/spend/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setResult(data);
        toast.success(`Imported ${data.imported} spend records ($${data.totalSpend.toFixed(2)} total)`);
        onImportComplete?.();
      } else {
        setStatus("error");
        setError(data.error || "Import failed");
        toast.error(data.error || "Failed to import CSV");
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
      toast.error("Failed to process CSV file");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();

    const file = event.dataTransfer.files[0];
    if (!file) return;

    // Create a fake input event
    const fakeEvent = {
      target: {
        files: [file],
      },
    } as any;

    handleFileSelect(fakeEvent);
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Import Spend Data</h3>
          <p className="text-sm text-muted-foreground">
            Upload CSV from TikTok or Facebook Ads Manager
          </p>
        </div>

        {/* Drag & Drop Zone */}
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />

          {status === "idle" && (
            <div className="space-y-3">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Drag & drop CSV file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports TikTok and Facebook Ads Manager exports
                </p>
              </div>
            </div>
          )}

          {status === "processing" && (
            <div className="space-y-3">
              <Loader2 className="w-12 h-12 mx-auto text-blue-400 animate-spin" />
              <p className="text-sm font-medium">Processing CSV...</p>
            </div>
          )}

          {status === "success" && result && (
            <div className="space-y-3">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-400">
                  Imported {result.imported} records
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: ${result.totalSpend.toFixed(2)} • Format: {result.detectedFormat}
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <XCircle className="w-12 h-12 mx-auto text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-400">Import failed</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        {status === "success" && result && result.preview.length > 0 && (
          <div className="border border-border rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3">Import Preview (first 5 records)</h4>
            <div className="space-y-2">
              {result.preview.map((record, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex-1">
                    <p className="font-medium truncate">{record.campaignName}</p>
                    <p className="text-muted-foreground">
                      {record.account ? `Account: ${record.account}` : "Account not detected"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${record.spend.toFixed(2)}</p>
                    <p className="text-muted-foreground">{record.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {(status === "success" || status === "error") && (
          <Button
            onClick={() => {
              setStatus("idle");
              setResult(null);
              setError("");
            }}
            variant="outline"
            className="w-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            Import Another File
          </Button>
        )}
      </div>
    </Card>
  );
}
