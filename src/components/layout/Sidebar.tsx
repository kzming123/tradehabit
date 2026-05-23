"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  ClipboardList,
  CalendarCheck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolios", label: "Portfolios", icon: Briefcase },
  { href: "/add-trade", label: "Add Trade", icon: PlusCircle },
  { href: "/history", label: "Trade History", icon: ClipboardList },
  { href: "/weekly-review", label: "Weekly Review", icon: CalendarCheck },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group cursor-pointer",
        active
          ? "bg-[#0f172a] text-[#f8fafc]"
          : "text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#0f172a]/60"
      )}
    >
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#22c55e]" />
      )}
      <Icon
        className="w-4 h-4 shrink-0 transition-colors"
        strokeWidth={active ? 2 : 1.75}
      />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-[220px] shrink-0 h-screen sticky top-0 z-30 bg-[#020617] border-r border-[#1e293b]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[#1e293b]">
        <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
          {/* Glow behind logo */}
          <span className="absolute inset-0 rounded-lg bg-[#22c55e]/20 blur-sm" />
          <span className="relative w-7 h-7 rounded-lg bg-[#0f172a] border border-[#1e293b] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polyline
                points="1,10 4,6 7,8 10,3 13,1"
                stroke="#22c55e"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <div>
          <p className="text-[13px] font-bold tracking-tight text-[#f8fafc]">TradeHabit</p>
          <p className="text-[10px] text-[#475569] leading-none mt-0.5">Trading Journal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={pathname === href}
          />
        ))}
      </nav>

      {/* Bottom: Settings */}
      <div className="px-2 pb-3 pt-2 border-t border-[#1e293b] space-y-0.5">
        <NavItem
          href="/settings"
          label="Settings"
          icon={Settings}
          active={pathname === "/settings"}
        />

        {/* User stub */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-lg border border-[#1e293b] bg-[#0f172a]/50">
          <div className="w-6 h-6 rounded-full bg-[#1e293b] flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-[#94a3b8]">T</span>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[#cbd5e1] truncate leading-none">Trader</p>
            <p className="text-[10px] text-[#475569] mt-0.5 leading-none">Phase 1</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
