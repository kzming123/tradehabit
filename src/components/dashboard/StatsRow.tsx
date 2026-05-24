import { KpiCard } from "./KpiCard";
import { DashboardAnalytics } from "@/lib/analytics";
import { fmtMoneySigned } from "@/lib/format";

interface Props {
  analytics: DashboardAnalytics;
  currency: string;
}

export function StatsRow({ analytics, currency }: Props) {
  const { totalPnl, totalReturnPct, winRate, totalTrades, streak } = analytics;
  const hasTrades = totalTrades > 0;
  const pnlUp = totalPnl >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        label="Total PnL"
        value={hasTrades ? fmtMoneySigned(currency, totalPnl) : "—"}
        change={hasTrades ? `${pnlUp ? "+" : ""}${totalReturnPct.toFixed(1)}%` : undefined}
        trend={hasTrades ? (pnlUp ? "up" : "down") : "neutral"}
        accent={pnlUp ? "emerald" : "red"}
        caption="All time"
      />
      <KpiCard
        label="Win Rate"
        value={hasTrades ? `${Math.round(winRate)}%` : "—"}
        accent="blue"
        caption={hasTrades ? `${analytics.wins}W · ${analytics.losses}L` : "No trades yet"}
      />
      <KpiCard
        label="Trades"
        value={String(totalTrades)}
        accent="violet"
        caption="Logged this period"
      />
      <KpiCard
        label="Streak"
        value={streak > 0 ? `${streak}d` : "—"}
        change={streak > 0 ? "Active" : undefined}
        trend={streak > 0 ? "up" : "neutral"}
        accent={streak > 0 ? "amber" : "blue"}
        caption="Journaling days"
      />
    </div>
  );
}
