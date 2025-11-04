"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Plus,
  Copy,
  Trash2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface SparkCodeManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sparkCodes: SparkCode[];
  onSparkCodesChange: (sparkCodes: SparkCode[]) => void;
}

export function SparkCodeManager({
  open,
  onOpenChange,
  sparkCodes,
  onSparkCodesChange,
}: SparkCodeManagerProps) {
  // Form state for adding new spark code
  const [newSparkName, setNewSparkName] = useState("");
  const [newSparkCode, setNewSparkCode] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newPlatform, setNewPlatform] = useState<"tiktok" | "facebook">(
    "tiktok"
  );
  const [newOfferCode, setNewOfferCode] = useState("");

  // Generate next spark code ID (SC1, SC2, SC3...)
  const getNextSparkCodeId = (): string => {
    if (sparkCodes.length === 0) return "SC1";
    const maxNum = Math.max(
      ...sparkCodes.map((sc) => {
        const match = sc.id.match(/^SC(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
    );
    return `SC${maxNum + 1}`;
  };

  const addSparkCode = () => {
    // Validation
    if (!newSparkName.trim()) {
      toast.error("Please enter a spark code name");
      return;
    }
    if (!newSparkCode.trim()) {
      toast.error("Please enter a spark code");
      return;
    }
    if (!newOfferCode) {
      toast.error("Please select an offer");
      return;
    }

    // Create new spark code
    const newSpark: SparkCode = {
      id: getNextSparkCodeId(),
      name: newSparkName.trim(),
      sparkCode: newSparkCode.trim(),
      videoUrl: newVideoUrl.trim() || undefined,
      platform: newPlatform,
      offerCode: newOfferCode,
      createdDate: new Date().toISOString(),
      metrics: {
        clicks: 0,
        conversions: 0,
        cvr: 0,
        revenue: 0,
        spend: 0,
        roi: 0,
      },
    };

    onSparkCodesChange([...sparkCodes, newSpark]);

    // Reset form
    setNewSparkName("");
    setNewSparkCode("");
    setNewVideoUrl("");
    setNewPlatform("tiktok");
    setNewOfferCode("");

    toast.success(`Spark code ${newSpark.id} added successfully`);
  };

  const deleteSparkCode = (id: string) => {
    onSparkCodesChange(sparkCodes.filter((sc) => sc.id !== id));
    toast.success(`Spark code ${id} deleted`);
  };

  const copySparkCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`${id} copied to clipboard`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#16181D] border-[#2A2D35] text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Spark Code Manager
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            Manage TikTok Spark Codes and track performance metrics
          </DialogDescription>
        </DialogHeader>

        {/* Add New Spark Code Form */}
        <div className="border border-[#2A2D35] rounded-lg p-5 bg-[#1C1E24] mt-4">
          <h3 className="text-sm font-semibold mb-4 text-cyan-400">
            Add New Spark Code
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium mb-2 block text-slate-300">
                Spark Code Name
              </Label>
              <Input
                placeholder="e.g., dancing-girl-1"
                value={newSparkName}
                onChange={(e) => setNewSparkName(e.target.value)}
                className="bg-[#16181D] border-[#2A2D35] h-10 hover:border-[#3A3D45] transition-colors text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-2 block text-slate-300">
                Spark Code ID
              </Label>
              <Input
                placeholder="e.g., 7423891234567890"
                value={newSparkCode}
                onChange={(e) => setNewSparkCode(e.target.value)}
                className="bg-[#16181D] border-[#2A2D35] h-10 hover:border-[#3A3D45] transition-colors text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-2 block text-slate-300">
                Video URL (Optional)
              </Label>
              <Input
                placeholder="https://www.tiktok.com/@user/video/..."
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                className="bg-[#16181D] border-[#2A2D35] h-10 hover:border-[#3A3D45] transition-colors text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-2 block text-slate-300">Platform</Label>
              <Select
                value={newPlatform}
                onValueChange={(val) => setNewPlatform(val as "tiktok" | "facebook")}
              >
                <SelectTrigger className="bg-[#16181D] border-[#2A2D35] h-10 hover:border-[#3A3D45] transition-colors text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1E24] border-[#2A2D35]">
                  <SelectItem value="tiktok" className="text-sm">
                    TikTok
                  </SelectItem>
                  <SelectItem value="facebook" className="text-sm">
                    Facebook
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-medium mb-2 block text-slate-300">Offer</Label>
              <Select value={newOfferCode} onValueChange={setNewOfferCode}>
                <SelectTrigger className="bg-[#16181D] border-[#2A2D35] h-10 hover:border-[#3A3D45] transition-colors text-sm">
                  <SelectValue placeholder="Select an offer..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1E24] border-[#2A2D35]">
                  {Object.entries(config.offers).map(([key, value]) => (
                    <SelectItem key={key} value={key} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono">
                          {value.code}
                        </Badge>
                        <span>{value.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={addSparkCode}
            className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 h-10 font-medium transition-colors shadow-lg shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Spark Code ({getNextSparkCodeId()})
          </Button>
        </div>

        {/* Existing Spark Codes List */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-4">
            Saved Spark Codes ({sparkCodes.length})
          </h3>
          {sparkCodes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No spark codes saved yet. Add one above to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {sparkCodes.map((sc) => (
                <div
                  key={sc.id}
                  className="border border-[#2A2D35] rounded-lg p-4 bg-[#1C1E24] hover:border-[#3A3D45] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-mono text-xs">
                          {sc.id}
                        </Badge>
                        <span className="text-sm font-semibold">
                          {sc.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {sc.platform}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {
                            config.offers[
                              sc.offerCode as keyof typeof config.offers
                            ]?.name
                          }
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        <span>Code: {sc.sparkCode}</span>
                        {sc.videoUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(sc.videoUrl, "_blank")}
                            className="text-xs h-6 px-2 border-[#2A2D35] hover:bg-[#16181D]"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copySparkCode(sc.id, sc.id)}
                        className="h-7 px-2 border-[#2A2D35] hover:bg-[#16181D] hover:border-[#3A3D45] transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSparkCode(sc.id)}
                        className="h-7 px-2 border-[#2A2D35] hover:bg-red-500/10 hover:border-red-500/30 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#2A2D35]">
                    <div>
                      <p className="text-xs font-mono text-slate-400 mb-1">Clicks</p>
                      <p className="text-sm font-mono font-semibold text-white">
                        {sc.metrics.clicks.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-mono text-slate-400 mb-1">Conversions</p>
                      <p className="text-sm font-mono font-semibold text-white">
                        {sc.metrics.conversions.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-mono text-slate-400 mb-1">CVR</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-mono font-semibold text-white">
                          {sc.metrics.cvr.toFixed(2)}%
                        </p>
                        {sc.metrics.cvr >= 3 ? (
                          <TrendingUp className="w-3 h-3 text-green-400" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-mono text-slate-400 mb-1">Revenue</p>
                      <p className="text-sm font-mono font-semibold text-white">
                        ${sc.metrics.revenue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-mono text-slate-400 mb-1">Spend</p>
                      <p className="text-sm font-mono font-semibold text-white">
                        ${sc.metrics.spend.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-mono text-slate-400 mb-1">ROI</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-mono font-semibold text-white">
                          {sc.metrics.roi.toFixed(0)}%
                        </p>
                        {sc.metrics.roi >= 100 ? (
                          <TrendingUp className="w-3 h-3 text-green-400" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-[#2A2D35]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 border-[#2A2D35] hover:bg-[#1C1E24] hover:border-[#3A3D45] transition-colors text-sm font-medium"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
