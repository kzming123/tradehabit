"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Upload,
  X,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { SetupInput } from "@/components/shared/SetupInput";
import { portfolioStorage, tradeStorage } from "@/lib/storage";
import { Portfolio, Trade } from "@/types";
import { toast } from "sonner";

// ── Constants ─────────────────────────────────────────────────────────────────

const MARKETS = ["Crypto", "Forex", "Stocks", "Indices", "Commodities", "Futures"];

const EMOTIONS = [
  { key: "calm",        label: "Calm",        color: "text-[#22c55e]", bg: "bg-[#22c55e]/10 border-[#22c55e]/30" },
  { key: "confident",   label: "Confident",   color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10 border-[#3b82f6]/30" },
  { key: "disciplined", label: "Disciplined", color: "text-[#22c55e]", bg: "bg-[#22c55e]/10 border-[#22c55e]/30" },
  { key: "fomo",        label: "FOMO",        color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10 border-[#f59e0b]/30" },
  { key: "greedy",      label: "Greedy",      color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10 border-[#f59e0b]/30" },
  { key: "fearful",     label: "Fearful",     color: "text-[#ef4444]", bg: "bg-[#ef4444]/10 border-[#ef4444]/30" },
  { key: "revenge",     label: "Revenge",     color: "text-[#ef4444]", bg: "bg-[#ef4444]/10 border-[#ef4444]/30" },
];

const MISTAKES = [
  { key: "no_stop",       label: "No Stop Loss"  },
  { key: "early_exit",    label: "Early Exit"    },
  { key: "oversized",     label: "Oversized"     },
  { key: "fomo_entry",    label: "FOMO Entry"    },
  { key: "revenge_trade", label: "Revenge Trade" },
  { key: "broke_rules",   label: "Broke Rules"   },
  { key: "moved_sl",      label: "Moved SL"      },
  { key: "overtraded",    label: "Overtraded"    },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#0f172a]">
        <p className="text-[11px] font-bold text-[#334155] uppercase tracking-[0.08em]">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">
      {children}
      {required && <span className="text-[#ef4444] ml-0.5">*</span>}
    </label>
  );
}

function TextInput({
  value, onChange, placeholder, type = "text", hasError, className,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; hasError?: boolean; className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full h-10 rounded-lg border bg-[#0f172a] px-3 text-[13px] text-[#f8fafc] placeholder:text-[#334155]",
        "focus:outline-none focus:ring-1 transition-colors",
        hasError
          ? "border-[#ef4444]/60 ring-[#ef4444]/40 focus:border-[#ef4444]/60"
          : "border-[#1e293b] focus:border-[#334155] focus:ring-[#334155]",
        className
      )}
    />
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] text-[#ef4444] mt-1">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {msg}
    </p>
  );
}

// ── Form helpers ──────────────────────────────────────────────────────────────

interface FormState {
  portfolioId:  string;
  pair:         string;
  market:       string;
  direction:    "long" | "short";
  outcome:      "win" | "loss" | "breakeven";
  entryPrice:   string;
  exitPrice:    string;
  positionSize: string;
  pnl:          string;
  pnlPercent:   string;
  pnlManual:    boolean;
  dateTime:     string;
  setupTag:     string;
  emotionBefore: string;
  emotionAfter:  string;
  mistakes:     string[];
  notes:        string;
  lessonLearned: string;
  screenshotUrl: string;
}

function nowLocalISO(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toLocalISO(isoStr: string): string {
  const d = new Date(isoStr);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function calcPnl(dir: "long" | "short", entry: number, exit: number, size: number) {
  const raw = dir === "long" ? (exit - entry) * size : (entry - exit) * size;
  const pnl = Math.round(raw * 100) / 100;
  const pnlPercent = entry > 0 ? Math.round((pnl / (entry * size)) * 10000) / 100 : 0;
  const outcome: "win" | "loss" | "breakeven" = pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven";
  return { pnl, pnlPercent, outcome };
}

const EMPTY: FormState = {
  portfolioId: "", pair: "", market: "Crypto",
  direction: "long", outcome: "win",
  entryPrice: "", exitPrice: "", positionSize: "",
  pnl: "", pnlPercent: "", pnlManual: false,
  dateTime: nowLocalISO(),
  setupTag: "", emotionBefore: "", emotionAfter: "",
  mistakes: [], notes: "", lessonLearned: "", screenshotUrl: "",
};

function tradeToForm(t: Trade): FormState {
  return {
    portfolioId:   t.portfolioId,
    pair:          t.pair,
    market:        t.market,
    direction:     t.direction,
    outcome:       t.outcome,
    entryPrice:    String(t.entryPrice),
    exitPrice:     String(t.exitPrice),
    positionSize:  String(t.positionSize),
    pnl:           String(t.pnl),
    pnlPercent:    String(t.pnlPercent),
    pnlManual:     false,
    dateTime:      toLocalISO(t.dateTime),
    setupTag:      t.setupTag ?? "",
    emotionBefore: t.emotionBefore ?? "",
    emotionAfter:  t.emotionAfter ?? "",
    mistakes:      t.mistakes,
    notes:         t.notes ?? "",
    lessonLearned: t.lessonLearned ?? "",
    screenshotUrl: t.screenshotUrl ?? "",
  };
}

// ── Inner form (needs useSearchParams, wrapped in Suspense) ──────────────────

function AddTradeForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get("edit");
  const isEditing    = !!editId;

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [form,       setForm]       = useState<FormState>(EMPTY);
  const [errors,     setErrors]     = useState<Partial<Record<keyof FormState, string>>>({});
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load portfolios + optionally pre-fill for edit
  useEffect(() => {
    portfolioStorage.seedIfEmpty();
    const all = portfolioStorage.getAll();
    setPortfolios(all);

    if (editId) {
      const existing = tradeStorage.getById(editId);
      if (existing) {
        setForm(tradeToForm(existing));
        if (existing.screenshotUrl) setScreenshotPreview(existing.screenshotUrl);
        return;
      }
    }
    // New trade: default to first portfolio
    if (all.length > 0) setForm((f) => ({ ...f, portfolioId: all[0].id }));
  }, [editId]);

  // Auto-calculate PnL
  useEffect(() => {
    if (form.pnlManual) return;
    const entry = parseFloat(form.entryPrice);
    const exit  = parseFloat(form.exitPrice);
    const size  = parseFloat(form.positionSize);
    if (isNaN(entry) || isNaN(exit) || isNaN(size) || size <= 0 || entry <= 0) return;
    const { pnl, pnlPercent, outcome } = calcPnl(form.direction, entry, exit, size);
    setForm((f) => ({ ...f, pnl: String(pnl), pnlPercent: String(pnlPercent), outcome }));
  }, [form.entryPrice, form.exitPrice, form.positionSize, form.direction, form.pnlManual]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleMistake(key: string) {
    setForm((f) => ({
      ...f,
      mistakes: f.mistakes.includes(key)
        ? f.mistakes.filter((m) => m !== key)
        : [...f.mistakes, key],
    }));
  }

  function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);
    set("screenshotUrl", url);
  }

  function removeScreenshot() {
    if (screenshotPreview && screenshotPreview.startsWith("blob:")) {
      URL.revokeObjectURL(screenshotPreview);
    }
    setScreenshotPreview(null);
    set("screenshotUrl", "");
    if (fileRef.current) fileRef.current.value = "";
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.portfolioId)  e.portfolioId  = "Select a portfolio";
    if (!form.pair.trim())  e.pair         = "Pair is required";
    const entry = parseFloat(form.entryPrice);
    const exit  = parseFloat(form.exitPrice);
    const size  = parseFloat(form.positionSize);
    if (!form.entryPrice   || isNaN(entry) || entry <= 0) e.entryPrice   = "Enter a valid entry price";
    if (!form.exitPrice    || isNaN(exit)  || exit  <= 0) e.exitPrice    = "Enter a valid exit price";
    if (!form.positionSize || isNaN(size)  || size  <= 0) e.positionSize = "Enter a valid position size";
    if (!form.dateTime) e.dateTime = "Date & time is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) { toast.error("Please fix the errors before saving"); return; }
    setSaving(true);
    try {
      const payload: Omit<Trade, "id" | "createdAt"> = {
        portfolioId:  form.portfolioId,
        pair:         form.pair.trim().toUpperCase(),
        market:       form.market,
        direction:    form.direction,
        outcome:      form.outcome,
        entryPrice:   parseFloat(form.entryPrice),
        exitPrice:    parseFloat(form.exitPrice),
        positionSize: parseFloat(form.positionSize),
        pnl:          parseFloat(form.pnl) || 0,
        pnlPercent:   parseFloat(form.pnlPercent) || 0,
        dateTime:     new Date(form.dateTime).toISOString(),
        setupTag:     form.setupTag.trim()      || undefined,
        emotionBefore:form.emotionBefore        || undefined,
        emotionAfter: form.emotionAfter         || undefined,
        mistakes:     form.mistakes,
        notes:        form.notes.trim()         || undefined,
        lessonLearned:form.lessonLearned.trim() || undefined,
        screenshotUrl:form.screenshotUrl        || undefined,
      };

      if (isEditing && editId) {
        tradeStorage.update(editId, payload);
        toast.success("Trade updated");
        router.push(`/history/${editId}`);
      } else {
        const created = tradeStorage.create(payload);
        toast.success("Trade logged successfully");
        router.push(`/history/${created.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  const selectedPortfolio = portfolios.find((p) => p.id === form.portfolioId);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] leading-none text-[#f8fafc]">
            {isEditing ? "Edit Trade" : "Log a Trade"}
          </h1>
          <p className="text-[12px] text-[#475569] mt-1.5">
            {isEditing ? "Update your trade details" : "Record your entry and reflection"}
          </p>
        </div>

        {/* ── Screenshot ── */}
        <SectionCard title="Screenshot">
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#8b5cf6] shrink-0" />
              <p className="text-[12px] text-[#a78bfa]">
                AI auto-fill coming soon — screenshot will populate your trade fields automatically
              </p>
            </div>

            {screenshotPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-[#1e293b] bg-[#0f172a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={screenshotPreview} alt="Trade screenshot" className="w-full max-h-60 object-contain" />
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#020617]/80 border border-[#1e293b] flex items-center justify-center text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-24 rounded-lg border border-dashed border-[#1e293b] bg-[#0f172a] flex flex-col items-center justify-center gap-2 hover:border-[#334155] hover:bg-[#0f172a]/80 transition-colors cursor-pointer group"
              >
                <Upload className="w-5 h-5 text-[#334155] group-hover:text-[#475569] transition-colors" />
                <p className="text-[12px] text-[#334155] group-hover:text-[#475569] transition-colors">
                  Click to upload screenshot
                </p>
                <p className="text-[11px] text-[#1e293b]">PNG, JPG, WEBP</p>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
          </div>
        </SectionCard>

        {/* ── Trade Info ── */}
        <SectionCard title="Trade Info">
          <div className="space-y-4">
            {/* Portfolio */}
            <div>
              <FieldLabel required>Portfolio</FieldLabel>
              {portfolios.length === 0 ? (
                <p className="text-[13px] text-[#475569]">
                  No portfolios.{" "}
                  <a href="/portfolios" className="text-[#f8fafc] underline">Create one first.</a>
                </p>
              ) : (
                <select
                  value={form.portfolioId}
                  onChange={(e) => set("portfolioId", e.target.value)}
                  className={cn(
                    "w-full h-10 rounded-lg border bg-[#0f172a] px-3 text-[13px] text-[#f8fafc]",
                    "focus:outline-none focus:ring-1 transition-colors cursor-pointer",
                    errors.portfolioId
                      ? "border-[#ef4444]/60 ring-[#ef4444]/40"
                      : "border-[#1e293b] focus:border-[#334155] focus:ring-[#334155]"
                  )}
                >
                  {portfolios.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.currency})</option>
                  ))}
                </select>
              )}
              <FieldError msg={errors.portfolioId} />
            </div>

            {/* Pair + Market */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Pair / Symbol</FieldLabel>
                <TextInput
                  value={form.pair}
                  onChange={(v) => set("pair", v)}
                  placeholder="BTC/USDT"
                  hasError={!!errors.pair}
                />
                <FieldError msg={errors.pair} />
              </div>
              <div>
                <FieldLabel>Market</FieldLabel>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {MARKETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set("market", m)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer",
                        form.market === m
                          ? "bg-[#f8fafc]/10 border-[#f8fafc]/20 text-[#f8fafc]"
                          : "border-[#1e293b] text-[#475569] hover:border-[#334155]"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Time */}
            <div>
              <FieldLabel required>Date & Time</FieldLabel>
              <TextInput
                type="datetime-local"
                value={form.dateTime}
                onChange={(v) => set("dateTime", v)}
                hasError={!!errors.dateTime}
              />
              <FieldError msg={errors.dateTime} />
            </div>

            {/* Direction */}
            <div>
              <FieldLabel>Direction</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {(["long", "short"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set("direction", d)}
                    className={cn(
                      "h-10 rounded-lg text-[13px] font-bold border flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer",
                      form.direction === d
                        ? d === "long"
                          ? "bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]"
                          : "bg-[#ef4444]/10 border-[#ef4444]/40 text-[#ef4444]"
                        : "border-[#1e293b] text-[#475569] hover:border-[#334155] hover:text-[#94a3b8]"
                    )}
                  >
                    {d === "long"
                      ? <><ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} /> Long</>
                      : <><ArrowDown className="w-3.5 h-3.5" strokeWidth={2.5} /> Short</>
                    }
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Prices & PnL ── */}
        <SectionCard title="Prices & PnL">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel required>Entry Price</FieldLabel>
                <TextInput type="number" value={form.entryPrice} onChange={(v) => set("entryPrice", v)} placeholder="0.00" hasError={!!errors.entryPrice} />
                <FieldError msg={errors.entryPrice} />
              </div>
              <div>
                <FieldLabel required>Exit Price</FieldLabel>
                <TextInput type="number" value={form.exitPrice} onChange={(v) => set("exitPrice", v)} placeholder="0.00" hasError={!!errors.exitPrice} />
                <FieldError msg={errors.exitPrice} />
              </div>
              <div>
                <FieldLabel required>Position Size</FieldLabel>
                <TextInput type="number" value={form.positionSize} onChange={(v) => set("positionSize", v)} placeholder="0.00" hasError={!!errors.positionSize} />
                <FieldError msg={errors.positionSize} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <FieldLabel>PnL ({selectedPortfolio?.currency ?? "USDT"})</FieldLabel>
                  {!form.pnlManual && form.pnl && (
                    <span className="text-[10px] text-[#22c55e] font-semibold">Auto</span>
                  )}
                </div>
                <TextInput
                  type="number"
                  value={form.pnl}
                  onChange={(v) => { set("pnl", v); setForm((f) => ({ ...f, pnlManual: true })); }}
                  placeholder="0.00"
                  className={cn(
                    form.pnl && !form.pnlManual
                      ? parseFloat(form.pnl) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                      : ""
                  )}
                />
                {form.pnlManual && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, pnlManual: false }))}
                    className="text-[11px] text-[#475569] hover:text-[#94a3b8] mt-1 transition-colors"
                  >
                    Reset to auto-calculate
                  </button>
                )}
              </div>
              <div>
                <FieldLabel>PnL %</FieldLabel>
                <TextInput
                  type="number"
                  value={form.pnlPercent}
                  onChange={(v) => { set("pnlPercent", v); setForm((f) => ({ ...f, pnlManual: true })); }}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Outcome</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {(["win", "loss", "breakeven"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => set("outcome", o)}
                    className={cn(
                      "h-10 rounded-lg text-[13px] font-bold border capitalize transition-all duration-150 cursor-pointer",
                      form.outcome === o
                        ? o === "win"
                          ? "bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]"
                          : o === "loss"
                          ? "bg-[#ef4444]/10 border-[#ef4444]/40 text-[#ef4444]"
                          : "bg-[#1e293b] border-[#334155] text-[#f8fafc]"
                        : "border-[#1e293b] text-[#475569] hover:border-[#334155] hover:text-[#94a3b8]"
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Setup ── */}
        <SectionCard title="Setup Tag">
          <SetupInput value={form.setupTag} onChange={(v) => set("setupTag", v)} />
        </SectionCard>

        {/* ── Emotions ── */}
        <SectionCard title="Emotions">
          <div className="space-y-4">
            {[
              { label: "Before trade", key: "emotionBefore" as const },
              { label: "After trade",  key: "emotionAfter"  as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <FieldLabel>{label}</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {EMOTIONS.map(({ key: ek, label: el, color, bg }) => {
                    const selected = form[key] === ek;
                    return (
                      <button
                        key={ek}
                        type="button"
                        onClick={() => set(key, selected ? "" : ek)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-[12px] font-semibold border transition-all duration-150 cursor-pointer",
                          selected ? cn(color, bg) : "border-[#1e293b] text-[#475569] hover:border-[#334155] hover:text-[#94a3b8]"
                        )}
                      >
                        {el}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Mistakes ── */}
        <SectionCard title="Mistakes Made">
          <div className="flex flex-wrap gap-2">
            {MISTAKES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleMistake(key)}
                className={cn(
                  "px-3 py-2 rounded-lg text-[12px] font-semibold border transition-all duration-150 cursor-pointer",
                  form.mistakes.includes(key)
                    ? "bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#f59e0b]"
                    : "border-[#1e293b] text-[#475569] hover:border-[#334155] hover:text-[#94a3b8]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* ── Reflection ── */}
        <SectionCard title="Reflection">
          <div className="space-y-4">
            <div>
              <FieldLabel>Trade Notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                placeholder="What happened? What did you notice during this trade?"
                className="w-full rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2.5 text-[13px] text-[#f8fafc] placeholder:text-[#334155] resize-none focus:outline-none focus:border-[#334155] focus:ring-1 focus:ring-[#334155] transition-colors"
              />
            </div>
            <div>
              <FieldLabel>Lesson Learned</FieldLabel>
              <textarea
                value={form.lessonLearned}
                onChange={(e) => set("lessonLearned", e.target.value)}
                rows={2}
                placeholder="What would you do differently next time?"
                className="w-full rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2.5 text-[13px] text-[#f8fafc] placeholder:text-[#334155] resize-none focus:outline-none focus:border-[#334155] focus:ring-1 focus:ring-[#334155] transition-colors"
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Submit ── */}
        <div className="flex gap-3 pb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-11 px-5 rounded-xl border border-[#1e293b] text-[14px] font-semibold text-[#475569] hover:border-[#334155] hover:text-[#f8fafc] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 h-11 rounded-xl bg-[#f8fafc] text-[#020617] text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-[#e2e8f0] active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Save Trade"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Page export (Suspense boundary for useSearchParams) ───────────────────────

export default function AddTradePage() {
  return (
    <Suspense>
      <AddTradeForm />
    </Suspense>
  );
}
