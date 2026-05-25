"use client";

import { cn } from "@/lib/utils";
import { DashboardAnalytics } from "@/lib/analytics";
import { Trophy, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { fmtMoneySigned } from "@/lib/format";
import { useT } from "@/i18n/LanguageProvider";

interface InsightCardProps {
  icon: React.ReactNode;
  label: string;
  title: string;
  subtitle: string;
  accent: string;
  accentBg: string;
}

function InsightCard({ icon, label, title, subtitle, accent, accentBg }: InsightCardProps) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] p-4 flex items-start gap-3">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", accentBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-[#334155] uppercase tracking-[0.08em] mb-1">{label}</p>
        <p className={cn("text-[14px] font-bold leading-tight truncate", accent)}>{title}</p>
        <p className="text-[11px] text-[#475569] mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

interface Props {
  analytics: DashboardAnalytics;
  currency: string;
}

export function InsightCards({ analytics, currency }: Props) {
  const { t, tf } = useT();
  const { bestSetup, mostCommonMistake, mostCommonMistakeCount, portfolioStats } = analytics;

  const cards: InsightCardProps[] = [];

  if (bestSetup) {
    cards.push({
      label: t("insights.bestSetup"),
      title: bestSetup.tag,
      subtitle: `${Math.round(bestSetup.winRate)}% WR · ${bestSetup.count} trades · ${fmtMoneySigned(currency, bestSetup.totalPnl)}`,
      icon: <Trophy className="w-4 h-4 text-[#f59e0b]" strokeWidth={2} />,
      accent: "text-[#f8fafc]",
      accentBg: "bg-[#f59e0b]/10",
    });
  }

  if (analytics.worstSetup && analytics.worstSetup.tag !== bestSetup?.tag) {
    const ws = analytics.worstSetup;
    cards.push({
      label: t("insights.watchOut"),
      title: ws.tag,
      subtitle: `${Math.round(ws.winRate)}% WR · ${ws.count} trades · ${fmtMoneySigned(currency, ws.totalPnl)}`,
      icon: <AlertTriangle className="w-4 h-4 text-[#ef4444]" strokeWidth={2} />,
      accent: "text-[#ef4444]",
      accentBg: "bg-[#ef4444]/10",
    });
  }

  if (mostCommonMistake) {
    cards.push({
      label: t("insights.topMistake"),
      title: t(`mistakes.${mostCommonMistake}`),
      subtitle: tf("insights.occurrences", { n: mostCommonMistakeCount }),
      icon: <AlertTriangle className="w-4 h-4 text-[#f59e0b]" strokeWidth={2} />,
      accent: "text-[#f8fafc]",
      accentBg: "bg-[#f59e0b]/10",
    });
  }

  const sortedPortfolios = [...portfolioStats].sort((a, b) => b.pnl - a.pnl);
  if (sortedPortfolios.length > 1) {
    const best = sortedPortfolios[0];
    cards.push({
      label: t("insights.bestPortfolio"),
      title: best.portfolio.name,
      subtitle: `${fmtMoneySigned(currency, best.pnl)} · ${Math.round(best.winRate)}% WR · ${best.trades} trades`,
      icon: <TrendingUp className="w-4 h-4 text-[#22c55e]" strokeWidth={2} />,
      accent: "text-[#22c55e]",
      accentBg: "bg-[#22c55e]/10",
    });

    const worst = sortedPortfolios[sortedPortfolios.length - 1];
    if (worst.portfolio.id !== best.portfolio.id) {
      cards.push({
        label: t("insights.needsWork"),
        title: worst.portfolio.name,
        subtitle: `${fmtMoneySigned(currency, worst.pnl)} · ${Math.round(worst.winRate)}% WR · ${worst.trades} trades`,
        icon: <TrendingDown className="w-4 h-4 text-[#ef4444]" strokeWidth={2} />,
        accent: "text-[#ef4444]",
        accentBg: "bg-[#ef4444]/10",
      });
    }
  }

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cards.map((card, i) => (
        <InsightCard key={i} {...card} />
      ))}
    </div>
  );
}
