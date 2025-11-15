"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { SparkCode } from "@/lib/config";
import { redtrackApi, RedTrackMetrics, DateRange } from "@/lib/api/redtrack";
import { Loader2, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface SparkCodeWithMetrics extends SparkCode {
  metrics: RedTrackMetrics & {
    spend: number;
    roi: number;
  };
}

export default function SparkCodeAnalyticsPage() {
  const [sparkCodes] = useLocalStorage<SparkCode[]>("spark-codes", []);
  const [metricsData, setMetricsData] = useState<SparkCodeWithMetrics[]>([]);
  const [timeRange, setTimeRange] = useState<7 | 30>(7);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spendInputs, setSpendInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMetrics();
  }, [timeRange, sparkCodes]);

  async function loadMetrics() {
    setIsLoading(true);
    setError(null);

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const dateRange: DateRange = {
        from: startDate.toISOString().split("T")[0],
        to: endDate.toISOString().split("T")[0],
      };

      // Fetch reports grouped by sub1 (Spark Code ID)
      const reports = await redtrackApi.getReports(dateRange, ["sub1"]);

      // Match reports to saved Spark Codes
      const metricsWithDetails: SparkCodeWithMetrics[] = sparkCodes
        .map((sc) => {
          // Find matching report
          const report = reports.find((r) => r.sub1 === sc.id);

          // Get saved spend from localStorage
          const spend = parseFloat(
            localStorage.getItem(`sparkcode-spend-${sc.id}`) || "0"
          );

          // Calculate metrics
          const clicks = report?.clicks || 0;
          const conversions = report?.conversions || 0;
          const revenue = report?.revenue || 0;
          const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;
          const epc = clicks > 0 ? revenue / clicks : 0;
          const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

          return {
            ...sc,
            metrics: {
              clicks,
              conversions,
              revenue,
              cvr,
              epc,
              roi,
              spend,
              cost: spend,
            },
          };
        })
        .sort((a, b) => b.metrics.revenue - a.metrics.revenue); // Sort by revenue desc

      setMetricsData(metricsWithDetails);

      // Initialize spend inputs
      const initialSpends: Record<string, string> = {};
      metricsWithDetails.forEach((sc) => {
        initialSpends[sc.id] = sc.metrics.spend.toFixed(2);
      });
      setSpendInputs(initialSpends);
    } catch (err) {
      console.error("Failed to load Spark Code metrics:", err);
      setError("Failed to load metrics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSpendChange(sparkCodeId: string, value: string) {
    setSpendInputs((prev) => ({
      ...prev,
      [sparkCodeId]: value,
    }));
  }

  function handleSpendBlur(sparkCodeId: string) {
    const value = parseFloat(spendInputs[sparkCodeId] || "0");
    if (!isNaN(value)) {
      localStorage.setItem(`sparkcode-spend-${sparkCodeId}`, value.toFixed(2));
      // Reload metrics to recalculate ROI
      loadMetrics();
    }
  }

  // Calculate totals
  const totals = metricsData.reduce(
    (acc, sc) => ({
      clicks: acc.clicks + sc.metrics.clicks,
      conversions: acc.conversions + sc.metrics.conversions,
      revenue: acc.revenue + sc.metrics.revenue,
      spend: acc.spend + sc.metrics.spend,
    }),
    { clicks: 0, conversions: 0, revenue: 0, spend: 0 }
  );

  const totalCvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
  const totalEpc = totals.clicks > 0 ? totals.revenue / totals.clicks : 0;
  const totalRoi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Spark Code Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track performance metrics for each Spark Code
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v) as 7 | 30)}>
            <TabsList>
              <TabsTrigger value="7">7 Days</TabsTrigger>
              <TabsTrigger value="30">30 Days</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={loadMetrics} disabled={isLoading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl">${totals.revenue.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Clicks</CardDescription>
            <CardTitle className="text-2xl">{totals.clicks.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average EPC</CardDescription>
            <CardTitle className="text-2xl">${totalEpc.toFixed(3)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total ROI</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {totalRoi > 0 ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-green-500">+{totalRoi.toFixed(1)}%</span>
                </>
              ) : totalRoi < 0 ? (
                <>
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <span className="text-red-500">{totalRoi.toFixed(1)}%</span>
                </>
              ) : (
                "0%"
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Spark Code Table */}
      <Card>
        <CardHeader>
          <CardTitle>Spark Code Performance</CardTitle>
          <CardDescription>
            {metricsData.length} Spark Codes tracked over the last {timeRange} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : metricsData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No Spark Codes found.</p>
              <p className="text-sm mt-2">Create Spark Codes in the Spark Codes page to start tracking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Offer</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead className="text-right">CVR</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead className="text-right">EPC</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metricsData.map((sc) => (
                    <TableRow key={sc.id}>
                      <TableCell className="font-medium">{sc.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sc.platform === "tiktok" ? "TikTok" : "Facebook"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sc.offerCode}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{sc.metrics.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{sc.metrics.conversions}</TableCell>
                      <TableCell className="text-right">{sc.metrics.cvr.toFixed(2)}%</TableCell>
                      <TableCell className="text-right font-medium">
                        ${sc.metrics.revenue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={spendInputs[sc.id] || "0"}
                          onChange={(e) => handleSpendChange(sc.id, e.target.value)}
                          onBlur={() => handleSpendBlur(sc.id)}
                          className="w-24 h-8 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">${sc.metrics.epc.toFixed(3)}</TableCell>
                      <TableCell className="text-right">
                        {sc.metrics.roi > 0 ? (
                          <span className="text-green-600 font-medium">
                            +{sc.metrics.roi.toFixed(1)}%
                          </span>
                        ) : sc.metrics.roi < 0 ? (
                          <span className="text-red-600 font-medium">
                            {sc.metrics.roi.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0%</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use Spark Code Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>1. Create Spark Codes:</strong> Go to the Spark Codes page to add your TikTok/Facebook Spark Codes.
          </p>
          <p>
            <strong>2. Generate Links:</strong> When creating links, select the Spark Code to associate it with the campaign.
          </p>
          <p>
            <strong>3. Track Spend:</strong> Enter your ad spend for each Spark Code in the "Spend" column to calculate ROI.
          </p>
          <p>
            <strong>4. Monitor Performance:</strong> View clicks, conversions, revenue, and ROI for each creator/ad.
          </p>
          <p>
            <strong>Note:</strong> Metrics are pulled from RedTrack API using the sub1 parameter (Spark Code ID).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
