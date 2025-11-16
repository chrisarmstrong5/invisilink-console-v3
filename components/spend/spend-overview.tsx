"use client";

import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface SpendOverviewProps {
  todayTotal: number;
  yesterdayTotal: number;
  weekTotal: number;
  monthTotal: number;
}

export function SpendOverview({
  todayTotal,
  yesterdayTotal,
  weekTotal,
  monthTotal,
}: SpendOverviewProps) {
  const todayChange = yesterdayTotal > 0
    ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Today's Spend</p>
            <p className="text-2xl font-bold">${todayTotal.toFixed(2)}</p>
            {todayChange !== 0 && (
              <div className="flex items-center gap-1 mt-1">
                {todayChange > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-500">
                      +{todayChange.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">
                      {todayChange.toFixed(1)}%
                    </span>
                  </>
                )}
                <span className="text-xs text-muted-foreground">vs yesterday</span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Yesterday</p>
            <p className="text-2xl font-bold">${yesterdayTotal.toFixed(2)}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">7-Day Total</p>
            <p className="text-2xl font-bold">${weekTotal.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ${(weekTotal / 7).toFixed(2)}/day avg
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">30-Day Total</p>
            <p className="text-2xl font-bold">${monthTotal.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ${(monthTotal / 30).toFixed(2)}/day avg
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-purple-500" />
          </div>
        </div>
      </Card>
    </div>
  );
}
