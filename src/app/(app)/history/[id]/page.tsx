"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Trash2, TrendingUp, TrendingDown, Minus, ImageOff,
} from "lucide-react";
import { Trade, Portfolio } from "@/types";
import { getTradeById, deleteTrade } from "@/lib/db/trades";
import { getPortfolioById } from "@/lib/db/portfolios";
import { DeleteTradeDialog } from "@/components/trades/DeleteTradeDialog";
import { PairDisplay } from "@/components/shared/PairDisplay";
import { fmtMoney, fmtMoneySigned } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  no_stop: "No Stop Loss", early_exit: "Early Exit", oversized: "Oversized",
  fomo_entry: "FOMO Entry", revenge_trade: "Revenge Trade", broke_rules: "Broke Rules",
  moved_sl: "Moved SL", overtraded: "Overtraded",
};

function formatDateTime(s: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", hour12: false }).format(new Date(s));
}

function formatNum(n: number, decimals = 2) {
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] overflow-hidden">
      <div className="px-5 py-3 border-b border-[#0f172a]">
        <p className="text-[11px] font-bold text-[#334155] uppercase tracking-[0.08em]">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#0f172a] last:border-0">
      <span className="text-[12px] font-semibold text-[#475569] shrink-0">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function EmoBadge({ emotion }: { emotion: string }) {
  const m = EMOTION_META[emotion];
  if (!m) return <span className="text-[13px] text-[#f8fafc] font-semibold">{emotion}</span>;
  return <span className={cn("text-[12px] font-semibold border px-2.5 py-1 rounded-lg", m.color, m.bg)}>{m.emoji} {m.label}</span>;
}

