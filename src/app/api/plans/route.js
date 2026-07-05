import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";
import { enumerateDateKeys } from "@/lib/dateUtils";

const MAX_RANGE_DAYS = 366;

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("plans")
    .select("*")
    .eq("user_id", uid)
    .order("start_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ plans: data || [] });
}

export async function POST(request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { name, emoji, startDate, endDate } = await request.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Plan ka naam zaroori hai." }, { status: 400 });
  }
  if (!startDate || !endDate || endDate < startDate) {
    return NextResponse.json(
      { error: "Start date, end date se pehle ya barabar honi chahiye." },
      { status: 400 }
    );
  }

  const dateKeys = enumerateDateKeys(startDate, endDate);
  if (dateKeys.length > MAX_RANGE_DAYS) {
    return NextResponse.json(
      { error: `Ek plan zyada se zyada ${MAX_RANGE_DAYS} din ka ho sakta hai.` },
      { status: 400 }
    );
  }

  const { data: plan, error: planError } = await supabaseAdmin
    .from("plans")
    .insert({
      user_id: uid,
      name: name.trim(),
      emoji: (emoji || "📘").trim() || "📘",
      start_date: startDate,
      end_date: endDate,
    })
    .select()
    .single();

  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 });

  const { error: logsError } = await supabaseAdmin.from("plan_logs").insert(
    dateKeys.map((logDate) => ({
      user_id: uid,
      plan_id: plan.id,
      log_date: logDate,
      done: false,
    }))
  );
  if (logsError) return NextResponse.json({ error: logsError.message }, { status: 500 });

  return NextResponse.json({ plan });
}
