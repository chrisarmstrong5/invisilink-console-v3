"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MobileUpload } from "@/components/mobile/mobile-upload";
import { toast } from "sonner";
import type { CompetitorAd } from "@/lib/config";
import { Upload, X, Video, Image as ImageIcon, Search, Edit } from "lucide-react";

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<CompetitorAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [contentType, setContentType] = useState<"video" | "slideshow">("video");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [landerScreenshot, setLanderScreenshot] = useState<File | null>(null);
  const [competitor, setCompetitor] = useState("");
  const [niche, setNiche] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [tiktokLink, setTiktokLink] = useState("");

  // Load from database
  useEffect(() => {
    async function fetchCompetitors() {
      try {
        const response = await fetch("/api/competitors");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCompetitors(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch competitors:", error);
      }
    }
    fetchCompetitors();
  }, []);

  // Save to database
  const saveCompetitor = async (ad: CompetitorAd) => {
    try {
      const response = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ad),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompetitors([...competitors, data.data]);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Failed to save competitor:", error);
      return false;
    }
  };

  // Dropzone for ad media - allow up to 50 files for comprehensive competitor research
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const maxFiles = 50; // Allow many screenshots for thorough competitor analysis
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

  // Separate dropzone for lander screenshot
  const onLanderDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setLanderScreenshot(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps: getLanderRootProps, getInputProps: getLanderInputProps, isDragActive: isLanderDragActive } = useDropzone({
    onDrop: onLanderDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    maxFiles: 1,
  });

  // Upload files
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

  // Add or Update competitor ad
  const handleSubmit = async () => {
    if (!competitor.trim()) {
      toast.error("Please enter competitor name");
      return;
    }
    if (!niche.trim()) {
      toast.error("Please enter niche/offer");
      return;
    }

    // Only require media files for new ads, not for edits
    if (!editingId && mediaFiles.length === 0) {
      toast.error(`Please upload ${contentType === "video" ? "a video/screenshot" : "slideshow images"}`);
      return;
    }

    setLoading(true);
    try {
      let mediaUrls: string[] = [];

      // If updating and no new files, keep existing media URLs
      if (editingId && mediaFiles.length === 0) {
        const existingAd = competitors.find((ad) => ad.id === editingId);
        mediaUrls = existingAd?.mediaUrls || [];
      } else if (mediaFiles.length > 0) {
        mediaUrls = await uploadFiles(mediaFiles);
      }

      // Upload lander screenshot if provided
      let landerScreenshotUrl: string | undefined;
      if (landerScreenshot) {
        const landerUrls = await uploadFiles([landerScreenshot]);
        landerScreenshotUrl = landerUrls[0];
      }

      const adData = {
        id: editingId || `COMP${Date.now()}`,
        creatorName: competitor.trim(),
        platform: "tiktok",
        contentType,
        mediaUrls,
        adContent: notes.trim(),
        productName: niche.trim(),
        productLink: tiktokLink.trim() || undefined,
        capturedDate: new Date(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      const saved = await saveCompetitor(adData);

      if (saved) {
        // Reset form
        handleCancelEdit();
        toast.success(editingId ? "Competitor ad updated!" : "Competitor ad added!");
      } else {
        toast.error("Failed to save competitor ad to database");
      }
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${editingId ? "update" : "add"} competitor ad`);
    }
    setLoading(false);
  };

  // Delete ad
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/competitors/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCompetitors(competitors.filter((ad) => ad.id !== id));
        toast.success("Competitor ad deleted");
      } else {
        toast.error("Failed to delete competitor ad");
      }
    } catch (error) {
      console.error("Failed to delete competitor ad:", error);
      toast.error("Failed to delete competitor ad");
    }
  };

  // Edit ad - populate form with existing data
  const handleEdit = (ad: CompetitorAd) => {
    setEditingId(ad.id);
    setCompetitor(ad.creatorName);
    setNiche(ad.productName || "");
    setTags(ad.tags?.join(", ") || "");
    setNotes(ad.adContent || "");
    setTiktokLink(ad.productLink || "");
    setContentType(ad.contentType);
    // Note: existing media URLs can't be re-uploaded, user will need to re-upload if they want to change media
    setMediaFiles([]);
    setLanderScreenshot(null);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info("Editing competitor ad - update fields and click 'Update'");
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setCompetitor("");
    setNiche("");
    setTags("");
    setNotes("");
    setTiktokLink("");
    setMediaFiles([]);
    setLanderScreenshot(null);
    setContentType("video");
  };

  // Filter ads
  const filteredAds = competitors.filter((ad) => {
    const search = searchTerm.toLowerCase();
    return (
      ad.creatorName.toLowerCase().includes(search) ||
      (ad.productName && ad.productName.toLowerCase().includes(search)) ||
      (ad.tags && ad.tags.some((tag) => tag.toLowerCase().includes(search))) ||
      (ad.adContent && ad.adContent.toLowerCase().includes(search))
    );
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Competitor Spy</h1>
        <p className="text-sm text-muted-foreground">
          Store and organize competitor ads for research and inspiration
        </p>
      </div>

      {/* Upload Form */}
      <Card className="mb-6 md:mb-8 p-4 md:p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-semibold text-foreground">
          {editingId ? "Edit Competitor Ad" : "Add Competitor Ad"}
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

          {/* Competitor Name */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-foreground">Competitor Name</Label>
            <Input
              placeholder="e.g., CompanyName"
              value={competitor}
              onChange={(e) => setCompetitor(e.target.value)}
              className="bg-input border h-10"
            />
          </div>

          {/* Niche/Offer */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-foreground">Offer/Niche</Label>
            <Input
              placeholder="e.g., Apple Pay, Cash App"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="bg-input border h-10"
            />
          </div>

          {/* Tags */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-foreground">Tags (comma-separated)</Label>
            <Input
              placeholder="e.g., tiktok, carousel, ugc"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-input border h-10"
            />
          </div>

          {/* TikTok Link */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-foreground">TikTok Link (Optional)</Label>
            <Input
              placeholder="e.g., https://www.tiktok.com/@user/video/123..."
              value={tiktokLink}
              onChange={(e) => setTiktokLink(e.target.value)}
              className="bg-input border h-10"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <Label className="mb-2 block text-sm font-medium text-foreground">Notes</Label>
            <Textarea
              placeholder="Add any observations, hooks, angles, or insights..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-input border min-h-[100px]"
            />
          </div>
        </div>

        {/* File Upload - Mobile Optimized */}
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
                {contentType === "video" ? "1 video or screenshot" : "Exactly 3 images for slideshow"}
              </p>
            </div>

            {/* Preview */}
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
              accept={contentType === "video" ? "image/*,video/*" : "image/*"}
              multiple={contentType === "slideshow"}
              maxSize={50 * 1024 * 1024}
              onUpload={async (files) => {
                const maxFiles = contentType === "video" ? 1 : 3;
                if (files.length > maxFiles) {
                  toast.error(`Maximum ${maxFiles} file${maxFiles > 1 ? "s" : ""} for ${contentType}`);
                  return;
                }
                setMediaFiles(files);
                toast.success(`${files.length} file(s) selected`);
              }}
              label={contentType === "video" ? "Upload Video/Screenshot" : "Upload 3 Slides"}
            />
          </div>
        </div>

        {/* Lander Screenshot Upload (Optional) - Mobile Optimized */}
        <div className="mt-6">
          <Label className="mb-2 block text-sm font-medium text-foreground">
            Landing Page Screenshot (Optional)
          </Label>

          {/* Desktop Dropzone */}
          <div className="hidden md:block">
            <div
              {...getLanderRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                isLanderDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <input {...getLanderInputProps()} />
              <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="mb-2 text-sm font-medium text-foreground">
                {isLanderDragActive ? "Drop here" : "Upload lander screenshot (optional)"}
              </p>
              <p className="text-xs text-muted-foreground">
                1 image - screenshot of the landing page this ad links to
              </p>
            </div>

            {/* Preview lander screenshot */}
            {landerScreenshot && (
              <div className="mt-4">
                <div className="relative rounded-lg border p-2">
                  <p className="truncate text-xs text-foreground">{landerScreenshot.name}</p>
                  <p className="text-xs text-muted-foreground">{(landerScreenshot.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={() => setLanderScreenshot(null)}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Upload */}
          <div className="md:hidden">
            <MobileUpload
              accept="image/*"
              multiple={false}
              maxSize={10 * 1024 * 1024}
              onUpload={async (files) => {
                if (files.length > 0) {
                  setLanderScreenshot(files[0]);
                  toast.success("Landing page screenshot selected");
                }
              }}
              label="Upload Lander Screenshot"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
            {loading ? "Uploading..." : editingId ? "Update Competitor Ad" : "Add Competitor Ad"}
          </Button>
          {editingId && (
            <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search competitors, niches, tags, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-input border h-10 pl-10"
          />
        </div>
      </div>

      {/* Ads Grid */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Saved Ads ({filteredAds.length})
        </h3>
        {filteredAds.length === 0 ? (
          <Card className="p-12 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              {competitors.length === 0
                ? "No competitor ads yet. Add one above to start building your swipe file."
                : "No ads match your search."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAds.map((ad) => (
              <Card key={ad.id} className="overflow-hidden shadow-sm">
                {/* Media Preview */}
                <div className="relative aspect-video bg-secondary">
                  {ad.mediaUrls && ad.mediaUrls.length > 0 && ad.mediaUrls[0] && (
                    ad.contentType === "video" ? (
                      <video
                        src={ad.mediaUrls[0]}
                        className="h-full w-full object-cover"
                        controls
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={ad.mediaUrls[0]}
                        alt={ad.creatorName}
                        className="h-full w-full object-cover"
                      />
                    )
                  )}
                  <div className="absolute right-2 top-2">
                    <Badge className="bg-primary text-xs">{ad.contentType}</Badge>
                  </div>
                  {ad.mediaUrls && ad.mediaUrls.length > 1 && (
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        +{ad.mediaUrls.length - 1} more
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <p className="mb-1 text-sm font-semibold text-foreground">{ad.creatorName}</p>
                      {ad.productName && (
                        <p className="text-xs text-muted-foreground">{ad.productName}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(ad)}
                        className="h-7 px-2"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(ad.id)}
                        className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Tags */}
                  {ad.tags && ad.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {ad.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* TikTok Link */}
                  {ad.productLink && (
                    <div className="mb-3">
                      <a
                        href={ad.productLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View on TikTok →
                      </a>
                    </div>
                  )}

                  {/* Notes */}
                  {ad.adContent && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground">Notes:</p>
                      <p className="mt-1 text-sm text-foreground">{ad.adContent}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
