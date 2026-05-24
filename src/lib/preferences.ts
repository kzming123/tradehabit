// Lightweight client-side preferences (localStorage) for smart defaults & drafts.
// Safe to call from SSR — every function no-ops when window is undefined.

const LAST_PORTFOLIO = "tradehabit_last_portfolio";
const RECENT_EMOTIONS = "tradehabit_recent_emotions";
const RECENT_PAIRS = "tradehabit_recent_pairs";
const TRADE_DRAFT = "tradehabit_trade_draft";
const QUICK_MODE = "tradehabit_quick_mode";

function safe<T>(fn: () => T, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return fn(); } catch { return fallback; }
}

// ── Last portfolio ────────────────────────────────────────────────────────────

export function getLastPortfolio(): string | null {
  return safe(() => localStorage.getItem(LAST_PORTFOLIO), null);
}

export function setLastPortfolio(id: string): void {
  safe(() => { localStorage.setItem(LAST_PORTFOLIO, id); return null; }, null);
}

// ── Recent emotions (LRU, max 4) ──────────────────────────────────────────────

export function getRecentEmotions(): string[] {
  return safe(() => {
    const raw = localStorage.getItem(RECENT_EMOTIONS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  }, []);
}

export function pushRecentEmotion(key: string): void {
  safe(() => {
    const current = getRecentEmotions();
    const next = [key, ...current.filter((e) => e !== key)].slice(0, 4);
    localStorage.setItem(RECENT_EMOTIONS, JSON.stringify(next));
    return null;
  }, null);
}

// ── Recent pairs (LRU, max 8) ─────────────────────────────────────────────────

export function getRecentPairs(): string[] {
  return safe(() => {
    const raw = localStorage.getItem(RECENT_PAIRS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  }, []);
}

export function pushRecentPair(pair: string): void {
  const trimmed = pair.trim().toUpperCase();
  if (!trimmed) return;
  safe(() => {
    const current = getRecentPairs();
    const next = [trimmed, ...current.filter((p) => p !== trimmed)].slice(0, 8);
    localStorage.setItem(RECENT_PAIRS, JSON.stringify(next));
    return null;
  }, null);
}

// ── Trade draft (auto-save the in-progress form so accidental dismissal doesn't lose it) ──

export function getTradeDraft<T>(): T | null {
  return safe(() => {
    const raw = localStorage.getItem(TRADE_DRAFT);
    return raw ? (JSON.parse(raw) as T) : null;
  }, null);
}

export function setTradeDraft<T>(state: T): void {
  safe(() => { localStorage.setItem(TRADE_DRAFT, JSON.stringify(state)); return null; }, null);
}

export function clearTradeDraft(): void {
  safe(() => { localStorage.removeItem(TRADE_DRAFT); return null; }, null);
}

// ── Quick add mode toggle (sticky between sessions) ──────────────────────────

export function getQuickMode(): boolean {
  return safe(() => localStorage.getItem(QUICK_MODE) === "1", false);
}

export function setQuickMode(on: boolean): void {
  safe(() => { localStorage.setItem(QUICK_MODE, on ? "1" : "0"); return null; }, null);
}
