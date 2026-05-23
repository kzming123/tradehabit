import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  /** Left-border accent color (Tailwind color string, e.g. "emerald", "blue") */
  accent?: "emerald" | "blue" | "violet" | "amber" | "red";
  caption?: string;
}

const accentStyles = {
  emerald: {
    border: "border-l-[#22c55e]",
    change: "text-[#22c55e] bg-[#22c55e]/10",
    glow: "shadow-[inset_0_0_20px_0_rgba(34,197,94,0.04)]",
  },
  blue: {
    border: "border-l-[#3b82f6]",
    change: "text-[#3b82f6] bg-[#3b82f6]/10",
    glow: "shadow-[inset_0_0_20px_0_rgba(59,130,246,0.04)]",
  },
  violet: {
    border: "border-l-[#8b5cf6]",
    change: "text-[#8b5cf6] bg-[#8b5cf6]/10",
    glow: "shadow-[inset_0_0_20px_0_rgba(139,92,246,0.04)]",
  },
  amber: {
    border: "border-l-[#f59e0b]",
    change: "text-[#f59e0b] bg-[#f59e0b]/10",
    glow: "shadow-[inset_0_0_20px_0_rgba(245,158,11,0.04)]",
  },
  red: {
    border: "border-l-[#ef4444]",
    change: "text-[#ef4444] bg-[#ef4444]/10",
    glow: "shadow-[inset_0_0_20px_0_rgba(239,68,68,0.04)]",
  },
};

export function KpiCard({
  label,
  value,
  change,
  trend = "neutral",
  accent = "blue",
  caption,
}: KpiCardProps) {
  const styles = accentStyles[accent];

  return (
    <div
      className={cn(
        "relative rounded-xl border border-[#1e293b] border-l-[3px] bg-[#0e1223] px-5 py-4 flex flex-col gap-3 transition-all duration-150 cursor-default",
        "hover:border-[#334155] hover:border-l-[3px]",
        styles.border,
        styles.glow
      )}
    >
      {/* Label + change badge */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-[#475569] uppercase tracking-[0.08em]">
          {label}
        </p>
        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
              styles.change
            )}
          >
            {trend === "up" && <TrendingUp className="w-2.5 h-2.5" strokeWidth={2.5} />}
            {trend === "down" && <TrendingDown className="w-2.5 h-2.5" strokeWidth={2.5} />}
            {change}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <p className="text-[28px] font-bold leading-none tracking-[-0.03em] text-[#f8fafc] tabular">
          {value}
        </p>
        {caption && (
          <p className="text-[11px] text-[#475569] mt-2 leading-none">{caption}</p>
        )}
      </div>
    </div>
  );
}