export default function TradeDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [trade,      setTrade]      = useState<Trade | null>(null);
  const [portfolio,  setPortfolio]  = useState<Portfolio | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const t = await getTradeById(id);
      if (!t) { router.replace("/history"); return; }
      setTrade(t);
      const p = await getPortfolioById(t.portfolioId);
      setPortfolio(p);
    }
    load();
  }, [id, router]);

  async function handleDelete() {
    if (!trade) return;
    try {
      await deleteTrade(id);
      toast.success(`${trade.pair} trade deleted`);
      router.push("/history");
    } catch {
      toast.error("Failed to delete trade");
    }
  }

  if (!trade) return null;

  const isWin  = trade.outcome === "win";
  const isLoss = trade.outcome === "loss";
  const PnlIcon = isWin ? TrendingUp : isLoss ? TrendingDown : Minus;
  const pnlColor = isWin ? "text-[#22c55e]" : isLoss ? "text-[#ef4444]" : "text-[#94a3b8]";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/history" className="flex items-center gap-1.5 text-[12px] font-semibold text-[#475569] hover:text-[#f8fafc] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Trade History
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/add-trade?edit=${trade.id}`} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#1e293b] text-[12px] font-semibold text-[#475569] hover:border-[#334155] hover:text-[#f8fafc] transition-colors cursor-pointer">
            <Pencil className="w-3 h-3" />Edit
          </Link>
          <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#ef4444]/30 text-[12px] font-semibold text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors cursor-pointer">
            <Trash2 className="w-3 h-3" />Delete
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <PairDisplay pair={trade.pair} className="text-[20px] font-bold tracking-[-0.02em] text-[#f8fafc]" />
              <span className={cn("text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md", trade.direction === "long" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]")}>{trade.direction}</span>
              <span className={cn("text-[11px] font-semibold capitalize px-2 py-0.5 rounded-md", isWin ? "bg-[#22c55e]/10 text-[#22c55e]" : isLoss ? "bg-[#ef4444]/10 text-[#ef4444]" : "bg-[#1e293b] text-[#94a3b8]")}>{trade.outcome}</span>
            </div>
            <p className="text-[12px] text-[#475569] mt-1">{portfolio?.name ?? "—"} · {trade.market} · {formatDateTime(trade.dateTime)}</p>
          </div>
          <div className="text-right">
            <p className={cn("text-[26px] font-bold tabular leading-none tracking-[-0.02em]", pnlColor)}>{fmtMoneySigned(portfolio?.currency ?? "$", trade.pnl, 2)}</p>
            <p className={cn("text-[13px] font-semibold tabular mt-0.5", pnlColor)}>{trade.pnlPercent >= 0 ? "+" : ""}{trade.pnlPercent.toFixed(2)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Entry",    value: fmtMoney(portfolio?.currency ?? "$", trade.entryPrice, 2) },
            { label: "Exit",     value: fmtMoney(portfolio?.currency ?? "$", trade.exitPrice, 2)  },
            { label: "Size",     value: formatNum(trade.positionSize, 4)  },
            { label: "Currency", value: portfolio?.currency ?? "USD"      },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-[#0f172a] border border-[#1e293b] px-3 py-2.5">
              <p className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.06em] mb-1">{label}</p>
              <p className="text-[13px] font-bold text-[#f8fafc] tabular">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section title="Setup Tag">
          {trade.setupTag
            ? <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#0f172a] border border-[#1e293b] text-[13px] font-semibold text-[#f8fafc]">{trade.setupTag}</span>
            : <p className="text-[13px] text-[#334155]">No setup tagged</p>
          }
        </Section>
        <Section title="Emotions">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#334155] w-14 shrink-0">Before</span>
              {trade.emotionBefore ? <EmoBadge emotion={trade.emotionBefore} /> : <span className="text-[12px] text-[#334155]">—</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#334155] w-14 shrink-0">After</span>
              {trade.emotionAfter ? <EmoBadge emotion={trade.emotionAfter} /> : <span className="text-[12px] text-[#334155]">—</span>}
            </div>
          </div>
        </Section>
      </div>

      <Section title="Mistakes">
        {trade.mistakes.length === 0
          ? <p className="text-[13px] text-[#334155]">No mistakes logged — great discipline!</p>
          : <div className="flex flex-wrap gap-2">
              {trade.mistakes.map((m) => (
                <span key={m} className="text-[12px] font-semibold text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2.5 py-1 rounded-lg">
                  {MISTAKE_LABELS[m] ?? m}
                </span>
              ))}
            </div>
        }
      </Section>

      {(trade.notes || trade.lessonLearned) && (
        <Section title="Reflection">
          <div className="space-y-4">
            {trade.notes && (
              <div>
                <p className="text-[10px] font-bold text-[#334155] uppercase tracking-[0.08em] mb-1.5">Trade Notes</p>
                <p className="text-[13px] text-[#94a3b8] leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
              </div>
            )}
            {trade.lessonLearned && (
              <div className={trade.notes ? "pt-4 border-t border-[#0f172a]" : ""}>
                <p className="text-[10px] font-bold text-[#334155] uppercase tracking-[0.08em] mb-1.5">Lesson Learned</p>
                <p className="text-[13px] text-[#94a3b8] leading-relaxed whitespace-pre-wrap">{trade.lessonLearned}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      <Section title="Screenshot">
        {trade.screenshotUrl
          ? <div className="rounded-lg overflow-hidden border border-[#1e293b]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={trade.screenshotUrl} alt={`${trade.pair} trade screenshot`} className="w-full object-contain max-h-80" />
            </div>
          : <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed border-[#1e293b]">
              <ImageOff className="w-7 h-7 text-[#1e293b] mb-2" />
              <p className="text-[12px] text-[#334155]">No screenshot uploaded</p>
            </div>
        }
      </Section>

      <Section title="Details">
        <div>
          <DataRow label="Portfolio"><span className="text-[13px] font-semibold text-[#f8fafc]">{portfolio?.name ?? "—"}</span></DataRow>
          <DataRow label="Market"><span className="text-[13px] text-[#94a3b8]">{trade.market}</span></DataRow>
          <DataRow label="Logged"><span className="text-[13px] text-[#94a3b8]">{formatDateTime(trade.createdAt)}</span></DataRow>
          <DataRow label="Trade ID"><span className="text-[11px] text-[#334155] font-mono truncate max-w-[180px] inline-block">{trade.id}</span></DataRow>
        </div>
      </Section>

      <div className="flex gap-3 pb-4">
        <Link href={`/add-trade?edit=${trade.id}`} className="flex-1 h-11 rounded-xl border border-[#1e293b] text-[14px] font-semibold text-[#475569] flex items-center justify-center gap-2 hover:border-[#334155] hover:text-[#f8fafc] transition-colors cursor-pointer">
          <Pencil className="w-4 h-4" />Edit Trade
        </Link>
        <button onClick={() => setDeleteOpen(true)} className="flex-1 h-11 rounded-xl border border-[#ef4444]/30 text-[14px] font-semibold text-[#ef4444] flex items-center justify-center gap-2 hover:bg-[#ef4444]/10 transition-colors cursor-pointer">
          <Trash2 className="w-4 h-4" />Delete Trade
        </button>
      </div>

      <DeleteTradeDialog
        open={deleteOpen}
        tradePair={trade.pair}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      {/* Suppress unused PnlIcon warning */}
      <span style={{ display: "none" }}><PnlIcon /></span>
    </div>
  );
}
