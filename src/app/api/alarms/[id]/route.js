import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";

export async function PATCH(request, { params }) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const { enabled } = await request.json();
  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "enabled boolean hona chahiye." }, { status: 400 });
  }

  const { data: alarm, error } = await supabaseAdmin
    .from("alarms")
    .update({ enabled })
    .eq("id", id)
    .eq("user_id", uid)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!alarm) return NextResponse.json({ error: "Alarm nahi mila." }, { status: 404 });

  return NextResponse.json({ alarm });
}

export async function DELETE(request, { params }) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;

  const { data: alarm, error } = await supabaseAdmin
    .from("alarms")
    .delete()
    .eq("id", id)
    .eq("user_id", uid)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!alarm) return NextResponse.json({ error: "Alarm nahi mila." }, { status: 404 });

  return NextResponse.json({ ok: true });
}
