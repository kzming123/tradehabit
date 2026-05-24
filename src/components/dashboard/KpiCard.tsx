import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  accent?: "emerald" | "blue" | "violet" | "amber" | "red";
  caption?: string;
}

const accentDot = {
  emerald: "bg-[#22c55e]",
  blue:    "bg-[#3b82f6]",
  violet:  "bg-[#8b5cf6]",
  amber:   "bg-[#f59e0b]",
  red:     "bg-[#ef4444]",
};

const changeStyle = {
  emerald: "text-[#22c55e] bg-[#22c55e]/10",
  blue:    "text-[#3b82f6] bg-[#3b82f6]/10",
  violet:  "text-[#8b5cf6] bg-[#8b5cf6]/10",
  amber:   "text-[#f59e0b] bg-[#f59e0b]/10",
  red:     "text-[#ef4444] bg-[#ef4444]/10",
};

export function KpiCard({
  label,
  value,
  change,
  trend = "neutral",
  accent = "blue",
  caption,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "group rounded-xl border border-[#1e293b] bg-[#0e1223] p-4 sm:p-5 flex flex-col gap-3",
        "transition-colors duration-200 hover:border-[#334155]"
      )}
    >
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("w-1 h-1 rounded-full shrink-0", accentDot[accent])} />
          <p className="text-[10px] sm:text-[11px] font-semibold text-[#475569] uppercase tracking-[0.08em] truncate">
            {label}
          </p>
        </div>
        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular",
              changeStyle[accent]
            )}
          >
            {trend === "up" && <TrendingUp className="w-2.5 h-2.5" strokeWidth={2.5} />}
            {trend === "down" && <TrendingDown className="w-2.5 h-2.5" strokeWidth={2.5} />}
            {change}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[22px] sm:text-[26px] font-bold leading-none tracking-[-0.03em] text-[#f8fafc] tabular">
          {value}
        </p>
        {caption && (
          <p className="text-[11px] text-[#475569] leading-none truncate">{caption}</p>
        )}
      </div>
    </div>
  );
}
