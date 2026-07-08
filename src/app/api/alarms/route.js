import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("alarms")
    .select("*")
    .eq("user_id", uid)
    .order("time", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alarms: data || [] });
}

export async function POST(request) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { time, label } = await request.json();
  if (typeof time !== "string" || !TIME_RE.test(time)) {
    return NextResponse.json({ error: "Time HH:MM format me hona chahiye." }, { status: 400 });
  }

  const { data: alarm, error } = await supabaseAdmin
    .from("alarms")
    .insert({
      user_id: uid,
      time,
      label: (label || "").trim(),
      enabled: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alarm });
}
