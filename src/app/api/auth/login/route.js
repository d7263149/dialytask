import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeUserId } from "@/lib/userId";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/session";

const GENERIC_ERROR = "Galat user id ya password.";

export async function POST(request) {
  const { userId, password } = await request.json();

  if (typeof userId !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const username = normalizeUserId(userId);

  const { data: user, error } = await supabaseAdmin
    .from("app_users")
    .select("id, username, password_hash")
    .eq("username", username)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const token = await createSessionToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

  return NextResponse.json({ ok: true, username: user.username });
}
