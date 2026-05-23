import { createClient } from "@/lib/supabase/client";
import { WeeklyReview } from "@/types";

// ── Type mapping ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toReview(row: any): WeeklyReview {
  return {
    id:                    row.id,
    portfolioId:           row.portfolio_id    ?? undefined,
    weekStart:             row.week_start,
    weekEnd:               row.week_end,
    followedPlan:          row.followed_plan,
    followedPlanNotes:     row.followed_plan_notes     ?? undefined,
    repeatedMistake:       row.repeated_mistake        ?? undefined,
    repeatedMistakeNotes:  row.repeated_mistake_notes  ?? undefined,
    improvementNextWeek:   row.improvement_next_week   ?? undefined,
    notes:                 row.notes                   ?? undefined,
    rating:                row.rating as 1 | 2 | 3 | 4 | 5,
    createdAt:             row.created_at,
  };
}

function toRow(
  data: Omit<WeeklyReview, "id" | "createdAt">,
  userId: string
) {
  return {
    user_id:                  userId,
    portfolio_id:             data.portfolioId           ?? null,
    week_start:               data.weekStart,
    week_end:                 data.weekEnd,
    followed_plan:            data.followedPlan,
    followed_plan_notes:      data.followedPlanNotes     ?? null,
    repeated_mistake:         data.repeatedMistake       ?? null,
    repeated_mistake_notes:   data.repeatedMistakeNotes  ?? null,
    improvement_next_week:    data.improvementNextWeek   ?? null,
    notes:                    data.notes                 ?? null,
    rating:                   data.rating,
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getWeeklyReviews(): Promise<WeeklyReview[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weekly_reviews")
    .select("*")
    .order("week_start", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toReview);
}

export async function getWeeklyReviewByWeek(
  weekStart: string,
  portfolioId?: string
): Promise<WeeklyReview | null> {
  const supabase = createClient();
  let query = supabase
    .from("weekly_reviews")
    .select("*")
    .eq("week_start", weekStart);

  if (portfolioId && portfolioId !== "all") {
    query = query.eq("portfolio_id", portfolioId);
  } else {
    query = query.is("portfolio_id", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) return null;
  return data ? toReview(data) : null;
}

export async function createWeeklyReview(
  input: Omit<WeeklyReview, "id" | "createdAt">
): Promise<WeeklyReview> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("weekly_reviews")
    .insert(toRow(input, user.id))
    .select()
    .single();
  if (error) throw error;
  return toReview(data);
}

export async function updateWeeklyReview(
  id: string,
  input: Partial<Omit<WeeklyReview, "id" | "createdAt">>
): Promise<WeeklyReview> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (input.portfolioId          !== undefined) patch.portfolio_id           = input.portfolioId          ?? null;
  if (input.weekStart            !== undefined) patch.week_start             = input.weekStart;
  if (input.weekEnd              !== undefined) patch.week_end               = input.weekEnd;
  if (input.followedPlan         !== undefined) patch.followed_plan          = input.followedPlan;
  if (input.followedPlanNotes    !== undefined) patch.followed_plan_notes    = input.followedPlanNotes    ?? null;
  if (input.repeatedMistake      !== undefined) patch.repeated_mistake       = input.repeatedMistake      ?? null;
  if (input.repeatedMistakeNotes !== undefined) patch.repeated_mistake_notes = input.repeatedMistakeNotes ?? null;
  if (input.improvementNextWeek  !== undefined) patch.improvement_next_week  = input.improvementNextWeek  ?? null;
  if (input.notes                !== undefined) patch.notes                  = input.notes                ?? null;
  if (input.rating               !== undefined) patch.rating                 = input.rating;

  const { data, error } = await supabase
    .from("weekly_reviews")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toReview(data);
}

export async function deleteWeeklyReview(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("weekly_reviews").delete().eq("id", id);
  if (error) throw error;
}
