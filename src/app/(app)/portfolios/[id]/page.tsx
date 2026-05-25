"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Target, FileText, TrendingUp, TrendingDown, Pencil, Trash2 } from "lucide-react";
import { Portfolio, Trade } from "@/types";
import { getPortfolioById, updatePortfolio, deletePortfolio } from "@/lib/db/portfolios";
import { getTradesByPortfolio } from "@/lib/db/trades";
import { PortfolioFormModal } from "@/components/portfolios/PortfolioFormModal";
import { DeleteConfirmDialog } from "@/components/portfolios/DeleteConfirmDialog";
import { PairDisplay } from "@/components/shared/PairDisplay";
import { fmtMoney, fmtMoneySigned } from "@/lib/format";
import { toast } from "sonner";
import { useT } from "@/i18n/LanguageProvider";

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "green" | "red" }) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] p-4">
      <p className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.06em] mb-1.5">{label}</p>
      <p className={`text-[22px] font-bold leading-none tracking-[-0.02em] tabular ${accent === "green" ? "text-[#22c55e]" : accent === "red" ? "text-[#ef4444]" : "text-[#f8fafc]"}`}>{value}</p>
    </div>
  );
}

export default function PortfolioDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const { t }   = useT();

  const [portfolio,  setPortfolio]  = useState<Portfolio | null>(null);
  const [trades,     setTrades]     = useState<Trade[]>([]);
  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    const p = await getPortfolioById(id);
    if (!p) { router.replace("/portfolios"); return; }
    setPortfolio(p);
    const ts = await getTradesByPortfolio(id);
    setTrades(ts);
  }

  async function handleEdit(data: Omit<Portfolio, "id" | "createdAt">) {
    try {
      await updatePortfolio(id, data);
      toast.success(t("toast.portfolioUpdated"));
      setEditOpen(false);
      load();
    } catch { toast.error(t("toast.portfolioUpdateFailed")); }
  }

  async function handleDelete() {
    if (!portfolio) return;
    try {
      await deletePortfolio(id);
      toast.success(`"${portfolio.name}" ${t("common.deleted")}`);
      router.push("/portfolios");
    } catch { toast.error(t("toast.portfolioDeleteFailed")); }
  }

  if (!portfolio) return null;

  const wins     = trades.filter((t) => t.outcome === "win").length;
  const losses   = trades.filter((t) => t.outcome === "loss").length;
  const winRate  = trades.length > 0 ? Math.round((wins / trades.length) * 100) : null;
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const hasPnl   = trades.length > 0;

  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/portfolios" className="flex items-center gap-1.5 text-[12px] font-semibold text-[#475569] hover:text-[#f8fafc] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />{t("nav.portfolios")}
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#1e293b] text-[12px] font-semibold text-[#475569] hover:border-[#334155] hover:text-[#f8fafc] transition-colors cursor-pointer">
            <Pencil className="w-3 h-3" />{t("common.edit")}
          </button>
          <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#ef4444]/30 text-[12px] font-semibold text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors cursor-pointer">
            <Trash2 className="w-3 h-3" />{t("common.delete")}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                <polyline points="1,10 4,6 7,8 10,3 13,1" stroke="#22c55e" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-[18px] font-bold tracking-[-0.02em] text-[#f8fafc] leading-none">{portfolio.name}</h1>
              <p className="text-[12px] text-[#475569] mt-0.5">{portfolio.broker}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#475569] border border-[#1e293b] px-2 py-0.5 rounded-md">{portfolio.currency}</span>
            <span className="text-[10px] font-semibold text-[#475569] bg-[#0f172a] border border-[#1e293b] px-2 py-0.5 rounded-md">{t(`tradingStyles.${portfolio.tradingStyle}`) || portfolio.tradingStyle}</span>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-[#334155] uppercase tracking-[0.06em] mb-1">{t("portfolioDetail.startingBalance")}</p>
          <p className="text-[32px] font-bold tracking-[-0.03em] text-[#f8fafc] leading-none tabular">{fmtMoney(portfolio.currency, portfolio.startingBalance)}</p>
        </div>

        {(portfolio.goal || portfolio.notes) && (
          <div className="mt-5 pt-5 border-t border-[#1e293b] space-y-3">
            {portfolio.goal && (
              <div className="flex gap-2.5">
                <Target className="w-3.5 h-3.5 text-[#475569] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.06em] mb-0.5">{t("portfolioDetail.goal")}</p>
                  <p className="text-[13px] text-[#94a3b8] leading-relaxed">{portfolio.goal}</p>
                </div>
              </div>
            )}
            {portfolio.notes && (
              <div className="flex gap-2.5">
                <FileText className="w-3.5 h-3.5 text-[#475569] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.06em] mb-0.5">{t("portfolioDetail.notes")}</p>
                  <p className="text-[13px] text-[#94a3b8] leading-relaxed">{portfolio.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t("portfolioDetail.totalTrades")} value={String(trades.length)} />
        <StatCard label={t("portfolioDetail.winRate")} value={winRate !== null ? `${winRate}%` : "—"} />
        <StatCard
          label={t("portfolioDetail.totalPnl")}
          value={hasPnl ? fmtMoneySigned(portfolio.currency, totalPnl, 2) : "—"}
          accent={hasPnl ? (totalPnl >= 0 ? "green" : "red") : undefined}
        />
        <StatCard label={t("portfolioDetail.wl")} value={trades.length > 0 ? `${wins} / ${losses}` : "—"} />
      </div>

      <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b]">
          <p className="text-[13px] font-bold text-[#f8fafc]">{t("portfolioDetail.recentTrades")}</p>
          <Link href="/add-trade" className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-[#f8fafc] text-[#020617] text-[12px] font-bold hover:bg-[#e2e8f0] transition-colors">
            <Plus className="w-3 h-3" strokeWidth={2.5} />{t("portfolioDetail.addTrade")}
          </Link>
        </div>

        {recentTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-[13px] font-semibold text-[#475569] mb-1">{t("portfolioDetail.noTradesTitle")}</p>
            <p className="text-[12px] text-[#334155]">{t("portfolioDetail.noTradesDesc")}</p>
          </div>
        ) : (
          <div>
            {recentTrades.map((trade) => {
              const isWin  = trade.outcome === "win";
              const isLoss = trade.outcome === "loss";
              const Icon   = isWin ? TrendingUp : TrendingDown;
              return (
                <div key={trade.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#0f172a] last:border-0 hover:bg-[#0f172a]/50 transition-colors">
                  <div className={`w-1 h-8 rounded-full shrink-0 ${isWin ? "bg-[#22c55e]" : isLoss ? "bg-[#ef4444]" : "bg-[#475569]"}`} />
                  <div className="flex-1 min-w-0">
                    <PairDisplay pair={trade.pair} className="text-[13px] font-bold text-[#f8fafc]" />
                    <p className="text-[11px] text-[#475569]">{trade.direction === "long" ? t("common.long") : t("common.short")} · {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(trade.dateTime))}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[13px] font-bold tabular ${isWin ? "text-[#22c55e]" : isLoss ? "text-[#ef4444]" : "text-[#475569]"}`}>
                      {fmtMoneySigned(portfolio.currency, trade.pnl, 2)}
                    </p>
                    <p className="text-[11px] text-[#475569] tabular">{trade.pnlPercent >= 0 ? "+" : ""}{trade.pnlPercent.toFixed(2)}%</p>
                  </div>
                  <Icon className={`w-4 h-4 shrink-0 ${isWin ? "text-[#22c55e]" : isLoss ? "text-[#ef4444]" : "text-[#475569]"}`} strokeWidth={2} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PortfolioFormModal open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleEdit} initial={portfolio} />
      <DeleteConfirmDialog open={deleteOpen} portfolioName={portfolio.name} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} />
    </div>
  );
}
