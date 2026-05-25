"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, CheckCircle2, Upload, X, Sparkles, AlertCircle, Zap, ImagePlus } from "lucide-react";
import { SetupInput } from "@/components/shared/SetupInput";
import { PairDisplay } from "@/components/shared/PairDisplay";
import { fmtMoneySigned } from "@/lib/format";
import { getPortfolios } from "@/lib/db/portfolios";
import { createTrade, updateTrade, getTradeById } from "@/lib/db/trades";
import { uploadScreenshot, deleteScreenshot } from "@/lib/supabase/storage";
import { createClient } from "@/lib/supabase/client";
import {
  getLastPortfolio, setLastPortfolio,
  getRecentEmotions, pushRecentEmotion,
  getRecentPairs, pushRecentPair,
  getTradeDraft, setTradeDraft, clearTradeDraft,
  getQuickMode, setQuickMode as persistQuickMode,
} from "@/lib/preferences";
import { Portfolio, Trade } from "@/types";
import { useT } from "@/i18n/LanguageProvider";
import { toast } from "sonner";

const MARKETS = ["Crypto", "Forex", "Stocks", "Indices", "Commodities", "Futures"];

const EMOTION_KEYS = [
  { key: "calm",        color: "text-[#22c55e]", bg: "bg-[#22c55e]/10 border-[#22c55e]/30" },
  { key: "confident",   color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10 border-[#3b82f6]/30" },
  { key: "disciplined", color: "text-[#22c55e]", bg: "bg-[#22c55e]/10 border-[#22c55e]/30" },
  { key: "fomo",        color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10 border-[#f59e0b]/30" },
  { key: "greedy",      color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10 border-[#f59e0b]/30" },
  { key: "fearful",     color: "text-[#ef4444]", bg: "bg-[#ef4444]/10 border-[#ef4444]/30" },
  { key: "revenge",     color: "text-[#ef4444]", bg: "bg-[#ef4444]/10 border-[#ef4444]/30" },
];

const MISTAKE_KEYS = [
  "no_stop", "early_exit", "oversized", "fomo_entry",
  "revenge_trade", "broke_rules", "moved_sl", "overtraded",
];

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#0f172a] flex items-center justify-between">
        <p className="text-[11px] font-bold text-[#334155] uppercase tracking-[0.08em]">{title}</p>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">
      {children}{required && <span className="text-[#ef4444] ml-0.5">*</span>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", hasError, inputMode, autoFocus, list, autoCapitalize }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; hasError?: boolean; inputMode?: "decimal" | "numeric" | "text"; autoFocus?: boolean;
  list?: string; autoCapitalize?: string;
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      list={list}
      autoCapitalize={autoCapitalize}
      className={cn(
        "w-full h-11 rounded-lg border bg-[#0f172a] px-3 text-[14px] text-[#f8fafc] placeholder:text-[#334155]",
        "focus:outline-none focus:ring-1 transition-colors",
        hasError
          ? "border-[#ef4444]/60 ring-[#ef4444]/40 focus:border-[#ef4444]/60"
          : "border-[#1e293b] focus:border-[#334155] focus:ring-[#334155]"
      )}
    />
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="flex items-center gap-1 text-[11px] text-[#ef4444] mt-1"><AlertCircle className="w-3 h-3 shrink-0" />{msg}</p>;
}

interface FormState {
  portfolioId: string; pair: string; market: string;
  direction: "long" | "short"; outcome: "win" | "loss" | "breakeven";
  entryPrice: string; exitPrice: string; positionSize: string;
  pnl: string; pnlPercent: string; pnlManual: boolean;
  dateTime: string; setupTag: string; emotionBefore: string; emotionAfter: string;
  mistakes: string[]; notes: string; lessonLearned: string; screenshotUrl: string;
}

function nowLocalISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toLocalISO(iso: string) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function calcPnl(dir: "long" | "short", entry: number, exit: number, size: number) {
  const raw = dir === "long" ? (exit - entry) * size : (entry - exit) * size;
  const pnl = Math.round(raw * 100) / 100;
  const pnlPercent = entry > 0 ? Math.round((pnl / (entry * size)) * 10000) / 100 : 0;
  const outcome: "win" | "loss" | "breakeven" = pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven";
  return { pnl, pnlPercent, outcome };
}

const EMPTY: FormState = {
  portfolioId: "", pair: "", market: "Crypto", direction: "long", outcome: "win",
  entryPrice: "", exitPrice: "", positionSize: "", pnl: "", pnlPercent: "", pnlManual: false,
  dateTime: nowLocalISO(), setupTag: "", emotionBefore: "", emotionAfter: "",
  mistakes: [], notes: "", lessonLearned: "", screenshotUrl: "",
};

function tradeToForm(t: Trade): FormState {
  return {
    portfolioId: t.portfolioId, pair: t.pair, market: t.market,
    direction: t.direction, outcome: t.outcome,
    entryPrice: String(t.entryPrice), exitPrice: String(t.exitPrice), positionSize: String(t.positionSize),
    pnl: String(t.pnl), pnlPercent: String(t.pnlPercent), pnlManual: false,
    dateTime: toLocalISO(t.dateTime), setupTag: t.setupTag ?? "", emotionBefore: t.emotionBefore ?? "",
    emotionAfter: t.emotionAfter ?? "", mistakes: t.mistakes, notes: t.notes ?? "",
    lessonLearned: t.lessonLearned ?? "", screenshotUrl: t.screenshotUrl ?? "",
  };
}

function ModeToggle({ quick, onToggle, t }: { quick: boolean; onToggle: (v: boolean) => void; t: (k: string) => string }) {
  return (
    <div className="inline-flex items-center gap-1 bg-[#0e1223] border border-[#1e293b] rounded-lg p-0.5">
      {[
        { v: false, labelKey: "addTrade.modeDetailed" },
        { v: true,  labelKey: "addTrade.modeQuick" },
      ].map(({ v, labelKey }) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onToggle(v)}
          className={cn(
            "flex items-center gap-1.5 h-7 px-3 rounded-md text-[12px] font-semibold transition-colors cursor-pointer",
            quick === v
              ? "bg-[#0f172a] text-[#f8fafc] shadow-sm"
              : "text-[#475569] hover:text-[#94a3b8]"
          )}
        >
          {v && <Zap className="w-3 h-3" />}
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}

function ScreenshotUploader({
  preview, onFile, onClear, t,
}: {
  preview: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
  t: (k: string) => string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleSelect = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("toast.screenshotNotImage"));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error(t("toast.screenshotTooLarge"));
      return;
    }
    onFile(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
        <Sparkles className="w-3.5 h-3.5 text-[#8b5cf6] shrink-0" />
        <p className="text-[12px] text-[#a78bfa]">{t("addTrade.aiAutoFill")}</p>
      </div>

      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-[#1e293b] bg-[#0f172a] group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Trade screenshot" className="w-full max-h-64 object-contain" />
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-7 px-2.5 rounded-lg bg-[#020617]/80 border border-[#1e293b] flex items-center gap-1 text-[11px] font-semibold text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer"
            >
              <ImagePlus className="w-3 h-3" />
              {t("addTrade.replace")}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="w-7 h-7 rounded-full bg-[#020617]/80 border border-[#1e293b] flex items-center justify-center text-[#94a3b8] hover:text-[#ef4444] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleSelect(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "w-full h-28 rounded-lg border border-dashed flex flex-col items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer group",
            dragOver
              ? "border-[#22c55e]/50 bg-[#22c55e]/5"
              : "border-[#1e293b] bg-[#0f172a] hover:border-[#334155] hover:bg-[#0f172a]/80"
          )}
        >
          <Upload className={cn("w-5 h-5 transition-colors", dragOver ? "text-[#22c55e]" : "text-[#334155] group-hover:text-[#475569]")} />
          <p className={cn("text-[12px] transition-colors font-medium", dragOver ? "text-[#22c55e]" : "text-[#475569] group-hover:text-[#94a3b8]")}>
            {dragOver ? t("addTrade.screenshotDropOver") : t("addTrade.screenshotDrop")}
          </p>
          <p className="text-[10px] text-[#334155]">{t("addTrade.screenshotFormat")}</p>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleSelect(e.target.files?.[0])}
        className="hidden"
      />
    </div>
  );
}

function AddTradeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [quick, setQuick] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [recentEmotions, setRecentEmotions] = useState<string[]>([]);
  const [recentPairs, setRecentPairs] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const originalScreenshotUrlRef = useRef<string | null>(null);

  // Build translated emotion list
  const EMOTIONS = EMOTION_KEYS.map((e) => ({ ...e, label: t(`emotions.${e.key}`) }));

  useEffect(() => {
    async function load() {
      try {
        const all = await getPortfolios();
        setPortfolios(all);
        setRecentEmotions(getRecentEmotions());
        setRecentPairs(getRecentPairs());

        if (editId) {
          const existing = await getTradeById(editId);
          if (existing) {
            setForm(tradeToForm(existing));
            if (existing.screenshotUrl) {
              setScreenshotPreview(existing.screenshotUrl);
              originalScreenshotUrlRef.current = existing.screenshotUrl;
            }
          }
          return;
        }

        setQuick(getQuickMode());
        const draft = getTradeDraft<FormState>();
        if (draft && draft.portfolioId && all.some((p) => p.id === draft.portfolioId)) {
          setForm({ ...draft, dateTime: draft.dateTime || nowLocalISO() });
          setDraftRestored(true);
        } else if (all.length > 0) {
          const last = getLastPortfolio();
          const pid = last && all.some((p) => p.id === last) ? last : all[0].id;
          setForm((f) => ({ ...f, portfolioId: pid }));
        }
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, [editId]);

  useEffect(() => {
    if (form.pnlManual) return;
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const size = parseFloat(form.positionSize);
    if (isNaN(entry) || isNaN(exit) || isNaN(size) || size <= 0 || entry <= 0) return;
    const { pnl, pnlPercent, outcome } = calcPnl(form.direction, entry, exit, size);
    setForm((f) => ({ ...f, pnl: String(pnl), pnlPercent: String(pnlPercent), outcome }));
  }, [form.entryPrice, form.exitPrice, form.positionSize, form.direction, form.pnlManual]);

  useEffect(() => {
    if (isEditing || !loaded) return;
    const timer = setTimeout(() => {
      if (form.pair || form.entryPrice || form.exitPrice || form.notes) {
        setTradeDraft(form);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [form, isEditing, loaded]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleMistake(key: string) {
    setForm((f) => ({
      ...f,
      mistakes: f.mistakes.includes(key) ? f.mistakes.filter((m) => m !== key) : [...f.mistakes, key],
    }));
  }

  const handleScreenshotFile = useCallback((file: File) => {
    setScreenshotFile(file);
    const url = URL.createObjectURL(file);
    if (screenshotPreview?.startsWith("blob:")) URL.revokeObjectURL(screenshotPreview);
    setScreenshotPreview(url);
    setForm((f) => ({ ...f, screenshotUrl: url }));
  }, [screenshotPreview]);

  const handleScreenshotClear = useCallback(() => {
    if (screenshotPreview?.startsWith("blob:")) URL.revokeObjectURL(screenshotPreview);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setForm((f) => ({ ...f, screenshotUrl: "" }));
  }, [screenshotPreview]);

  function validate() {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.portfolioId) e.portfolioId = t("addTrade.errPortfolio");
    if (!form.pair.trim()) e.pair = t("addTrade.errPair");
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const size = parseFloat(form.positionSize);
    if (!form.entryPrice || isNaN(entry) || entry <= 0) e.entryPrice = t("addTrade.errEntry");
    if (!form.exitPrice || isNaN(exit) || exit <= 0) e.exitPrice = t("addTrade.errExit");
    if (!form.positionSize || isNaN(size) || size <= 0) e.positionSize = t("addTrade.errSize");
    if (!form.dateTime) e.dateTime = t("addTrade.errDateTime");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) { toast.error(t("toast.fixErrors")); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const originalUrl = originalScreenshotUrlRef.current;
      let screenshotUrl = "";

      if (screenshotFile) {
        if (user) {
          const { url: uploaded, error: uploadErr } = await uploadScreenshot(screenshotFile, user.id);
          if (uploaded) {
            screenshotUrl = uploaded;
            if (originalUrl && originalUrl !== uploaded) {
              deleteScreenshot(originalUrl).catch(() => {});
            }
          } else if (uploadErr) {
            toast.error(`Screenshot upload failed: ${uploadErr}`);
            screenshotUrl = originalUrl ?? "";
          }
        }
      } else if (screenshotPreview && !screenshotPreview.startsWith("blob:")) {
        screenshotUrl = screenshotPreview;
      } else if (!screenshotPreview && originalUrl) {
        deleteScreenshot(originalUrl).catch(() => {});
        screenshotUrl = "";
      }

      const payload: Omit<Trade, "id" | "createdAt"> = {
        portfolioId: form.portfolioId,
        pair: form.pair.trim().toUpperCase(),
        market: form.market,
        direction: form.direction,
        outcome: form.outcome,
        entryPrice: parseFloat(form.entryPrice),
        exitPrice: parseFloat(form.exitPrice),
        positionSize: parseFloat(form.positionSize),
        pnl: parseFloat(form.pnl) || 0,
        pnlPercent: parseFloat(form.pnlPercent) || 0,
        dateTime: new Date(form.dateTime).toISOString(),
        setupTag: form.setupTag.trim() || undefined,
        emotionBefore: form.emotionBefore || undefined,
        emotionAfter: form.emotionAfter || undefined,
        mistakes: form.mistakes,
        notes: form.notes.trim() || undefined,
        lessonLearned: form.lessonLearned.trim() || undefined,
        screenshotUrl: isEditing ? screenshotUrl : (screenshotUrl || undefined),
      };

      if (isEditing && editId) {
        await updateTrade(editId, payload);
        toast.success(t("toast.tradeUpdated"));
        router.push(`/history/${editId}`);
      } else {
        const created = await createTrade(payload);
        setLastPortfolio(form.portfolioId);
        pushRecentPair(form.pair);
        if (form.emotionBefore) pushRecentEmotion(form.emotionBefore);
        if (form.emotionAfter) pushRecentEmotion(form.emotionAfter);
        clearTradeDraft();
        toast.success(t("toast.tradeLogged"));
        router.push(`/history/${created.id}`);
      }
    } catch {
      toast.error(t("toast.tradeSaveFailed"));
    } finally {
      setSaving(false);
    }
  }

  function handleDiscardDraft() {
    clearTradeDraft();
    setDraftRestored(false);
    const last = getLastPortfolio();
    const pid = last && portfolios.some((p) => p.id === last) ? last : (portfolios[0]?.id ?? "");
    setForm({ ...EMPTY, portfolioId: pid, dateTime: nowLocalISO() });
  }

  function handleQuickToggle(v: boolean) {
    setQuick(v);
    persistQuickMode(v);
  }

  const selectedPortfolio = portfolios.find((p) => p.id === form.portfolioId);
  const currency = selectedPortfolio?.currency ?? "$";

  const orderedEmotions = (() => {
    if (recentEmotions.length === 0) return EMOTIONS;
    const recent = recentEmotions.map((k) => EMOTIONS.find((e) => e.key === k)).filter(Boolean) as typeof EMOTIONS;
    const rest = EMOTIONS.filter((e) => !recentEmotions.includes(e.key));
    return [...recent, ...rest];
  })();

  const pnlNum = parseFloat(form.pnl);
  const showPnlPreview = !isNaN(pnlNum) && form.entryPrice && form.exitPrice && form.positionSize;

  if (!loaded) return null;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-[22px] font-bold tracking-[-0.02em] leading-none text-[#f8fafc]">
              {isEditing ? t("addTrade.editTitle") : t("addTrade.logTitle")}
            </h1>
            <p className="text-[12px] text-[#475569] mt-1.5">
              {isEditing ? t("addTrade.editSubtitle") : t("addTrade.logSubtitle")}
            </p>
          </div>
          {!isEditing && <ModeToggle quick={quick} onToggle={handleQuickToggle} t={t} />}
        </div>

        {draftRestored && !isEditing && (
          <div className="flex items-center justify-between rounded-lg border border-[#3b82f6]/30 bg-[#3b82f6]/5 px-3 py-2">
            <p className="text-[12px] text-[#93c5fd]">{t("addTrade.draftRestored")}</p>
            <button type="button" onClick={handleDiscardDraft} className="text-[11px] font-semibold text-[#475569] hover:text-[#f8fafc] transition-colors cursor-pointer">
              {t("addTrade.discard")}
            </button>
          </div>
        )}

        <SectionCard title={t("addTrade.sectionTrade")}>
          <div className="space-y-4">
            <div>
              <FieldLabel required>{t("addTrade.portfolio")}</FieldLabel>
              {portfolios.length === 0 ? (
                <p className="text-[13px] text-[#475569]">
                  {t("addTrade.noPortfolios")}{" "}
                  <a href="/portfolios" className="text-[#f8fafc] underline">{t("addTrade.createFirst")}</a>
                </p>
              ) : (
                <select
                  value={form.portfolioId}
                  onChange={(e) => set("portfolioId", e.target.value)}
                  className={cn(
                    "w-full h-11 rounded-lg border bg-[#0f172a] px-3 text-[14px] text-[#f8fafc] focus:outline-none focus:ring-1 transition-colors cursor-pointer",
                    errors.portfolioId ? "border-[#ef4444]/60 ring-[#ef4444]/40" : "border-[#1e293b] focus:border-[#334155] focus:ring-[#334155]"
                  )}
                >
                  {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.currency})</option>)}
                </select>
              )}
              <FieldError msg={errors.portfolioId} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>{t("addTrade.pair")}</FieldLabel>
                <TextInput
                  value={form.pair}
                  onChange={(v) => set("pair", v.toUpperCase())}
                  placeholder={t("addTrade.pairPlaceholder")}
                  hasError={!!errors.pair}
                  list={recentPairs.length > 0 ? "recent-pairs" : undefined}
                  autoCapitalize="characters"
                />
                {recentPairs.length > 0 && (
                  <datalist id="recent-pairs">
                    {recentPairs.map((p) => <option key={p} value={p} />)}
                  </datalist>
                )}
                <FieldError msg={errors.pair} />
              </div>
              <div>
                <FieldLabel>{t("addTrade.market")}</FieldLabel>
                <select
                  value={form.market}
                  onChange={(e) => set("market", e.target.value)}
                  className="w-full h-11 rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 text-[14px] text-[#f8fafc] focus:outline-none focus:border-[#334155] focus:ring-1 focus:ring-[#334155] transition-colors cursor-pointer"
                >
                  {MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {recentPairs.length > 0 && (
              <div className="-mt-1 flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
                <span className="text-[11px] text-[#475569] shrink-0">{t("addTrade.recent")}</span>
                <div className="flex items-center gap-1.5">
                  {recentPairs.slice(0, 6).map((p) => {
                    const active = form.pair === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => set("pair", p)}
                        className={cn(
                          "h-8 px-2.5 rounded-lg border text-[12px] font-bold transition-all duration-150 cursor-pointer shrink-0 leading-none",
                          active
                            ? "bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]"
                            : "border-[#1e293b] text-[#cbd5e1] hover:border-[#334155] hover:bg-[#0f172a]"
                        )}
                      >
                        <PairDisplay pair={p} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <FieldLabel>{t("addTrade.direction")}</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {(["long", "short"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set("direction", d)}
                    className={cn(
                      "h-11 rounded-lg border text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer",
                      form.direction === d
                        ? d === "long" ? "bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]" : "bg-[#ef4444]/10 border-[#ef4444]/40 text-[#ef4444]"
                        : "border-[#1e293b] text-[#475569] hover:border-[#334155] hover:text-[#94a3b8]"
                    )}
                  >
                    {d === "long" ? <ArrowUp className="w-4 h-4" strokeWidth={2.5} /> : <ArrowDown className="w-4 h-4" strokeWidth={2.5} />}
                    {t(`common.${d}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel required>{t("addTrade.entry")}</FieldLabel>
                <TextInput value={form.entryPrice} onChange={(v) => set("entryPrice", v)} placeholder="0.00" inputMode="decimal" hasError={!!errors.entryPrice} />
                <FieldError msg={errors.entryPrice} />
              </div>
              <div>
                <FieldLabel required>{t("addTrade.exit")}</FieldLabel>
                <TextInput value={form.exitPrice} onChange={(v) => set("exitPrice", v)} placeholder="0.00" inputMode="decimal" hasError={!!errors.exitPrice} />
                <FieldError msg={errors.exitPrice} />
              </div>
              <div>
                <FieldLabel required>{t("addTrade.size")}</FieldLabel>
                <TextInput value={form.positionSize} onChange={(v) => set("positionSize", v)} placeholder="0.00" inputMode="decimal" hasError={!!errors.positionSize} />
                <FieldError msg={errors.positionSize} />
              </div>
            </div>

            {showPnlPreview && (
              <div className={cn(
                "rounded-lg border px-4 py-3 flex items-center justify-between",
                pnlNum > 0  ? "border-[#22c55e]/30 bg-[#22c55e]/5"
                : pnlNum < 0 ? "border-[#ef4444]/30 bg-[#ef4444]/5"
                : "border-[#1e293b] bg-[#0f172a]"
              )}>
                <div>
                  <p className="text-[10px] font-bold text-[#334155] uppercase tracking-[0.08em] mb-1">{t("addTrade.calculatedPnl")}</p>
                  <p className={cn(
                    "text-[20px] font-bold tabular leading-none tracking-tight",
                    pnlNum > 0 ? "text-[#22c55e]" : pnlNum < 0 ? "text-[#ef4444]" : "text-[#94a3b8]"
                  )}>
                    {fmtMoneySigned(currency, pnlNum, 2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-[#334155] uppercase tracking-[0.08em] mb-1">{t("addTrade.returnPct")}</p>
                  <p className={cn(
                    "text-[16px] font-bold tabular leading-none",
                    pnlNum > 0 ? "text-[#22c55e]" : pnlNum < 0 ? "text-[#ef4444]" : "text-[#94a3b8]"
                  )}>
                    {parseFloat(form.pnlPercent) >= 0 ? "+" : ""}{form.pnlPercent}%
                  </p>
                </div>
                {form.pnlManual && (
                  <button
                    type="button"
                    onClick={() => set("pnlManual", false)}
                    className="ml-2 text-[10px] font-semibold text-[#475569] hover:text-[#f8fafc] transition-colors cursor-pointer underline"
                  >
                    {t("addTrade.reset")}
                  </button>
                )}
              </div>
            )}

            {!quick && (
              <details className="group">
                <summary className="text-[11px] font-semibold text-[#475569] hover:text-[#94a3b8] cursor-pointer select-none list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform inline-block">›</span>
                  {t("addTrade.overridePnl")}
                </summary>
                <div className="grid grid-cols-2 gap-3 mt-2.5">
                  <TextInput value={form.pnl} onChange={(v) => { set("pnl", v); set("pnlManual", true); }} placeholder={t("addTrade.pnlPlaceholder")} inputMode="decimal" />
                  <TextInput value={form.pnlPercent} onChange={(v) => { set("pnlPercent", v); set("pnlManual", true); }} placeholder={t("addTrade.pnlPctPlaceholder")} inputMode="decimal" />
                </div>
              </details>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:items-end">
              <div>
                <FieldLabel required>{t("addTrade.dateTime")}</FieldLabel>
                <input
                  type="datetime-local"
                  value={form.dateTime}
                  onChange={(e) => set("dateTime", e.target.value)}
                  className={cn(
                    "w-full h-11 rounded-lg border bg-[#0f172a] px-3 text-[14px] text-[#f8fafc] focus:outline-none focus:ring-1 transition-colors",
                    errors.dateTime ? "border-[#ef4444]/60" : "border-[#1e293b] focus:border-[#334155] focus:ring-[#334155]"
                  )}
                />
                <FieldError msg={errors.dateTime} />
              </div>
              <div>
                <FieldLabel>{t("addTrade.outcome")}</FieldLabel>
                <div className="flex gap-1.5">
                  {(["win", "loss", "breakeven"] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => set("outcome", o)}
                      className={cn(
                        "h-11 px-3 rounded-lg border text-[12px] font-semibold transition-all duration-150 cursor-pointer",
                        form.outcome === o
                          ? o === "win" ? "bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]"
                            : o === "loss" ? "bg-[#ef4444]/10 border-[#ef4444]/40 text-[#ef4444]"
                            : "bg-[#f8fafc]/10 border-[#f8fafc]/20 text-[#f8fafc]"
                          : "border-[#1e293b] text-[#475569] hover:border-[#334155]"
                      )}
                    >
                      {t(`common.${o}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {!quick && (
          <>
            <SectionCard title={t("addTrade.sectionScreenshot")}>
              <ScreenshotUploader
                preview={screenshotPreview}
                onFile={handleScreenshotFile}
                onClear={handleScreenshotClear}
                t={t}
              />
            </SectionCard>

            <SectionCard title={t("addTrade.sectionSetup")}>
              <SetupInput value={form.setupTag} onChange={(v) => set("setupTag", v)} />
            </SectionCard>

            <SectionCard title={t("addTrade.sectionPsychology")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["emotionBefore", "emotionAfter"] as const).map((field) => (
                  <div key={field}>
                    <FieldLabel>{field === "emotionBefore" ? t("addTrade.emotionBefore") : t("addTrade.emotionAfter")}</FieldLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {orderedEmotions.map(({ key, label, color, bg }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => set(field, form[field] === key ? "" : key)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg border text-[12px] font-semibold transition-all duration-150 cursor-pointer",
                            form[field] === key
                              ? cn(color, bg)
                              : "border-[#1e293b] text-[#475569] hover:border-[#334155]"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title={t("addTrade.sectionMistakes")}>
              <div className="flex flex-wrap gap-2">
                {MISTAKE_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleMistake(key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all duration-150 cursor-pointer",
                      form.mistakes.includes(key)
                        ? "bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#f59e0b]"
                        : "border-[#1e293b] text-[#475569] hover:border-[#334155]"
                    )}
                  >
                    {t(`mistakes.${key}`)}
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard title={t("addTrade.sectionReflection")}>
              <div className="space-y-4">
                <div>
                  <FieldLabel>{t("addTrade.tradeNotes")}</FieldLabel>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder={t("addTrade.tradeNotesPlaceholder")}
                    className="w-full rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2.5 text-[14px] text-[#f8fafc] placeholder:text-[#334155] resize-none focus:outline-none focus:border-[#334155] focus:ring-1 focus:ring-[#334155] transition-colors"
                  />
                </div>
                <div>
                  <FieldLabel>{t("addTrade.lessonLearned")}</FieldLabel>
                  <textarea
                    rows={2}
                    value={form.lessonLearned}
                    onChange={(e) => set("lessonLearned", e.target.value)}
                    placeholder={t("addTrade.lessonPlaceholder")}
                    className="w-full rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2.5 text-[14px] text-[#f8fafc] placeholder:text-[#334155] resize-none focus:outline-none focus:border-[#334155] focus:ring-1 focus:ring-[#334155] transition-colors"
                  />
                </div>
              </div>
            </SectionCard>
          </>
        )}

        <div className="sticky bottom-20 md:bottom-0 md:static z-30 -mx-5 md:mx-0 px-5 md:px-0 py-3 md:py-0 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent md:bg-none">
          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 rounded-xl bg-[#f8fafc] text-[#020617] text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-[#e2e8f0] active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-black/20"
          >
            <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
            {saving ? t("common.saving") : isEditing ? t("addTrade.updateTrade") : t("addTrade.logTrade")}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function AddTradePage() {
  return (
    <Suspense>
      <AddTradeForm />
    </Suspense>
  );
}
