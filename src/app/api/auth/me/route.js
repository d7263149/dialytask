import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUserId } from "@/lib/getSessionUser";

export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return NextResponse.json({ user: null }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("app_users")
    .select("username")
    .eq("id", uid)
    .maybeSingle();

  return NextResponse.json({ user: data ? { username: data.username } : null });
}
