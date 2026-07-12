import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";
import { toDateKey } from "@/lib/dateUtils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const uid = await getSessionUserId();
    if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    // The caller's own local date, not the server's — the server (e.g.
    // Vercel, usually UTC) can be on a different calendar day than the
    // user's browser for several hours around midnight, which would create
    // "today"'s row under the wrong date and break the toggle above.
    let clientDate = null;
    try {
      const body = await request.json();
      clientDate = body?.date || null;
    } catch {
      // no JSON body sent — fall back to server date
    }
    const todayKey = clientDate || toDateKey(new Date());

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
