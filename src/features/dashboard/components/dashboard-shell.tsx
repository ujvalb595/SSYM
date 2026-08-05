import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { Sidebar } from "@/features/dashboard/components/sidebar";
import { DashboardContent } from "@/features/dashboard/components/dashboard-content";

export function DashboardShell() {
  return (
    <div className="min-h-screen bg-transparent text-[#24203a]">
      <Sidebar />
      <main className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#ebe7f6] bg-white/70 px-5 backdrop-blur-xl md:px-9">
          <div className="flex items-center gap-3">
            <button aria-label="Open navigation" className="rounded-lg p-2 text-stone-600 hover:bg-white lg:hidden"><Menu size={21} /></button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7657f6]">Overview</p>
              <h1 className="text-lg font-bold">Good morning, Super Admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button aria-label="Search" className="hidden rounded-lg border border-[#ebe7f6] bg-white p-2.5 text-stone-500 sm:block"><Search size={18} /></button>
            <button aria-label="Notifications" className="relative rounded-lg border border-[#ebe7f6] bg-white p-2.5 text-stone-500"><Bell size={18} /><span className="absolute right-2 top-2 size-2 rounded-full bg-[#7657f6]" /></button>
            <button className="flex items-center gap-2 rounded-xl bg-white py-1.5 pl-2 pr-2.5 shadow-sm ring-1 ring-[#ebe7f6]">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7257f4] to-[#bf5eea] text-sm font-bold text-white">SA</span>
              <ChevronDown size={16} className="text-stone-500" />
            </button>
          </div>
        </header>
        <DashboardContent />
      </main>
    </div>
  );
}
