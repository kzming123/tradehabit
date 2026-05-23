export type TradeDirection = "long" | "short";
export type TradeOutcome = "win" | "loss" | "breakeven";
export type TradingStyle = "scalping" | "day_trading" | "swing" | "position" | "crypto_spot" | "prop_firm" | "other";

export interface Portfolio {
  id: string;
  name: string;
  broker: string;
  startingBalance: number;
  currency: string;
  tradingStyle: TradingStyle | string;
  goal?: string;
  notes?: string;
  createdAt: string;
}

export interface Trade {
  id: string;
  portfolioId: string;
  pair: string;
  market: string;
  direction: TradeDirection;
  outcome: TradeOutcome;
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  pnl: number;
  pnlPercent: number;
  dateTime: string;
  setupTag?: string;
  emotionBefore?: string;
  emotionAfter?: string;
  mistakes: string[];
  notes?: string;
  lessonLearned?: string;
  screenshotUrl?: string;
  createdAt: string;
}

export interface WeeklyReview {
  id: string;
  portfolioId?: string;
  weekStart: string;
  weekEnd: string;
  followedPlan: boolean;
  followedPlanNotes?: string;
  repeatedMistake?: string;
  repeatedMistakeNotes?: string;
  improvementNextWeek?: string;
  notes?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
}

export interface DashboardStats {
  totalPnl: number;
  totalPnlPercent: number;
  winRate: number;
  totalTrades: number;
  streak: number;
  streakType: "win" | "loss";
  bestSetup?: string;
  currentBalance: number;
}
