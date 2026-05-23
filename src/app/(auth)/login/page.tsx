"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authErr) {
        setError(authErr.message);
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[380px]">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <span className="relative w-8 h-8 flex items-center justify-center shrink-0">
          <span className="absolute inset-0 rounded-lg bg-[#22c55e]/20 blur-sm" />
          <span className="relative w-8 h-8 rounded-lg bg-[#0f172a] border border-[#1e293b] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <polyline
                points="1,10 4,6 7,8 10,3 13,1"
                stroke="#22c55e"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
        <div>
          <p className="text-[14px] font-bold tracking-tight text-[#f8fafc] leading-none">TradeHabit</p>
          <p className="text-[11px] text-[#475569] mt-0.5 leading-none">Trading Journal</p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-[#1e293b] bg-[#0e1223] p-6 space-y-5">
        <div>
          <h1 className="text-[20px] font-bold text-[#f8fafc] tracking-tight leading-none">
            Welcome back
          </h1>
          <p className="text-[13px] text-[#475569] mt-1.5">
            Sign in to your trading journal
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="you@example.com"
              className={cn(
                "w-full h-10 rounded-lg border bg-[#0f172a] px-3 text-[13px] text-[#f8fafc] placeholder:text-[#334155]",
                "focus:outline-none focus:ring-1 transition-colors",
                error
                  ? "border-[#ef4444]/60 focus:border-[#ef4444]/60 focus:ring-[#ef4444]/30"
                  : "border-[#1e293b] focus:border-[#334155] focus:ring-[#334155]"
              )}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                className={cn(
                  "w-full h-10 rounded-lg border bg-[#0f172a] px-3 pr-10 text-[13px] text-[#f8fafc] placeholder:text-[#334155]",
                  "focus:outline-none focus:ring-1 transition-colors",
                  error
                    ? "border-[#ef4444]/60 focus:border-[#ef4444]/60 focus:ring-[#ef4444]/30"
                    : "border-[#1e293b] focus:border-[#334155] focus:ring-[#334155]"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#334155] hover:text-[#94a3b8] transition-colors cursor-pointer"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/5 px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-[#ef4444] shrink-0" />
              <p className="text-[12px] text-[#ef4444]">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-[#f8fafc] text-[#020617] text-[13px] font-bold hover:bg-[#e2e8f0] active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="pt-1 border-t border-[#0f172a] text-center">
          <p className="text-[12px] text-[#475569]">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-[#f8fafc] font-semibold hover:underline transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
