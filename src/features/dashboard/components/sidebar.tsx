import { CalendarDays, ChartNoAxesCombined, CreditCard, LayoutDashboard, Settings, ShieldCheck, UsersRound } from "lucide-react";

const links = [
  [LayoutDashboard, "Dashboard", "/dashboard"], [UsersRound, "Members", "/members"], [CreditCard, "Payments", "#"], [CalendarDays, "Events", "#"], [ChartNoAxesCombined, "Reports", "#"], [ShieldCheck, "Admins", "#"], [Settings, "Settings", "#"],
] as const;

export function Sidebar() {
  return <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-[#ebe7f6] bg-white text-[#24203a] lg:flex">
    <div className="flex h-20 items-center gap-3 border-b border-[#f0edf8] px-7">
      <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7257f4] to-[#bc59ec] text-lg font-black text-white shadow-lg shadow-violet-200">S</span>
      <div><p className="font-bold tracking-tight">SSYM</p><p className="text-xs text-stone-400">Management System</p></div>
    </div>
    <nav className="flex-1 space-y-1 px-4 py-7">
      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400">Management</p>
      {links.map(([Icon, label, href]) => <a href={href} key={label} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${label === "Dashboard" ? "bg-gradient-to-r from-[#7257f4] to-[#9b56f1] text-white shadow-lg shadow-violet-200" : "text-stone-500 hover:bg-violet-50 hover:text-[#7257f4]"}`}><Icon size={19} />{label}</a>)}
    </nav>
    <div className="m-4 mt-auto rounded-2xl bg-gradient-to-br from-[#c467ec] via-[#8b57f2] to-[#5744db] p-4 text-white shadow-lg shadow-violet-200"><p className="text-sm font-bold">Need a hand?</p><p className="mt-1 text-xs text-white/75">Reach the SSYM support team.</p><a href="#" className="mt-4 block rounded-lg bg-white py-2 text-center text-xs font-bold text-[#7053ee]">Get support</a></div>
  </aside>;
}
