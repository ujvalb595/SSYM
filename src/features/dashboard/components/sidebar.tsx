import { CalendarDays, ChartNoAxesCombined, CreditCard, LayoutDashboard, Settings, ShieldCheck, UsersRound } from "lucide-react";

const links = [
  [LayoutDashboard, "Dashboard", true], [UsersRound, "Members"], [CreditCard, "Payments"], [CalendarDays, "Events"], [ChartNoAxesCombined, "Reports"], [ShieldCheck, "Admins"], [Settings, "Settings"],
] as const;

export function Sidebar() {
  return <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-[#4a2b07] bg-[#4b2b06] text-white lg:flex">
    <div className="flex h-20 items-center gap-3 border-b border-white/10 px-7">
      <span className="flex size-10 items-center justify-center rounded-xl bg-[#f1b54d] text-lg font-black text-[#4b2b06]">S</span>
      <div><p className="font-bold tracking-tight">SSYM</p><p className="text-xs text-amber-200/75">Management System</p></div>
    </div>
    <nav className="flex-1 space-y-1 px-4 py-7">
      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-amber-200/50">Management</p>
      {links.map(([Icon, label, active]) => <a href="#" key={label} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "bg-[#f1b54d] text-[#4b2b06] shadow-lg" : "text-amber-50/75 hover:bg-white/10 hover:text-white"}`}><Icon size={19} />{label}</a>)}
    </nav>
    <div className="border-t border-white/10 p-4"><a href="#" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-amber-50/75 hover:bg-white/10">Need help?</a></div>
  </aside>;
}
