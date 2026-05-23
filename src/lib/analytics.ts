import { Trade, Portfolio } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SetupStat {
  tag: string;
  count: number;
  wins: number;
  winRate: number;
  totalPnl: number;
}

export interface PortfolioStat {
  portfolio: Portfolio;
  pnl: number;
  trades: number;
  winRate: number;
}

export interface PnlPoint {
  date: string;   // ISO string
  label: string;  // "May 22" display label
  balance: number;
}

export interface DashboardAnalytics {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  totalPnl: number;
  winRate: number;
  avgPnl: number;
  currentBalance: number;
  startingBalance: number;
  totalReturnPct: number;
  bestSetup: SetupStat | null;
  worstSetup: SetupStat | null;
  mostCommonMistake: string | null;
  mostCommonMistakeCount: number;
  streak: number;
  recentTrades: Trade[];
  pnlCurve: PnlPoint[];
  portfolioStats: PortfolioStat[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function dateDayKey(isoStr: string): string {
  // Returns "YYYY-MM-DD" in local timezone
  const d = new Date(isoStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function calcStreak(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const days = new Set(trades.map((t) => dateDayKey(t.dateTime)));

  const today = new Date();
  const todayKey = dateDayKey(today.toISOString());

  // Walk backwards from today (or yesterday if today has no trades)
  let current = new Date(today);
  if (!days.has(todayKey)) {
    current.setDate(current.getDate() - 1);
  }

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const key = dateDayKey(current.toISOString());
    if (days.has(key)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function fmt(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

// ── Main analytics function ───────────────────────────────────────────────────

export function buildAnalytics(
  allTrades: Trade[],
  allPortfolios: Portfolio[],
  selectedPortfolioId: string // "all" or a portfolio ID
): DashboardAnalytics {
  // Filter trades for selected scope
  const trades =
    selectedPortfolioId === "all"
      ? allTrades
      : allTrades.filter((t) => t.portfolioId === selectedPortfolioId);

  // Starting balance
  const relevantPortfolios =
    selectedPortfolioId === "all"
      ? allPortfolios
      : allPortfolios.filter((p) => p.id === selectedPortfolioId);
  const startingBalance = relevantPortfolios.reduce((s, p) => s + p.startingBalance, 0);

  // Core stats
  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.outcome === "win").length;
  const losses = trades.filter((t) => t.outcome === "loss").length;
  const breakevens = trades.filter((t) => t.outcome === "breakeven").length;
  const totalPnl = Math.round(trades.reduce((s, t) => s + t.pnl, 0) * 100) / 100;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const avgPnl = totalTrades > 0 ? totalPnl / totalTrades : 0;
  const currentBalance = startingBalance + totalPnl;
  const totalReturnPct = startingBalance > 0 ? (totalPnl / startingBalance) * 100 : 0;

  // Setup stats (min 1 trade per setup)
  const setupMap = new Map<string, { wins: number; count: number; pnl: number }>();
  for (const t of trades) {
    if (!t.setupTag) continue;
    const e = setupMap.get(t.setupTag) ?? { wins: 0, count: 0, pnl: 0 };
    e.count++;
    if (t.outcome === "win") e.wins++;
    e.pnl = Math.round((e.pnl + t.pnl) * 100) / 100;
    setupMap.set(t.setupTag, e);
  }

  const setups: SetupStat[] = Array.from(setupMap.entries()).map(([tag, { wins: w, count, pnl }]) => ({
    tag,
    count,
    wins: w,
    winRate: (w / count) * 100,
    totalPnl: pnl,
  }));

  const bestSetup =
    setups.length > 0
      ? setups.reduce((best, s) => (s.totalPnl > best.totalPnl ? s : best))
      : null;
  const worstSetup =
    setups.length > 0
      ? setups.reduce((worst, s) => (s.totalPnl < worst.totalPnl ? s : worst))
      : null;

  // Most common mistake
  const mistakeCount = new Map<string, number>();
  for (const t of trades) {
    for (const m of t.mistakes) {
      mistakeCount.set(m, (mistakeCount.get(m) ?? 0) + 1);
    }
  }
  const mistakeEntries = Array.from(mistakeCount.entries());
  const topMistake =
    mistakeEntries.length > 0
      ? mistakeEntries.reduce((a, b) => (b[1] > a[1] ? b : a))
      : null;
  const mostCommonMistake = topMistake?.[0] ?? null;
  const mostCommonMistakeCount = topMistake?.[1] ?? 0;

  // Journaling streak
  const streak = calcStreak(trades);

  // Recent trades
  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    .slice(0, 8);

  // PnL curve — one point per trade + starting point
  const sorted = [...trades].sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  );

  const pnlCurve: PnlPoint[] = [];
  if (sorted.length > 0) {
    // Add starting point one day before first trade
    const firstDate = new Date(sorted[0].dateTime);
    const startDate = new Date(firstDate);
    startDate.setDate(startDate.getDate() - 1);
    pnlCurve.push({ date: startDate.toISOString(), label: fmt(startDate), balance: startingBalance });

    let balance = startingBalance;
    for (const t of sorted) {
      balance = Math.round((balance + t.pnl) * 100) / 100;
      pnlCurve.push({ date: t.dateTime, label: fmt(new Date(t.dateTime)), balance });
    }
  }

  // Per-portfolio stats (for insight cards)
  const portfolioStats: PortfolioStat[] = allPortfolios.map((p) => {
    const pTrades = allTrades.filter((t) => t.portfolioId === p.id);
    const pWins = pTrades.filter((t) => t.outcome === "win").length;
    return {
      portfolio: p,
      pnl: Math.round(pTrades.reduce((s, t) => s + t.pnl, 0) * 100) / 100,
      trades: pTrades.length,
      winRate: pTrades.length > 0 ? (pWins / pTrades.length) * 100 : 0,
    };
  });

  return {
    totalTrades,
    wins,
    losses,
    breakevens,
    totalPnl,
    winRate,
    avgPnl,
    currentBalance,
    startingBalance,
    totalReturnPct,
    bestSetup,
    worstSetup,
    mostCommonMistake,
    mostCommonMistakeCount,
    streak,
    recentTrades,
    pnlCurve,
    portfolioStats,
  };
}

// ── Weekly analytics ──────────────────────────────────────────────────────────

export interface DayStats {
  day: string;   // "Mon", "Tue", ...
  date: string;  // "YYYY-MM-DD"
  pnl: number;
  trades: number;
}

export interface WeekAnalytics {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  bestSetup: string | null;
  mostCommonMistake: string | null;
  bestDay: DayStats | null;
  worstDay: DayStats | null;
  dayStats: DayStats[];
  trades: Trade[];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function calcWeekAnalytics(
  allTrades: Trade[],
  weekStart: Date,
  weekEnd: Date,
  portfolioId?: string // undefined or "all" = all portfolios
): WeekAnalytics {
  const trades = allTrades.filter((t) => {
    const d = new Date(t.dateTime);
    if (d < weekStart || d > weekEnd) return false;
    if (portfolioId && portfolioId !== "all" && t.portfolioId !== portfolioId) return false;
    return true;
  });

  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.outcome === "win").length;
  const losses = trades.filter((t) => t.outcome === "loss").length;
  const breakevens = trades.filter((t) => t.outcome === "breakeven").length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const totalPnl = Math.round(trades.reduce((s, t) => s + t.pnl, 0) * 100) / 100;
  const avgPnl = totalTrades > 0 ? totalPnl / totalTrades : 0;

  // Best setup by total PnL
  const setupMap = new Map<string, number>();
  for (const t of trades) {
    if (t.setupTag) setupMap.set(t.setupTag, (setupMap.get(t.setupTag) ?? 0) + t.pnl);
  }
  const bestSetup =
    setupMap.size > 0
      ? Array.from(setupMap.entries()).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
      : null;

  // Most common mistake
  const mistakeMap = new Map<string, number>();
  for (const t of trades) {
    for (const m of t.mistakes) mistakeMap.set(m, (mistakeMap.get(m) ?? 0) + 1);
  }
  const mostCommonMistake =
    mistakeMap.size > 0
      ? Array.from(mistakeMap.entries()).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
      : null;

  // Per-day stats (Mon��Sun)
  const dayMap = new Map<string, { pnl: number; trades: number }>();
  for (const t of trades) {
    const d = new Date(t.dateTime);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const entry = dayMap.get(key) ?? { pnl: 0, trades: 0 };
    entry.pnl = Math.round((entry.pnl + t.pnl) * 100) / 100;
    entry.trades++;
    dayMap.set(key, entry);
  }

  const dayStats: DayStats[] = Array.from(dayMap.entries()).map(([date, { pnl, trades }]) => ({
    day: DAY_NAMES[new Date(date + "T12:00:00").getDay()],
    date,
    pnl,
    trades,
  }));

  const bestDay =
    dayStats.length > 0 ? dayStats.reduce((a, b) => (b.pnl > a.pnl ? b : a)) : null;
  const worstDay =
    dayStats.length > 0 ? dayStats.reduce((a, b) => (b.pnl < a.pnl ? b : a)) : null;

  return {
    totalTrades, wins, losses, breakevens,
    winRate, totalPnl, avgPnl,
    bestSetup, mostCommonMistake,
    bestDay, worstDay, dayStats, trades,
  };
}

// ── Week boundary helpers ─────────────────────────────────────────────────────

export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMon);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function formatWeekRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
  const year = end.getFullYear();
  return `${fmt(start)} – ${fmt(end)}, ${year}`;
}

export function weekStartISO(start: Date): string {
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
}

// ── Range filter for chart ────────────────────────────────────────────────────

export function filterCurveByRange(curve: PnlPoint[], range: string): PnlPoint[] {
  if (range === "All" || curve.length < 2) return curve;
  const days = range === "7D" ? 7 : range === "1M" ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const idx = curve.findIndex((p) => new Date(p.date).getTime() >= cutoff);
  if (idx === -1) return curve.slice(-2); // show at least last 2 points
  // Include the last point before cutoff as the period's starting balance
  return curve.slice(Math.max(0, idx - 1));
}
