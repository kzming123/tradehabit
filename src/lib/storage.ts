import { Portfolio, Trade, WeeklyReview } from "@/types";

const KEYS = {
  portfolios: "tradehabit_portfolios",
  trades: "tradehabit_trades",
  weeklyReviews: "tradehabit_weekly_reviews",
  activePortfolio: "tradehabit_active_portfolio",
} as const;

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function persist<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Demo portfolios seeded on first load ──────────────────────────────────────
const DEMO_PORTFOLIOS: Portfolio[] = [
  {
    id: "demo-1",
    name: "Binance Main",
    broker: "Binance",
    startingBalance: 10000,
    currency: "USDT",
    tradingStyle: "day_trading",
    goal: "Grow to $15,000 with consistent 2% daily gains",
    notes: "Focus on BTC and ETH only. No altcoins.",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-2",
    name: "FTMO Challenge",
    broker: "FTMO",
    startingBalance: 100000,
    currency: "USD",
    tradingStyle: "swing",
    goal: "Pass Phase 1 — max 5% drawdown, 10% profit target",
    notes: "Follow strict risk rules. Max 2 trades per day.",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Demo trades seeded on first load ─────────────────────────────────────────
const DEMO_TRADES: Trade[] = [
  {
    id: "demo-t1",
    portfolioId: "demo-1",
    pair: "BTC/USDT",
    market: "Crypto",
    direction: "long",
    outcome: "win",
    entryPrice: 62400,
    exitPrice: 64100,
    positionSize: 0.1,
    pnl: 170,
    pnlPercent: 2.72,
    dateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    setupTag: "Breakout",
    emotionBefore: "confident",
    emotionAfter: "calm",
    mistakes: [],
    notes: "Clean breakout above resistance. Held for the full move.",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-t2",
    portfolioId: "demo-1",
    pair: "ETH/USDT",
    market: "Crypto",
    direction: "short",
    outcome: "loss",
    entryPrice: 3520,
    exitPrice: 3590,
    positionSize: 1,
    pnl: -70,
    pnlPercent: -1.99,
    dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    setupTag: "Trend Reversal",
    emotionBefore: "fomo",
    emotionAfter: "fearful",
    mistakes: ["fomo_entry"],
    notes: "Entered too early, trend still intact",
    lessonLearned: "Wait for confirmation before entry",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-t3",
    portfolioId: "demo-1",
    pair: "SOL/USDT",
    market: "Crypto",
    direction: "long",
    outcome: "win",
    entryPrice: 178,
    exitPrice: 192,
    positionSize: 10,
    pnl: 140,
    pnlPercent: 7.87,
    dateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    setupTag: "Support Bounce",
    emotionBefore: "calm",
    emotionAfter: "disciplined",
    mistakes: [],
    notes: "Perfect bounce off key support",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-t4",
    portfolioId: "demo-1",
    pair: "BTC/USDT",
    market: "Crypto",
    direction: "long",
    outcome: "win",
    entryPrice: 61800,
    exitPrice: 62950,
    positionSize: 0.08,
    pnl: 92,
    pnlPercent: 1.86,
    dateTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    setupTag: "Breakout",
    emotionBefore: "confident",
    emotionAfter: "confident",
    mistakes: [],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-t5",
    portfolioId: "demo-1",
    pair: "AVAX/USDT",
    market: "Crypto",
    direction: "short",
    outcome: "loss",
    entryPrice: 38.5,
    exitPrice: 41.2,
    positionSize: 15,
    pnl: -40.5,
    pnlPercent: -7.01,
    dateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    setupTag: "Distribution",
    emotionBefore: "fearful",
    emotionAfter: "revenge",
    mistakes: ["no_stop"],
    notes: "Held too long without a stop.",
    lessonLearned: "Always set stop loss before entering",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Portfolio storage ─────────────────────────────────────────────────────────
export const portfolioStorage = {
  getAll(): Portfolio[] {
    return load<Portfolio>(KEYS.portfolios);
  },

  getById(id: string): Portfolio | undefined {
    return this.getAll().find((p) => p.id === id);
  },

  create(data: Omit<Portfolio, "id" | "createdAt">): Portfolio {
    const portfolio: Portfolio = {
      ...data,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    const all = this.getAll();
    persist(KEYS.portfolios, [...all, portfolio]);
    return portfolio;
  },

  update(id: string, data: Partial<Omit<Portfolio, "id" | "createdAt">>): Portfolio | null {
    const all = this.getAll();
    const idx = all.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    const updated = { ...all[idx], ...data };
    all[idx] = updated;
    persist(KEYS.portfolios, all);
    return updated;
  },

  delete(id: string): void {
    persist(KEYS.portfolios, this.getAll().filter((p) => p.id !== id));
  },

  seedIfEmpty(): void {
    if (this.getAll().length === 0) {
      persist(KEYS.portfolios, DEMO_PORTFOLIOS);
    }
  },
};

// ── Trade storage ─────────────────────────────────────────────────────────────
export const tradeStorage = {
  getAll(): Trade[] {
    return load<Trade>(KEYS.trades);
  },

  getById(id: string): Trade | undefined {
    return this.getAll().find((t) => t.id === id);
  },

  getByPortfolio(portfolioId: string): Trade[] {
    return this.getAll().filter((t) => t.portfolioId === portfolioId);
  },

  create(data: Omit<Trade, "id" | "createdAt">): Trade {
    const trade: Trade = {
      ...data,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    const all = this.getAll();
    persist(KEYS.trades, [...all, trade]);
    return trade;
  },

  update(id: string, data: Partial<Omit<Trade, "id" | "createdAt">>): Trade | null {
    const all = this.getAll();
    const idx = all.findIndex((t) => t.id === id);
    if (idx < 0) return null;
    const updated = { ...all[idx], ...data };
    all[idx] = updated;
    persist(KEYS.trades, all);
    return updated;
  },

  save(t: Trade): void {
    const all = this.getAll();
    const idx = all.findIndex((x) => x.id === t.id);
    if (idx >= 0) all[idx] = t;
    else all.push(t);
    persist(KEYS.trades, all);
  },

  delete(id: string): void {
    persist(KEYS.trades, this.getAll().filter((t) => t.id !== id));
  },

  seedIfEmpty(): void {
    if (this.getAll().length === 0) {
      persist(KEYS.trades, DEMO_TRADES);
    }
  },
};

// ── Weekly review storage ─────────────────────────────────────────────────────
export const weeklyReviewStorage = {
  getAll(): WeeklyReview[] {
    return load<WeeklyReview>(KEYS.weeklyReviews);
  },

  getById(id: string): WeeklyReview | undefined {
    return this.getAll().find((r) => r.id === id);
  },

  getByWeek(weekStart: string, portfolioId?: string): WeeklyReview | undefined {
    return this.getAll().find(
      (r) =>
        r.weekStart === weekStart &&
        (portfolioId === undefined || portfolioId === "all"
          ? !r.portfolioId
          : r.portfolioId === portfolioId)
    );
  },

  create(data: Omit<WeeklyReview, "id" | "createdAt">): WeeklyReview {
    const review: WeeklyReview = {
      ...data,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    const all = this.getAll();
    persist(KEYS.weeklyReviews, [...all, review]);
    return review;
  },

  update(id: string, data: Partial<Omit<WeeklyReview, "id" | "createdAt">>): WeeklyReview | null {
    const all = this.getAll();
    const idx = all.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    const updated = { ...all[idx], ...data };
    all[idx] = updated;
    persist(KEYS.weeklyReviews, all);
    return updated;
  },

  delete(id: string): void {
    persist(KEYS.weeklyReviews, this.getAll().filter((r) => r.id !== id));
  },

  save(r: WeeklyReview): void {
    const all = this.getAll();
    const idx = all.findIndex((x) => x.id === r.id);
    if (idx >= 0) all[idx] = r;
    else all.push(r);
    persist(KEYS.weeklyReviews, all);
  },
};

// ── Active portfolio ──────────────────────────────────────────────────────────
export const activePortfolioStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(KEYS.activePortfolio);
  },
  set(id: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEYS.activePortfolio, id);
  },
};
