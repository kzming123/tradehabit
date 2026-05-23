import { KpiCard } from "./KpiCard";
import { DashboardAnalytics } from "@/lib/analytics";

interface Props {
  analytics: DashboardAnalytics;
  currency: string;
}

export function StatsRow({ analytics, currency }: Props) {
  const {
    totalPnl, totalReturnPct, winRate, totalTrades,
    currentBalance, avgPnl, streak,
  } = analytics;

  const pnlUp = totalPnl >= 0;
  const avgUp = avgPnl >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <KpiCard
        label="Total PnL"
        value={
          totalTrades === 0
            ? "—"
            : `${pnlUp ? "+" : ""}${currency} ${Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        }
        change={totalTrades > 0 ? `${pnlUp ? "+" : ""}${totalReturnPct.toFixed(1)}%` : undefined}
        trend={totalTrades > 0 ? (pnlUp ? "up" : "down") : "neutral"}
        accent={pnlUp ? "emerald" : "red"}
        caption="All time return"
      />
      <KpiCard
        label="Win Rate"
        value={totalTrades === 0 ? "—" : `${Math.round(winRate)}%`}
        accent="blue"
        caption={`${analytics.wins}W · ${analytics.losses}L`}
      />
      <KpiCard
        label="Balance"
        value={
          totalTrades === 0
            ? `${currency} ${analytics.startingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
            : `${currency} ${currentBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        }
        accent="violet"
        caption="Current balance"
      />
      <KpiCard
        label="Trades"
        value={String(totalTrades)}
        accent="blue"
        caption="Total logged"
      />
      <KpiCard
        label="Avg PnL"
        value={
          totalTrades === 0
            ? "—"
            : `${avgUp ? "+" : ""}${currency} ${Math.abs(avgPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        }
        trend={totalTrades > 0 ? (avgUp ? "up" : "down") : "neutral"}
        accent={avgUp ? "emerald" : "red"}
        caption="Per trade"
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
