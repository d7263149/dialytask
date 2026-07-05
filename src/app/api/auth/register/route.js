import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidUserId, normalizeUserId, USER_ID_HELP_TEXT } from "@/lib/userId";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/session";

const STARTER_HABITS = [
  { name: "Breakfast", emoji: "🍳", sort_order: 1 },
  { name: "Lunch", emoji: "🍽️", sort_order: 2 },
  { name: "Dinner", emoji: "🍲", sort_order: 3 },
  { name: "Walk", emoji: "🚶", sort_order: 4 },
  { name: "Study", emoji: "📚", sort_order: 5 },
];

export async function POST(request) {
  const { userId, password } = await request.json();

  if (!isValidUserId(userId)) {
    return NextResponse.json(
      { error: `User id sahi format me nahi hai. ${USER_ID_HELP_TEXT}` },
      { status: 400 }
    );
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "Password kam se kam 6 characters ka hona chahiye." },
      { status: 400 }
    );
  }

  const username = normalizeUserId(userId);
  const passwordHash = await bcrypt.hash(password, 10);

  const { data: user, error: insertError } = await supabaseAdmin
    .from("app_users")
    .insert({ username, password_hash: passwordHash })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "Yeh user id already liya gaya hai." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabaseAdmin
    .from("habits")
    .insert(STARTER_HABITS.map((h) => ({ ...h, user_id: user.id, active: true })));

  const token = await createSessionToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

  return NextResponse.json({ ok: true, username });
}
