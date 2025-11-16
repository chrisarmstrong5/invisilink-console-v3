"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SpendChartProps {
  data: Array<{
    date: string;
    tiktok: number;
    facebook: number;
    total: number;
  }>;
  dateRange: "7" | "30" | "90";
  onDateRangeChange: (range: "7" | "30" | "90") => void;
}

export function SpendChart({ data, dateRange, onDateRangeChange }: SpendChartProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Spend Trend</h3>
          <p className="text-sm text-muted-foreground">Daily spend over time</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={dateRange === "7" ? "default" : "outline"}
            onClick={() => onDateRangeChange("7")}
          >
            7 Days
          </Button>
          <Button
            size="sm"
            variant={dateRange === "30" ? "default" : "outline"}
            onClick={() => onDateRangeChange("30")}
          >
            30 Days
          </Button>
          <Button
            size="sm"
            variant={dateRange === "90" ? "default" : "outline"}
            onClick={() => onDateRangeChange("90")}
          >
            90 Days
          </Button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          <p className="text-sm">No spend data for this period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium mb-2">
                      {payload[0].payload.date}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">TikTok:</span>
                        <span className="text-xs font-medium text-[hsl(var(--chart-1))]">
                          ${payload[0].payload.tiktok.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Facebook:</span>
                        <span className="text-xs font-medium text-[hsl(var(--chart-2))]">
                          ${payload[0].payload.facebook.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 pt-1 border-t">
                        <span className="text-xs font-medium">Total:</span>
                        <span className="text-xs font-bold">
                          ${payload[0].payload.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="tiktok"
              name="TikTok"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="facebook"
              name="Facebook"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
