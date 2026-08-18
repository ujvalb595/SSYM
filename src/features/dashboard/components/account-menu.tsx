"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [dbImage, setDbImage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  // Fetch fresh profile picture from DB on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.user?.image) {
            setDbImage(data.user.image);
          }
        })
        .catch(() => {});
    }
  }, [session?.user?.id]);

  const userName = session?.user?.name || "User";
  const userRole = session?.user?.role || "USER";
  const avatarImage = dbImage || session?.user?.image || null;

  // Display role name
  const roleText =
    userRole === "SUPER_ADMIN"
      ? "Super Admin"
      : userRole === "ADMIN"
        ? "Admin"
        : "Mandal Member";

  // Get initials from user's name
  const initials =
    userName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part.charAt(0))
      .join("")
      .toUpperCase() || "U";

  return (
    <div ref={menuRef} className="relative">
      {/* Top Navigation Navbar Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl bg-white py-1.5 pl-2 pr-2.5 shadow-sm ring-1 ring-[#ebe7f6] transition hover:bg-violet-50 cursor-pointer"
      >
        {avatarImage ? (
          <img
            src={avatarImage}
            alt={userName}
            className="size-8 rounded-lg object-cover ring-1 ring-violet-200"
          />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7257f4] to-[#bf5eea] text-sm font-bold text-white">
            {initials}
          </span>
        )}

        <ChevronDown
          size={16}
          className={`text-stone-500 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Account Dropdown Menu */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-[#e8e2f5] bg-white p-1.5 shadow-xl shadow-violet-200/40 z-50 animate-in fade-in zoom-in-95"
        >
          {/* Account Header with Avatar & Name */}
          <div className="flex items-center gap-3 border-b border-stone-100 px-3 py-3">
            {avatarImage ? (
              <img
                src={avatarImage}
                alt={userName}
                className="size-10 rounded-xl object-cover ring-2 ring-violet-200 shrink-0"
              />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7257f4] to-[#bf5eea] text-base font-bold text-white shadow-sm shrink-0">
                {initials}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#24203a] truncate">
                {userName}
              </p>

              <div className="mt-0.5 flex items-center gap-2">
                <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-[#7257f4]">
                  {roleText}
                </span>
              </div>
            </div>
          </div>

          {/* My Profile */}
          <Link
            onClick={() => setOpen(false)}
            href="/profile"
            role="menuitem"
            className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-violet-50 hover:text-[#7257f4]"
          >
            <UserRound size={16} />
            My Profile
          </Link>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}