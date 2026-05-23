"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, CheckCircle2, Upload, X, Sparkles, AlertCircle } from "lucide-react";
import { SetupInput } from "@/components/shared/SetupInput";
import { getPortfolios } from "@/lib/db/portfolios";
import { createTrade, updateTrade, getTradeById } from "@/lib/db/trades";
import { uploadScreenshot, deleteScreenshot } from "@/lib/supabase/storage";
import { createClient } from "@/lib/supabase/client";
import { Portfolio, Trade } from "@/types";
import { toast } from "sonner";

const MARKETS   = ["Crypto", "Forex", "Stocks", "Indices", "Commodities", "Futures"];
const EMOTIONS  = [
  { key: "calm",        label: "Calm",        color: "text-[#22c55e]", bg: "bg-[#22c55e]/10 border-[#22c55e]/30" },
  { key: "confident",   label: "Confident",   color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10 border-[#3b82f6]/30" },
  { key: "disciplined", label: "Disciplined", color: "text-[#22c55e]", bg: "bg-[#22c55e]/10 border-[#22c55e]/30" },
  { key: "fomo",        label: "FOMO",        color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10 border-[#f59e0b]/30" },
  { key: "greedy",      label: "Greedy",      color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10 border-[#f59e0b]/30" },
  { key: "fearful",     label: "Fearful",     color: "text-[#ef4444]", bg: "bg-[#ef4444]/10 border-[#ef4444]/30" },
  { key: "revenge",     label: "Revenge",     color: "text-[#ef4444]", bg: "bg-[#ef4444]/10 border-[#ef4444]/30" },
];
const MISTAKES  = [
  { key: "no_stop",       label: "No Stop Loss"  },
  { key: "early_exit",    label: "Early Exit"    },
  { key: "oversized",     label: "Oversized"     },
  { key: "fomo_entry",    label: "FOMO Entry"    },
  { key: "revenge_trade", label: "Revenge Trade" },
  { key: "broke_rules",   label: "Broke Rules"   },
  { key: "moved_sl",      label: "Moved SL"      },
  { key: "overtraded",    label: "Overtraded"    },
];

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
      {children}{required && <span className="text-[#ef4444] ml-0.5">*</span>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", hasError, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; hasError?: boolean; className?: string;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
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
  const raw     = dir === "long" ? (exit - entry) * size : (entry - exit) * size;
  const pnl     = Math.round(raw * 100) / 100;
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

// ── Inner form ────────────────────────────────────────────────────────────────

function AddTradeForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get("edit");
  const isEditing    = !!editId;

  const [portfolios,        setPortfolios]        = useState<Portfolio[]>([]);
  const [form,              setForm]              = useState<FormState>(EMPTY);
  const [errors,            setErrors]            = useState<Partial<Record<keyof FormState, string>>>({});
  const [screenshotFile,    setScreenshotFile]    = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [saving,            setSaving]            = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const all = await getPortfolios();
      setPortfolios(all);

      if (editId) {
        const existing = await getTradeById(editId);
        if (existing) {
          setForm(tradeToForm(existing));
          if (existing.screenshotUrl) setScreenshotPreview(existing.screenshotUrl);
          return;
        }
      }
      if (all.length > 0) setForm((f) => ({ ...f, portfolioId: all[0].id }));
    }
    load();
  }, [editId]);

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
      mistakes: f.mistakes.includes(key) ? f.mistakes.filter((m) => m !== key) : [...f.mistakes, key],
    }));
  }

  function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);
    set("screenshotUrl", url); // temp preview
  }

  function removeScreenshot() {
    if (screenshotPreview?.startsWith("blob:")) URL.revokeObjectURL(screenshotPreview);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    set("screenshotUrl", "");
    if (fileRef.current) fileRef.current.value = "";
  }

  function validate() {
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
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Determine the original Storage URL (non-blob, non-empty) for cleanup
      const originalUrl = isEditing && form.screenshotUrl && !form.screenshotUrl.startsWith("blob:")
        ? form.screenshotUrl
        : null;

      let screenshotUrl = "";

      if (screenshotFile) {
        // New file selected — upload it, then delete the old one if replacing
        if (user) {
          const uploaded = await uploadScreenshot(screenshotFile, user.id);
          if (uploaded) {
            screenshotUrl = uploaded;
            if (originalUrl && originalUrl !== uploaded) {
              deleteScreenshot(originalUrl).catch(() => {}); // fire-and-forget
            }
          }
        }
      } else if (screenshotPreview && !screenshotPreview.startsWith("blob:")) {
        // No new file — keep existing URL
        screenshotUrl = screenshotPreview;
      } else if (!screenshotPreview && originalUrl) {
        // Screenshot was cleared by the user — remove from Storage
        deleteScreenshot(originalUrl).catch(() => {}); // fire-and-forget
      }

      const payload: Omit<Trade, "id" | "createdAt"> = {
        portfolioId:   form.portfolioId,
        pair:          form.pair.trim().toUpperCase(),
        market:        form.market,
        direction:     form.direction,
        outcome:       form.outcome,
        entryPrice:    parseFloat(form.entryPrice),
        exitPrice:     parseFloat(form.exitPrice),
        positionSize:  parseFloat(form.positionSize),
        pnl:           parseFloat(form.pnl) || 0,
        pnlPercent:    parseFloat(form.pnlPercent) || 0,
        dateTime:      new Date(form.dateTime).toISOString(),
        setupTag:      form.setupTag.trim()       || undefined,
        emotionBefore: form.emotionBefore         || undefined,
        emotionAfter:  form.emotionAfter          || undefined,
        mistakes:      form.mistakes,
        notes:         form.notes.trim()          || undefined,
        lessonLearned: form.lessonLearned.trim()  || undefined,
        screenshotUrl: screenshotUrl              || undefined,
      };

      if (isEditing && editId) {
        await updateTrade(editId, payload);
        toast.success("Trade updated");
        router.push(`/history/${editId}`);
      } else {
        const created = await createTrade(payload);
        toast.success("Trade logged successfully");
        router.push(`/history/${created.id}`);
      }
    } catch {
      toast.error("Failed to save trade");
    } finally {
      setSaving(false);
    }
  }

  const selectedPortfolio = portfolios.find((p) => p.id === form.portfolioId);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] leading-none text-[#f8fafc]">
            {isEditing ? "Edit Trade" : "Log a Trade"}
          </h1>
          <p className="text-[12px] text-[#475569] mt-1.5">{isEditing ? "Update your trade details" : "Record your entry and reflection"}</p>
        </div>

        {/* Screenshot */}
        <SectionCard title="Screenshot">
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#8b5cf6] shrink-0" />
              <p className="text-[12px] text-[#a78bfa]">AI auto-fill coming soon — screenshot will populate your trade fields automatically</p>
            </div>

            {screenshotPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-[#1e293b] bg-[#0f172a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={screenshotPreview} alt="Trade screenshot" className="w-full max-h-60 object-contain" />
                <button type="button" onClick={removeScreenshot} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#020617]/80 border border-[#1e293b] flex items-center justify-center text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="w-full h-24 rounded-lg border border-dashed border-[#1e293b] bg-[#0f172a] flex flex-col items-center justify-center gap-2 hover:border-[#334155] hover:bg-[#0f172a]/80 transition-colors cursor-pointer group">
                <Upload className="w-5 h-5 text-[#334155] group-hover:text-[#475569] transition-colors" />
                <p className="text-[12px] text-[#334155] group-hover:text-[#475569] transition-colors">Click to upload screenshot</p>
                <p className="text-[11px] text-[#1e293b]">PNG, JPG, WEBP</p>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
          </div>
        </SectionCard>

        {/* Trade Info */}
        <SectionCard title="Trade Info">
          <div className="space-y-4">
            {/* Portfolio */}
            <div>
              <FieldLabel required>Portfolio</FieldLabel>
              {portfolios.length === 0 ? (
                <p className="text-[13px] text-[#475569]">No portfolios. <a href="/portfolios" className="text-[#f8fafc] underline">Create one first.</a></p>
              ) : (
                <select
                  value={form.portfolioId} onChange={(e) => set("portfolioId", e.target.value)}
                  className={cn("w-full h-10 rounded-lg border bg-[#0f172a] px-3 text-[13px] text-[#f8fafc] focus:outline-none focus:ring-1 transition-colors cursor-pointer", errors.portfolioId ? "border-[#ef4444]/60 ring-[#ef4444]/40" : "border-[#1e293b] focus:border-[#334155] focus:ring-[#334155]")}
                >
                  {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.currency})</option>)}
                </select>
              )}
              <FieldError msg={errors.portfolioId} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Pair / Symbol</FieldLabel>
                <TextInput value={form.pair} onChange={(v) => set("pair", v)} placeholder="BTC/USDT" hasError={!!errors.pair} />
                <FieldError msg={errors.pair} />
              </div>
              <div>
                <FieldLabel>Market</FieldLabel>
                <select value={form.market} onChange={(e) => set("market", e.target.value)} className="w-full h-10 rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 text-[13px] text-[#f8fafc] focus:outline-none focus:border-[#334155] focus:ring-1 focus:ring-[#334155] transition-colors cursor-pointer">
                  {MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Direction */}
            <div>
              <FieldLabel>Direction</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {(["long", "short"] as const).map((d) => (
                  <button key={d} type="button" onClick={() => set("direction", d)} className={cn("h-10 rounded-lg border text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer capitalize", form.direction === d ? d === "long" ? "bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]" : "bg-[#ef4444]/10 border-[#ef4444]/40 text-[#ef4444]" : "border-[#1e293b] text-[#475569] hover:border-[#334155] hover:text-[#94a3b8]")}>
                    {d === "long" ? <ArrowUp className="w-4 h-4" strokeWidth={2.5} /> : <ArrowDown className="w-4 h-4" strokeWidth={2.5} />}
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel required>Entry Price</FieldLabel>
                <TextInput value={form.entryPrice} onChange={(v) => set("entryPrice", v)} placeholder="0.00" type="number" hasError={!!errors.entryPrice} />
                <FieldError msg={errors.entryPrice} />
              </div>
              <div>
                <FieldLabel required>Exit Price</FieldLabel>
                <TextInput value={form.exitPrice} onChange={(v) => set("exitPrice", v)} placeholder="0.00" type="number" hasError={!!errors.exitPrice} />
                <FieldError msg={errors.exitPrice} />
              </div>
              <div>
                <FieldLabel required>Position Size</FieldLabel>
                <TextInput value={form.positionSize} onChange={(v) => set("positionSize", v)} placeholder="0.00" type="number" hasError={!!errors.positionSize} />
                <FieldError msg={errors.positionSize} />
              </div>
            </div>

            {/* PnL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <FieldLabel>PnL {selectedPortfolio ? `(${selectedPortfolio.currency})` : ""}</FieldLabel>
                {form.pnlManual && (
                  <button type="button" onClick={() => set("pnlManual", false)} className="text-[11px] text-[#475569] hover:text-[#94a3b8] transition-colors cursor-pointer">Reset auto</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextInput value={form.pnl} onChange={(v) => { set("pnl", v); set("pnlManual", true); }} placeholder="0.00" type="number" />
                <TextInput value={form.pnlPercent} onChange={(v) => { set("pnlPercent", v); set("pnlManual", true); }} placeholder="%" type="number" />
              </div>
            </div>

            {/* Outcome */}
            <div>
              <FieldLabel>Outcome</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {(["win", "loss", "breakeven"] as const).map((o) => (
                  <button key={o} type="button" onClick={() => set("outcome", o)} className={cn("h-9 rounded-lg border text-[13px] font-semibold capitalize transition-all duration-150 cursor-pointer", form.outcome === o ? o === "win" ? "bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]" : o === "loss" ? "bg-[#ef4444]/10 border-[#ef4444]/40 text-[#ef4444]" : "bg-[#f8fafc]/10 border-[#f8fafc]/20 text-[#f8fafc]" : "border-[#1e293b] text-[#475569] hover:border-[#334155]")}>{o}</button>
                ))}
              </div>
            </div>

            {/* Date/Time */}
            <div>
              <FieldLabel required>Date & Time</FieldLabel>
              <input type="datetime-local" value={form.dateTime} onChange={(e) => set("dateTime", e.target.value)} className={cn("w-full h-10 rounded-lg border bg-[#0f172a] px-3 text-[13px] text-[#f8fafc] focus:outline-none focus:ring-1 transition-colors", errors.dateTime ? "border-[#ef4444]/60" : "border-[#1e293b] focus:border-[#334155] focus:ring-[#334155]")} />
              <FieldError msg={errors.dateTime} />
            </div>
          </div>
        </SectionCard>

        {/* Setup */}
        <SectionCard title="Setup">
          <div>
            <FieldLabel>Setup Tag</FieldLabel>
            <SetupInput value={form.setupTag} onChange={(v) => set("setupTag", v)} />
          </div>
        </SectionCard>

        {/* Emotion */}
        <SectionCard title="Psychology">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["emotionBefore", "emotionAfter"] as const).map((field) => (
              <div key={field}>
                <FieldLabel>{field === "emotionBefore" ? "Emotion Before" : "Emotion After"}</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {EMOTIONS.map(({ key, label, color, bg }) => (
                    <button key={key} type="button" onClick={() => set(field, form[field] === key ? "" : key)} className={cn("px-2.5 py-1.5 rounded-lg border text-[12px] font-semibold transition-all duration-150 cursor-pointer", form[field] === key ? cn(color, bg) : "border-[#1e293b] text-[#475569] hover:border-[#334155]")}>{label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Mistakes */}
        <SectionCard title="Mistakes">
          <div className="flex flex-wrap gap-2">
            {MISTAKES.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => toggleMistake(key)} className={cn("px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all duration-150 cursor-pointer", form.mistakes.includes(key) ? "bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#f59e0b]" : "border-[#1e293b] text-[#475569] hover:border-[#334155]")}>{label}</button>
            ))}
          </div>
        </SectionCard>

        {/* Reflection */}
        <SectionCard title="Reflection">
          <div className="space-y-4">
            <div>
              <FieldLabel>Trade Notes</FieldLabel>
              <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="What happened? How did you execute?" className="w-full rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2.5 text-[13px] text-[#f8fafc] placeholder:text-[#334155] resize-none focus:outline-none focus:border-[#334155] focus:ring-1 focus:ring-[#334155] transition-colors" />
            </div>
            <div>
              <FieldLabel>Lesson Learned</FieldLabel>
              <textarea rows={2} value={form.lessonLearned} onChange={(e) => set("lessonLearned", e.target.value)} placeholder="What would you do differently?" className="w-full rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2.5 text-[13px] text-[#f8fafc] placeholder:text-[#334155] resize-none focus:outline-none focus:border-[#334155] focus:ring-1 focus:ring-[#334155] transition-colors" />
            </div>
          </div>
        </SectionCard>

        <button type="submit" disabled={saving} className="w-full h-11 rounded-xl bg-[#f8fafc] text-[#020617] text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-[#e2e8f0] active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
          <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
          {saving ? "Saving…" : isEditing ? "Update Trade" : "Log Trade"}
        </button>
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
