"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import AddHabitForm from "@/components/AddHabitForm";
import EmojiPickerButton from "@/components/EmojiPickerButton";

export default function SettingsPage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("✅");
  const [savingEdit, setSavingEdit] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

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

  async function handleAddHabit(name, emoji) {
    setErrorMsg("");
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
  }

  function startEdit(habit) {
    setEditingId(habit.id);
    setEditName(habit.name);
    setEditEmoji(habit.emoji);
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
      body: JSON.stringify({ name: editName.trim(), emoji: editEmoji.trim() || "✅" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      setSavingEdit(false);
      return;
    }
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? data.habit : h)));
    setSavingEdit(false);
    setEditingId(null);
  }

  function handleDragStart(index) {
    setDragIndex(index);
  }

  function handleDragOver(e, index) {
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
    setDragIndex(null);
    setDragOverIndex(null);
    setErrorMsg("");
    setSavingOrder(true);

    const changed = habits
      .map((h, i) => ({ h, i }))
      .filter(({ h, i }) => h.sort_order !== i);

    if (changed.length === 0) {
      setSavingOrder(false);
      return;
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
    if (failed) {
      setErrorMsg(failed.data.error);
      setSavingOrder(false);
      return;
    }

    setHabits((prev) => prev.map((h, i) => ({ ...h, sort_order: i })));
    setSavingOrder(false);
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
          <p className="font-mono text-xs text-ink-muted mb-4">⠿ ko pakad kar drag karo order badalne ke liye</p>

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
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-4 py-3 rounded-lg border border-gold/40 bg-surface-2"
                  >
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
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      aria-label="Drag to reorder"
                      title="Drag to reorder"
                      className="shrink-0 text-ink-muted hover:text-gold cursor-grab active:cursor-grabbing select-none text-sm tracking-widest"
                    >
                      ⠿
                    </span>
                    <span className="text-xl leading-none">{h.emoji}</span>
                    <span className="flex-1 text-sm text-ink">{h.name}</span>
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
