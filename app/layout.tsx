"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile/mobile-nav";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { MobileDrawer } from "@/components/mobile/mobile-drawer";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex h-screen overflow-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* Mobile Drawer */}
          <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto flex flex-col">
            {/* Mobile Header */}
            <MobileHeader onMenuClick={() => setDrawerOpen(true)} />

            {/* Page Content */}
            <div className="flex-1 pb-16 md:pb-0">
              {children}
            </div>

            {/* Mobile Bottom Nav */}
            <MobileNav />
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
