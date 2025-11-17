"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  X,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Zap,
  Copy,
  ChevronLeft,
  ChevronRight,
  Edit,
} from "lucide-react";
import type { SparkCode } from "@/lib/config";

interface SparkCodeDetailDialogProps {
  sparkCode: SparkCode | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit?: (sparkCode: SparkCode) => void;
  onEngagementBoost?: (sparkCode: SparkCode) => void;
}

export function SparkCodeDetailDialog({
  sparkCode,
  open,
  onClose,
  onDelete,
  onEdit,
  onEngagementBoost,
}: SparkCodeDetailDialogProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!sparkCode) return null;

  const {
    id,
    name,
    sparkCode: code,
    platform,
    offerCode,
    createdDate,
    contentType,
    mediaUrls = [],
    tags = [],
    tiktokLink,
    instagramPostLink,
    facebookPostLink,
    engagementSettings,
    metrics,
  } = sparkCode;

  const handleCopySparkCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Spark code copied to clipboard");
  };

  const handleDelete = () => {
    onDelete(id);
    onClose();
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % mediaUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] h-full max-h-[90vh]">
          {/* Left: Media */}
          <div className="relative bg-black min-h-[300px] md:min-h-[600px]">
            {mediaUrls.length > 0 && (
              <>
                {contentType === "video" ? (
                  <video
                    src={mediaUrls[currentImageIndex]}
                    className="object-contain w-full h-full"
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={mediaUrls[currentImageIndex]}
                    alt={name}
                    className="object-contain w-full h-full"
                  />
                )}

                {/* Carousel controls for slideshow */}
                {contentType === "slideshow" && mediaUrls.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                      {mediaUrls.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-full transition-all ${
                            idx === currentImageIndex
                              ? "w-6 bg-white"
                              : "w-1.5 bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right: Details */}
          <div className="flex flex-col h-full max-h-[90vh]">
            {/* Header */}
            <DialogHeader className="p-6 pb-4 border-b">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <DialogTitle className="text-xl">{name}</DialogTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {id}
                    </Badge>
                    <Badge className="text-xs capitalize">{platform}</Badge>
                    {contentType && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {contentType}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        onEdit(sparkCode);
                        onClose();
                      }}
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Details</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Offer:</span>
                    <span className="font-medium">{offerCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(createdDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(tiktokLink || instagramPostLink || facebookPostLink) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Social Links</h3>
                  <div className="space-y-2">
                    {tiktokLink && (
                      <a
                        href={tiktokLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        TikTok
                      </a>
                    )}
                    {instagramPostLink && (
                      <a
                        href={instagramPostLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Instagram
                      </a>
                    )}
                    {facebookPostLink && (
                      <a
                        href={facebookPostLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Facebook
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Engagement Settings */}
              {engagementSettings && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Engagement Boost
                  </h3>
                  <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium">{engagementSettings.likes}</span> likes,{" "}
                      <span className="font-medium">{engagementSettings.saves}</span> saves
                    </div>
                    {onEngagementBoost && tiktokLink && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onEngagementBoost(sparkCode)}
                        className="gap-1.5"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Boost
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Metrics */}
              {metrics && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Performance</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-accent rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Clicks</div>
                      <div className="text-lg font-bold">{metrics.clicks.toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-accent rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">CVR</div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold">{metrics.cvr.toFixed(2)}%</span>
                        {metrics.cvr >= 3 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-accent rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Revenue</div>
                      <div className="text-lg font-bold">${metrics.revenue.toFixed(2)}</div>
                    </div>
                    <div className="p-3 bg-accent rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">ROI</div>
                      <div className="text-lg font-bold">{metrics.roi.toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 pt-4 border-t space-y-2">
              <Button className="w-full gap-2" onClick={handleCopySparkCode}>
                <Copy className="h-4 w-4" />
                Copy Spark Code
              </Button>
              <div className="text-xs text-center text-muted-foreground font-mono">{code}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
