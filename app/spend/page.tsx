"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Upload, RefreshCw } from "lucide-react";
import { SpendOverview } from "@/components/spend/spend-overview";
import { SpendChart } from "@/components/spend/spend-chart";
import { SpendTable } from "@/components/spend/spend-table";
import { ManualEntry } from "@/components/spend/manual-entry";
import { CSVSpendImporter } from "@/components/csv-spend-importer";

interface SpendStats {
  today: number;
  yesterday: number;
  week: number;
  month: number;
}

interface ChartData {
  date: string;
  tiktok: number;
  facebook: number;
  total: number;
}

interface SpendRecord {
  id: number;
  date: string;
  accountId: string;
  platform: string;
  amount: number;
  campaignName?: string;
  notes?: string;
}

export default function SpendTrackingPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SpendStats>({
    today: 0,
    yesterday: 0,
    week: 0,
    month: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [dateRange, setDateRange] = useState<"7" | "30" | "90">("30");
  const [records, setRecords] = useState<SpendRecord[]>([]);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch stats
      const [todayRes, yesterdayRes, weekRes, monthRes] = await Promise.all([
        fetch("/api/spend/stats?period=today"),
        fetch("/api/spend/stats?period=yesterday"),
        fetch("/api/spend/stats?period=week"),
        fetch("/api/spend/stats?period=month"),
      ]);

      if (todayRes.ok) {
        const data = await todayRes.json();
        setStats((prev) => ({ ...prev, today: data.total || 0 }));
      }
      if (yesterdayRes.ok) {
        const data = await yesterdayRes.json();
        setStats((prev) => ({ ...prev, yesterday: data.total || 0 }));
      }
      if (weekRes.ok) {
        const data = await weekRes.json();
        setStats((prev) => ({ ...prev, week: data.total || 0 }));
      }
      if (monthRes.ok) {
        const data = await monthRes.json();
        setStats((prev) => ({ ...prev, month: data.total || 0 }));
      }

      // Fetch chart data
      const chartRes = await fetch(`/api/spend/chart?days=${dateRange}`);
      if (chartRes.ok) {
        const data = await chartRes.json();
        setChartData(data.data || []);
      }

      // Fetch records
      const recordsRes = await fetch(`/api/spend/records?limit=100`);
      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error("Failed to fetch spend data:", error);
      toast.error("Failed to load spend data");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const response = await fetch(`/api/spend/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Spend record deleted");
        fetchData();
      } else {
        toast.error("Failed to delete spend record");
      }
    } catch (error) {
      toast.error("Failed to delete spend record");
      console.error(error);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Spend Tracking</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Track and analyze ad spend across platforms
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <SpendOverview
        todayTotal={stats.today}
        yesterdayTotal={stats.yesterday}
        weekTotal={stats.week}
        monthTotal={stats.month}
      />

      {/* Chart */}
      <SpendChart
        data={chartData}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Import & Manual Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSV Import */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">CSV Import</h2>
          </div>
          <CSVSpendImporter onImportComplete={fetchData} />
        </Card>

        {/* Manual Entry */}
        <ManualEntry onSuccess={fetchData} />
      </div>

      {/* Spend Table */}
      <SpendTable records={records} onDelete={handleDelete} />
    </div>
  );
}
