"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChartNoAxesCombined,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

const links = [
  [LayoutDashboard, "Dashboard", "/dashboard"],
  [UsersRound, "Members", "/members"],
  [CreditCard, "Payments", "/payments"],
  [CalendarDays, "Events", "/events"],
  [ChartNoAxesCombined, "Expenses", "/expenses"],
  [ShieldCheck, "Admins", "/admins"], 
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-[#ebe7f6] bg-white text-[#24203a] lg:flex">
      <div className="flex h-20 items-center gap-3 border-b border-[#f0edf8] px-7">
        <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7257f4] to-[#bc59ec] text-lg font-black text-white shadow-lg shadow-violet-200">
          SS
        </span>

        <div>
          <p className="font-bold tracking-tight">SSYM</p>
          <p className="text-xs text-stone-400">Management System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-7">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400">
          Management
        </p>

        {links.map(([Icon, label, href]) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              href={href}
              key={label}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-gradient-to-r from-[#7257f4] to-[#9b56f1] text-white shadow-lg shadow-violet-200"
                  : "text-stone-500 hover:bg-violet-50 hover:text-[#7257f4]"
              }`}
            >
              <Icon size={19} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
