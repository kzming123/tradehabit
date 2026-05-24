import { createClient } from "@/lib/supabase/client";
import { Trade } from "@/types";

// ── Type mapping ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTrade(row: any): Trade {
  return {
    id:            row.id,
    portfolioId:   row.portfolio_id,
    pair:          row.pair,
    market:        row.market,
    direction:     row.direction,
    outcome:       row.outcome,
    entryPrice:    parseFloat(row.entry_price),
    exitPrice:     parseFloat(row.exit_price),
    positionSize:  parseFloat(row.position_size),
    pnl:           parseFloat(row.pnl),
    pnlPercent:    parseFloat(row.pnl_percent),
    dateTime:      row.date_time,
    setupTag:      row.setup_tag      ?? undefined,
    emotionBefore: row.emotion_before ?? undefined,
    emotionAfter:  row.emotion_after  ?? undefined,
    mistakes:      row.mistakes       ?? [],
    notes:         row.notes          ?? undefined,
    lessonLearned: row.lesson_learned ?? undefined,
    screenshotUrl: row.screenshot_url ?? undefined,
    createdAt:     row.created_at,
  };
}

function toRow(data: Omit<Trade, "id" | "createdAt">, userId: string) {
  return {
    user_id:        userId,
    portfolio_id:   data.portfolioId,
    pair:           data.pair,
    market:         data.market,
    direction:      data.direction,
    outcome:        data.outcome,
    entry_price:    data.entryPrice,
    exit_price:     data.exitPrice,
    position_size:  data.positionSize,
    pnl:            data.pnl,
    pnl_percent:    data.pnlPercent,
    date_time:      data.dateTime,
    setup_tag:      data.setupTag      ?? null,
    emotion_before: data.emotionBefore ?? null,
    emotion_after:  data.emotionAfter  ?? null,
    mistakes:       data.mistakes,
    notes:          data.notes         ?? null,
    lesson_learned: data.lessonLearned ?? null,
    screenshot_url: data.screenshotUrl ?? null,
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getTrades(): Promise<Trade[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("date_time", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toTrade);
}

export async function getTradeById(id: string): Promise<Trade | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return toTrade(data);
}

export async function getTradesByPortfolio(portfolioId: string): Promise<Trade[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .order("date_time", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toTrade);
}

export async function createTrade(
  input: Omit<Trade, "id" | "createdAt">
): Promise<Trade> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("trades")
    .insert(toRow(input, user.id))
    .select()
    .single();
  if (error) throw error;
  return toTrade(data);
}

export async function updateTrade(
  id: string,
  input: Partial<Omit<Trade, "id" | "createdAt">>
): Promise<Trade> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (input.portfolioId   !== undefined) patch.portfolio_id   = input.portfolioId;
  if (input.pair          !== undefined) patch.pair           = input.pair;
  if (input.market        !== undefined) patch.market         = input.market;
  if (input.direction     !== undefined) patch.direction      = input.direction;
  if (input.outcome       !== undefined) patch.outcome        = input.outcome;
  if (input.entryPrice    !== undefined) patch.entry_price    = input.entryPrice;
  if (input.exitPrice     !== undefined) patch.exit_price     = input.exitPrice;
  if (input.positionSize  !== undefined) patch.position_size  = input.positionSize;
  if (input.pnl           !== undefined) patch.pnl            = input.pnl;
  if (input.pnlPercent    !== undefined) patch.pnl_percent    = input.pnlPercent;
  if (input.dateTime      !== undefined) patch.date_time      = input.dateTime;
  if (input.setupTag      !== undefined) patch.setup_tag      = input.setupTag      ?? null;
  if (input.emotionBefore !== undefined) patch.emotion_before = input.emotionBefore ?? null;
  if (input.emotionAfter  !== undefined) patch.emotion_after  = input.emotionAfter  ?? null;
  if (input.mistakes      !== undefined) patch.mistakes       = input.mistakes;
  if (input.notes         !== undefined) patch.notes          = input.notes         ?? null;
  if (input.lessonLearned !== undefined) patch.lesson_learned = input.lessonLearned ?? null;
  if (input.screenshotUrl !== undefined) patch.screenshot_url = input.screenshotUrl || null;

  const { data, error } = await supabase
    .from("trades")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toTrade(data);
}

export async function deleteTrade(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("trades").delete().eq("id", id);
  if (error) throw error;
}
