import { Trash2, Download, ChevronRight } from "lucide-react";

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

function SettingInput({ placeholder }: { placeholder?: string }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className="w-36 h-8 rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 text-[12px] text-[#94a3b8] text-right placeholder:text-[#334155] focus:outline-none focus:border-[#334155] transition-colors"
    />
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
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] leading-none text-[#f8fafc]">
          Settings
        </h1>
        <p className="text-[12px] text-[#475569] mt-1.5">Preferences & account</p>
      </div>

      <SectionBlock title="Profile">
        <SettingRow label="Display Name" description="Shown in the app">
          <SettingInput placeholder="Trader" />
        </SettingRow>
        <SettingRow label="Preferred Currency" description="Default display currency">
          <SettingInput placeholder="USDT" />
        </SettingRow>
      </SectionBlock>

      <SectionBlock title="Trading">
        <SettingRow label="Default Portfolio" description="Active on app start">
          <SettingInput placeholder="Binance Main" />
        </SettingRow>
        <SettingRow label="Risk per Trade" description="% of balance per trade">
          <SettingInput placeholder="1.0" />
        </SettingRow>
        <SettingRow label="Timezone" description="Used for trade timestamps">
          <SettingInput placeholder="UTC+8" />
        </SettingRow>
      </SectionBlock>

      <SectionBlock title="Data">
        <SettingRow label="Export Journal" description="Download all trades as JSON">
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#1e293b] bg-[#0f172a] text-[12px] font-semibold text-[#94a3b8] hover:border-[#334155] hover:text-[#f8fafc] transition-colors cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </SettingRow>
        <SettingRow
          label="Clear All Data"
          description="Permanently delete all local data — cannot be undone"
        >
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/5 text-[12px] font-semibold text-[#ef4444] hover:bg-[#ef4444]/10 hover:border-[#ef4444]/50 transition-colors cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </SettingRow>
      </SectionBlock>

      <SectionBlock title="About">
        <SettingRow label="Version" description="Phase 1 Prototype">
          <span className="text-[12px] font-mono text-[#334155]">v0.1.0</span>
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
