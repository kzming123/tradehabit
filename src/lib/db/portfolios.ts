import { createClient } from "@/lib/supabase/client";
import { Portfolio } from "@/types";

// ── Type mapping ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPortfolio(row: any): Portfolio {
  return {
    id:              row.id,
    name:            row.name,
    broker:          row.broker,
    startingBalance: parseFloat(row.starting_balance),
    currency:        row.currency,
    tradingStyle:    row.trading_style,
    goal:            row.goal   ?? undefined,
    notes:           row.notes  ?? undefined,
    createdAt:       row.created_at,
  };
}

function toRow(data: Omit<Portfolio, "id" | "createdAt">, userId: string) {
  return {
    user_id:          userId,
    name:             data.name,
    broker:           data.broker,
    starting_balance: data.startingBalance,
    currency:         data.currency,
    trading_style:    data.tradingStyle,
    goal:             data.goal  ?? null,
    notes:            data.notes ?? null,
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getPortfolios(): Promise<Portfolio[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map(toPortfolio);
}

export async function getPortfolioById(id: string): Promise<Portfolio | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return toPortfolio(data);
}

export async function createPortfolio(
  input: Omit<Portfolio, "id" | "createdAt">
): Promise<Portfolio> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("portfolios")
    .insert(toRow(input, user.id))
    .select()
    .single();
  if (error) throw error;
  return toPortfolio(data);
}

export async function updatePortfolio(
  id: string,
  input: Partial<Omit<Portfolio, "id" | "createdAt">>
): Promise<Portfolio> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (input.name             !== undefined) patch.name             = input.name;
  if (input.broker           !== undefined) patch.broker           = input.broker;
  if (input.startingBalance  !== undefined) patch.starting_balance = input.startingBalance;
  if (input.currency         !== undefined) patch.currency         = input.currency;
  if (input.tradingStyle     !== undefined) patch.trading_style    = input.tradingStyle;
  if (input.goal             !== undefined) patch.goal             = input.goal ?? null;
  if (input.notes            !== undefined) patch.notes            = input.notes ?? null;

  const { data, error } = await supabase
    .from("portfolios")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toPortfolio(data);
}

export async function deletePortfolio(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("portfolios").delete().eq("id", id);
  if (error) throw error;
}

export async function getPortfolioTradeCounts(): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trades")
    .select("portfolio_id");
  if (error) return {};
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.portfolio_id] = (counts[row.portfolio_id] ?? 0) + 1;
  }
  return counts;
}
