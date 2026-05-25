"use client";

import { KpiCard } from "./KpiCard";
import { DashboardAnalytics } from "@/lib/analytics";
import { fmtMoneySigned } from "@/lib/format";
import { useT } from "@/i18n/LanguageProvider";

interface Props {
  analytics: DashboardAnalytics;
  currency: string;
}

export function StatsRow({ analytics, currency }: Props) {
  const { t } = useT();
  const { totalPnl, totalReturnPct, winRate, totalTrades, streak } = analytics;
  const hasTrades = totalTrades > 0;
  const pnlUp = totalPnl >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        label={t("statsRow.totalPnl")}
        value={hasTrades ? fmtMoneySigned(currency, totalPnl) : "—"}
        change={hasTrades ? `${pnlUp ? "+" : ""}${totalReturnPct.toFixed(1)}%` : undefined}
        trend={hasTrades ? (pnlUp ? "up" : "down") : "neutral"}
        accent={pnlUp ? "emerald" : "red"}
        caption={t("statsRow.allTime")}
      />
      <KpiCard
        label={t("statsRow.winRate")}
        value={hasTrades ? `${Math.round(winRate)}%` : "—"}
        accent="blue"
        caption={hasTrades ? `${analytics.wins}W · ${analytics.losses}L` : t("statsRow.noTrades")}
      />
      <KpiCard
        label={t("statsRow.trades")}
        value={String(totalTrades)}
        accent="violet"
        caption={t("statsRow.loggedPeriod")}
      />
      <KpiCard
        label={t("statsRow.streak")}
        value={streak > 0 ? `${streak}d` : "—"}
        change={streak > 0 ? t("statsRow.active") : undefined}
        trend={streak > 0 ? "up" : "neutral"}
        accent={streak > 0 ? "amber" : "blue"}
        caption={t("statsRow.journalingDays")}
      />
    </div>
  );
}
