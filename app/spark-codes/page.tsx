"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { config, type SparkCode } from "@/lib/config";
import { Upload, X, Video, Image as ImageIcon, TrendingUp, TrendingDown } from "lucide-react";

export default function SparkCodesPage() {
  const [sparkCodes, setSparkCodes] = useState<SparkCode[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [contentType, setContentType] = useState<"video" | "slideshow">("video");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [sparkCodeId, setSparkCodeId] = useState("");
  const [offer, setOffer] = useState("");
  const [platform, setPlatform] = useState<"tiktok" | "facebook">("tiktok");
  const [tags, setTags] = useState("");

  // Load spark codes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sparkCodes");
    if (saved) {
      setSparkCodes(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  const saveSparkCodes = (codes: SparkCode[]) => {
    localStorage.setItem("sparkCodes", JSON.stringify(codes));
    setSparkCodes(codes);
  };

  // Dropzone for media upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const maxFiles = contentType === "video" ? 1 : 3;
    if (acceptedFiles.length + mediaFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} file${maxFiles > 1 ? "s" : ""} for ${contentType}`);
      return;
    }
    setMediaFiles([...mediaFiles, ...acceptedFiles].slice(0, maxFiles));
  }, [contentType, mediaFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
      "video/*": [".mp4", ".mov", ".avi"],
    },
    maxFiles: contentType === "video" ? 1 : 3,
  });

  // Upload files to Vercel Blob
  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }

      const data = await response.json();
      urls.push(data.url);
    }
    return urls;
  };

  // Add spark code
  const handleAddSparkCode = async () => {
    if (!sparkCodeId.trim()) {
      toast.error("Please enter a Spark Code ID");
      return;
    }
    if (!offer) {
      toast.error("Please select an offer");
      return;
    }
    if (mediaFiles.length === 0) {
      toast.error(`Please upload ${contentType === "video" ? "a video/screenshot" : "3 slides"}`);
      return;
    }
    if (contentType === "slideshow" && mediaFiles.length !== 3) {
      toast.error("Please upload exactly 3 slides for slideshow");
      return;
    }

    setLoading(true);
    try {
      // Upload media files
      const mediaUrls = await uploadFiles(mediaFiles);

      // Create new spark code
      const newSparkCode: SparkCode = {
        id: `SC${sparkCodes.length + 1}`,
        name: sparkCodeId.trim(),
        sparkCode: sparkCodeId.trim(),
        offerCode: offer,
        platform,
        createdDate: new Date().toISOString(),
        contentType,
        mediaUrls,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        metrics: {
          clicks: 0,
          conversions: 0,
          cvr: 0,
          revenue: 0,
          spend: 0,
          roi: 0,
        },
      };

      saveSparkCodes([...sparkCodes, newSparkCode]);

      // Reset form
      setSparkCodeId("");
      setOffer("");
      setTags("");
      setMediaFiles([]);
      setContentType("video");

      toast.success("Spark code added successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload media files");
    }
    setLoading(false);
  };

  // Delete spark code
  const handleDelete = (id: string) => {
    saveSparkCodes(sparkCodes.filter((sc) => sc.id !== id));
    toast.success("Spark code deleted");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Spark Code Database</h1>
        <p className="text-sm text-muted-foreground">
          Upload and manage TikTok/Facebook Spark Codes with creative assets
        </p>
      </div>

      {/* Upload Form */}
      <Card className="mb-8 p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-semibold text-foreground">Add New Spark Code</h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Content Type */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-foreground">Content Type</Label>
            <Select
              value={contentType}
              onValueChange={(val) => {
                setContentType(val as "video" | "slideshow");
                setMediaFiles([]);
              }}
            >
              <SelectTrigger className="bg-input border h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border">
                <SelectItem value="video">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video
                  </div>
                </SelectItem>
                <SelectItem value="slideshow">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Slideshow (3 slides)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Spark Code ID */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-foreground">Spark Code ID</Label>
            <Input
              placeholder="e.g., 7423891234567890"
              value={sparkCodeId}
              onChange={(e) => setSparkCodeId(e.target.value)}
              className="bg-input border h-10"
            />
          </div>

          {/* Offer */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-foreground">Offer</Label>
            <Select value={offer} onValueChange={setOffer}>
              <SelectTrigger className="bg-input border h-10">
                <SelectValue placeholder="Select offer..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border">
                {Object.entries(config.offers).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {value.code}
                      </Badge>
                      {value.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Platform */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-foreground">Platform</Label>
            <Select value={platform} onValueChange={(val) => setPlatform(val as "tiktok" | "facebook")}>
              <SelectTrigger className="bg-input border h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border">
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <Label className="mb-2 block text-sm font-medium text-foreground">Tags (comma-separated)</Label>
            <Input
              placeholder="e.g., dancing, trending, viral"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-input border h-10"
            />
          </div>
        </div>

        {/* File Upload Dropzone */}
        <div className="mt-6">
          <Label className="mb-2 block text-sm font-medium text-foreground">
            Upload {contentType === "video" ? "Video/Screenshot" : "3 Slides"}
          </Label>
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-sm font-medium text-foreground">
              {isDragActive ? "Drop files here" : "Drag & drop files here, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              {contentType === "video" ? "1 video or screenshot" : "Exactly 3 images for slideshow"}
            </p>
          </div>

          {/* Preview uploaded files */}
          {mediaFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              {mediaFiles.map((file, idx) => (
                <div key={idx} className="relative rounded-lg border p-2">
                  <p className="truncate text-xs text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={() => setMediaFiles(mediaFiles.filter((_, i) => i !== idx))}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleAddSparkCode} disabled={loading} className="mt-6 w-full bg-primary hover:bg-primary/90">
          {loading ? "Uploading..." : "Add Spark Code"}
        </Button>
      </Card>

      {/* Spark Codes Grid */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Saved Spark Codes ({sparkCodes.length})
        </h3>
        {sparkCodes.length === 0 ? (
          <Card className="p-12 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">No spark codes yet. Add one above to get started.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sparkCodes.map((sc) => (
              <Card key={sc.id} className="overflow-hidden shadow-sm">
                {/* Media Preview */}
                <div className="relative aspect-video bg-secondary">
                  {sc.mediaUrls && sc.mediaUrls[0] && (
                    <img
                      src={sc.mediaUrls[0]}
                      alt={sc.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute right-2 top-2 flex gap-1">
                    <Badge className="bg-primary text-xs">{sc.contentType}</Badge>
                    <Badge variant="outline" className="text-xs">
                      {sc.platform}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <Badge className="mb-2 bg-cyan-500/10 text-cyan-600 border-cyan-500/20 font-mono text-xs">
                        {sc.id}
                      </Badge>
                      <p className="text-sm font-semibold text-foreground">{sc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {config.offers[sc.offerCode as keyof typeof config.offers]?.name}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(sc.id)}
                      className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Tags */}
                  {sc.tags && sc.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {sc.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 border-t pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                      <p className="text-sm font-semibold text-foreground">{sc.metrics.clicks}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CVR</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold text-foreground">{sc.metrics.cvr.toFixed(2)}%</p>
                        {sc.metrics.cvr >= 3 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-sm font-semibold text-foreground">${sc.metrics.revenue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ROI</p>
                      <p className="text-sm font-semibold text-foreground">{sc.metrics.roi.toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
