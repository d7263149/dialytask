"use client";

import { useState } from "react";
import EmojiPickerButton from "./EmojiPickerButton";

export default function AddHabitForm({ onAdd }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✅");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await onAdd(name.trim(), emoji.trim() || "✅", timeFrom, timeTo);
    setName("");
    setEmoji("✅");
    setTimeFrom("");
    setTimeTo("");
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nayi habit ka naam (e.g. Meditation)"
          className="w-full sm:flex-1 bg-surface-2 border border-line rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
        <div className="flex items-center gap-2">
          <EmojiPickerButton value={emoji} onChange={setEmoji} />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-md bg-gold text-surface text-sm font-medium disabled:opacity-40 hover:bg-gold-bright transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-ink-muted shrink-0">Time (optional)</span>
        <input
          type="time"
          value={timeFrom}
          onChange={(e) => setTimeFrom(e.target.value)}
          className="bg-surface-2 border border-line rounded-md px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
        <span className="text-ink-muted text-xs">to</span>
        <input
          type="time"
          value={timeTo}
          onChange={(e) => setTimeTo(e.target.value)}
          className="bg-surface-2 border border-line rounded-md px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
      </div>
    </form>
  );
}
