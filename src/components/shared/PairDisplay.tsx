// Render a trading pair with the base asset prominent and the quote muted.
// "BTC/USDT"  → BTC (full opacity) · / (faint) · USDT (muted)
// "EURUSD"    → EURUSD (no split; rendered plain)
//
// The two-tone styling lets the eye lock on the base asset first, matching
// how Coinbase, TradingView, and most pro trading apps render pairs.

export function PairDisplay({ pair, className }: { pair: string; className?: string }) {
  const sep = pair.includes("/") ? "/" : pair.includes("-") ? "-" : null;
  if (!sep) return <span className={className}>{pair}</span>;
  const [base, ...rest] = pair.split(sep);
  const quote = rest.join(sep);
  return (
    <span className={className}>
      <span>{base}</span>
      <span className="opacity-40 mx-[2px]">{sep}</span>
      <span className="opacity-60 font-medium">{quote}</span>
    </span>
  );
}
