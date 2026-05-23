"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Download, ChevronRight, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getTrades } from "@/lib/db/trades";
import { getPortfolios } from "@/lib/db/portfolios";
import { getWeeklyReviews } from "@/lib/db/weekly-reviews";
import { toast } from "sonner";

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 gap-4">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#f8fafc]">{label}</p>
        {description && (
          <p className="text-[11px] text-[#475569] mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#1e293b]">
        <p className="text-[11px] font-bold text-[#334155] uppercase tracking-[0.08em]">{title}</p>
      </div>
      <div className="divide-y divide-[#0f172a]">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
      setSigningOut(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const [trades, portfolios, reviews] = await Promise.all([
        getTrades(),
        getPortfolios(),
        getWeeklyReviews(),
      ]);
      const blob = new Blob(
        [JSON.stringify({ portfolios, trades, weeklyReviews: reviews }, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tradehabit-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] leading-none text-[#f8fafc]">
          Settings
        </h1>
        <p className="text-[12px] text-[#475569] mt-1.5">Preferences & account</p>
      </div>

      <SectionBlock title="Account">
        <SettingRow label="Email" description="Your sign-in email address">
          <span className="text-[12px] text-[#475569] truncate max-w-[200px]">{email ?? "—"}</span>
        </SettingRow>
        <SettingRow label="Sign Out" description="Sign out of your TradeHabit account">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/5 text-[12px] font-semibold text-[#ef4444] hover:bg-[#ef4444]/10 hover:border-[#ef4444]/50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </SettingRow>
      </SectionBlock>

      <SectionBlock title="Data">
        <SettingRow label="Export Journal" description="Download all your data as JSON">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#1e293b] bg-[#0f172a] text-[12px] font-semibold text-[#94a3b8] hover:border-[#334155] hover:text-[#f8fafc] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? "Exporting…" : "Export"}
          </button>
        </SettingRow>
      </SectionBlock>

      <SectionBlock title="About">
        <SettingRow label="Version">
          <span className="text-[12px] font-mono text-[#334155]">v1.0.0</span>
        </SettingRow>
        <SettingRow label="Documentation">
          <button className="flex items-center gap-1 text-[12px] text-[#475569] hover:text-[#94a3b8] transition-colors cursor-pointer">
            View docs <ChevronRight className="w-3 h-3" />
          </button>
        </SettingRow>
      </SectionBlock>
    </div>
  );
}
