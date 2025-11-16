"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Home,
  Link2,
  Sparkles,
  BarChart3,
  Eye,
  Settings,
  TrendingUp,
} from "lucide-react";

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/links", icon: Link2, label: "Link Generator" },
    { href: "/spark-codes", icon: Sparkles, label: "Spark Codes" },
    { href: "/performance", icon: TrendingUp, label: "Performance" },
    { href: "/spark-codes-analytics", icon: BarChart3, label: "Spark Analytics" },
    { href: "/competitors", icon: Eye, label: "Competitor Spy" },
    { href: "/setup", icon: Settings, label: "Setup" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              IL
            </div>
            <div>
              <div className="text-base font-semibold">InvisiLink</div>
              <div className="text-xs text-muted-foreground font-normal">
                Console v3.0
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col p-4 gap-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="text-xs text-muted-foreground">
            <div className="font-medium mb-1">RedTrack Connected</div>
            <div className="text-[10px]">rgbad.ttrk.io</div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
