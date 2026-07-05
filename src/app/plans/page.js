"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { todayKey as getTodayKey, MONTH_NAMES } from "@/lib/dateUtils";
import { buildCompletionByDate } from "@/lib/progress";
import NavBar from "@/components/NavBar";
import MonthCalendar from "@/components/MonthCalendar";
import HabitChecklist from "@/components/HabitChecklist";
import ProgressBar from "@/components/ProgressBar";
import PlanForm from "@/components/PlanForm";
import PlanDayDetailModal from "@/components/PlanDayDetailModal";

export default function PlansPage() {
  const today = useMemo(() => new Date(), []);
  const todayStr = getTodayKey();

  const [plans, setPlans] = useState([]);
  const [allLogs, setAllLogs] = useState([]); // [{plan_id, log_date, done, name, emoji}]
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const loadPlans = useCallback(async () => {
    const res = await fetch("/api/plans");
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      return;
    }
    setPlans(data.plans || []);
  }, []);

  const loadAllLogs = useCallback(async () => {
    const res = await fetch("/api/plans/logs");
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      return;
    }
    setAllLogs(data.logs || []);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadPlans(), loadAllLogs()]);
      setLoading(false);
    }
    init();
  }, [loadPlans, loadAllLogs]);

  async function togglePlanLog(planId, date, newVal) {
    setAllLogs((prev) => {
      const exists = prev.some((l) => l.plan_id === planId && l.log_date === date);
      if (exists) {
        return prev.map((l) =>
          l.plan_id === planId && l.log_date === date ? { ...l, done: newVal } : l
        );
      }
      return prev;
    });

    const res = await fetch("/api/plans/logs/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, date, done: newVal }),
    });
    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.error);
      setAllLogs((prev) =>
        prev.map((l) =>
          l.plan_id === planId && l.log_date === date ? { ...l, done: !newVal } : l
        )
      );
    }
  }

  async function handleCreatePlan({ name, emoji, startDate, endDate }) {
    setErrorMsg("");
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji, startDate, endDate }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      return;
    }
    setShowCreateForm(false);
    await Promise.all([loadPlans(), loadAllLogs()]);
  }

  async function handleEditPlan(planId, { name, emoji, startDate, endDate }) {
    setErrorMsg("");
    const res = await fetch(`/api/plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji, startDate, endDate }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      return;
    }
    setEditingPlanId(null);
    await Promise.all([loadPlans(), loadAllLogs()]);
  }

  async function handleDeletePlan(plan) {
    const confirmed = window.confirm(`"${plan.name}" plan delete karo? Iska poora record mit jayega.`);
    if (!confirmed) return;

    const res = await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      return;
    }
    setPlans((prev) => prev.filter((p) => p.id !== plan.id));
    setAllLogs((prev) => prev.filter((l) => l.plan_id !== plan.id));
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

  const completionByDate = useMemo(() => buildCompletionByDate(allLogs), [allLogs]);

  const activePlansToday = useMemo(
    () => plans.filter((p) => p.start_date <= todayStr && p.end_date >= todayStr),
    [plans, todayStr]
  );

  const todayDoneMap = useMemo(() => {
    const map = {};
    allLogs
      .filter((l) => l.log_date === todayStr)
      .forEach((l) => {
        map[l.plan_id] = l.done;
      });
    return map;
  }, [allLogs, todayStr]);

  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    return allLogs
      .filter((l) => l.log_date === selectedDate)
      .map((l) => ({ plan_id: l.plan_id, name: l.name, emoji: l.emoji, done: l.done }));
  }, [selectedDate, allLogs]);

  const logsByPlan = useMemo(() => {
    const map = {};
    allLogs.forEach((l) => {
      if (!map[l.plan_id]) map[l.plan_id] = { done: 0, total: 0 };
      map[l.plan_id].total += 1;
      if (l.done) map[l.plan_id].done += 1;
    });
    return map;
  }, [allLogs]);

  return (
    <div className="grain-bg min-h-full flex-1">
      <div className="max-w-5xl mx-auto px-5 py-10 md:py-14">
        <NavBar />

        <header className="mb-8">
          <p className="font-mono text-xs tracking-[0.2em] text-gold uppercase mb-2">
            Study / Task Plans
          </p>
          <h1 className="font-display italic text-4xl md:text-5xl text-ink">Plans</h1>
          <p className="text-ink-muted text-sm mt-2 max-w-md">
            Koi bhi kaam (jaise Math, Science, Bio) ek date range ke liye plan karo —
            15 din ho ya poora mahina, roz apne aap checklist me aayega jab tak plan
            chalta rahega.
          </p>
        </header>

        {errorMsg && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-red-800/50 bg-red-950/30 text-red-300 text-sm font-mono">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <p className="text-ink-muted font-mono text-sm">Loading plans…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <section className="md:col-span-2 flex flex-col gap-6">
              <div className="rounded-xl border border-line bg-surface p-5">
                <h2 className="font-display text-xl text-ink mb-4">Aaj ke plan tasks</h2>
                {activePlansToday.length === 0 ? (
                  <p className="text-ink-muted text-sm font-mono">
                    {plans.length === 0
                      ? "Koi plan nahi hai — neeche se ek naya plan banao."
                      : "Aaj ke liye koi active plan nahi hai."}
                  </p>
                ) : (
                  <HabitChecklist
                    habits={activePlansToday}
                    doneMap={todayDoneMap}
                    onToggle={(planId, newVal) => togglePlanLog(planId, todayStr, newVal)}
                  />
                )}
              </div>

              <div className="rounded-xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base text-ink">Sab plans</h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm((v) => !v)}
                    className="px-3 py-1.5 rounded-md border border-line text-ink-muted hover:text-gold hover:border-gold/50 text-xs font-mono transition-colors cursor-pointer"
                  >
                    {showCreateForm ? "Cancel" : "+ New Plan"}
                  </button>
                </div>

                {showCreateForm && (
                  <div className="mb-4 pb-4 border-b border-line">
                    <PlanForm submitLabel="Create" onSubmit={handleCreatePlan} />
                  </div>
                )}

                {plans.length === 0 ? (
                  <p className="text-ink-muted text-sm font-mono">
                    Koi plan nahi hai — &quot;+ New Plan&quot; se shuru karo.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {plans.map((plan) => {
                      const progress = logsByPlan[plan.id] || { done: 0, total: 0 };
                      const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
                      return (
                        <li key={plan.id} className="rounded-lg border border-line bg-surface-2 p-3">
                          {editingPlanId === plan.id ? (
                            <PlanForm
                              initial={plan}
                              submitLabel="Save"
                              onSubmit={(vals) => handleEditPlan(plan.id, vals)}
                              onCancel={() => setEditingPlanId(null)}
                            />
                          ) : (
                            <>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg leading-none">{plan.emoji}</span>
                                <span className="flex-1 text-sm text-ink">{plan.name}</span>
                                <button
                                  type="button"
                                  onClick={() => setEditingPlanId(plan.id)}
                                  className="px-2.5 py-1 rounded-md border border-line text-ink-muted hover:text-gold hover:border-gold/50 text-xs font-mono transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePlan(plan)}
                                  className="px-2.5 py-1 rounded-md border border-red-800/50 text-red-300 hover:bg-red-950/30 text-xs font-mono transition-colors cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                              <p className="text-xs font-mono text-ink-muted mb-2">
                                {plan.start_date} → {plan.end_date}
                              </p>
                              <ProgressBar value={pct} sublabel={`${progress.done}/${progress.total} din`} />
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>

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
            </section>
          </div>
        )}

        <PlanDayDetailModal
          dateKey={selectedDate}
          entries={selectedDateEntries}
          onToggle={(planId, newVal) => togglePlanLog(planId, selectedDate, newVal)}
          onClose={() => setSelectedDate(null)}
        />

        <footer className="mt-14 text-center text-ink-muted text-xs font-mono">
          KD Protek · connected to Supabase · har din ka register apne aap ban jaata hai
        </footer>
      </div>
    </div>
  );
}
