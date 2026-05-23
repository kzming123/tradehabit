import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Trade, Portfolio } from "@/types";

interface Props {
  trades: Trade[];
  portfolioMap: Record<string, Portfolio>;
  currency: string;
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(dateStr)
  );
}

export function RecentTrades({ trades, portfolioMap, currency }: Props) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b]">
        <p className="text-[13px] font-semibold text-[#f8fafc]">Recent Trades</p>
        <Link
          href="/history"
          className="flex items-center gap-1 text-[12px] text-[#475569] hover:text-[#94a3b8] transition-colors cursor-pointer"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {trades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-[13px] font-semibold text-[#475569] mb-1">No trades yet</p>
          <p className="text-[12px] text-[#334155] mb-4">Log your first trade to see it here.</p>
          <Link
            href="/add-trade"
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[#f8fafc] text-[#020617] text-[12px] font-bold hover:bg-[#e2e8f0] transition-colors"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            Log Trade
          </Link>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[4px_1fr_80px_72px_90px] gap-3 px-5 py-2.5 border-b border-[#0f172a]">
            <span />
            <span className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.08em]">Trade</span>
            <span className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.08em]">Setup</span>
            <span className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.08em] text-right">Date</span>
            <span className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.08em] text-right">PnL</span>
          </div>

          {trades.map((trade, idx) => {
            const isWin  = trade.outcome === "win";
            const isLoss = trade.outcome === "loss";
            const portfolio = portfolioMap[trade.portfolioId];

            return (
              <Link
                key={trade.id}
                href={`/history/${trade.id}`}
                className={cn(
                  "flex sm:grid sm:grid-cols-[4px_1fr_80px_72px_90px] gap-3 items-center px-5 py-3.5 transition-colors hover:bg-[#0f172a] cursor-pointer",
                  idx !== trades.length - 1 && "border-b border-[#0f172a]"
                )}
              >
                <div
                  className={cn(
                    "w-[4px] h-8 rounded-full shrink-0",
                    isWin ? "bg-[#22c55e]/50" : isLoss ? "bg-[#ef4444]/50" : "bg-[#475569]/30"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#f8fafc]">{trade.pair}</span>
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
                  </div>
                  <p className="text-[11px] text-[#475569] mt-0.5 leading-none truncate">
                    {portfolio?.name ?? "—"}
                  </p>
                </div>

                <p className="text-[12px] text-[#475569] hidden sm:block truncate">
                  {trade.setupTag ?? "—"}
                </p>
                <p className="text-[11px] text-[#334155] tabular text-right hidden sm:block">
                  {formatDate(trade.dateTime)}
                </p>

                <div className="text-right ml-auto sm:ml-0">
                  <p className={cn(
                    "text-[13px] font-bold tabular leading-none",
                    isWin ? "text-[#22c55e]" : isLoss ? "text-[#ef4444]" : "text-[#94a3b8]"
                  )}>
                    {trade.pnl >= 0 ? "+" : ""}{currency}{" "}
                    {Math.abs(trade.pnl).toFixed(0)}
                  </p>
                  <p className="text-[10px] text-[#475569] tabular mt-0.5 leading-none">
                    {trade.pnlPercent >= 0 ? "+" : ""}{trade.pnlPercent.toFixed(2)}%
                  </p>
                </div>
              </Link>
            );
          })}
        </>
      )}
    </div>
  );
}
