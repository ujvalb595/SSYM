"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Bell, Menu, Search } from "lucide-react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (window.innerWidth < 1024) {
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          // Scrolling down -> hide header
          setShowHeader(false);
        } else {
          // Scrolling up or near top -> show header
          setShowHeader(true);
        }
      } else {
        setShowHeader(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-transparent text-[#24203a]">
      <Sidebar mobileOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="min-h-screen lg:pl-72">
        <header
          className={`sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between border-b border-[#ebe7f6] bg-white/80 px-4 sm:px-5 backdrop-blur-xl md:px-9 transition-transform duration-300 ease-in-out ${
            showHeader ? "translate-y-0" : "-translate-y-full lg:translate-y-0"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg p-2 text-stone-600 hover:bg-white lg:hidden cursor-pointer"
            >
              <Menu size={21} />
            </button>
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-[#7657f6]">{section}</p>
              <h1 className="text-base sm:text-lg font-bold">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button aria-label="Search" className="hidden rounded-lg border border-[#ebe7f6] bg-white p-2.5 text-stone-500 sm:block cursor-pointer"><Search size={18} /></button>
            <button aria-label="Notifications" className="relative rounded-lg border border-[#ebe7f6] bg-white p-2.5 text-stone-500 cursor-pointer"><Bell size={18} /><span className="absolute right-2 top-2 size-2 rounded-full bg-[#7657f6]" /></button>
            <AccountMenu />
          </div>
        </header>
        {children ?? <DashboardContent />}
      </main>
    </div>
  );
}
