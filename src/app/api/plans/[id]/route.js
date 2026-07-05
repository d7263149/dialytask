import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";
import { enumerateDateKeys } from "@/lib/dateUtils";

const MAX_RANGE_DAYS = 366;

export async function PATCH(request, { params }) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const { name, emoji, startDate, endDate } = await request.json();

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("plans")
    .select("*")
    .eq("id", id)
    .eq("user_id", uid)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Plan nahi mila." }, { status: 404 });

  const nextName = name?.trim() || existing.name;
  const nextEmoji = emoji?.trim() || existing.emoji;
  const nextStart = startDate || existing.start_date;
  const nextEnd = endDate || existing.end_date;

  if (nextEnd < nextStart) {
    return NextResponse.json(
      { error: "Start date, end date se pehle ya barabar honi chahiye." },
      { status: 400 }
    );
  }

  const dateRangeChanged = nextStart !== existing.start_date || nextEnd !== existing.end_date;

  if (dateRangeChanged) {
    const dateKeys = enumerateDateKeys(nextStart, nextEnd);
    if (dateKeys.length > MAX_RANGE_DAYS) {
      return NextResponse.json(
        { error: `Ek plan zyada se zyada ${MAX_RANGE_DAYS} din ka ho sakta hai.` },
        { status: 400 }
      );
    }

    // Drop days that fall outside the new range, keep done-status for the
    // overlapping days, and add rows for any newly-covered days.
    const { error: trimError } = await supabaseAdmin
      .from("plan_logs")
      .delete()
      .eq("plan_id", id)
      .or(`log_date.lt.${nextStart},log_date.gt.${nextEnd}`);
    if (trimError) return NextResponse.json({ error: trimError.message }, { status: 500 });

    const { error: upsertError } = await supabaseAdmin.from("plan_logs").upsert(
      dateKeys.map((logDate) => ({
        user_id: uid,
        plan_id: id,
        log_date: logDate,
        done: false,
      })),
      { onConflict: "plan_id,log_date", ignoreDuplicates: true }
    );
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const { data: plan, error: updateError } = await supabaseAdmin
    .from("plans")
    .update({ name: nextName, emoji: nextEmoji, start_date: nextStart, end_date: nextEnd })
    .eq("id", id)
    .eq("user_id", uid)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ plan });
}

export async function DELETE(request, { params }) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("plans")
    .delete()
    .eq("id", id)
    .eq("user_id", uid)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Plan nahi mila." }, { status: 404 });

  return NextResponse.json({ ok: true });
}
