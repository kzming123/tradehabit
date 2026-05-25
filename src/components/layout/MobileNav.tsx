"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  ClipboardList,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageProvider";

const navItems = [
  { href: "/", labelKey: "nav.home", icon: LayoutDashboard },
  { href: "/portfolios", labelKey: "nav.portfolios", icon: Briefcase },
  { href: "/add-trade", labelKey: "nav.add", icon: PlusCircle },
  { href: "/history", labelKey: "nav.history", icon: ClipboardList },
  { href: "/weekly-review", labelKey: "nav.review", icon: CalendarCheck },
];

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useT();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#020617]/95 backdrop-blur-md border-t border-[#1e293b]">
      <div
        className="flex items-center justify-around px-1 pt-2 pb-2"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const label = t(labelKey);
          const active = pathname === href;
          const isAdd = href === "/add-trade";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[52px] cursor-pointer",
                isAdd ? "relative -mt-5" : ""
              )}
            >
              {isAdd ? (
                <span className="w-12 h-12 rounded-full bg-[#f8fafc] flex items-center justify-center shadow-lg shadow-black/40">
                  <Icon className="w-5 h-5 text-[#020617]" strokeWidth={2.5} />
                </span>
              ) : (
                <span
                  className={cn(
                    "w-10 h-7 flex items-center justify-center rounded-xl transition-colors",
                    active ? "bg-[#0f172a]" : ""
                  )}
                >
                  <Icon
                    className={cn(
                      "transition-colors",
                      active ? "text-[#f8fafc]" : "text-[#475569]"
                    )}
                    strokeWidth={active ? 2 : 1.75}
                    size={18}
                  />
                </span>
              )}
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  isAdd ? "text-[#64748b]" : active ? "text-[#f8fafc]" : "text-[#475569]"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
