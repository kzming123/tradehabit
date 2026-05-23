"use client";

import { cn } from "@/lib/utils";
import { Portfolio } from "@/types";
import { ChevronDown } from "lucide-react";

interface Props {
  portfolios: Portfolio[];
  selected: string; // "all" or portfolio id
  onChange: (id: string) => void;
}

export function PortfolioFilter({ portfolios, selected, onChange }: Props) {
  const selectedName =
    selected === "all"
      ? "All Portfolios"
      : (portfolios.find((p) => p.id === selected)?.name ?? "Portfolio");

  if (portfolios.length === 0) return null;

  return (
    <div className="relative">
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-8 pl-3 pr-7 rounded-lg border border-[#1e293b] bg-[#0f172a]",
          "text-[12px] font-semibold text-[#94a3b8]",
          "focus:outline-none focus:border-[#334155] transition-colors cursor-pointer appearance-none"
        )}
      >
        <option value="all">All Portfolios</option>
        {portfolios.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569] pointer-events-none" />
    </div>
  );
}
