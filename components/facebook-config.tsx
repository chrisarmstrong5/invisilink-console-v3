"use client";

import { Facebook, Zap, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FacebookConfigProps {
  pixelId: string;
  appId: string;
  trackingMode: "direct" | "redirect";
  onPixelIdChange: (id: string) => void;
  onAppIdChange: (id: string) => void;
  onTrackingModeChange: (mode: "direct" | "redirect") => void;
}

export function FacebookConfig({
  pixelId,
  appId,
  trackingMode,
  onPixelIdChange,
  onAppIdChange,
  onTrackingModeChange,
}: FacebookConfigProps) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Facebook className="h-4 w-4 text-blue-500" />
        <h3 className="font-medium">Facebook Features</h3>
        <Badge variant="secondary" className="text-xs">
          Platform Config
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Tracking Mode */}
        <div className="space-y-2">
          <Label htmlFor="tracking-mode" className="text-xs text-muted-foreground">
            Tracking Mode
          </Label>
          <Select value={trackingMode} onValueChange={(v) => onTrackingModeChange(v as "direct" | "redirect")}>
            <SelectTrigger id="tracking-mode" className="bg-input border h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-3 w-3 text-green-500" />
                  <span>Direct (FB-Compliant)</span>
                </div>
              </SelectItem>
              <SelectItem value="redirect">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-3 w-3 text-yellow-500" />
                  <span>Redirect (Testing Only)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {trackingMode === "direct" ? (
            <p className="text-xs text-muted-foreground">
              No redirect - passes tracking params directly to offer page (FB-compliant)
            </p>
          ) : (
            <p className="text-xs text-yellow-600">
              ⚠️ Uses redirect - may violate Facebook policies. Use for testing only.
            </p>
          )}
        </div>

        {/* Facebook Pixel ID */}
        <div className="space-y-2">
          <Label htmlFor="fb-pixel-id" className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            Facebook Pixel ID
          </Label>
          <Input
            id="fb-pixel-id"
            type="text"
            placeholder="e.g., 123456789012345"
            value={pixelId}
            onChange={(e) => onPixelIdChange(e.target.value)}
            className="bg-input border h-9 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Tracks PageView, ViewContent, and AddToCart events
          </p>
        </div>

        {/* Facebook App ID */}
        <div className="space-y-2">
          <Label htmlFor="fb-app-id" className="text-xs text-muted-foreground">
            Facebook App ID (Optional)
          </Label>
          <Input
            id="fb-app-id"
            type="text"
            placeholder="e.g., 987654321098765"
            value={appId}
            onChange={(e) => onAppIdChange(e.target.value)}
            className="bg-input border h-9 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            For advanced features like social sharing
          </p>
        </div>
      </div>
    </div>
  );
}
