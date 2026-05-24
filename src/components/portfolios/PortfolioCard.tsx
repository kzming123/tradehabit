"use client";

import { Portfolio } from "@/types";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Pencil, Trash2, ArrowUpRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fmtMoney } from "@/lib/format";
import Link from "next/link";

const STYLE_LABELS: Record<string, string> = {
  scalping: "Scalping",
  day_trading: "Day Trading",
  swing: "Swing",
  position: "Position",
  crypto_spot: "Crypto Spot",
  prop_firm: "Prop Firm",
  other: "Other",
};

interface Props {
  portfolio: Portfolio;
  tradeCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function PortfolioCard({ portfolio, tradeCount, onEdit, onDelete }: Props) {
  const { id, name, broker, startingBalance, currency, tradingStyle, createdAt } = portfolio;

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] hover:border-[#334155] transition-all duration-150 group overflow-hidden">
      {/* Card top: clickable area → detail page */}
      <Link href={`/portfolios/${id}`} className="block p-5 cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="w-9 h-9 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <polyline
                  points="1,10 4,6 7,8 10,3 13,1"
                  stroke="#22c55e"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#f8fafc] leading-none">{name}</p>
              <p className="text-[11px] text-[#475569] mt-0.5">{broker}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#475569] border border-[#1e293b] px-2 py-0.5 rounded-md">
              {currency}
            </span>
          </div>
        </div>

        {/* Balance */}
        <p className="text-[28px] font-bold leading-none tracking-[-0.03em] text-[#f8fafc] tabular">
          {fmtMoney(currency, startingBalance)}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <p className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.06em] mb-0.5">PnL</p>
            <p className="text-[13px] font-bold text-[#475569] tabular">—</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.06em] mb-0.5">Win Rate</p>
            <p className="text-[13px] font-bold text-[#475569] tabular">—</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#334155] uppercase tracking-[0.06em] mb-0.5">Trades</p>
            <p className="text-[13px] font-bold text-[#f8fafc] tabular">{tradeCount}</p>
          </div>
        </div>
      </Link>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#0f172a]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-[#334155] bg-[#0f172a] px-2 py-0.5 rounded-md border border-[#1e293b]">
            {STYLE_LABELS[tradingStyle] ?? tradingStyle}
          </span>
          <span className="text-[10px] text-[#334155]">
            {new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(
              new Date(createdAt)
            )}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
          <Link
            href={`/portfolios/${id}`}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#334155] hover:text-[#f8fafc] hover:bg-[#0f172a] transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="w-7 h-7 rounded-lg flex items-center justify-center text-[#334155] hover:text-[#f8fafc] hover:bg-[#0f172a] transition-colors cursor-pointer outline-none">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#0e1223] border-[#1e293b] min-w-[140px]"
            >
              <DropdownMenuItem
                onClick={onEdit}
                className="text-[13px] text-[#94a3b8] hover:text-[#f8fafc] cursor-pointer gap-2"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-[13px] text-[#ef4444] hover:text-[#ef4444] focus:text-[#ef4444] cursor-pointer gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
