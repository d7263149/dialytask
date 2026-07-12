"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import AddHabitForm from "@/components/AddHabitForm";
import EmojiPickerButton from "@/components/EmojiPickerButton";
import { formatTime12, todayKey } from "@/lib/dateUtils";

const AUTO_ARRANGE_KEY = "kd_auto_arrange_habits";

// Habits with a from-time sort earliest-first; habits with no time sort to
// the end, keeping their existing relative order (stable sort).
function sortByTime(list) {
  return [...list].sort((a, b) => {
    if (a.time_from && b.time_from) return a.time_from.localeCompare(b.time_from);
    if (a.time_from && !b.time_from) return -1;
    if (!a.time_from && b.time_from) return 1;
    return 0;
  });
}

export default function SettingsPage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("✅");
  const [editTimeFrom, setEditTimeFrom] = useState("");
  const [editTimeTo, setEditTimeTo] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [autoArrange, setAutoArrange] = useState(false);

  useEffect(() => {
    setAutoArrange(localStorage.getItem(AUTO_ARRANGE_KEY) === "1");
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const res = await fetch("/api/habits");
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error);
        setLoading(false);
        return;
      }
      setHabits(data.habits || []);
      setLoading(false);
    }
    init();
  }, []);

  // Persists whatever order `list` is currently in as each habit's sort_order
  // (only PATCHes the ones that actually moved). Returns the list with
  // sort_order values brought in sync, ready to setHabits().
  async function persistOrder(list) {
    setErrorMsg("");
    setSavingOrder(true);

    const changed = list.map((h, i) => ({ h, i })).filter(({ h, i }) => h.sort_order !== i);
    if (changed.length === 0) {
      setSavingOrder(false);
      return list;
    }

    const results = await Promise.all(
      changed.map(({ h, i }) =>
        fetch(`/api/habits/${h.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: i }),
        }).then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      )
    );
    const failed = results.find((r) => !r.ok);
    setSavingOrder(false);
    if (failed) {
      setErrorMsg(failed.data.error);
      return list;
    }
    return list.map((h, i) => ({ ...h, sort_order: i }));
  }

  async function handleAutoArrangeToggle(next) {
    setAutoArrange(next);
    localStorage.setItem(AUTO_ARRANGE_KEY, next ? "1" : "0");
    if (next) {
      setHabits(await persistOrder(sortByTime(habits)));
    }
  }

  async function handleAddHabit(name, emoji, timeFrom, timeTo) {
    setErrorMsg("");
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        emoji,
        time_from: timeFrom || null,
        time_to: timeTo || null,
        date: todayKey(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      return;
    }
    let next = [...habits, data.habit];
    if (autoArrange) next = await persistOrder(sortByTime(next));
    setHabits(next);
  }

  function startEdit(habit) {
    setEditingId(habit.id);
    setEditName(habit.name);
    setEditEmoji(habit.emoji);
    setEditTimeFrom(habit.time_from || "");
    setEditTimeTo(habit.time_to || "");
    setErrorMsg("");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(habit) {
    if (!editName.trim()) return;
    setSavingEdit(true);
    setErrorMsg("");
    const res = await fetch(`/api/habits/${habit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        emoji: editEmoji.trim() || "✅",
        time_from: editTimeFrom || null,
        time_to: editTimeTo || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      setSavingEdit(false);
      return;
    }
    let next = habits.map((h) => (h.id === habit.id ? data.habit : h));
    if (autoArrange) next = await persistOrder(sortByTime(next));
    setHabits(next);
    setSavingEdit(false);
    setEditingId(null);
  }

  function handleDragStart(index) {
    if (autoArrange) return;
    setDragIndex(index);
  }

  function handleDragOver(e, index) {
    if (autoArrange) return;
    e.preventDefault();
    setDragOverIndex(index);
    if (dragIndex === null || dragIndex === index) return;
    setHabits((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  }

  async function handleDrop() {
    if (autoArrange) return;
    setDragIndex(null);
    setDragOverIndex(null);
    setHabits(await persistOrder(habits));
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  async function handleDelete(habit) {
    const confirmed = window.confirm(
      `"${habit.name}" ko delete karo? Aaj se aage yeh checklist me nahi dikhega, lekin pichle dino ka saved data (calendar, chart, progress) waisa hi rahega.`
    );
    if (!confirmed) return;

    setDeletingId(habit.id);
    setErrorMsg("");
    const res = await fetch(`/api/habits/${habit.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      setDeletingId(null);
      return;
    }
    setHabits((prev) => prev.filter((h) => h.id !== habit.id));
    setDeletingId(null);
  }

  return (
    <div className="grain-bg min-h-full flex-1">
      <div className="max-w-5xl mx-auto px-5 py-10 md:py-14">
        <NavBar />

        <header className="mb-8">
          <p className="font-mono text-xs tracking-[0.2em] text-gold uppercase mb-2">
            Manage
          </p>
          <h1 className="font-display italic text-4xl md:text-5xl text-ink">Settings</h1>
          <p className="text-ink-muted text-sm mt-2 max-w-md">
            Habits add/edit/delete karo — aaj se aage checklist me changes dikhenge,
            lekin pichle dino ka saved data (calendar, chart) affect nahi hoga.
          </p>
        </header>

        {errorMsg && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-red-800/50 bg-red-950/30 text-red-300 text-sm font-mono">
            {errorMsg}
          </div>
        )}

        <div className="rounded-xl border border-line bg-surface p-5 max-w-xl mb-6">
          <h3 className="font-display text-base text-ink mb-4">Nayi habit add karo</h3>
          <AddHabitForm onAdd={handleAddHabit} />
        </div>

        <div className="rounded-xl border border-line bg-surface p-5 max-w-xl">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display text-base text-ink">Habits</h3>
            {savingOrder && (
              <span className="font-mono text-xs text-ink-muted">Order saving…</span>
            )}
          </div>
          <p className="font-mono text-xs text-ink-muted mb-4">
            {autoArrange
              ? "Auto-arrange ON hai — order start time ke hisaab se apne aap set hota hai"
              : "⠿ ko pakad kar drag karo order badalne ke liye"}
          </p>

          <div className="flex items-center justify-between gap-4 mb-4 px-4 py-3 rounded-lg border border-line bg-surface-2">
            <div>
              <p className="text-sm text-ink">Auto-arrange by time</p>
              <p className="font-mono text-[11px] text-ink-muted mt-0.5">
                On karne par habits unke start time (from) ke hisaab se apne aap arrange ho jayengi
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoArrange}
              onClick={() => handleAutoArrangeToggle(!autoArrange)}
              className={`w-11 h-6 rounded-full relative transition-colors shrink-0 cursor-pointer ${
                autoArrange ? "bg-gold" : "bg-line-strong"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-transform ${
                  autoArrange ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {loading ? (
            <p className="text-ink-muted font-mono text-sm">Loading…</p>
          ) : habits.length === 0 ? (
            <p className="text-ink-muted text-sm font-mono">Koi habit nahi mila.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {habits.map((h, index) =>
                editingId === h.id ? (
                  <li
                    key={h.id}
                    className="flex flex-col gap-2 px-4 py-3 rounded-lg border border-gold/40 bg-surface-2"
                  >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full sm:flex-1 bg-surface border border-line rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40"
                      />
                      <div className="flex items-center gap-2">
                        <EmojiPickerButton value={editEmoji} onChange={setEditEmoji} />
                        <button
                          type="button"
                          onClick={() => saveEdit(h)}
                          disabled={savingEdit || !editName.trim()}
                          className="px-3 py-1.5 rounded-md bg-gold text-surface text-xs font-mono disabled:opacity-40 hover:bg-gold-bright transition-colors"
                        >
                          {savingEdit ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={savingEdit}
                          className="px-3 py-1.5 rounded-md border border-line text-ink-muted hover:text-gold text-xs font-mono transition-colors disabled:opacity-40"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink-muted shrink-0">Time (optional)</span>
                      <input
                        type="time"
                        value={editTimeFrom}
                        onChange={(e) => setEditTimeFrom(e.target.value)}
                        className="bg-surface border border-line rounded-md px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-gold/40"
                      />
                      <span className="text-ink-muted text-xs">to</span>
                      <input
                        type="time"
                        value={editTimeTo}
                        onChange={(e) => setEditTimeTo(e.target.value)}
                        className="bg-surface border border-line rounded-md px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-gold/40"
                      />
                    </div>
                  </li>
                ) : (
                  <li
                    key={h.id}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={handleDrop}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg border bg-surface-2 transition-colors ${
                      dragOverIndex === index && dragIndex !== index
                        ? "border-gold/60"
                        : "border-line"
                    } ${dragIndex === index ? "opacity-50" : ""}`}
                  >
                    <span
                      draggable={!autoArrange}
                      onDragStart={() => handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      aria-label="Drag to reorder"
                      title={autoArrange ? "Auto-arrange ON — manual drag disabled" : "Drag to reorder"}
                      className={`shrink-0 select-none text-sm tracking-widest ${
                        autoArrange
                          ? "text-ink-muted/30 cursor-not-allowed"
                          : "text-ink-muted hover:text-gold cursor-grab active:cursor-grabbing"
                      }`}
                    >
                      ⠿
                    </span>
                    <span className="text-xl leading-none">{h.emoji}</span>
                    <span className="flex-1 text-sm text-ink">{h.name}</span>
                    {h.time_from && (
                      <span className="font-mono text-xs text-gold whitespace-nowrap">
                        {formatTime12(h.time_from)}
                        {h.time_to ? ` – ${formatTime12(h.time_to)}` : ""}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(h)}
                      className="px-3 py-1.5 rounded-md border border-line text-ink-muted hover:text-gold text-xs font-mono transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(h)}
                      disabled={deletingId === h.id}
                      className="px-3 py-1.5 rounded-md border border-red-800/50 text-red-300 hover:bg-red-950/30 text-xs font-mono transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {deletingId === h.id ? "Deleting…" : "Delete"}
                    </button>
                  </li>
                )
              )}
            </ul>
          )}
        </div>

        <footer className="mt-14 text-center text-ink-muted text-xs font-mono">
          KD Protek · connected to Supabase · har din ka register apne aap ban jaata hai
        </footer>
      </div>
    </div>
  );
}
