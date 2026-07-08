import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";

export const dynamic = "force-dynamic";

// GET /api/logs?date=YYYY-MM-DD           -> a single day's logs
// GET /api/logs?start=YYYY-MM-DD&end=...  -> a date range's logs
export async function GET(request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  let query = supabaseAdmin
    .from("logs")
    .select("habit_id, log_date, done, habits!inner(user_id)")
    .eq("habits.user_id", uid);

  query = date ? query.eq("log_date", date) : query.gte("log_date", start).lte("log_date", end);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const logs = (data || []).map(({ habit_id, log_date, done }) => ({ habit_id, log_date, done }));
  return NextResponse.json({ logs });
}
