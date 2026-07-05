import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";
import { toDateKey } from "@/lib/dateUtils";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const uid = await getSessionUserId();
    if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const todayKey = toDateKey(new Date());

    const { data: habits, error: habitsError } = await supabaseAdmin
      .from("habits")
      .select("id")
      .eq("user_id", uid)
      .eq("active", true);

    if (habitsError) throw habitsError;
    if (!habits || habits.length === 0) {
      return NextResponse.json({ ok: true, created: 0 });
    }

    const rows = habits.map((h) => ({
      habit_id: h.id,
      log_date: todayKey,
      done: false,
    }));

    // ignoreDuplicates so days that already have a row are left untouched
    const { error: upsertError } = await supabaseAdmin
      .from("logs")
      .upsert(rows, { onConflict: "habit_id,log_date", ignoreDuplicates: true });

    if (upsertError) throw upsertError;

    return NextResponse.json({ ok: true, created: rows.length, date: todayKey });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
