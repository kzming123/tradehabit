"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronLeft, ChevronRight, Trash2, Star } from "lucide-react";
import { getPortfolios } from "@/lib/db/portfolios";
import { getTrades } from "@/lib/db/trades";
import {
  getWeeklyReviews,
  createWeeklyReview,
  updateWeeklyReview,
  deleteWeeklyReview,
} from "@/lib/db/weekly-reviews";
import {
  calcWeekAnalytics, getWeekBounds, formatWeekRange, weekStartISO,
} from "@/lib/analytics";
import { fmtMoneySigned } from "@/lib/format";
import { Portfolio, WeeklyReview } from "@/types";
import { toast } from "sonner";

const MISTAKE_OPTIONS = [
  { key: "no_stop",       label: "No Stop Loss" },
  { key: "early_exit",    label: "Early Exit"   },
  { key: "oversized",     label: "Oversized"    },
  { key: "fomo_entry",    label: "FOMO Entry"   },
  { key: "revenge_trade", label: "Revenge Trade"},
  { key: "broke_rules",   label: "Broke Rules"  },
  { key: "moved_sl",      label: "Moved SL"     },
  { key: "overtraded",    label: "Overtraded"   },
  { key: "none",          label: "None this week"},
];

const MISTAKE_LABELS = Object.fromEntries(MISTAKE_OPTIONS.map(({ key, label }) => [key, label]));

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Terrible week",  color: "text-[#ef4444]" },
  2: { label: "Below average",  color: "text-[#f59e0b]" },
  3: { label: "Average",        color: "text-[#94a3b8]" },
  4: { label: "Good week",      color: "text-[#3b82f6]" },
  5: { label: "Excellent!",     color: "text-[#22c55e]" },
};

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] overflow-hidden">
      <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-[#0f172a]">
        <p className="text-[14px] font-semibold text-[#f8fafc]">{title}</p>
        {description && <p className="text-[12px] text-[#475569] mt-0.5">{description}</p>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function Textarea({ placeholder, rows = 2, value, onChange }: { placeholder: string; rows?: number; value: string; onChange: (v: string) => void }) {
  return (
    <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2.5 text-[13px] text-[#f8fafc] placeholder:text-[#334155] resize-none focus:outline-none focus:border-[#334155] focus:ring-1 focus:ring-[#334155] transition-colors" />
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] px-3 py-3 sm:px-4 sm:py-3.5 text-center min-w-0">
      <p className={cn("text-[17px] sm:text-[20px] font-bold leading-none tracking-tight tabular-nums truncate", color)}>{value}</p>
      <p className="text-[9px] sm:text-[10px] font-semibold text-[#334155] uppercase tracking-[0.08em] mt-1.5 truncate">{label}</p>
    </div>
  );
}

function WeekSummary({ weekAnalytics, currency }: { weekAnalytics: ReturnType<typeof calcWeekAnalytics>; currency: string }) {
  const { totalTrades, wins, winRate, totalPnl, avgPnl, bestSetup, mostCommonMistake, bestDay, worstDay } = weekAnalytics;
  const pnlColor = totalPnl > 0 ? "text-[#22c55e]" : totalPnl < 0 ? "text-[#ef4444]" : "text-[#94a3b8]";
  void wins; // used in winRate calculation upstream

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatPill label="PnL"      value={fmtMoneySigned(currency, totalPnl)}                                                color={pnlColor} />
        <StatPill label="Trades"   value={String(totalTrades)}                                                                color="text-[#f8fafc]" />
        <StatPill label="Win Rate" value={totalTrades > 0 ? `${Math.round(winRate)}%` : "—"}                                  color="text-[#3b82f6]" />
        <StatPill label="Avg PnL"  value={totalTrades > 0 ? fmtMoneySigned(currency, avgPnl) : "—"}                           color={avgPnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"} />
      </div>

      {(bestDay || worstDay || bestSetup || mostCommonMistake) && (
        <div className="grid grid-cols-2 gap-2">
          {bestDay && <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] px-4 py-3"><p className="text-[10px] font-bold text-[#334155] uppercase tracking-[0.08em] mb-1">Best Day</p><p className="text-[13px] font-bold text-[#22c55e] tabular">{bestDay.day} {fmtMoneySigned(currency, bestDay.pnl)}</p></div>}
          {worstDay && worstDay.date !== bestDay?.date && <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] px-4 py-3"><p className="text-[10px] font-bold text-[#334155] uppercase tracking-[0.08em] mb-1">Worst Day</p><p className="text-[13px] font-bold text-[#ef4444] tabular">{worstDay.day} {fmtMoneySigned(currency, worstDay.pnl)}</p></div>}
          {bestSetup && <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] px-4 py-3"><p className="text-[10px] font-bold text-[#334155] uppercase tracking-[0.08em] mb-1">Best Setup</p><p className="text-[13px] font-bold text-[#f8fafc] truncate">{bestSetup}</p></div>}
          {mostCommonMistake && <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] px-4 py-3"><p className="text-[10px] font-bold text-[#334155] uppercase tracking-[0.08em] mb-1">Top Mistake</p><p className="text-[13px] font-bold text-[#f59e0b] truncate">{MISTAKE_LABELS[mostCommonMistake] ?? mostCommonMistake}</p></div>}
        </div>
      )}
    </div>
  );
}

function HistoryCard({ review, portfolioName, onDelete }: { review: WeeklyReview; portfolioName: string; onDelete: () => void }) {
  const weekEnd = review.weekEnd ?? (() => {
    const d = new Date(review.weekStart + "T12:00:00");
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <div className="group rounded-xl border border-[#1e293b] bg-[#0e1223] p-4 transition-colors hover:border-[#334155]">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-[13px] font-semibold text-[#f8fafc] truncate">{formatWeekRange(new Date(review.weekStart + "T12:00:00"), new Date(weekEnd + "T12:00:00"))}</span>
          {review.portfolioId && <span className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.08em] border border-[#1e293b] rounded px-1.5 py-0.5">{portfolioName}</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={cn("w-3 h-3", s <= review.rating ? "fill-[#f59e0b] text-[#f59e0b]" : "text-[#1e293b]")} />)}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="Delete review"
            className="ml-1 w-7 h-7 flex items-center justify-center rounded-lg text-[#475569] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors cursor-pointer md:opacity-0 md:group-hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", review.followedPlan ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]")}>{review.followedPlan ? "Followed Plan" : "Deviated"}</span>
        {review.repeatedMistake && review.repeatedMistake !== "none" && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b]">{MISTAKE_LABELS[review.repeatedMistake] ?? review.repeatedMistake}</span>}
      </div>
      {review.improvementNextWeek && <p className="text-[12px] text-[#94a3b8] line-clamp-2 mt-2">Goal: {review.improvementNextWeek}</p>}
    </div>
  );
}

interface FormState {
  followedPlan: boolean | null; followedPlanNotes: string;
  repeatedMistake: string; repeatedMistakeNotes: string;
  improvementNextWeek: string; notes: string; rating: number;
}

const EMPTY_FORM: FormState = { followedPlan: null, followedPlanNotes: "", repeatedMistake: "", repeatedMistakeNotes: "", improvementNextWeek: "", notes: "", rating: 0 };

function reviewToForm(r: WeeklyReview): FormState {
  return {
    followedPlan: r.followedPlan, followedPlanNotes: r.followedPlanNotes ?? "",
    repeatedMistake: r.repeatedMistake ?? "", repeatedMistakeNotes: r.repeatedMistakeNotes ?? "",
    improvementNextWeek: r.improvementNextWeek ?? "", notes: r.notes ?? "", rating: r.rating,
  };
}

export default function WeeklyReviewPage() {
  const [hydrated,    setHydrated]    = useState(false);
  const [portfolios,  setPortfolios]  = useState<Portfolio[]>([]);
  const [allTrades,   setAllTrades]   = useState<ReturnType<typeof getTrades> extends Promise<infer T> ? T : never>([]);
  const [allReviews,  setAllReviews]  = useState<WeeklyReview[]>([]);
  const [portfolioId, setPortfolioId] = useState<string>("all");
  const [weekOffset,  setWeekOffset]  = useState(0);
  const [tab,         setTab]         = useState<"write" | "history">("write");
  const [form,        setForm]        = useState<FormState>(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [ps, ts, rs] = await Promise.all([getPortfolios(), getTrades(), getWeeklyReviews()]);
        setPortfolios(ps);
        setAllTrades(ts);
        setAllReviews(rs);
        if (ps.length === 1) setPortfolioId(ps[0].id);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setHydrated(true);
      }
    }
    load();
  }, []);

  const { weekStart, weekEnd, weekStartStr, weekEndStr, weekRange } = useMemo(() => {
    const ref = new Date();
    ref.setDate(ref.getDate() + weekOffset * 7);
    const { start, end } = getWeekBounds(ref);
    return {
      weekStart: start, weekEnd: end,
      weekStartStr: weekStartISO(start),
      weekEndStr:   weekStartISO(end),
      weekRange:    formatWeekRange(start, end),
    };
  }, [weekOffset]);

  const weekAnalytics = useMemo(
    () => calcWeekAnalytics(allTrades, weekStart, weekEnd, portfolioId),
    [allTrades, weekStart, weekEnd, portfolioId]
  );

  const existingReview = useMemo(
    () => allReviews.find((r) => {
      if (r.weekStart !== weekStartStr) return false;
      return portfolioId === "all" ? !r.portfolioId : r.portfolioId === portfolioId;
    }) ?? null,
    [allReviews, weekStartStr, portfolioId]
  );

  useEffect(() => {
    setForm(existingReview ? reviewToForm(existingReview) : EMPTY_FORM);
  }, [existingReview]);

  const currency = useMemo(() => {
    if (portfolioId === "all") return "$";
    return portfolios.find((p) => p.id === portfolioId)?.currency ?? "$";
  }, [portfolioId, portfolios]);

  const portfolioMap = useMemo(() => Object.fromEntries(portfolios.map((p) => [p.id, p.name])), [portfolios]);
  const historyReviews = useMemo(() => [...allReviews].sort((a, b) => b.weekStart.localeCompare(a.weekStart)), [allReviews]);
  const isCurrentWeek = weekOffset === 0;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (form.followedPlan === null) { toast.error("Please answer the plan question"); return; }
    if (form.rating === 0)          { toast.error("Please rate your week"); return; }
    setSaving(true);
    try {
      const data = {
        portfolioId:          portfolioId === "all" ? undefined : portfolioId,
        weekStart:            weekStartStr,
        weekEnd:              weekEndStr,
        followedPlan:         form.followedPlan!,
        followedPlanNotes:    form.followedPlanNotes    || undefined,
        repeatedMistake:      form.repeatedMistake      || undefined,
        repeatedMistakeNotes: form.repeatedMistakeNotes || undefined,
        improvementNextWeek:  form.improvementNextWeek  || undefined,
        notes:                form.notes                || undefined,
        rating:               form.rating as 1 | 2 | 3 | 4 | 5,
      };

      if (existingReview) {
        await updateWeeklyReview(existingReview.id, data);
        toast.success("Review updated");
      } else {
        await createWeeklyReview(data);
        toast.success("Review saved");
      }
      setAllReviews(await getWeeklyReviews());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save review";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteReview(id: string) {
    try {
      await deleteWeeklyReview(id);
      setAllReviews(await getWeeklyReviews());
      toast.success("Review deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete review";
      toast.error(msg);
    }
  }

  if (!hydrated) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="space-y-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] leading-none text-[#f8fafc]">Weekly Review</h1>
          <p className="text-[12px] text-[#475569] mt-1.5">{weekRange}</p>
        </div>
        {portfolios.length >= 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1">
            {["all", ...portfolios.map((p) => p.id)].map((pid) => (
              <button
                key={pid}
                onClick={() => setPortfolioId(pid)}
                className={cn(
                  "h-7 px-3 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer shrink-0",
                  portfolioId === pid
                    ? "bg-[#f8fafc] text-[#020617] border-transparent"
                    : "border-[#1e293b] text-[#475569] hover:border-[#334155] hover:text-[#94a3b8]"
                )}
              >
                {pid === "all" ? "All" : portfolioMap[pid] ?? pid}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between bg-[#0e1223] rounded-xl border border-[#1e293b] px-4 py-3">
        <button onClick={() => setWeekOffset((n) => n - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#1e293b] text-[#475569] hover:border-[#334155] hover:text-[#f8fafc] transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
        <div className="text-center">
          <p className="text-[13px] font-semibold text-[#f8fafc]">{weekRange}</p>
          {isCurrentWeek && <p className="text-[10px] text-[#475569] mt-0.5">Current Week</p>}
        </div>
        <button onClick={() => setWeekOffset((n) => n + 1)} disabled={isCurrentWeek} className={cn("w-8 h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer", isCurrentWeek ? "border-[#0f172a] text-[#1e293b] cursor-not-allowed" : "border-[#1e293b] text-[#475569] hover:border-[#334155] hover:text-[#f8fafc]")}><ChevronRight className="w-4 h-4" /></button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#0e1223] rounded-xl border border-[#1e293b] p-1">
        {(["write", "history"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("flex-1 h-8 rounded-lg text-[12px] font-semibold transition-all duration-150 cursor-pointer", tab === t ? "bg-[#0f172a] text-[#f8fafc] shadow-sm" : "text-[#475569] hover:text-[#94a3b8]")}>
            {t === "write" ? "Write Review" : `History (${historyReviews.length})`}
          </button>
        ))}
      </div>

      {/* Write tab */}
      {tab === "write" && (
        <div className="space-y-4">
          {existingReview && <div className="rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/5 px-4 py-3"><p className="text-[12px] text-[#3b82f6] font-semibold">Editing existing review for this week</p></div>}

          {weekAnalytics.totalTrades > 0
            ? <WeekSummary weekAnalytics={weekAnalytics} currency={currency} />
            : <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] px-5 py-4 text-center"><p className="text-[13px] text-[#475569]">No trades this week — you can still write a reflection.</p></div>
          }

          <SectionCard title="Did you follow your trading plan?" description="Be honest with yourself">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[{ value: true, label: "Yes, I was disciplined" }, { value: false, label: "No, I deviated" }].map(({ value, label }) => (
                <button key={String(value)} onClick={() => setField("followedPlan", value)} className={cn("h-10 rounded-lg text-[13px] font-semibold border transition-all duration-150 cursor-pointer", form.followedPlan === value ? value ? "bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]" : "bg-[#ef4444]/10 border-[#ef4444]/40 text-[#ef4444]" : "border-[#1e293b] text-[#475569] hover:border-[#334155] hover:text-[#94a3b8]")}>{label}</button>
              ))}
            </div>
            {form.followedPlan !== null && (
              <textarea rows={2} value={form.followedPlanNotes} onChange={(e) => setField("followedPlanNotes", e.target.value)} placeholder={form.followedPlan ? "What helped you stay disciplined?" : "What caused you to deviate?"} className="w-full rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2.5 text-[13px] text-[#f8fafc] placeholder:text-[#334155] resize-none focus:outline-none focus:border-[#334155] focus:ring-1 focus:ring-[#334155] transition-colors" />
            )}
          </SectionCard>

          <SectionCard title="What mistake repeated this week?">
            <div className="flex flex-wrap gap-2 mb-3">
              {MISTAKE_OPTIONS.map(({ key, label }) => (
                <button key={key} onClick={() => setField("repeatedMistake", key === form.repeatedMistake ? "" : key)} className={cn("px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all duration-150 cursor-pointer flex items-center gap-1.5", form.repeatedMistake === key ? key === "none" ? "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]" : "bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#f59e0b]" : "border-[#1e293b] text-[#475569] hover:border-[#334155] hover:text-[#94a3b8]")}>
                  {label}
                  {weekAnalytics.mostCommonMistake === key && <span className="text-[9px] font-bold text-[#f59e0b] bg-[#f59e0b]/20 px-1 rounded">AUTO</span>}
                </button>
              ))}
            </div>
            {form.repeatedMistake && form.repeatedMistake !== "none" && (
              <Textarea placeholder="Describe what happened and how to avoid it next time..." value={form.repeatedMistakeNotes} onChange={(v) => setField("repeatedMistakeNotes", v)} />
            )}
          </SectionCard>

          <SectionCard title="What's your goal for next week?" description="One focused improvement">
            <Textarea rows={3} placeholder="E.g. Only trade during the first 2 hours of the session..." value={form.improvementNextWeek} onChange={(v) => setField("improvementNextWeek", v)} />
          </SectionCard>

          <SectionCard title="Additional notes" description="Anything else you want to remember">
            <Textarea rows={3} placeholder="Market context, mindset observations, external factors..." value={form.notes} onChange={(v) => setField("notes", v)} />
          </SectionCard>

          <SectionCard title="How was this week overall?">
            <div className="flex gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} onClick={() => setField("rating", r)} className={cn("flex-1 h-11 rounded-xl text-[15px] font-bold border transition-all duration-150 cursor-pointer", form.rating === r ? "bg-[#f8fafc]/10 border-[#f8fafc]/20 text-[#f8fafc] scale-105" : "border-[#1e293b] text-[#334155] hover:border-[#334155] hover:text-[#94a3b8]")}>{r}</button>
              ))}
            </div>
            {form.rating > 0 && <p className={cn("text-center text-[12px] font-semibold mt-1", RATING_LABELS[form.rating].color)}>{RATING_LABELS[form.rating].label}</p>}
          </SectionCard>

          <button onClick={handleSave} disabled={saving} className="w-full h-11 rounded-xl bg-[#f8fafc] text-[#020617] text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-[#e2e8f0] active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
            <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
            {saving ? "Saving…" : existingReview ? "Update Review" : "Save Weekly Review"}
          </button>
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div className="space-y-3">
          {historyReviews.length === 0 ? (
            <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] px-5 py-10 text-center">
              <p className="text-[14px] font-semibold text-[#f8fafc] mb-1">No reviews yet</p>
              <p className="text-[12px] text-[#475569]">Save your first weekly review to see history here.</p>
            </div>
          ) : (
            historyReviews.map((r) => (
              <HistoryCard key={r.id} review={r} portfolioName={r.portfolioId ? (portfolioMap[r.portfolioId] ?? "Unknown") : "All Portfolios"} onDelete={() => handleDeleteReview(r.id)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
