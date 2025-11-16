"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Link2, Sparkles, Eye, BarChart3, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Link Generator", href: "/links", icon: Link2 },
  { name: "Spend Tracking", href: "/spend", icon: DollarSign },
  { name: "Spark Codes", href: "/spark-codes", icon: Sparkles },
  { name: "Spark Analytics", href: "/spark-codes-analytics", icon: BarChart3 },
  { name: "Competitor Spy", href: "/competitors", icon: Eye },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo & Title */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <span className="text-xl font-bold text-primary-foreground">IL</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground">InvisiLink</h1>
          <p className="text-xs text-muted-foreground">Console v3.0</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <div className="mb-1 font-medium text-foreground">RedTrack Connected</div>
          <div className="font-mono">rgbad.ttrk.io</div>
        </div>
      </div>
    </div>
  );
}
