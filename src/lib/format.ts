// Money formatting helpers used across the app.
// - Symbols ($, €, £, ¥) sit tight against the number: "$12,480"
// - 3-letter codes (USD, EUR, USDT) get a space:          "USDT 12,480"
// Always uses tabular spacing so numbers align in columns.

const SYMBOL_RE = /^[\$€£¥₹₽]$/;

export function fmtAmount(amount: number, decimals = 0): string {
  return amount.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals === 0 ? 0 : decimals });
}

export function fmtMoney(currency: string, amount: number, decimals = 0): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const formatted = fmtAmount(abs, decimals);
  return SYMBOL_RE.test(currency)
    ? `${sign}${currency}${formatted}`
    : `${sign}${currency} ${formatted}`;
}

// Signed money — adds "+" or "-" prefix.
export function fmtMoneySigned(currency: string, amount: number, decimals = 0): string {
  const prefix = amount >= 0 ? "+" : "-";
  const formatted = fmtAmount(Math.abs(amount), decimals);
  return SYMBOL_RE.test(currency)
    ? `${prefix}${currency}${formatted}`
    : `${prefix}${currency} ${formatted}`;
}
