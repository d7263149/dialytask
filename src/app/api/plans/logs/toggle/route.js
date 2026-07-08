import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { planId, date, done } = await request.json();
  if (!planId || !date) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", uid)
    .maybeSingle();

  if (!plan) return NextResponse.json({ error: "Plan nahi mila." }, { status: 404 });

  const { error } = await supabaseAdmin
    .from("plan_logs")
    .update({ done: !!done })
    .eq("plan_id", planId)
    .eq("log_date", date);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
