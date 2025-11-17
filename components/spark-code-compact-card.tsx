"use client";

import { Badge } from "@/components/ui/badge";
import type { SparkCode } from "@/lib/config";

interface SparkCodeCompactCardProps {
  sparkCode: SparkCode;
  onClick: () => void;
}

export function SparkCodeCompactCard({ sparkCode, onClick }: SparkCodeCompactCardProps) {
  const { name, platform, offerCode, mediaUrls, metrics, contentType } = sparkCode;
  const cvr = metrics?.cvr || 0;
  const thumbnailUrl = mediaUrls?.[0] || "/placeholder-video.png";

  return (
    <div
      onClick={onClick}
      className="relative aspect-[3/4] group cursor-pointer overflow-hidden rounded-lg transition-transform hover:scale-105 hover:z-10"
    >
      {/* Background Media */}
      {contentType === "video" ? (
        <video
          src={thumbnailUrl}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <img
          src={thumbnailUrl}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Top badge */}
      <div className="absolute top-2 right-2">
        <Badge variant="secondary" className="h-5 text-[10px] px-1.5">
          {platform === "tiktok" ? "TT" : "FB"}
        </Badge>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 inset-x-0 p-2.5">
        <p className="text-white text-xs font-medium truncate mb-0.5">{name}</p>
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-[10px] truncate">{offerCode}</span>
          <span
            className={`text-xs font-bold ${
              cvr >= 3 ? "text-green-400" : cvr >= 1 ? "text-yellow-400" : "text-red-400"
            }`}
          >
            {cvr.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
