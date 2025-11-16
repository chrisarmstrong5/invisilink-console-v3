"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  MousePointerClick,
  Target,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { redtrackApi, type RedTrackMetrics } from "@/lib/api/redtrack";
import { config } from "@/lib/config";
import { toast } from "sonner";
import { MigrationBanner } from "@/components/migration-banner";

interface DailyStats {
  today: RedTrackMetrics;
  yesterday: RedTrackMetrics;
}

interface CampaignRow {
  source: string;
  offer: string;
  epc: number;
  clicks: number;
  cvr: number;
  revenue: number;
  spend: number;
  roi: number;
}

export default function DashboardPage() {
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [timeRange, setTimeRange] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [editingSpend, setEditingSpend] = useState<string | null>(null);
  const [spendInputs, setSpendInputs] = useState<Record<string, string>>({});

  // Load data
  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [daily, revenue, activeCampaigns] = await Promise.all([
        redtrackApi.getDailyMetrics(),
        redtrackApi.getRevenueTimeSeries(timeRange),
        redtrackApi.getActiveCampaigns({
          from: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          to: new Date().toISOString().split("T")[0],
        }),
      ]);

      setDailyStats(daily);
      setRevenueData(revenue);
      setCampaigns(activeCampaigns);

      // Initialize spend inputs
      const spendMap: Record<string, string> = {};
      activeCampaigns.forEach((c) => {
        spendMap[c.source] = c.spend.toString();
      });
      setSpendInputs(spendMap);
    } catch (error: any) {
      console.error("Failed to load dashboard data:", error);

      // Show detailed error message
      const errorMessage = error?.message || "Failed to connect to RedTrack API";
      const errorDetails = error?.details || "The API key may be invalid or the endpoint structure has changed.";

      toast.error(
        `RedTrack API Error: ${errorMessage}`,
        {
          description: errorDetails,
          duration: 10000,
        }
      );
    }
    setLoading(false);
  }

  // Save spend to localStorage
  function saveSpend(source: string, value: string) {
    const spend = parseFloat(value) || 0;
    localStorage.setItem(`source-spend-${source}`, spend.toString());
    setEditingSpend(null);
    loadDashboardData(); // Refresh to recalculate ROI
  }

  // Calculate percentage change
  function calcChange(current: number, previous: number): { value: number; isPositive: boolean } {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg font-semibold text-foreground">Loading Dashboard...</div>
          <div className="text-sm text-muted-foreground">Fetching RedTrack metrics</div>
        </div>
      </div>
    );
  }

  const revenueChange = dailyStats ? calcChange(dailyStats.today.revenue, dailyStats.yesterday.revenue) : { value: 0, isPositive: true };
  const epcChange = dailyStats ? calcChange(dailyStats.today.epc, dailyStats.yesterday.epc) : { value: 0, isPositive: true };
  const clicksChange = dailyStats ? calcChange(dailyStats.today.clicks, dailyStats.yesterday.clicks) : { value: 0, isPositive: true };
  const cvrChange = dailyStats ? calcChange(dailyStats.today.cvr, dailyStats.yesterday.cvr) : { value: 0, isPositive: true };

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time performance metrics from RedTrack</p>
      </div>

      {/* Migration Banner */}
      <MigrationBanner />

      {/* Daily Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <Card className="p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Revenue</span>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="mb-2 text-2xl font-bold text-foreground">
            ${dailyStats?.today.revenue.toFixed(2) || "0.00"}
          </div>
          <div className="flex items-center gap-1 text-xs">
            {revenueChange.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={revenueChange.isPositive ? "text-green-600" : "text-red-600"}>
              {revenueChange.value.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs yesterday</span>
          </div>
        </Card>

        {/* EPC */}
        <Card className="p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">EPC</span>
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="mb-2 text-2xl font-bold text-foreground">
            ${dailyStats?.today.epc.toFixed(3) || "0.000"}
          </div>
          <div className="flex items-center gap-1 text-xs">
            {epcChange.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={epcChange.isPositive ? "text-green-600" : "text-red-600"}>
              {epcChange.value.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs yesterday</span>
          </div>
        </Card>

        {/* Clicks */}
        <Card className="p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Clicks</span>
            <MousePointerClick className="h-5 w-5 text-primary" />
          </div>
          <div className="mb-2 text-2xl font-bold text-foreground">
            {dailyStats?.today.clicks.toLocaleString() || "0"}
          </div>
          <div className="flex items-center gap-1 text-xs">
            {clicksChange.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={clicksChange.isPositive ? "text-green-600" : "text-red-600"}>
              {clicksChange.value.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs yesterday</span>
          </div>
        </Card>

        {/* CVR */}
        <Card className="p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">CVR</span>
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="mb-2 text-2xl font-bold text-foreground">
            {dailyStats?.today.cvr.toFixed(2) || "0.00"}%
          </div>
          <div className="flex items-center gap-1 text-xs">
            {cvrChange.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={cvrChange.isPositive ? "text-green-600" : "text-red-600"}>
              {cvrChange.value.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs yesterday</span>
          </div>
        </Card>
      </div>

      {/* Revenue Graph */}
      <Card className="mb-8 p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Revenue Over Time</h3>
            <p className="text-sm text-muted-foreground">Daily revenue trend</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeRange === 7 ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(7)}
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(30)}
            >
              30 Days
            </Button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: "12px" }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Line type="monotone" dataKey="revenue" stroke="#635BFF" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Active Campaigns Table */}
      <Card className="p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Active Campaigns</h3>
          <p className="text-sm text-muted-foreground">Performance metrics for the last {timeRange} days</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Offer</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">EPC</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">Clicks</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">CVR</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">Spend</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map((c) => (
                <tr key={c.source} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-foreground">{c.source}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{c.offer}</td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-foreground">${c.epc.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-foreground">{c.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-foreground">{c.cvr.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-foreground">${c.revenue.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    {editingSpend === c.source ? (
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={spendInputs[c.source] || ""}
                          onChange={(e) =>
                            setSpendInputs({ ...spendInputs, [c.source]: e.target.value })
                          }
                          className="h-7 w-24 text-right text-sm"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => saveSpend(c.source, spendInputs[c.source])}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingSpend(c.source)}
                        className="text-sm font-mono text-foreground hover:text-primary"
                      >
                        ${c.spend.toFixed(2)}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-sm font-semibold ${
                        c.roi >= 100 ? "text-green-600" : c.roi >= 0 ? "text-yellow-600" : "text-red-600"
                      }`}
                    >
                      {c.roi.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {campaigns.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No active campaigns found for this time range
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
