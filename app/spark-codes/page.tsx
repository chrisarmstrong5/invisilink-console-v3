"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileUpload } from "@/components/mobile/mobile-upload";
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
import { Upload, X, Video, Image as ImageIcon, TrendingUp, TrendingDown, BarChart3, Edit } from "lucide-react";
import Link from "next/link";
import { SparkCodeCompactCard } from "@/components/spark-code-compact-card";
import { SparkCodeDetailDialog } from "@/components/spark-code-detail-dialog";

export default function SparkCodesPage() {
  const [sparkCodes, setSparkCodes] = useState<SparkCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SparkCode | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [contentType, setContentType] = useState<"video" | "slideshow">("video");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [sparkCodeId, setSparkCodeId] = useState("");
  const [offer, setOffer] = useState("");
  const [platform, setPlatform] = useState<"tiktok" | "facebook">("tiktok");
  const [tags, setTags] = useState("");
  const [tiktokLink, setTiktokLink] = useState("");
  const [instagramPostLink, setInstagramPostLink] = useState("");
  const [facebookPostLink, setFacebookPostLink] = useState("");
  const [engagementLikes, setEngagementLikes] = useState(1900);
  const [engagementSaves, setEngagementSaves] = useState(180);

  // Load spark codes from database
  useEffect(() => {
    async function fetchSparkCodes() {
      try {
        const response = await fetch("/api/spark-codes");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSparkCodes(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch spark codes:", error);
      }
    }
    fetchSparkCodes();
  }, []);

  // Save to database
  const saveSparkCode = async (code: SparkCode) => {
    try {
      const response = await fetch("/api/spark-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(code),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSparkCodes([...sparkCodes, data.data]);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Failed to save spark code:", error);
      return false;
    }
  };

  // Dropzone for media upload - allow up to 50 files
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const maxFiles = 50;
    if (acceptedFiles.length + mediaFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }
    setMediaFiles([...mediaFiles, ...acceptedFiles].slice(0, maxFiles));
  }, [mediaFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    maxFiles: 50,
    multiple: true,
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

  // Add or Update spark code
  const handleSubmit = async () => {
    if (!sparkCodeId.trim()) {
      toast.error("Please enter a Spark Code ID");
      return;
    }
    if (!offer) {
      toast.error("Please select an offer");
      return;
    }

    setLoading(true);
    try {
      let mediaUrls: string[] = [];

      // If updating and no new files, keep existing media URLs
      if (editingId && mediaFiles.length === 0) {
        const existingSpark = sparkCodes.find((sc) => sc.id === editingId);
        mediaUrls = existingSpark?.mediaUrls || [];
      } else if (mediaFiles.length > 0) {
        mediaUrls = await uploadFiles(mediaFiles);
      }
      // Media upload is optional - allow empty mediaUrls array

      // Create or update spark code
      const sparkCodeData: SparkCode = {
        id: editingId || `SC${sparkCodes.length + 1}`,
        name: sparkCodeId.trim(),
        sparkCode: sparkCodeId.trim(),
        offerCode: offer,
        platform,
        createdDate: editingId
          ? sparkCodes.find((sc) => sc.id === editingId)?.createdDate || new Date().toISOString()
          : new Date().toISOString(),
        contentType,
        mediaUrls,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        tiktokLink: tiktokLink.trim() || undefined,
        instagramPostLink: instagramPostLink.trim() || undefined,
        facebookPostLink: facebookPostLink.trim() || undefined,
        engagementSettings: {
          likes: engagementLikes,
          saves: engagementSaves,
        },
        metrics: editingId
          ? sparkCodes.find((sc) => sc.id === editingId)?.metrics || {
              clicks: 0,
              conversions: 0,
              cvr: 0,
              revenue: 0,
              spend: 0,
              roi: 0,
            }
          : {
              clicks: 0,
              conversions: 0,
              cvr: 0,
              revenue: 0,
              spend: 0,
              roi: 0,
            },
      };

      const saved = await saveSparkCode(sparkCodeData);

      if (saved) {
        handleCancelEdit();
        toast.success(editingId ? "Spark code updated!" : "Spark code added successfully!");
      } else {
        toast.error("Failed to save spark code to database");
      }
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${editingId ? "update" : "add"} spark code`);
    }
    setLoading(false);
  };

  // Delete spark code
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/spark-codes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSparkCodes(sparkCodes.filter((sc) => sc.id !== id));
        toast.success("Spark code deleted");
      } else {
        toast.error("Failed to delete spark code");
      }
    } catch (error) {
      console.error("Failed to delete spark code:", error);
      toast.error("Failed to delete spark code");
    }
  };

  // Edit spark code - populate form with existing data
  const handleEdit = (sparkCode: SparkCode) => {
    setEditingId(sparkCode.id);
    setSparkCodeId(sparkCode.sparkCode);
    setOffer(sparkCode.offerCode);
    setPlatform(sparkCode.platform);
    setContentType(sparkCode.contentType || "video");
    setTags(sparkCode.tags?.join(", ") || "");
    setTiktokLink(sparkCode.tiktokLink || "");
    setInstagramPostLink(sparkCode.instagramPostLink || "");
    setFacebookPostLink(sparkCode.facebookPostLink || "");
    setEngagementLikes(sparkCode.engagementSettings?.likes || 1900);
    setEngagementSaves(sparkCode.engagementSettings?.saves || 180);
    // Note: existing media URLs can't be re-uploaded, user will need to re-upload if they want to change media
    setMediaFiles([]);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info("Editing spark code - update fields and click 'Update'");
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setSparkCodeId("");
    setOffer("");
    setPlatform("tiktok");
    setContentType("video");
    setTags("");
    setTiktokLink("");
    setInstagramPostLink("");
    setFacebookPostLink("");
    setEngagementLikes(1900);
    setEngagementSaves(180);
    setMediaFiles([]);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex items-center justify-between flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Spark Code Database</h1>
          <p className="text-sm text-muted-foreground">
            Upload and manage TikTok/Facebook Spark Codes with creative assets
          </p>
        </div>
        <Link href="/spark-codes-analytics">
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Button>
        </Link>
      </div>

      {/* Upload Form */}
      <Card className="mb-6 md:mb-8 p-4 md:p-6 shadow-sm">
        <h3 className="mb-4 md:mb-6 text-lg font-semibold text-foreground">
          {editingId ? "Edit Spark Code" : "Add New Spark Code"}
        </h3>

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

          {/* TikTok Link (for TikTok platform) */}
          {platform === "tiktok" && (
            <div className="md:col-span-2">
              <Label className="mb-2 block text-sm font-medium text-foreground">TikTok Link (Optional)</Label>
              <Input
                placeholder="e.g., https://www.tiktok.com/@user/video/123..."
                value={tiktokLink}
                onChange={(e) => setTiktokLink(e.target.value)}
                className="bg-input border h-10"
              />
            </div>
          )}

          {/* Instagram/Facebook Post Links (for Facebook platform) */}
          {platform === "facebook" && (
            <>
              <div>
                <Label className="mb-2 block text-sm font-medium text-foreground">Instagram Post Link (Optional)</Label>
                <Input
                  placeholder="e.g., https://www.instagram.com/p/..."
                  value={instagramPostLink}
                  onChange={(e) => setInstagramPostLink(e.target.value)}
                  className="bg-input border h-10"
                />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium text-foreground">Facebook Post Link (Optional)</Label>
                <Input
                  placeholder="e.g., https://www.facebook.com/..."
                  value={facebookPostLink}
                  onChange={(e) => setFacebookPostLink(e.target.value)}
                  className="bg-input border h-10"
                />
              </div>
            </>
          )}

          {/* Engagement Boost Settings */}
          <div className="md:col-span-2 border-t pt-4 mt-2">
            <Label className="mb-3 block text-sm font-semibold text-foreground">Engagement Boost Settings</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-xs text-muted-foreground">Likes</Label>
                <Input
                  type="number"
                  placeholder="1900"
                  value={engagementLikes}
                  onChange={(e) => setEngagementLikes(parseInt(e.target.value) || 1900)}
                  className="bg-input border h-10"
                />
              </div>
              <div>
                <Label className="mb-2 block text-xs text-muted-foreground">Saves</Label>
                <Input
                  type="number"
                  placeholder="180"
                  value={engagementSaves}
                  onChange={(e) => setEngagementSaves(parseInt(e.target.value) || 180)}
                  className="bg-input border h-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* File Upload Dropzone */}
        <div className="mt-6">
          <Label className="mb-2 block text-sm font-medium text-foreground">
            Upload {contentType === "video" ? "Video/Screenshot" : "3 Slides"}
          </Label>

          {/* Desktop Dropzone */}
          <div className="hidden md:block">
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
                {contentType === "video" ? "1 video or screenshot" : "Up to 20 images for slideshow"}
              </p>
            </div>

            {/* Preview uploaded files - Desktop */}
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

          {/* Mobile Upload */}
          <div className="md:hidden">
            <MobileUpload
              accept="image/*,video/*"
              multiple={true}
              maxSize={50 * 1024 * 1024}
              onUpload={async (files) => {
                const maxFiles = 50;
                if (files.length > maxFiles) {
                  toast.error(`Maximum ${maxFiles} files allowed`);
                  return;
                }
                setMediaFiles(files);
                toast.success(`${files.length} file(s) selected`);
              }}
              label="Upload Media (up to 50 files)"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
            {loading ? "Uploading..." : editingId ? "Update Spark Code" : "Add Spark Code"}
          </Button>
          {editingId && (
            <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
              Cancel
            </Button>
          )}
        </div>
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
          <>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {sparkCodes.map((sc) => (
                <SparkCodeCompactCard
                  key={sc.id}
                  sparkCode={sc}
                  onClick={() => setSelectedCard(sc)}
                />
              ))}
            </div>

            <SparkCodeDetailDialog
              sparkCode={selectedCard}
              open={selectedCard !== null}
              onClose={() => setSelectedCard(null)}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onEngagementBoost={async (sc) => {
                try {
                  const response = await fetch("/api/smm/boost", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      tiktokLink: sc.tiktokLink,
                      likes: sc.engagementSettings?.likes,
                      saves: sc.engagementSettings?.saves,
                    }),
                  });

                  const data = await response.json();

                  if (response.ok && data.success) {
                    toast.success(`Engagement boost order placed! Orders: ${data.orders.join(", ")}`);
                  } else {
                    toast.error(data.error || data.message || "Failed to boost engagement");
                  }
                } catch (error) {
                  toast.error("Failed to boost engagement");
                  console.error(error);
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
