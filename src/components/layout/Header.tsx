"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";

const pageMeta: Record<string, { title: string; desc: string }> = {
  "/": { title: "Dashboard", desc: "Trading overview" },
  "/portfolios": { title: "Portfolios", desc: "Your accounts" },
  "/add-trade": { title: "Add Trade", desc: "New journal entry" },
  "/history": { title: "Trade History", desc: "All trades" },
  "/weekly-review": { title: "Weekly Review", desc: "Reflect & improve" },
  "/settings": { title: "Settings", desc: "Preferences" },
};

export function Header() {
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? { title: "TradeHabit", desc: "" };

  return (
    <header className="h-14 border-b border-[#1e293b] flex items-center px-6 gap-4 bg-[#020617]/90 backdrop-blur-md sticky top-0 z-40">
      {/* Mobile logo */}
      <div className="md:hidden flex items-center gap-2 mr-2">
        <span className="w-6 h-6 rounded-md bg-[#0f172a] border border-[#1e293b] flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <polyline
              points="1,10 4,6 7,8 10,3 13,1"
              stroke="#22c55e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#f8fafc] leading-none tracking-tight">
          {meta.title}
        </p>
        <p className="text-[11px] text-[#475569] mt-0.5 leading-none">{meta.desc}</p>
      </div>

      {/* Settings icon (mobile only — desktop uses sidebar) */}
      <Link
        href="/settings"
        className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:text-[#f8fafc] hover:bg-[#0f172a] transition-colors cursor-pointer"
      >
        <Settings className="w-4 h-4" strokeWidth={1.75} />
      </Link>
    </header>
  );
}
