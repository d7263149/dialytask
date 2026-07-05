import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";
import { todayKey } from "@/lib/dateUtils";

export async function GET(request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const includeInactive = new URL(request.url).searchParams.get("all") === "1";

  let query = supabaseAdmin
    .from("habits")
    .select("*")
    .eq("user_id", uid)
    .order("sort_order", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ habits: data || [] });
}

export async function POST(request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { name, emoji } = await request.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Habit name zaroori hai." }, { status: 400 });
  }

  const { count } = await supabaseAdmin
    .from("habits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", uid);

  const { data: habit, error } = await supabaseAdmin
    .from("habits")
    .insert({
      user_id: uid,
      name: name.trim(),
      emoji: (emoji || "✅").trim() || "✅",
      sort_order: count || 0,
      active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin
    .from("logs")
    .insert({ habit_id: habit.id, log_date: todayKey(), done: false });

  return NextResponse.json({ habit });
}
