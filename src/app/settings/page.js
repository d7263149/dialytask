"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";

export default function SettingsPage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

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
            Habits delete karo — aaj se aage checklist me nahi aayenge, lekin pichle
            dino ka saved data (calendar, chart) affect nahi hoga.
          </p>
        </header>

        {errorMsg && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-red-800/50 bg-red-950/30 text-red-300 text-sm font-mono">
            {errorMsg}
          </div>
        )}

        <div className="rounded-xl border border-line bg-surface p-5 max-w-xl">
          <h3 className="font-display text-base text-ink mb-4">Habits</h3>

          {loading ? (
            <p className="text-ink-muted font-mono text-sm">Loading…</p>
          ) : habits.length === 0 ? (
            <p className="text-ink-muted text-sm font-mono">Koi habit nahi mila.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {habits.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg border border-line bg-surface-2"
                >
                  <span className="text-xl leading-none">{h.emoji}</span>
                  <span className="flex-1 text-sm text-ink">{h.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(h)}
                    disabled={deletingId === h.id}
                    className="px-3 py-1.5 rounded-md border border-red-800/50 text-red-300 hover:bg-red-950/30 text-xs font-mono transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {deletingId === h.id ? "Deleting…" : "Delete"}
                  </button>
                </li>
              ))}
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
