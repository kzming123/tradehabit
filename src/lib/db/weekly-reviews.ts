import { createClient } from "@/lib/supabase/client";
import { WeeklyReview } from "@/types";

// ── Type mapping ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toReview(row: any): WeeklyReview {
  // weekEnd is always weekStart + 6 days. If the DB column is missing or null,
  // derive it locally so the UI never shows "Invalid Date".
  const weekEnd = row.week_end ?? deriveWeekEnd(row.week_start);
  return {
    id:                    row.id,
    portfolioId:           row.portfolio_id           ?? undefined,
    weekStart:             row.week_start,
    weekEnd:               weekEnd,
    followedPlan:          row.followed_plan,
    followedPlanNotes:     row.followed_plan_notes    ?? undefined,
    repeatedMistake:       row.repeated_mistake       ?? undefined,
    repeatedMistakeNotes:  row.repeated_mistake_notes ?? undefined,
    improvementNextWeek:   row.improvement_next_week  ?? undefined,
    notes:                 row.notes                  ?? undefined,
    rating:                row.rating as 1 | 2 | 3 | 4 | 5,
    createdAt:             row.created_at,
  };
}

function deriveWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + "T12:00:00");
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
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

// Translate raw Postgres / Supabase errors into user-friendly messages.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function friendlyError(err: any): Error {
  const raw = (err?.message ?? String(err ?? "")).toLowerCase();

  // Missing-column errors (user ran the old schema before week_end / repeated_mistake_notes were added)
  const colMatch = raw.match(/column .*['"]?(week_end|repeated_mistake_notes)['"]?/);
  if (colMatch || raw.includes("could not find the") && raw.includes("column")) {
    return new Error(
      "Your database is missing a column. Run the migration block at the bottom of supabase/schema.sql, then try again."
    );
  }
  if (raw.includes("duplicate key") || raw.includes("unique constraint")) {
    return new Error("A review already exists for this week and portfolio.");
  }
  if (raw.includes("violates foreign key")) {
    return new Error("The selected portfolio no longer exists.");
  }
  if (raw.includes("row-level security") || raw.includes("permission denied")) {
    return new Error("Permission denied. Please sign out and back in.");
  }
  return new Error(err?.message || "Failed to save review");
}

// Insert with a defensive retry: if the DB rejects the optional columns,
// strip them and try once more so older schemas still work.
async function insertRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weekly_reviews")
    .insert(row)
    .select()
    .single();

  if (!error) return data;

  // Retry without optional columns if the DB doesn't have them
  const raw = error.message.toLowerCase();
  if (raw.includes("week_end") || raw.includes("repeated_mistake_notes")) {
    const { week_end, repeated_mistake_notes, ...trimmed } = row;
    void week_end; void repeated_mistake_notes;
    const retry = await supabase
      .from("weekly_reviews")
      .insert(trimmed)
      .select()
      .single();
    if (!retry.error) return retry.data;
    throw friendlyError(retry.error);
  }
  throw friendlyError(error);
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getWeeklyReviews(): Promise<WeeklyReview[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weekly_reviews")
    .select("*")
    .order("week_start", { ascending: false });
  if (error) throw friendlyError(error);
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
  if (!user) throw new Error("Not authenticated. Please sign in again.");

  const data = await insertRow(toRow(input, user.id));
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

  if (error) {
    // Retry without optional columns if the DB rejects them
    const raw = error.message.toLowerCase();
    if (raw.includes("week_end") || raw.includes("repeated_mistake_notes")) {
      const { week_end, repeated_mistake_notes, ...trimmed } = patch;
      void week_end; void repeated_mistake_notes;
      const retry = await supabase
        .from("weekly_reviews")
        .update(trimmed)
        .eq("id", id)
        .select()
        .single();
      if (!retry.error) return toReview(retry.data);
      throw friendlyError(retry.error);
    }
    throw friendlyError(error);
  }
  return toReview(data);
}

export async function deleteWeeklyReview(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("weekly_reviews").delete().eq("id", id);
  if (error) throw friendlyError(error);
}
