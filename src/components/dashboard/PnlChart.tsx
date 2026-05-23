"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { PnlPoint, filterCurveByRange } from "@/lib/analytics";

const RANGES = ["7D", "1M", "3M", "All"] as const;

interface Props {
  curve: PnlPoint[];
  currentBalance: number;
  totalPnl: number;
  returnPct: number;
  currency: string;
  startingBalance: number;
}

export function PnlChart({ curve, currentBalance, totalPnl, returnPct, currency, startingBalance }: Props) {
  const [range, setRange] = useState<string>("All");

  const pts = useMemo(() => filterCurveByRange(curve, range), [curve, range]);
  const hasData = pts.length >= 2;

  const W = 400;
  const H = 100;
  const padY = 8;

  const { linePath, areaPath, glowDot } = useMemo(() => {
    if (!hasData) return { linePath: "", areaPath: "", glowDot: null };

    const balances = pts.map((p) => p.balance);
    const minB = Math.min(...balances);
    const maxB = Math.max(...balances);
    const rangeB = maxB - minB || 1;

    const mapped = pts.map((p, i) => ({
      x: (i / (pts.length - 1)) * W,
      y: padY + ((maxB - p.balance) / rangeB) * (H - padY * 2),
    }));

    let d = `M ${mapped[0].x} ${mapped[0].y}`;
    for (let i = 0; i < mapped.length - 1; i++) {
      const cx = (mapped[i].x + mapped[i + 1].x) / 2;
      d += ` C ${cx} ${mapped[i].y} ${cx} ${mapped[i + 1].y} ${mapped[i + 1].x} ${mapped[i + 1].y}`;
    }

    const last = mapped[mapped.length - 1];
    const first = mapped[0];
    const area = `${d} L ${last.x} ${H} L ${first.x} ${H} Z`;

    return { linePath: d, areaPath: area, glowDot: last };
  }, [pts, hasData]);

  const pnlUp = totalPnl >= 0;
  const displayBalance = currentBalance > 0 ? currentBalance : startingBalance;
  const lineColor = pnlUp ? "#22c55e" : "#ef4444";

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold text-[#475569] uppercase tracking-[0.08em] mb-2">
            Portfolio Balance
          </p>
          <p className="text-[32px] font-bold leading-none tracking-[-0.03em] text-[#f8fafc] tabular">
            {currency}{" "}
            {displayBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {hasData ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
                  pnlUp ? "text-[#22c55e] bg-[#22c55e]/10" : "text-[#ef4444] bg-[#ef4444]/10"
                )}
              >
                {pnlUp ? "+" : ""}{currency}{" "}
                {Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                {" "}({pnlUp ? "+" : ""}{returnPct.toFixed(1)}%)
              </span>
            ) : (
              <span className="text-[11px] text-[#334155]">No trades yet</span>
            )}
          </div>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-px p-0.5 rounded-lg border border-[#1e293b] bg-[#0f172a]">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-150 cursor-pointer",
                range === r ? "bg-[#1e293b] text-[#f8fafc]" : "text-[#475569] hover:text-[#94a3b8]"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full relative" style={{ height: 96 }}>
        {hasData ? (
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
              </linearGradient>
              <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.4" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Dashed grid */}
            {[0.25, 0.5, 0.75].map((frac) => (
              <line
                key={frac}
                x1="0" y1={H * frac} x2={W} y2={H * frac}
                stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4"
              />
            ))}

            <path d={areaPath} fill="url(#chartAreaGrad)" />
            <path
              d={linePath} fill="none"
              stroke="url(#chartLineGrad)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {glowDot && (
              <>
                <circle cx={glowDot.x} cy={glowDot.y} r="5" fill={lineColor} opacity="0.2" />
                <circle cx={glowDot.x} cy={glowDot.y} r="2.5" fill={lineColor} />
              </>
            )}
          </svg>
        ) : (
          <div className="w-full h-full flex items-center justify-center rounded-lg border border-dashed border-[#1e293b]">
            <p className="text-[12px] text-[#334155]">Log trades to see your PnL curve</p>
          </div>
        )}
      </div>
    </div>
  );
}
