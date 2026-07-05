"use client";

import { useState } from "react";
import { todayKey } from "@/lib/dateUtils";

export default function PlanForm({ initial, onSubmit, onCancel, submitLabel }) {
  const [name, setName] = useState(initial?.name || "");
  const [emoji, setEmoji] = useState(initial?.emoji || "📘");
  const [startDate, setStartDate] = useState(initial?.start_date || todayKey());
  const [endDate, setEndDate] = useState(initial?.end_date || todayKey());
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    setBusy(true);
    await onSubmit({ name: name.trim(), emoji: emoji.trim() || "📘", startDate, endDate });
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Plan ka naam (e.g. Math)"
          className="w-full sm:flex-1 bg-surface-2 border border-line rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={4}
          className="w-12 shrink-0 text-center bg-surface-2 border border-line rounded-md py-2 text-lg focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <label className="flex-1 flex flex-col gap-1">
          <span className="text-xs font-mono text-ink-muted uppercase tracking-wide">
            Start date
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-surface-2 border border-line rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </label>
        <label className="flex-1 flex flex-col gap-1">
          <span className="text-xs font-mono text-ink-muted uppercase tracking-wide">
            End date
          </span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-surface-2 border border-line rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="px-4 py-2 rounded-md bg-gold text-surface text-sm font-medium disabled:opacity-40 hover:bg-gold-bright transition-colors cursor-pointer"
        >
          {busy ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-line text-ink-muted hover:text-gold hover:border-gold/50 text-sm font-mono transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
