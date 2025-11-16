"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { TrendingUp, Zap, Clock, ExternalLink } from "lucide-react";
import { config } from "@/lib/config";

interface BoostHistory {
  id?: string;
  tiktokLink: string;
  likes: number;
  saves: number;
  views?: number;
  date?: string;
  orderIds: number[];
  cost?: number;
}

export default function EngagementBoostPage() {
  // Form state
  const [tiktokLink, setTiktokLink] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [likes, setLikes] = useState(config.smmPanel.defaults.likes);
  const [saves, setSaves] = useState(config.smmPanel.defaults.saves);
  const [boosting, setBoosting] = useState(false);

  // History state
  const [boostHistory, setBoostHistory] = useState<BoostHistory[]>([]);

  // Load history from database
  useEffect(() => {
    async function fetchBoostHistory() {
      try {
        const response = await fetch("/api/boost-history");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setBoostHistory(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch boost history:", error);
      }
    }
    fetchBoostHistory();
  }, []);

  // Reset to defaults when toggling custom
  useEffect(() => {
    if (!useCustom) {
      setLikes(config.smmPanel.defaults.likes);
      setSaves(config.smmPanel.defaults.saves);
    }
  }, [useCustom]);

  // Save history to database
  const saveBoost = async (boost: BoostHistory) => {
    try {
      const response = await fetch("/api/boost-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(boost),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBoostHistory([data.data, ...boostHistory]);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Failed to save boost history:", error);
      return false;
    }
  };

  // Handle boost
  async function handleBoost() {
    // Validation
    if (!tiktokLink.trim()) {
      toast.error("Please enter a TikTok link");
      return;
    }

    if (!tiktokLink.includes("tiktok.com")) {
      toast.error("Invalid TikTok link");
      return;
    }

    if (likes <= 0 && saves <= 0) {
      toast.error("Please enter at least likes or saves");
      return;
    }

    setBoosting(true);

    try {
      const response = await fetch("/api/smm/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiktokLink: tiktokLink.trim(),
          likes,
          saves,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Add to history
        const newBoost: BoostHistory = {
          tiktokLink: tiktokLink.trim(),
          likes,
          saves,
          orderIds: data.orders || [],
        };

        const saved = await saveBoost(newBoost);

        if (saved) {
          toast.success(
            `Engagement boost successful! Orders: ${data.orders.join(", ")}`
          );

          // Reset form
          setTiktokLink("");
          if (!useCustom) {
            setLikes(config.smmPanel.defaults.likes);
            setSaves(config.smmPanel.defaults.saves);
          }
        } else {
          toast.warning(
            `Boost orders placed (${data.orders.join(", ")}), but failed to save to history`
          );
        }
      } else {
        toast.error(data.error || data.message || "Failed to boost engagement");
      }
    } catch (error) {
      toast.error("Failed to boost engagement");
      console.error(error);
    } finally {
      setBoosting(false);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
          <Zap className="w-7 h-7 text-yellow-500" />
          Engagement Boost
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Instantly boost likes, saves, and views on any TikTok video
        </p>
      </div>

      {/* Quick Boost Form */}
      <Card className="p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Quick Boost</h2>
        </div>

        <div className="space-y-4">
          {/* TikTok Link */}
          <div>
            <Label className="mb-2 block">TikTok Video URL</Label>
            <Input
              placeholder="https://www.tiktok.com/@user/video/123..."
              value={tiktokLink}
              onChange={(e) => setTiktokLink(e.target.value)}
              className="h-11"
            />
          </div>

          {/* Custom Amounts Toggle */}
          <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
            <div>
              <Label className="font-medium">Use Custom Amounts</Label>
              <p className="text-xs text-muted-foreground">
                Default: {config.smmPanel.defaults.likes} likes, {config.smmPanel.defaults.saves} saves
              </p>
            </div>
            <Switch checked={useCustom} onCheckedChange={setUseCustom} />
          </div>

          {/* Engagement Settings */}
          {useCustom && (
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <div>
                <Label className="mb-2 block text-sm">Likes</Label>
                <Input
                  type="number"
                  placeholder="1900"
                  value={likes}
                  onChange={(e) => setLikes(parseInt(e.target.value) || 0)}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="mb-2 block text-sm">Saves</Label>
                <Input
                  type="number"
                  placeholder="180"
                  value={saves}
                  onChange={(e) => setSaves(parseInt(e.target.value) || 0)}
                  className="h-10"
                />
              </div>
            </div>
          )}

          {/* Boost Button */}
          <Button
            onClick={handleBoost}
            disabled={boosting}
            className="w-full h-12 text-base gap-2"
          >
            {boosting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Boosting...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Boost Engagement ({likes} likes, {saves} saves)
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Boost History */}
      <Card className="p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Boost History</h2>
          <Badge variant="secondary" className="ml-auto">
            {boostHistory.length} total
          </Badge>
        </div>

        {boostHistory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No boosts yet. Add your first one above!</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {boostHistory.map((boost) => (
                <Card key={boost.id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <a
                        href={boost.tiktokLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{boost.tiktokLink}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      {boost.date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(boost.date).toLocaleDateString()} at{" "}
                          {new Date(boost.date).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
                    <div>
                      <span className="text-muted-foreground">Likes:</span>{" "}
                      <span className="font-semibold">{boost.likes.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Saves:</span>{" "}
                      <span className="font-semibold">{boost.saves.toLocaleString()}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Orders:</span>{" "}
                      <span className="font-mono text-xs">{boost.orderIds.join(", ")}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">TikTok Link</th>
                    <th className="pb-3 font-medium text-right">Likes</th>
                    <th className="pb-3 font-medium text-right">Saves</th>
                    <th className="pb-3 font-medium">Order IDs</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {boostHistory.map((boost) => (
                    <tr key={boost.id} className="text-sm">
                      <td className="py-3 text-muted-foreground">
                        {boost.date ? (
                          <>
                            {new Date(boost.date).toLocaleDateString()}
                            <br />
                            <span className="text-xs">
                              {new Date(boost.date).toLocaleTimeString()}
                            </span>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3">
                        <a
                          href={boost.tiktokLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 max-w-md truncate"
                        >
                          <span className="truncate">{boost.tiktokLink}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {boost.likes.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {boost.saves.toLocaleString()}
                      </td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">
                        {boost.orderIds.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
