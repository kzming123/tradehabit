import { cn } from "@/lib/utils";
import { DashboardAnalytics } from "@/lib/analytics";
import { Portfolio } from "@/types";
import { Trophy, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { fmtMoneySigned } from "@/lib/format";

const MISTAKE_LABELS: Record<string, string> = {
  no_stop:       "No Stop Loss",
  early_exit:    "Early Exit",
  oversized:     "Oversized",
  fomo_entry:    "FOMO Entry",
  revenge_trade: "Revenge Trade",
  broke_rules:   "Broke Rules",
  moved_sl:      "Moved SL",
  overtraded:    "Overtraded",
};

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
  const { bestSetup, mostCommonMistake, mostCommonMistakeCount, portfolioStats } = analytics;

  const cards: InsightCardProps[] = [];

  // Best Setup
  if (bestSetup) {
    cards.push({
      label: "Best Setup",
      title: bestSetup.tag,
      subtitle: `${Math.round(bestSetup.winRate)}% WR · ${bestSetup.count} trades · ${fmtMoneySigned(currency, bestSetup.totalPnl)}`,
      icon: <Trophy className="w-4 h-4 text-[#f59e0b]" strokeWidth={2} />,
      accent: "text-[#f8fafc]",
      accentBg: "bg-[#f59e0b]/10",
    });
  }

  // Worst Setup (only if different from best)
  if (analytics.worstSetup && analytics.worstSetup.tag !== bestSetup?.tag) {
    const ws = analytics.worstSetup;
    cards.push({
      label: "Watch Out",
      title: ws.tag,
      subtitle: `${Math.round(ws.winRate)}% WR · ${ws.count} trades · ${fmtMoneySigned(currency, ws.totalPnl)}`,
      icon: <AlertTriangle className="w-4 h-4 text-[#ef4444]" strokeWidth={2} />,
      accent: "text-[#ef4444]",
      accentBg: "bg-[#ef4444]/10",
    });
  }

  // Most Common Mistake
  if (mostCommonMistake) {
    cards.push({
      label: "Top Mistake",
      title: MISTAKE_LABELS[mostCommonMistake] ?? mostCommonMistake,
      subtitle: `Occurred ${mostCommonMistakeCount}x — work on fixing this`,
      icon: <AlertTriangle className="w-4 h-4 text-[#f59e0b]" strokeWidth={2} />,
      accent: "text-[#f8fafc]",
      accentBg: "bg-[#f59e0b]/10",
    });
  }

  // Best portfolio (only when multiple exist)
  const sortedPortfolios = [...portfolioStats].sort((a, b) => b.pnl - a.pnl);
  if (sortedPortfolios.length > 1) {
    const best = sortedPortfolios[0];
    cards.push({
      label: "Best Portfolio",
      title: best.portfolio.name,
      subtitle: `${fmtMoneySigned(currency, best.pnl)} · ${Math.round(best.winRate)}% WR · ${best.trades} trades`,
      icon: <TrendingUp className="w-4 h-4 text-[#22c55e]" strokeWidth={2} />,
      accent: "text-[#22c55e]",
      accentBg: "bg-[#22c55e]/10",
    });

    const worst = sortedPortfolios[sortedPortfolios.length - 1];
    if (worst.portfolio.id !== best.portfolio.id) {
      cards.push({
        label: "Needs Work",
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
