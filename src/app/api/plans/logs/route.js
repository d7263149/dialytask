import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";

// GET /api/plans/logs                          -> every plan log the user has
// GET /api/plans/logs?date=YYYY-MM-DD           -> a single day's plan logs
// GET /api/plans/logs?start=YYYY-MM-DD&end=...  -> a date range's plan logs
//
// Plans (unlike habits) have a fixed start/end date, so "all logs" is a
// naturally bounded, small dataset — simplest to fetch once and derive the
// calendar heatmap, today's checklist and per-plan progress from it client-side.
export async function GET(request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  let query = supabaseAdmin
    .from("plan_logs")
    .select("plan_id, log_date, done, plans!inner(user_id, name, emoji)")
    .eq("plans.user_id", uid);

  if (date) query = query.eq("log_date", date);
  else if (start && end) query = query.gte("log_date", start).lte("log_date", end);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const logs = (data || []).map((row) => ({
    plan_id: row.plan_id,
    log_date: row.log_date,
    done: row.done,
    name: row.plans.name,
    emoji: row.plans.emoji,
  }));
  return NextResponse.json({ logs });
}
