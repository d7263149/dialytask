import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";
import { todayKey } from "@/lib/dateUtils";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { habitId, done, date } = await request.json();

  const { data: habit } = await supabaseAdmin
    .from("habits")
    .select("id")
    .eq("id", habitId)
    .eq("user_id", uid)
    .maybeSingle();

  if (!habit) return NextResponse.json({ error: "Habit nahi mila." }, { status: 404 });

  // The caller's own local date, not the server's — the server (e.g. Vercel,
  // usually UTC) can be on a different calendar day than the user's browser
  // for several hours around midnight, which would toggle the wrong row.
  const logDate = date || todayKey();

  const { error } = await supabaseAdmin
    .from("logs")
    .update({ done: !!done })
    .eq("habit_id", habitId)
    .eq("log_date", logDate);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
