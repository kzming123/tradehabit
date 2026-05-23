"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { tradeStorage, portfolioStorage } from "@/lib/storage";
import { Trade, Portfolio } from "@/types";
import Link from "next/link";
import {
  Search,
  BookOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Plus,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateStr));
}

const EMOTION_META: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  calm:        { label: "Calm",        emoji: "😌", color: "text-[#22c55e]",  bg: "bg-[#22c55e]/10 border-[#22c55e]/20"  },
  confident:   { label: "Confident",   emoji: "😎", color: "text-[#3b82f6]",  bg: "bg-[#3b82f6]/10 border-[#3b82f6]/20"  },
  disciplined: { label: "Disciplined", emoji: "🧘", color: "text-[#22c55e]",  bg: "bg-[#22c55e]/10 border-[#22c55e]/20"  },
  fomo:        { label: "FOMO",        emoji: "😰", color: "text-[#f59e0b]",  bg: "bg-[#f59e0b]/10 border-[#f59e0b]/20"  },
  greedy:      { label: "Greedy",      emoji: "🤑", color: "text-[#f59e0b]",  bg: "bg-[#f59e0b]/10 border-[#f59e0b]/20"  },
  fearful:     { label: "Fearful",     emoji: "😨", color: "text-[#ef4444]",  bg: "bg-[#ef4444]/10 border-[#ef4444]/20"  },
  revenge:     { label: "Revenge",     emoji: "😤", color: "text-[#ef4444]",  bg: "bg-[#ef4444]/10 border-[#ef4444]/20"  },
};

const MISTAKE_LABELS: Record<string, string> = {
  no_stop: "No Stop Loss",
  early_exit: "Early Exit",
  oversized: "Oversized",
  fomo_entry: "FOMO Entry",
  revenge_trade: "Revenge Trade",
  broke_rules: "Broke Rules",
  moved_sl: "Moved SL",
  overtraded: "Overtraded",
};

