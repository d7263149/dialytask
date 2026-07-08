"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { todayKey as getTodayKey, MONTH_NAMES, FULL_WEEKDAY_LABELS } from "@/lib/dateUtils";
import HabitChecklist from "@/components/HabitChecklist";
import CircularProgress from "@/components/CircularProgress";
import NavBar from "@/components/NavBar";

export default function Home() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const todayStr = getTodayKey();

  const [username, setUsername] = useState("");
  const [habits, setHabits] = useState([]);
  const [todayDone, setTodayDone] = useState({}); // habit_id -> bool
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadHabits = useCallback(async () => {
    const res = await fetch("/api/habits");
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      return [];
    }
    setHabits(data.habits || []);
    return data.habits || [];
  }, []);

  const loadTodayLogs = useCallback(async () => {
    const res = await fetch(`/api/logs?date=${todayStr}`);
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      return;
    }
    const map = {};
    (data.logs || []).forEach((row) => {
      map[row.habit_id] = row.done;
    });
    setTodayDone(map);
  }, [todayStr]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const meRes = await fetch("/api/auth/me");
      const me = await meRes.json();
      setUsername(me.user?.username || "");
      try {
        await fetch("/api/ensure-today", { method: "POST" });
      } catch {
        // network hiccup is fine, we still try to load what exists
      }
      await loadHabits();
      await loadTodayLogs();
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggle(habitId, newVal) {
    setTodayDone((prev) => ({ ...prev, [habitId]: newVal }));
    const res = await fetch("/api/logs/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, done: newVal }),
    });
    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.error);
      setTodayDone((prev) => ({ ...prev, [habitId]: !newVal }));
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const todayTotal = habits.length;
  const todayDoneCount = habits.filter((h) => todayDone[h.id]).length;
  const todayPct = todayTotal > 0 ? (todayDoneCount / todayTotal) * 100 : 0;

  return (
    <div className="grain-bg min-h-full flex-1">
      <div className="max-w-5xl mx-auto px-5 py-10 md:py-14">
        <NavBar />

        <header className="mb-10 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-gold uppercase mb-3">
              Daily Register
            </p>
            <h1 className="font-display italic text-5xl md:text-6xl text-ink tracking-tight">
              KD Protek
            </h1>
            <div className="mt-3 h-px w-24 bg-gradient-to-r from-gold to-transparent" />
            <p className="text-ink-muted text-sm mt-4 max-w-md font-body">
              Roz ki routine ka register — sattu, gym, study, sab kuch ek jagah trace karo.
            </p>
          </div>
          <div className="font-mono text-sm text-ink-muted text-right">
            {username && (
              <div className="mb-1 flex items-center justify-end gap-2">
                <span>Hi, {username}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-ink-muted hover:text-gold underline underline-offset-2 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
            <div>{todayStr}</div>
          </div>
        </header>

        {errorMsg && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-red-800/50 bg-red-950/30 text-red-300 text-sm font-mono">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <p className="text-ink-muted font-mono text-sm">Loading register…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <section className="md:col-span-3">
              <div className="rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
                <div className="flex items-baseline justify-between mb-1">
                  <h2 className="font-display italic text-2xl text-ink">
                    Aaj — {MONTH_NAMES[today.getMonth()]} {today.getDate()}
                  </h2>
                  <span className="font-mono text-xs text-ink-muted">
                    {todayDoneCount}/{todayTotal}
                  </span>
                </div>
                <div className="mb-6 h-px w-full bg-line" />
                <HabitChecklist habits={habits} doneMap={todayDone} onToggle={handleToggle} />
              </div>
            </section>

            <section className="md:col-span-2">
              <div className="rounded-2xl border border-line bg-gradient-to-b from-surface to-surface-2 p-6 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.25)] flex flex-col items-center text-center h-full">
                <p className="font-mono text-xs tracking-[0.3em] text-gold uppercase mb-1">
                  {FULL_WEEKDAY_LABELS[today.getDay()]}
                </p>
                <h3 className="font-display italic text-xl text-ink mb-6">
                  Aaj ka Snapshot
                </h3>

                <CircularProgress value={todayPct} />

                <p className="font-mono text-xs text-ink-muted mt-5">
                  {todayDoneCount} of {todayTotal} habits done
                </p>

                <div className="mt-6 w-full h-px bg-line" />

                <p className="font-display italic text-ink-muted text-sm mt-6 mb-6 max-w-xs">
                  &ldquo;Chhoti aadatein, bada asar — roz ka register hi tumhari kahani likhta hai.&rdquo;
                </p>

                <Link
                  href="/progress"
                  className="mt-auto text-xs font-mono text-gold hover:text-gold-bright underline underline-offset-4 transition-colors"
                >
                  Poora progress dekho →
                </Link>
              </div>
            </section>
          </div>
        )}

        <footer className="mt-14 pt-6 border-t border-line text-center text-ink-muted text-xs font-mono">
          KD Protek · connected to Supabase · har din ka register apne aap ban jaata hai
        </footer>
      </div>
    </div>
  );
}
