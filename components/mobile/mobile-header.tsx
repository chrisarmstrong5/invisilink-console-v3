"use client";

import { Menu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const response = await fetch("/api/cron/sync-redtrack", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        const total = data.synced?.total || 0;
        toast.success(`Synced ${total} metrics from RedTrack`);
      } else {
        // Show more detailed error message
        const errorMsg = data.error || data.errors?.[0] || "Sync failed";
        toast.error(`RedTrack sync failed: ${errorMsg}`);
        console.error("[Sync Error]", data);
      }
    } catch (error) {
      toast.error("Network error during sync");
      console.error("[Sync Error]", error);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <header className="md:hidden sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 safe-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-10 w-10"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">InvisiLink</span>
          <span className="text-xs text-muted-foreground bg-primary/10 px-1.5 py-0.5 rounded">
            v3.0
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSync}
          disabled={syncing}
          className="h-10 w-10"
        >
          <RefreshCw
            className={`h-5 w-5 ${syncing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
    </header>
  );
}