type SortKey = "date_desc" | "date_asc" | "pnl_desc" | "pnl_asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc",  label: "Oldest first" },
  { value: "pnl_desc",  label: "PnL high → low" },
  { value: "pnl_asc",   label: "PnL low → high" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [trades, setTrades]               = useState<Trade[]>([]);
  const [portfolios, setPortfolios]       = useState<Portfolio[]>([]);
  const [search, setSearch]               = useState("");
  const [filterPortfolio, setFilterPortfolio] = useState("all");
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [filterDirection, setFilterDirection] = useState("all");
  const [filterEmotion, setFilterEmotion] = useState("all");
  const [sortKey, setSortKey]             = useState<SortKey>("date_desc");
  const [sortOpen, setSortOpen]           = useState(false);

  useEffect(() => {
    portfolioStorage.seedIfEmpty();
    tradeStorage.seedIfEmpty();
    setPortfolios(portfolioStorage.getAll());
    setTrades(tradeStorage.getAll());
  }, []);

  const portfolioMap = useMemo(
    () => Object.fromEntries(portfolios.map((p) => [p.id, p])),
    [portfolios]
  );

  const filtered = useMemo(() => {
    let list = trades.filter((t) => {
      if (filterPortfolio !== "all" && t.portfolioId !== filterPortfolio) return false;
      if (filterOutcome !== "all" && t.outcome !== filterOutcome) return false;
      if (filterDirection !== "all" && t.direction !== filterDirection) return false;
      if (filterEmotion !== "all" && t.emotionBefore !== filterEmotion) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !t.pair.toLowerCase().includes(q) &&
          !(t.setupTag ?? "").toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "date_desc": return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
        case "date_asc":  return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
        case "pnl_desc":  return b.pnl - a.pnl;
        case "pnl_asc":   return a.pnl - b.pnl;
      }
    });

    return list;
  }, [trades, filterPortfolio, filterOutcome, filterDirection, filterEmotion, search, sortKey]);

  // Stats bar
  const totalPnl   = filtered.reduce((s, t) => s + t.pnl, 0);
  const wins       = filtered.filter((t) => t.outcome === "win").length;
  const winRate    = filtered.length > 0 ? Math.round((wins / filtered.length) * 100) : 0;

  function resetFilters() {
    setSearch("");
    setFilterPortfolio("all");
    setFilterOutcome("all");
    setFilterDirection("all");
    setFilterEmotion("all");
  }

  const hasActiveFilter =
    search || filterPortfolio !== "all" || filterOutcome !== "all" ||
    filterDirection !== "all" || filterEmotion !== "all";

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] leading-none text-[#f8fafc]">
            Trade History
          </h1>
          <p className="text-[12px] text-[#475569] mt-1.5">{filtered.length} of {trades.length} trades</p>
        </div>
        <Link
          href="/add-trade"
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#f8fafc] text-[#020617] text-[13px] font-semibold hover:bg-[#e2e8f0] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          Log Trade
        </Link>
      </div>

      {/* ── Stats bar ── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Total PnL",
              value: `${totalPnl >= 0 ? "+" : ""}$${Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              accent: totalPnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]",
            },
            {
              label: "Win Rate",
              value: `${winRate}%`,
              accent: "text-[#f8fafc]",
            },
            {
              label: "Trades",
              value: String(filtered.length),
              accent: "text-[#f8fafc]",
            },
          ].map(({ label, value, accent }) => (
            <div key={label} className="rounded-xl border border-[#1e293b] bg-[#0e1223] px-4 py-3">
              <p className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.06em] mb-1">{label}</p>
              <p className={cn("text-[18px] font-bold tabular leading-none", accent)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#334155]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pair or setup…"
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#1e293b] bg-[#0e1223] text-[13px] text-[#f8fafc] placeholder:text-[#334155] focus:outline-none focus:border-[#334155] transition-colors"
            />
          </div>

          {/* Portfolio */}
          {portfolios.length > 1 && (
            <select
              value={filterPortfolio}
              onChange={(e) => setFilterPortfolio(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#1e293b] bg-[#0e1223] text-[13px] text-[#94a3b8] focus:outline-none focus:border-[#334155] transition-colors cursor-pointer"
            >
              <option value="all">All Portfolios</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          {/* Emotion filter */}
          <select
            value={filterEmotion}
            onChange={(e) => setFilterEmotion(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#1e293b] bg-[#0e1223] text-[13px] text-[#94a3b8] focus:outline-none focus:border-[#334155] transition-colors cursor-pointer"
          >
            <option value="all">All Emotions</option>
            {Object.entries(EMOTION_META).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </select>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#1e293b] bg-[#0e1223] text-[13px] text-[#94a3b8] hover:border-[#334155] transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {SORT_OPTIONS.find((o) => o.value === sortKey)?.label}
              <ChevronDown className="w-3 h-3" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-[#1e293b] bg-[#0e1223] shadow-xl overflow-hidden">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => { setSortKey(o.value); setSortOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-[13px] transition-colors",
                      sortKey === o.value
                        ? "text-[#f8fafc] bg-[#0f172a]"
                        : "text-[#475569] hover:text-[#f8fafc] hover:bg-[#0f172a]"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="h-9 px-3 rounded-lg text-[12px] font-semibold text-[#475569] hover:text-[#f8fafc] transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Outcome + Direction row */}
        <div className="flex flex-wrap gap-2">
          {/* Outcome pills */}
          <div className="flex items-center gap-1">
            {(["all", "win", "loss", "breakeven"] as const).map((o) => (
              <button
                key={o}
                onClick={() => setFilterOutcome(o)}
                className={cn(
                  "h-7 px-2.5 rounded-md text-[11px] font-semibold border capitalize transition-colors cursor-pointer",
                  filterOutcome === o
                    ? o === "win"
                      ? "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]"
                      : o === "loss"
                      ? "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
                      : "bg-[#f8fafc]/10 border-[#f8fafc]/20 text-[#f8fafc]"
                    : "border-[#1e293b] text-[#475569] hover:border-[#334155]"
                )}
              >
                {o === "all" ? "All outcomes" : o}
              </button>
            ))}
          </div>

          <div className="w-px bg-[#1e293b] self-stretch mx-1 hidden sm:block" />

          {/* Direction pills */}
          <div className="flex items-center gap-1">
            {(["all", "long", "short"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setFilterDirection(d)}
                className={cn(
                  "h-7 px-2.5 rounded-md text-[11px] font-semibold border capitalize transition-colors cursor-pointer flex items-center gap-1",
                  filterDirection === d
                    ? d === "long"
                      ? "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]"
                      : d === "short"
                      ? "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
                      : "bg-[#f8fafc]/10 border-[#f8fafc]/20 text-[#f8fafc]"
                    : "border-[#1e293b] text-[#475569] hover:border-[#334155]"
                )}
              >
                {d === "long" && <ArrowUp className="w-3 h-3" />}
                {d === "short" && <ArrowDown className="w-3 h-3" />}
                {d === "all" ? "All directions" : d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Close sort dropdown on outside click ── */}
      {sortOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
      )}

      {/* ── Empty state ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-[#1e293b] bg-[#0e1223] text-center">
          <BookOpen className="w-9 h-9 text-[#1e293b] mb-4" />
          <p className="text-[14px] font-semibold text-[#475569] mb-1">
            {trades.length === 0 ? "No trades yet" : "No trades match"}
          </p>
          <p className="text-[12px] text-[#334155] mb-6 max-w-xs leading-relaxed">
            {trades.length === 0
              ? "Start logging trades to build your journal."
              : "Try adjusting your filters."}
          </p>
          {trades.length === 0 && (
            <Link
              href="/add-trade"
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[#f8fafc] text-[#020617] text-[13px] font-semibold hover:bg-[#e2e8f0] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Log First Trade
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[4px_1fr_100px_80px_80px_100px] gap-4 px-5 py-3 border-b border-[#1e293b]">
            <span />
            <span className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.08em]">Trade</span>
            <span className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.08em]">Setup</span>
            <span className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.08em]">Emotion</span>
            <span className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.08em] text-right">Date</span>
            <span className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.08em] text-right">PnL</span>
          </div>

          {filtered.map((trade, idx) => {
            const isWin  = trade.outcome === "win";
            const isLoss = trade.outcome === "loss";
            const portfolio = portfolioMap[trade.portfolioId];
            const emo = trade.emotionBefore ? EMOTION_META[trade.emotionBefore] : null;

            return (
              <Link
                key={trade.id}
                href={`/history/${trade.id}`}
                className={cn(
                  "flex md:grid md:grid-cols-[4px_1fr_100px_80px_80px_100px] gap-4 items-center px-5 py-4 transition-colors hover:bg-[#0f172a] cursor-pointer",
                  idx !== filtered.length - 1 && "border-b border-[#0f172a]"
                )}
              >
                {/* Color bar */}
                <div
                  className={cn(
                    "w-[4px] h-10 rounded-full shrink-0",
                    isWin ? "bg-[#22c55e]/50" : isLoss ? "bg-[#ef4444]/50" : "bg-[#475569]/30"
                  )}
                />

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-bold text-[#f8fafc]">{trade.pair}</span>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded",
                        trade.direction === "long"
                          ? "bg-[#22c55e]/10 text-[#22c55e]/80"
                          : "bg-[#ef4444]/10 text-[#ef4444]/80"
                      )}
                    >
                      {trade.direction}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded",
                        isWin
                          ? "bg-[#22c55e]/10 text-[#22c55e]"
                          : isLoss
                          ? "bg-[#ef4444]/10 text-[#ef4444]"
                          : "bg-[#1e293b] text-[#94a3b8]"
                      )}
                    >
                      {trade.outcome}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569] mt-0.5 truncate">
                    {portfolio?.name ?? "—"} · {trade.market}
                  </p>
                  {/* Mobile: show setup + date below */}
                  <div className="flex items-center gap-3 mt-1 md:hidden">
                    {trade.setupTag && (
                      <span className="text-[10px] font-semibold text-[#475569] bg-[#0f172a] border border-[#1e293b] px-1.5 py-0.5 rounded">
                        {trade.setupTag}
                      </span>
                    )}
                    <span className="text-[10px] text-[#334155]">
                      {formatDateTime(trade.dateTime)}
                    </span>
                  </div>
                </div>

                {/* Setup tag (desktop) */}
                <div className="hidden md:block">
                  {trade.setupTag ? (
                    <span className="text-[11px] font-semibold text-[#475569] bg-[#0f172a] border border-[#1e293b] px-2 py-0.5 rounded-md truncate block max-w-full">
                      {trade.setupTag}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#334155]">—</span>
                  )}
                </div>

                {/* Emotion (desktop) */}
                <div className="hidden md:block">
                  {emo ? (
                    <span className={cn("text-[11px] font-semibold border px-2 py-0.5 rounded-md", emo.color, emo.bg)}>
                      {emo.emoji} {emo.label}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#334155]">—</span>
                  )}
                </div>

                {/* Date (desktop) */}
                <p className="text-[11px] text-[#334155] tabular text-right hidden md:block whitespace-nowrap">
                  {formatDateTime(trade.dateTime)}
                </p>

                {/* PnL */}
                <div className="text-right ml-auto md:ml-0 shrink-0">
                  <p
                    className={cn(
                      "text-[13px] font-bold tabular leading-none",
                      isWin ? "text-[#22c55e]" : isLoss ? "text-[#ef4444]" : "text-[#94a3b8]"
                    )}
                  >
                    {trade.pnl >= 0 ? "+" : ""}${Math.abs(trade.pnl).toFixed(0)}
                  </p>
                  <p className="text-[10px] text-[#475569] tabular mt-0.5 leading-none">
                    {trade.pnlPercent >= 0 ? "+" : ""}{trade.pnlPercent.toFixed(2)}%
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
