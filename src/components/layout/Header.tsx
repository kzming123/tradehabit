"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import { useT } from "@/i18n/LanguageProvider";

interface PageMeta {
  titleKey: string;
  descKey: string;
}

const PAGE_META: Record<string, PageMeta> = {
  "/":              { titleKey: "nav.dashboard",    descKey: "nav.tradingOverview" },
  "/portfolios":    { titleKey: "nav.portfolios",   descKey: "nav.yourAccounts" },
  "/add-trade":     { titleKey: "nav.addTrade",     descKey: "nav.newJournalEntry" },
  "/history":       { titleKey: "nav.history",      descKey: "nav.allTrades" },
  "/weekly-review": { titleKey: "nav.weeklyReview", descKey: "nav.reflectImprove" },
  "/settings":      { titleKey: "nav.settings",     descKey: "nav.preferences" },
};

export function Header() {
  const pathname = usePathname();
  const { t } = useT();
  const meta = PAGE_META[pathname];
  const title = meta ? t(meta.titleKey) : "TradeHabit";
  const desc = meta ? t(meta.descKey) : "";

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
          {title}
        </p>
        <p className="text-[11px] text-[#475569] mt-0.5 leading-none">{desc}</p>
      </div>

      {/* Settings icon (mobile only — desktop uses sidebar) */}
      <Link
        href="/settings"
        className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:text-[#f8fafc] hover:bg-[#0f172a] transition-colors cursor-pointer"
        aria-label={t("nav.settings")}
      >
        <Settings className="w-4 h-4" strokeWidth={1.75} />
      </Link>
    </header>
  );
}
