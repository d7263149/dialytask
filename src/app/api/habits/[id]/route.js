import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const { name, emoji, time_from, time_to, sort_order } = await request.json();

  const updates = {};
  if (name !== undefined) {
    if (!name.trim()) {
      return NextResponse.json({ error: "Habit name zaroori hai." }, { status: 400 });
    }
    updates.name = name.trim();
    updates.emoji = (emoji || "✅").trim() || "✅";
    updates.time_from = time_from || null;
    updates.time_to = time_to || null;
  }
  if (sort_order !== undefined) {
    updates.sort_order = sort_order;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Kuch update karne ko nahi mila." }, { status: 400 });
  }

  const { data: habit, error } = await supabaseAdmin
    .from("habits")
    .update(updates)
    .eq("id", id)
    .eq("user_id", uid)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!habit) return NextResponse.json({ error: "Habit nahi mila." }, { status: 404 });

  return NextResponse.json({ habit });
}

// Soft delete: sets active=false instead of removing the row, so past
// logs (which reference this habit_id) are untouched — the calendar,
// charts and progress overview keep showing that history. Only future
// days stop getting a log row for it (see /api/ensure-today, which only
// creates rows for active habits).
export async function DELETE(request, { params }) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;

  const { data: habit, error } = await supabaseAdmin
    .from("habits")
    .update({ active: false })
    .eq("id", id)
    .eq("user_id", uid)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!habit) return NextResponse.json({ error: "Habit nahi mila." }, { status: 404 });

  return NextResponse.json({ ok: true });
}
