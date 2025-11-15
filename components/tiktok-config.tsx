"use client";

import { useState, useEffect } from "react";
import { Smartphone, Zap, Shield } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { config } from "@/lib/config";
import { validateTikTokPixelId } from "@/lib/tiktok-pixel";

interface TikTokConfigProps {
  pixelEnabled: boolean;
  pixelId: string;
  browserRedirectEnabled: boolean;
  strictBotDetectionEnabled: boolean;
  onPixelEnabledChange: (enabled: boolean) => void;
  onPixelIdChange: (id: string) => void;
  onBrowserRedirectChange: (enabled: boolean) => void;
  onStrictBotDetectionChange: (enabled: boolean) => void;
}

export function TikTokConfig({
  pixelEnabled,
  pixelId,
  browserRedirectEnabled,
  strictBotDetectionEnabled,
  onPixelEnabledChange,
  onPixelIdChange,
  onBrowserRedirectChange,
  onStrictBotDetectionChange,
}: TikTokConfigProps) {
  const [pixelIdValid, setPixelIdValid] = useState(true);

  // Validate pixel ID when it changes
  useEffect(() => {
    if (pixelEnabled && pixelId) {
      setPixelIdValid(validateTikTokPixelId(pixelId));
    } else {
      setPixelIdValid(true);
    }
  }, [pixelId, pixelEnabled]);

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Smartphone className="h-4 w-4" />
        <h3 className="font-medium">TikTok Features</h3>
        <Badge variant="outline" className="text-xs">
          Advanced
        </Badge>
      </div>

      <div className="space-y-3">
        {/* TikTok Pixel */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tiktok-pixel"
              checked={pixelEnabled}
              onCheckedChange={(checked) =>
                onPixelEnabledChange(checked as boolean)
              }
            />
            <Label htmlFor="tiktok-pixel" className="flex items-center gap-2">
              <Zap className="h-3 w-3" />
              Enable TikTok Pixel
            </Label>
          </div>

          {pixelEnabled && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="pixel-id" className="text-xs text-muted-foreground">
                Pixel ID
              </Label>
              <Input
                id="pixel-id"
                type="text"
                placeholder={config.tiktok.pixelDefaults.pixelId}
                value={pixelId}
                onChange={(e) => onPixelIdChange(e.target.value)}
                className={!pixelIdValid ? "border-red-500" : ""}
              />
              {!pixelIdValid && (
                <p className="text-xs text-red-500">
                  Invalid pixel ID format (should be 15-25 alphanumeric characters)
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Tracks PageView and ClickButton events
              </p>
            </div>
          )}
        </div>

        {/* Browser Redirect */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="browser-redirect"
              checked={browserRedirectEnabled}
              onCheckedChange={(checked) =>
                onBrowserRedirectChange(checked as boolean)
              }
            />
            <Label
              htmlFor="browser-redirect"
              className="flex items-center gap-2"
            >
              <Smartphone className="h-3 w-3" />
              Force Browser Open
            </Label>
          </div>

          {browserRedirectEnabled && (
            <p className="ml-6 text-xs text-muted-foreground">
              Forces TikTok webview to open link in external browser (improves tracking)
            </p>
          )}
        </div>

        {/* Strict Bot Detection */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="strict-bot-detection"
              checked={strictBotDetectionEnabled}
              onCheckedChange={(checked) =>
                onStrictBotDetectionChange(checked as boolean)
              }
            />
            <Label
              htmlFor="strict-bot-detection"
              className="flex items-center gap-2"
            >
              <Shield className="h-3 w-3" />
              Strict Bot Detection
            </Label>
          </div>

          {strictBotDetectionEnabled && (
            <p className="ml-6 text-xs text-muted-foreground">
              Enhanced detection for TikTok/ByteDance crawlers
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
