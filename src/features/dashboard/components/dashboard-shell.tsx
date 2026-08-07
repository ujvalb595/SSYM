"use client";

import { useState, type ReactNode } from "react";
import { Bell, Menu, Search, X } from "lucide-react";
import { Sidebar } from "@/features/dashboard/components/sidebar";
import { DashboardContent } from "@/features/dashboard/components/dashboard-content";
import { AccountMenu } from "@/features/dashboard/components/account-menu";

export function DashboardShell({
  children,
  section = "Overview",
  title = "Good morning, Super Admin",
}: {
  children?: ReactNode;
  section?: string;
  title?: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-transparent text-[#24203a]">
      {/* Fixed Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex w-72 flex-col bg-white shadow-2xl">
            <div className="flex h-20 items-center justify-between border-b border-[#f0edf8] px-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7257f4] to-[#bc59ec] text-lg font-black text-white shadow-lg shadow-violet-200">
                  SS
                </span>
                <div>
                  <p className="font-bold tracking-tight">SSYM</p>
                  <p className="text-xs text-stone-400">Management System</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto" onClick={() => setMobileMenuOpen(false)}>
              <Sidebar isMobile />
            </div>
          </div>
        </div>
      )}

      {/* Main Locked Container */}
      <main className="relative flex min-h-screen max-w-full flex-col overflow-x-hidden lg:pl-72">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-[#ebe7f6] bg-white/80 px-5 backdrop-blur-xl md:px-9">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
              className="rounded-xl border border-[#ebe7f6] bg-white p-2.5 text-stone-600 shadow-sm transition hover:bg-violet-50 lg:hidden"
            >
              <Menu size={21} />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7657f6]">{section}</p>
              <h1 className="text-lg font-bold">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              aria-label="Search"
              className="hidden rounded-xl border border-[#ebe7f6] bg-white p-2.5 text-stone-500 shadow-sm sm:block"
            >
              <Search size={18} />
            </button>
            <button
              aria-label="Notifications"
              className="relative rounded-xl border border-[#ebe7f6] bg-white p-2.5 text-stone-500 shadow-sm"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-[#7657f6]" />
            </button>
            <AccountMenu />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 w-full max-w-full overflow-x-hidden">
          {children ?? <DashboardContent />}
        </div>
      </main>
    </div>
  );
}
