"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Portfolio, TradingStyle } from "@/types";
import { useT } from "@/i18n/LanguageProvider";

interface FormData {
  name: string;
  broker: string;
  startingBalance: string;
  currency: string;
  tradingStyle: TradingStyle | string;
  goal: string;
  notes: string;
}

const EMPTY: FormData = {
  name: "",
  broker: "",
  startingBalance: "",
  currency: "USD",
  tradingStyle: "",
  goal: "",
  notes: "",
};

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "USDT", "USDC", "BTC", "ETH"];

const TRADING_STYLE_KEYS: TradingStyle[] = [
  "scalping", "day_trading", "swing", "position", "crypto_spot", "prop_firm", "other",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Portfolio, "id" | "createdAt">) => void;
  initial?: Portfolio | null;
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-semibold text-[#475569]">
        {label}
        {required && <span className="text-[#ef4444] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-[#ef4444]">{error}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hasError?: boolean;
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
          ? "border-[#ef4444]/60 ring-[#ef4444]/40"
          : "border-[#1e293b] focus:border-[#334155] focus:ring-[#334155]"
      )}
    />
  );
}

export function PortfolioFormModal({ open, onClose, onSubmit, initial }: Props) {
  const { t } = useT();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(
        initial
          ? {
              name: initial.name,
              broker: initial.broker,
              startingBalance: String(initial.startingBalance),
              currency: initial.currency,
              tradingStyle: initial.tradingStyle,
              goal: initial.goal ?? "",
              notes: initial.notes ?? "",
            }
          : EMPTY
      );
    }
  }, [open, initial]);

  function set(field: keyof FormData) {
    return (v: string) => {
      setForm((f) => ({ ...f, [field]: v }));
      if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    };
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) e.name = t("portfolio.errName");
    if (!form.broker.trim()) e.broker = t("portfolio.errBroker");
    const bal = parseFloat(form.startingBalance);
    if (!form.startingBalance || isNaN(bal) || bal <= 0)
      e.startingBalance = t("portfolio.errBalance");
    if (!form.tradingStyle) e.tradingStyle = t("portfolio.errStyle");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: form.name.trim(),
      broker: form.broker.trim(),
      startingBalance: parseFloat(form.startingBalance),
      currency: form.currency,
      tradingStyle: form.tradingStyle,
      goal: form.goal.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  }

  const isEditing = !!initial;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#0e1223] border-[#1e293b] text-[#f8fafc] max-w-lg w-full p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-[#1e293b]">
          <DialogTitle className="text-[15px] font-bold tracking-tight">
            {isEditing ? t("portfolio.editTitle") : t("portfolio.createTitle")}
          </DialogTitle>
          <p className="text-[12px] text-[#475569] mt-0.5">
            {isEditing ? t("portfolio.editSubtitle") : t("portfolio.createSubtitle")}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Name + Broker */}
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("portfolio.nameLabel")} required error={errors.name}>
                <Input
                  value={form.name}
                  onChange={set("name")}
                  placeholder={t("portfolio.namePlaceholder")}
                  hasError={!!errors.name}
                />
              </Field>
              <Field label={t("portfolio.brokerLabel")} required error={errors.broker}>
                <Input
                  value={form.broker}
                  onChange={set("broker")}
                  placeholder={t("portfolio.brokerPlaceholder")}
                  hasError={!!errors.broker}
                />
              </Field>
            </div>

            {/* Balance + Currency */}
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("portfolio.balanceLabel")} required error={errors.startingBalance}>
                <Input
                  type="number"
                  value={form.startingBalance}
                  onChange={set("startingBalance")}
                  placeholder="10000"
                  hasError={!!errors.startingBalance}
                />
              </Field>
              <Field label={t("portfolio.currencyLabel")}>
                <div className="flex flex-wrap gap-1.5">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("currency")(c)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer",
                        form.currency === c
                          ? "bg-[#f8fafc]/10 border-[#f8fafc]/20 text-[#f8fafc]"
                          : "border-[#1e293b] text-[#475569] hover:border-[#334155]"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Trading Style */}
            <Field label={t("portfolio.styleLabel")} required error={errors.tradingStyle}>
              <div className="flex flex-wrap gap-2">
                {TRADING_STYLE_KEYS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("tradingStyle")(value)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-[12px] font-semibold border transition-colors cursor-pointer",
                      form.tradingStyle === value
                        ? "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]"
                        : "border-[#1e293b] text-[#475569] hover:border-[#334155] hover:text-[#94a3b8]",
                      errors.tradingStyle ? "border-[#ef4444]/40" : ""
                    )}
                  >
                    {t(`tradingStyles.${value}`)}
                  </button>
                ))}
              </div>
            </Field>

            {/* Goal */}
            <Field label={t("portfolio.goalLabel")}>
              <textarea
                value={form.goal}
                onChange={(e) => set("goal")(e.target.value)}
                rows={2}
                placeholder={t("portfolio.goalPlaceholder")}
                className="w-full rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2.5 text-[13px] text-[#f8fafc] placeholder:text-[#334155] resize-none focus:outline-none focus:border-[#334155] focus:ring-1 focus:ring-[#334155] transition-colors"
              />
            </Field>

            {/* Notes */}
            <Field label={t("portfolio.notesLabel")}>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes")(e.target.value)}
                rows={2}
                placeholder={t("portfolio.notesPlaceholder")}
                className="w-full rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2.5 text-[13px] text-[#f8fafc] placeholder:text-[#334155] resize-none focus:outline-none focus:border-[#334155] focus:ring-1 focus:ring-[#334155] transition-colors"
              />
            </Field>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-[#1e293b] text-[13px] font-semibold text-[#475569] hover:border-[#334155] hover:text-[#f8fafc] transition-colors cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded-lg bg-[#f8fafc] text-[#020617] text-[13px] font-bold hover:bg-[#e2e8f0] active:scale-[0.99] transition-all cursor-pointer"
            >
              {isEditing ? t("portfolio.saveChanges") : t("portfolios.createPortfolio")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
