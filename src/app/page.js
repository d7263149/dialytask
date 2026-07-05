"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toDateKey, todayKey as getTodayKey, MONTH_NAMES } from "@/lib/dateUtils";
import { buildCompletionByDate, buildRangeChartData, averagePct, getRangeBounds } from "@/lib/progress";
import HabitChecklist from "@/components/HabitChecklist";
import ProgressBar from "@/components/ProgressBar";
import MonthCalendar from "@/components/MonthCalendar";
import CompletionChart from "@/components/CompletionChart";
import AddHabitForm from "@/components/AddHabitForm";
import DayDetailModal from "@/components/DayDetailModal";
import ProgressOverview from "@/components/ProgressOverview";
import NavBar from "@/components/NavBar";

function upsertLog(prev, habitId, logDate, done) {
  const exists = prev.some((r) => r.habit_id === habitId && r.log_date === logDate);
  if (exists) {
    return prev.map((r) =>
      r.habit_id === habitId && r.log_date === logDate ? { ...r, done } : r
    );
  }
  return [...prev, { habit_id: habitId, log_date: logDate, done }];
}

export default function Home() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const todayStr = getTodayKey();

  const [username, setUsername] = useState("");
  const [habits, setHabits] = useState([]);
  const [allHabits, setAllHabits] = useState([]); // active + deleted, for historical name/emoji lookups
  const [todayDone, setTodayDone] = useState({}); // habit_id -> bool
  const [monthLogs, setMonthLogs] = useState([]); // [{habit_id, log_date, done}]
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-11
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [progressRange, setProgressRange] = useState("week");
  const [progressLogs, setProgressLogs] = useState([]);
  const [progressLoading, setProgressLoading] = useState(true);

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

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

  const loadAllHabits = useCallback(async () => {
    const res = await fetch("/api/habits?all=1");
    const data = await res.json();
    if (res.ok) setAllHabits(data.habits || []);
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

  const loadMonthLogs = useCallback(async (year, monthIndex) => {
    const start = toDateKey(new Date(year, monthIndex, 1));
    const end = toDateKey(new Date(year, monthIndex + 1, 0));
    const res = await fetch(`/api/logs?start=${start}&end=${end}`);
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      return;
    }
    setMonthLogs(data.logs || []);
  }, []);

  const loadProgressLogs = useCallback(async (range) => {
    setProgressLoading(true);
    const { start, end } = getRangeBounds(range, today);
    const res = await fetch(`/api/logs?start=${toDateKey(start)}&end=${toDateKey(end)}`);
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      setProgressLoading(false);
      return;
    }
    setProgressLogs(data.logs || []);
    setProgressLoading(false);
  }, [today]);

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
      await loadAllHabits();
      await loadTodayLogs();
      await loadMonthLogs(viewYear, viewMonth);
      await loadProgressLogs(progressRange);
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMonthLogs(viewYear, viewMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth]);

  useEffect(() => {
    loadProgressLogs(progressRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressRange]);

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
      return;
    }
    if (isCurrentMonth) {
      setMonthLogs((prev) => upsertLog(prev, habitId, todayStr, newVal));
    }
    // Every progress range (week/month/3m/6m) is a rolling window ending
    // today, so today's toggle always belongs in it too.
    setProgressLogs((prev) => upsertLog(prev, habitId, todayStr, newVal));
  }

  async function handleAddHabit(name, emoji) {
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      return;
    }
    setHabits((prev) => [...prev, data.habit]);
    setTodayDone((prev) => ({ ...prev, [data.habit.id]: false }));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function goPrevMonth() {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function goNextMonth() {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  const todayTotal = habits.length;
  const todayDoneCount = habits.filter((h) => todayDone[h.id]).length;
  const todayPct = todayTotal > 0 ? (todayDoneCount / todayTotal) * 100 : 0;

  const completionByDate = useMemo(() => buildCompletionByDate(monthLogs), [monthLogs]);

  const chartData = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const arr = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const key = toDateKey(new Date(viewYear, viewMonth, day));
      const info = completionByDate[key];
      const pct = info && info.total > 0 ? Math.round((info.done / info.total) * 100) : 0;
      arr.push({ label: `${day}`, pct });
    }
    return arr;
  }, [completionByDate, viewYear, viewMonth]);

  const monthAvgPct = useMemo(() => averagePct(completionByDate), [completionByDate]);

  const habitsById = useMemo(() => {
    const map = {};
    allHabits.forEach((h) => {
      map[h.id] = h;
    });
    return map;
  }, [allHabits]);

  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    return monthLogs
      .filter((row) => row.log_date === selectedDate)
      .map((row) => {
        const habit = habitsById[row.habit_id];
        return {
          habit_id: row.habit_id,
          done: row.done,
          name: habit?.name || "Habit",
          emoji: habit?.emoji || "✅",
          sort_order: habit?.sort_order ?? 999,
        };
      })
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [selectedDate, monthLogs, habitsById]);

  const progressCompletionByDate = useMemo(
    () => buildCompletionByDate(progressLogs),
    [progressLogs]
  );

  const progressChartData = useMemo(
    () => buildRangeChartData(progressRange, progressCompletionByDate, today),
    [progressRange, progressCompletionByDate, today]
  );

  const progressAvgPct = useMemo(
    () => averagePct(progressCompletionByDate),
    [progressCompletionByDate]
  );

  const progressDaysLogged = Object.keys(progressCompletionByDate).length;

  const daysLogged = Object.keys(completionByDate).length;

  return (
    <div className="grain-bg min-h-full flex-1">
      <div className="max-w-5xl mx-auto px-5 py-10 md:py-14">
        <NavBar />
        <header className="mb-10 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-gold uppercase mb-2">
              Daily Register
            </p>
            <h1 className="font-display italic text-4xl md:text-5xl text-ink">
              KD Protek
            </h1>
            <p className="text-ink-muted text-sm mt-2 max-w-md">
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
            <div className="text-gold">{todayDoneCount}/{todayTotal} aaj tick hua</div>
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
            {/* Left: today's checklist */}
            <section className="md:col-span-2 flex flex-col gap-6">
              <div className="rounded-xl border border-line bg-surface p-5">
                <h2 className="font-display text-xl text-ink mb-4">Aaj — {MONTH_NAMES[today.getMonth()]} {today.getDate()}</h2>
                <div className="mb-5">
                  <ProgressBar value={todayPct} label="Today's progress" sublabel={`${todayDoneCount}/${todayTotal}`} />
                </div>
                <HabitChecklist habits={habits} doneMap={todayDone} onToggle={handleToggle} />
              </div>

              <div className="rounded-xl border border-line bg-surface p-5">
                <h3 className="font-display text-base text-ink mb-3">Nayi habit add karo</h3>
                <AddHabitForm onAdd={handleAddHabit} />
              </div>
            </section>

            {/* Right: calendar + chart */}
            <section className="md:col-span-3 flex flex-col gap-6">
              <div className="rounded-xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={goPrevMonth}
                    className="w-8 h-8 rounded-md border border-line hover:border-gold/50 text-ink-muted hover:text-gold flex items-center justify-center transition-colors"
                    aria-label="Previous month"
                  >
                    ‹
                  </button>
                  <h2 className="font-display text-xl text-ink">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </h2>
                  <button
                    onClick={goNextMonth}
                    className="w-8 h-8 rounded-md border border-line hover:border-gold/50 text-ink-muted hover:text-gold flex items-center justify-center transition-colors"
                    aria-label="Next month"
                  >
                    ›
                  </button>
                </div>
                <MonthCalendar
                  year={viewYear}
                  monthIndex={viewMonth}
                  completionByDate={completionByDate}
                  todayKeyStr={todayStr}
                  onDayClick={setSelectedDate}
                />
              </div>

              <div className="rounded-xl border border-line bg-surface p-5">
                <div className="mb-4">
                  <ProgressBar
                    value={monthAvgPct}
                    label="Month average"
                    sublabel={`${daysLogged} din logged`}
                  />
                </div>
                <h3 className="font-display text-base text-ink mb-2">Daily completion trend</h3>
                <CompletionChart data={chartData} />
              </div>

              <ProgressOverview
                range={progressRange}
                onRangeChange={setProgressRange}
                avgPct={progressAvgPct}
                chartData={progressChartData}
                daysLogged={progressDaysLogged}
                loading={progressLoading}
              />
            </section>
          </div>
        )}

        <DayDetailModal
          dateKey={selectedDate}
          entries={selectedDateEntries}
          onClose={() => setSelectedDate(null)}
        />

        <footer className="mt-14 text-center text-ink-muted text-xs font-mono">
          KD Protek · connected to Supabase · har din ka register apne aap ban jaata hai
        </footer>
      </div>
    </div>
  );
}
