"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface SpendRecord {
  id: number;
  date: string;
  accountId: string;
  platform: string;
  amount: number;
  campaignName?: string;
  notes?: string;
}

interface SpendTableProps {
  records: SpendRecord[];
  onDelete?: (id: number) => void;
}

export function SpendTable({ records, onDelete }: SpendTableProps) {
  // Group by account
  const accountTotals = records.reduce((acc, record) => {
    const key = `${record.accountId}-${record.platform}`;
    if (!acc[key]) {
      acc[key] = {
        accountId: record.accountId,
        platform: record.platform,
        total: 0,
        count: 0,
      };
    }
    acc[key].total += record.amount;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { accountId: string; platform: string; total: number; count: number }>);

  const sortedAccounts = Object.values(accountTotals).sort((a, b) => b.total - a.total);

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Spend by Account</h3>
        <p className="text-sm text-muted-foreground">Breakdown of spend across accounts</p>
      </div>

      {sortedAccounts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No spend records yet</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Account ID</th>
                  <th className="pb-3 font-medium">Platform</th>
                  <th className="pb-3 font-medium text-right">Total Spend</th>
                  <th className="pb-3 font-medium text-right">Records</th>
                  <th className="pb-3 font-medium text-right">Avg/Record</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedAccounts.map((account, idx) => (
                  <tr key={idx} className="text-sm">
                    <td className="py-3 font-mono">{account.accountId}</td>
                    <td className="py-3">
                      <Badge
                        variant={account.platform === "tiktok" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {account.platform}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-semibold">
                      ${account.total.toFixed(2)}
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      {account.count}
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      ${(account.total / account.count).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {sortedAccounts.map((account, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-sm font-medium">{account.accountId}</p>
                    <Badge
                      variant={account.platform === "tiktok" ? "default" : "secondary"}
                      className="capitalize mt-1"
                    >
                      {account.platform}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${account.total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{account.count} records</p>
                  </div>
                </div>
                <div className="pt-3 border-t text-xs text-muted-foreground">
                  Average: ${(account.total / account.count).toFixed(2)} per record
                </div>
              </Card>
            ))}
          </div>

          {/* Recent Records */}
          <div className="mt-8 pt-6 border-t">
            <h4 className="text-sm font-semibold mb-4">Recent Records</h4>
            <div className="space-y-2">
              {records.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        {record.date}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {record.accountId}
                      </Badge>
                      <Badge
                        variant={record.platform === "tiktok" ? "default" : "secondary"}
                        className="text-[10px] h-5 capitalize"
                      >
                        {record.platform}
                      </Badge>
                    </div>
                    {record.campaignName && (
                      <p className="text-xs text-muted-foreground truncate">
                        {record.campaignName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">
                      ${record.amount.toFixed(2)}
                    </span>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(record.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
