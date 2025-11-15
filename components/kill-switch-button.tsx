"use client";

import { useState } from "react";
import { Skull, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { type LinkHistoryItem } from "@/lib/config";
import { killLink, restoreLink, exportKillListForGitHub } from "@/lib/kill-list-manager";

interface KillSwitchButtonProps {
  link: LinkHistoryItem;
  isKilled: boolean;
  onKillStateChange: () => void;
}

export function KillSwitchButton({
  link,
  isKilled,
  onKillStateChange,
}: KillSwitchButtonProps) {
  const [syncing, setSyncing] = useState(false);

  const handleKill = async () => {
    try {
      // Kill the link
      const killedItem = killLink(link, "Manually killed from UI");

      // Sync to GitHub
      setSyncing(true);
      const killListJson = exportKillListForGitHub();

      const response = await fetch("/api/kill-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ killListJson }),
      });

      if (!response.ok) {
        throw new Error("Failed to sync kill list to GitHub");
      }

      const data = await response.json();

      toast.success("Link killed successfully", {
        description: `Committed to GitHub: ${data.commitUrl}`,
      });

      onKillStateChange();
    } catch (error) {
      console.error("Kill switch error:", error);
      toast.error("Failed to kill link", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleRestore = async () => {
    try {
      const slug = link.whitePageUrl.split("/").pop() || "";

      // Restore the link
      const success = restoreLink(slug);

      if (!success) {
        throw new Error("Link not found in kill list");
      }

      // Sync to GitHub
      setSyncing(true);
      const killListJson = exportKillListForGitHub();

      const response = await fetch("/api/kill-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ killListJson }),
      });

      if (!response.ok) {
        throw new Error("Failed to sync kill list to GitHub");
      }

      toast.success("Link restored successfully");
      onKillStateChange();
    } catch (error) {
      console.error("Restore error:", error);
      toast.error("Failed to restore link", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (isKilled) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={syncing}
            className="border-green-500 text-green-600 hover:bg-green-50"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Restore
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the link and allow traffic through again. The link will be removed from the kill list and committed to GitHub.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              Restore Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={syncing}
          className="border-red-500 text-red-600 hover:bg-red-50"
        >
          <Skull className="h-3 w-3 mr-1" />
          Kill
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Kill This Link?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently block all traffic to this link. The link will be added to the kill list and committed to GitHub. This action can be undone later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleKill}
            className="bg-red-600 hover:bg-red-700"
          >
            Kill Link
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
