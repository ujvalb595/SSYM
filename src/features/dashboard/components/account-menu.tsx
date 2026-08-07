"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { signOut } from "next-auth/react";

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return <div ref={menuRef} className="relative">
    <button onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" className="flex items-center gap-2 rounded-xl bg-white py-1.5 pl-2 pr-2.5 shadow-sm ring-1 ring-[#ebe7f6] transition hover:bg-violet-50">
      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7257f4] to-[#bf5eea] text-sm font-bold text-white">SA</span>
      <ChevronDown size={16} className={`text-stone-500 transition ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div role="menu" className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-[#e8e2f5] bg-white p-1.5 shadow-xl shadow-violet-200/40">
      <div className="border-b border-stone-100 px-3 py-2.5"><p className="text-sm font-semibold">Super Admin</p><p className="text-xs text-stone-500">admin@ssym.local</p></div>
      <Link onClick={() => setOpen(false)} href="/profile" role="menuitem" className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-violet-50 hover:text-[#7257f4]"><UserRound size={16} /> My Profile</Link>
      <button onClick={() => signOut({ callbackUrl: "/login" })} role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"><LogOut size={16} /> Logout</button>
    </div>}
  </div>;
}
