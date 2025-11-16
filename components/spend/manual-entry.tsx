"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface ManualEntryProps {
  onSuccess: () => void;
}

export function ManualEntry({ onSuccess }: ManualEntryProps) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [accountId, setAccountId] = useState("");
  const [platform, setPlatform] = useState<"tiktok" | "facebook">("tiktok");
  const [amount, setAmount] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!accountId || !amount) {
      toast.error("Please fill in account ID and amount");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/spend/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          accountId,
          platform,
          amount: amountNum,
          campaignName: campaignName || undefined,
          notes: notes || undefined,
        }),
      });

      if (response.ok) {
        toast.success("Spend record added successfully");
        // Reset form
        setAccountId("");
        setAmount("");
        setCampaignName("");
        setNotes("");
        setDate(new Date().toISOString().split("T")[0]);
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to add spend record");
      }
    } catch (error) {
      toast.error("Failed to add spend record");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Quick Add Spend</h3>
        <p className="text-sm text-muted-foreground">Manually add a spend record</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={(v: "tiktok" | "facebook") => setPlatform(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="accountId">Account ID</Label>
            <Input
              id="accountId"
              placeholder="e.g., 1639, 1784"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="campaignName">Campaign Name (Optional)</Label>
          <Input
            id="campaignName"
            placeholder="e.g., Apple Watch - TikTok Ads"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          {loading ? "Adding..." : "Add Spend Record"}
        </Button>
      </form>
    </Card>
  );
}
