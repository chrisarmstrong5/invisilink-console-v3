"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skull, TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LinkPerformance {
  slug: string;
  offerName: string;
  accountNumber: string;
  sparkCodeId?: string;
  platform: "tiktok" | "facebook";
  createdAt: Date;
  clicks: number;
  conversions: number;
  revenue: number;
  spend: number;
  profit: number;
  roi: number;
  cvr: number;
  epc: number;
  isKilled: boolean;
}

export default function PerformancePage() {
  const [links, setLinks] = useState<LinkPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7" | "30">("7");
  const [platformFilter, setPlatformFilter] = useState<"all" | "tiktok" | "facebook">("all");
  const [sortBy, setSortBy] = useState<"profit" | "roi" | "revenue">("profit");

  useEffect(() => {
    fetchPerformance();
  }, [dateRange]);

  async function fetchPerformance() {
    setLoading(true);
    try {
      const response = await fetch(`/api/performance?days=${dateRange}`);
      const data = await response.json();

      if (data.success) {
        setLinks(data.links);
      } else {
        toast.error("Failed to load performance data");
      }
    } catch (error) {
      toast.error("Error loading performance data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function killLink(slug: string, offerName: string) {
    if (!confirm(`Kill link "${offerName}" (${slug})? This will add it to the kill list.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/links/${slug}/kill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Manually killed from performance dashboard" }),
      });

      if (response.ok) {
        toast.success(`Link ${slug} killed`);
        await fetchPerformance(); // Refresh data
      } else {
        toast.error("Failed to kill link");
      }
    } catch (error) {
      toast.error("Error killing link");
      console.error(error);
    }
  }

  // Filter and sort links
  const filteredLinks = links
    .filter((link) => {
      if (platformFilter === "all") return true;
      return link.platform === platformFilter;
    })
    .sort((a, b) => {
      if (sortBy === "profit") return b.profit - a.profit;
      if (sortBy === "roi") return b.roi - a.roi;
      if (sortBy === "revenue") return b.revenue - a.revenue;
      return 0;
    });

  // Calculate totals
  const totals = filteredLinks.reduce(
    (acc, link) => ({
      revenue: acc.revenue + link.revenue,
      spend: acc.spend + link.spend,
      profit: acc.profit + link.profit,
      clicks: acc.clicks + link.clicks,
      conversions: acc.conversions + link.conversions,
    }),
    { revenue: 0, spend: 0, profit: 0, clicks: 0, conversions: 0 }
  );

  const totalROI = totals.spend > 0 ? ((totals.profit / totals.spend) * 100) : 0;

  function getROIColor(roi: number): string {
    if (roi < 0) return "text-red-400";
    if (roi < 100) return "text-yellow-400";
    return "text-green-400";
  }

  function getProfitColor(profit: number): string {
    if (profit < 0) return "text-red-400";
    if (profit < 50) return "text-yellow-400";
    return "text-green-400";
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Link Performance</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Track ROI, profit, and performance across all your links
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">
                ${totals.revenue.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400/50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Spend</p>
              <p className="text-2xl font-bold text-red-400">
                ${totals.spend.toFixed(2)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-400/50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Profit</p>
              <p className={`text-2xl font-bold ${getProfitColor(totals.profit)}`}>
                ${totals.profit.toFixed(2)}
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${getProfitColor(totals.profit)}/50`} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total ROI</p>
              <p className={`text-2xl font-bold ${getROIColor(totalROI)}`}>
                {totalROI.toFixed(0)}%
              </p>
            </div>
            <div className={`text-3xl ${getROIColor(totalROI)}`}>
              {totalROI >= 100 ? "📈" : totalROI >= 0 ? "📊" : "📉"}
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Date Range</label>
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as "7" | "30")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Platform</label>
            <Select
              value={platformFilter}
              onValueChange={(v) => setPlatformFilter(v as "all" | "tiktok" | "facebook")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Sort By</label>
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as "profit" | "roi" | "revenue")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit">Profit</SelectItem>
                <SelectItem value="roi">ROI %</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={fetchPerformance} variant="outline">
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Performance Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground">
            No links found. Generate some links and they'll appear here once they get traffic.
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {filteredLinks.map((link) => (
                <Card key={link.slug} className={`p-4 ${link.isKilled ? "opacity-50 bg-red-950/20" : ""}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-mono text-sm font-semibold mb-1">{link.slug}</div>
                      <div className="text-sm font-medium mb-1">{link.offerName}</div>
                      <div className="text-xs text-muted-foreground">{link.accountNumber}</div>
                      {link.sparkCodeId && (
                        <div className="text-xs text-muted-foreground mt-1">
                          SC: {link.sparkCodeId}
                        </div>
                      )}
                    </div>
                    <Badge variant={link.platform === "tiktok" ? "default" : "secondary"}>
                      {link.platform}
                    </Badge>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3 border-t pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                      <p className="text-sm font-semibold">{link.clicks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Conv</p>
                      <p className="text-sm font-semibold">{link.conversions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CVR</p>
                      <p className="text-sm font-semibold">{link.cvr.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">EPC</p>
                      <p className="text-sm font-semibold">${link.epc.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-sm font-semibold text-green-400">${link.revenue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Spend</p>
                      <p className="text-sm font-semibold text-red-400">${link.spend.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Profit</p>
                      <p className={`text-sm font-semibold ${getProfitColor(link.profit)}`}>
                        ${link.profit.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ROI</p>
                      <p className={`text-sm font-semibold ${getROIColor(link.roi)}`}>
                        {link.roi.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="border-t pt-3">
                    {link.isKilled ? (
                      <Badge variant="destructive" className="w-full justify-center">Killed</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-9 gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => killLink(link.slug, link.offerName)}
                      >
                        <Skull className="h-4 w-4" />
                        Kill Link
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link</TableHead>
                  <TableHead>Offer</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conv</TableHead>
                  <TableHead className="text-right">CVR</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">EPC</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.map((link) => (
                  <TableRow
                    key={link.slug}
                    className={link.isKilled ? "opacity-50 bg-red-950/20" : ""}
                  >
                    <TableCell>
                      <div className="font-mono text-sm">{link.slug}</div>
                      {link.sparkCodeId && (
                        <div className="text-xs text-muted-foreground">
                          SC: {link.sparkCodeId}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{link.offerName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{link.accountNumber}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={link.platform === "tiktok" ? "default" : "secondary"}>
                        {link.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{link.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{link.conversions}</TableCell>
                    <TableCell className="text-right">{link.cvr.toFixed(2)}%</TableCell>
                    <TableCell className="text-right text-green-400">
                      ${link.revenue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-red-400">
                      ${link.spend.toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${getProfitColor(link.profit)}`}>
                      ${link.profit.toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${getROIColor(link.roi)}`}>
                      {link.roi.toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right">${link.epc.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      {link.isKilled ? (
                        <Badge variant="destructive">Killed</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => killLink(link.slug, link.offerName)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        >
                          <Skull className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </>
        )}
      </Card>

      {/* Footer Stats */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {filteredLinks.length} links • {totals.clicks.toLocaleString()} total clicks •{" "}
        {totals.conversions} conversions
      </div>
    </div>
  );
}
