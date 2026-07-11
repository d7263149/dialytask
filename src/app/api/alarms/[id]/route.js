import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";

export const dynamic = "force-dynamic";

const VALID_SOUNDS = ["classic", "chime", "digital", "bell"];

export async function PATCH(request, { params }) {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const { enabled, sound } = await request.json();

  const updates = {};
  if (enabled !== undefined) {
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled boolean hona chahiye." }, { status: 400 });
    }
    updates.enabled = enabled;
  }
  if (sound !== undefined) {
    if (!VALID_SOUNDS.includes(sound)) {
      return NextResponse.json({ error: "Invalid sound." }, { status: 400 });
    }
    updates.sound = sound;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Kuch update karne ko nahi mila." }, { status: 400 });
  }

  const { data: alarm, error } = await supabaseAdmin
    .from("alarms")
    .update(updates)
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
