"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, CalendarCheck, FolderOpen } from "lucide-react";
import { portfolioStorage, tradeStorage } from "@/lib/storage";
import { buildAnalytics } from "@/lib/analytics";
import { Portfolio, Trade } from "@/types";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { PnlChart } from "@/components/dashboard/PnlChart";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PortfolioFilter } from "@/components/dashboard/PortfolioFilter";
import { InsightCards } from "@/components/dashboard/InsightCards";

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyDashboard({ hasPortfolios }: { hasPortfolios: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-[#1e293b] bg-[#0e1223] text-center">
      <div className="w-14 h-14 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center mb-5">
        <svg width="24" height="24" viewBox="0 0 14 14" fill="none">
          <polyline
            points="1,10 4,6 7,8 10,3 13,1"
            stroke="#334155"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="text-[16px] font-bold text-[#f8fafc] mb-2">
        {hasPortfolios ? "No trades yet" : "Welcome to TradeHabit"}
      </p>
      <p className="text-[13px] text-[#475569] max-w-xs mb-8 leading-relaxed">
        {hasPortfolios
          ? "Log your first trade to start tracking performance and building discipline."
          : "Create a portfolio to get started. Track every trade, build habits, improve fast."}
      </p>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {!hasPortfolios && (
          <Link
            href="/portfolios"
            className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#1e293b] text-[13px] font-semibold text-[#94a3b8] hover:border-[#334155] hover:text-[#f8fafc] transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Create Portfolio
          </Link>
        )}
        <Link
          href="/add-trade"
          className="flex items-center gap-2 h-9 px-5 rounded-lg bg-[#f8fafc] text-[#020617] text-[13px] font-bold hover:bg-[#e2e8f0] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          Log First Trade
        </Link>
        <Link
          href="/weekly-review"
          className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#1e293b] text-[13px] font-semibold text-[#94a3b8] hover:border-[#334155] hover:text-[#f8fafc] transition-colors cursor-pointer"
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          Weekly Review
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [portfolios,  setPortfolios]  = useState<Portfolio[]>([]);
  const [trades,      setTrades]      = useState<Trade[]>([]);
  const [selected,    setSelected]    = useState<string>("all");
  const [hydrated,    setHydrated]    = useState(false);

  useEffect(() => {
    portfolioStorage.seedIfEmpty();
    tradeStorage.seedIfEmpty();
    const ps = portfolioStorage.getAll();
    const ts = tradeStorage.getAll();
    setPortfolios(ps);
    setTrades(ts);
    // Default to first portfolio if only one exists
    if (ps.length === 1) setSelected(ps[0].id);
    setHydrated(true);
  }, []);

  const analytics = useMemo(
    () => buildAnalytics(trades, portfolios, selected),
    [trades, portfolios, selected]
  );

  const portfolioMap = useMemo(
    () => Object.fromEntries(portfolios.map((p) => [p.id, p])),
    [portfolios]
  );

  // Currency: use selected portfolio's currency, or "USDT" for all
  const currency = useMemo(() => {
    if (selected === "all") return "USDT";
    return portfolios.find((p) => p.id === selected)?.currency ?? "USDT";
  }, [selected, portfolios]);

  // Subtitle
  const subtitle = useMemo(() => {
    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    if (selected === "all") return `${month} · All Portfolios`;
    const name = portfolios.find((p) => p.id === selected)?.name ?? "";
    return `${month} · ${name}`;
  }, [selected, portfolios]);

  const hasPortfolios = portfolios.length > 0;
  const hasTrades = trades.filter(
    (t) => selected === "all" || t.portfolioId === selected
  ).length > 0;

  // Don't render until hydrated (avoids SSR mismatch with localStorage)
  if (!hydrated) return null;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] leading-none text-[#f8fafc]">
            Overview
          </h1>
          <p className="text-[12px] text-[#475569] mt-1.5">{subtitle}</p>
        </div>
        <PortfolioFilter
          portfolios={portfolios}
          selected={selected}
          onChange={setSelected}
        />
      </div>

      {/* KPI row — always show if there are portfolios */}
      {hasPortfolios && (
        <StatsRow analytics={analytics} currency={currency} />
      )}

      {/* Main content */}
      {!hasPortfolios || !hasTrades ? (
        <EmptyDashboard hasPortfolios={hasPortfolios} />
      ) : (
        <>
          {/* Chart + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_256px] gap-4">
            <PnlChart
              curve={analytics.pnlCurve}
              currentBalance={analytics.currentBalance}
              totalPnl={analytics.totalPnl}
              returnPct={analytics.totalReturnPct}
              currency={currency}
              startingBalance={analytics.startingBalance}
            />
            <QuickActions />
          </div>

          {/* Insight cards */}
          <InsightCards analytics={analytics} currency={currency} />

          {/* Recent trades */}
          <RecentTrades
            trades={analytics.recentTrades}
            portfolioMap={portfolioMap}
            currency={currency}
          />
        </>
      )}
    </div>
  );
}
