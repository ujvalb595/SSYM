"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CalendarDays,
  ChartNoAxesCombined,
  CreditCard,
  HeartHandshake,
  Home,
  LayoutDashboard,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";

const links = [
  [Home, "Home", "/home"],
  [LayoutDashboard, "Dashboard", "/dashboard"],
  [UsersRound, "Members", "/members"],
  [CreditCard, "Payments", "/payments"],
  [CalendarDays, "Events", "/events"],
  [ChartNoAxesCombined, "Expenses", "/expenses"],
  [HeartHandshake, "Donations", "/donations"],
  [ShieldCheck, "Admins", "/admins"], 
] as const;

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isAdminOrSuperAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const visibleLinks = links.filter(([, , href]) => {
    if (href === "/admins") {
      return isAdminOrSuperAdmin;
    }
    return true;
  });

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#24203a]/40 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#ebe7f6] bg-white text-[#24203a] transition-transform duration-300 ease-in-out lg:z-20 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-[#f0edf8] px-7">
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
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-7">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400">
            Management
          </p>

          {visibleLinks.map(([Icon, label, href]) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                href={href}
                key={label}
                onClick={onClose}
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
    </>
  );
}
