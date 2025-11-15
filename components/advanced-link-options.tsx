"use client";

import { ExternalLink, Ban } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface AdvancedLinkOptionsProps {
  customUrl: string;
  disableCloaking: boolean;
  onCustomUrlChange: (url: string) => void;
  onDisableCloakingChange: (disabled: boolean) => void;
}

export function AdvancedLinkOptions({
  customUrl,
  disableCloaking,
  onCustomUrlChange,
  onDisableCloakingChange,
}: AdvancedLinkOptionsProps) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-medium">Advanced Options</h3>

      <div className="space-y-3">
        {/* Custom Redirect URL */}
        <div className="space-y-2">
          <Label htmlFor="custom-url" className="flex items-center gap-2">
            <ExternalLink className="h-3 w-3" />
            Custom Redirect URL (Optional)
          </Label>
          <Input
            id="custom-url"
            type="url"
            placeholder="https://example.com/your-link"
            value={customUrl}
            onChange={(e) => onCustomUrlChange(e.target.value)}
            disabled={disableCloaking}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use RedTrack. Fill to redirect to any custom URL (bypasses RedTrack).
          </p>
        </div>

        {/* Disable Cloaking */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="disable-cloaking"
              checked={disableCloaking}
              onCheckedChange={(checked) =>
                onDisableCloakingChange(checked as boolean)
              }
            />
            <Label htmlFor="disable-cloaking" className="flex items-center gap-2">
              <Ban className="h-3 w-3" />
              Disable Cloaking (Instant Redirect)
            </Label>
          </div>

          {disableCloaking && (
            <p className="ml-6 text-xs text-amber-600">
              ⚠️ All traffic will be redirected instantly with no bot filtering. Use for testing only.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
