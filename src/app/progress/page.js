"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { toDateKey, todayKey as getTodayKey, MONTH_NAMES } from "@/lib/dateUtils";
import { buildCompletionByDate, buildRangeChartData, averagePct, getRangeBounds } from "@/lib/progress";
import ProgressBar from "@/components/ProgressBar";
import MonthCalendar from "@/components/MonthCalendar";
import CompletionChart from "@/components/CompletionChart";
import DayDetailModal from "@/components/DayDetailModal";
import ProgressOverview from "@/components/ProgressOverview";
import NavBar from "@/components/NavBar";

export default function ProgressPage() {
  const today = useMemo(() => new Date(), []);
  const todayStr = getTodayKey();

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

  const loadHabits = useCallback(async () => {
    const res = await fetch("/api/habits");
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      return;
    }
    setHabits(data.habits || []);
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
        <header className="mb-10">
          <p className="font-mono text-xs tracking-[0.2em] text-gold uppercase mb-2">
            Har Mahine Ka Hisaab
          </p>
          <h1 className="font-display italic text-4xl md:text-5xl text-ink">Progress</h1>
          <p className="text-ink-muted text-sm mt-2 max-w-md">
            Kisi bhi month ka calendar, trend aur overview — sab yahan.
          </p>
        </header>

        {errorMsg && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-red-800/50 bg-red-950/30 text-red-300 text-sm font-mono">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <p className="text-ink-muted font-mono text-sm">Loading progress…</p>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-line bg-surface p-5">
              <ProgressBar value={todayPct} label="Today's progress" sublabel={`${todayDoneCount}/${todayTotal}`} />
            </div>

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
