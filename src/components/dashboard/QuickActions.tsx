import Link from "next/link";
import { PlusCircle, CalendarCheck, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/add-trade",
    label: "Log a Trade",
    description: "Record a new entry",
    icon: PlusCircle,
    iconColor: "text-[#22c55e]",
    iconBg: "bg-[#22c55e]/10",
    hoverBg: "hover:border-[#22c55e]/20",
  },
  {
    href: "/weekly-review",
    label: "Weekly Review",
    description: "Reflect on this week",
    icon: CalendarCheck,
    iconColor: "text-[#3b82f6]",
    iconBg: "bg-[#3b82f6]/10",
    hoverBg: "hover:border-[#3b82f6]/20",
  },
  {
    href: "/history",
    label: "Trade History",
    description: "Browse past trades",
    icon: ClipboardList,
    iconColor: "text-[#8b5cf6]",
    iconBg: "bg-[#8b5cf6]/10",
    hoverBg: "hover:border-[#8b5cf6]/20",
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] h-full flex flex-col">
      <div className="px-5 py-4 border-b border-[#1e293b]">
        <p className="text-[13px] font-semibold text-[#f8fafc]">Quick Actions</p>
      </div>
      <div className="flex-1 p-2 flex flex-col gap-1">
        {actions.map(({ href, label, description, icon: Icon, iconColor, iconBg, hoverBg }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-4 rounded-lg border border-transparent transition-all duration-150 cursor-pointer group",
              "hover:bg-[#0f172a]",
              hoverBg
            )}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-110",
                iconBg
              )}
            >
              <Icon className={cn("w-4 h-4", iconColor)} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#cbd5e1] leading-none">{label}</p>
              <p className="text-[11px] text-[#475569] mt-1 leading-none">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
