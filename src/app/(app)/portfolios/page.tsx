"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Portfolio } from "@/types";
import {
  getPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  getPortfolioTradeCounts,
} from "@/lib/db/portfolios";
import { PortfolioCard } from "@/components/portfolios/PortfolioCard";
import { PortfolioFormModal } from "@/components/portfolios/PortfolioFormModal";
import { DeleteConfirmDialog } from "@/components/portfolios/DeleteConfirmDialog";
import { toast } from "sonner";
import { useT } from "@/i18n/LanguageProvider";

export default function PortfoliosPage() {
  const { t, tf } = useT();
  const [portfolios,  setPortfolios]  = useState<Portfolio[]>([]);
  const [tradeCounts, setTradeCounts] = useState<Record<string, number>>({});
  const [loading,     setLoading]     = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState<Portfolio | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Portfolio | null>(null);

  useEffect(() => { reload(); }, []);

  async function reload() {
    try {
      const [all, counts] = await Promise.all([
        getPortfolios(),
        getPortfolioTradeCounts(),
      ]);
      setPortfolios(all);
      setTradeCounts(counts);
    } catch {
      toast.error(t("toast.portfoliosLoadFailed"));
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditTarget(null);
    setModalOpen(true);
  }

  function openEdit(portfolio: Portfolio) {
    setEditTarget(portfolio);
    setModalOpen(true);
  }

  async function handleFormSubmit(data: Omit<Portfolio, "id" | "createdAt">) {
    try {
      if (editTarget) {
        await updatePortfolio(editTarget.id, data);
        toast.success(t("toast.portfolioUpdated"));
      } else {
        await createPortfolio(data);
        toast.success(t("toast.portfolioCreated"));
      }
      setModalOpen(false);
      reload();
    } catch {
      toast.error(t("toast.portfolioSaveFailed"));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deletePortfolio(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" ${t("common.deleted")}`);
      setDeleteTarget(null);
      reload();
    } catch {
      toast.error(t("toast.portfolioDeleteFailed"));
    }
  }

  const label = portfolios.length === 1
    ? t("portfolios.account_one")
    : tf("portfolios.account_other", { n: portfolios.length });

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] leading-none text-[#f8fafc]">
            {t("nav.portfolios")}
          </h1>
          <p className="text-[12px] text-[#475569] mt-1.5">{label}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 h-8 px-3 rounded-lg bg-[#f8fafc] text-[#020617] text-[13px] font-semibold hover:bg-[#e2e8f0] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          {t("portfolios.newPortfolio")}
        </button>
      </div>

      {portfolios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-[#1e293b] bg-[#0e1223]">
          <div className="w-12 h-12 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
              <polyline
                points="1,10 4,6 7,8 10,3 13,1"
                stroke="#475569"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-[#f8fafc] mb-2">{t("portfolios.noPortfoliosTitle")}</p>
          <p className="text-[12px] text-[#475569] max-w-xs mb-6 leading-relaxed">
            {t("portfolios.noPortfoliosDesc")}
          </p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 h-8 px-4 rounded-lg bg-[#f8fafc] text-[#020617] text-[13px] font-semibold hover:bg-[#e2e8f0] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            {t("portfolios.createPortfolio")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {portfolios.map((p) => (
            <PortfolioCard
              key={p.id}
              portfolio={p}
              tradeCount={tradeCounts[p.id] ?? 0}
              onEdit={() => openEdit(p)}
              onDelete={() => setDeleteTarget(p)}
            />
          ))}
        </div>
      )}

      <PortfolioFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFormSubmit}
        initial={editTarget}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        portfolioName={deleteTarget?.name ?? ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
