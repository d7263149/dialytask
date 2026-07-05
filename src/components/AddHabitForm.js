"use client";

import { useState } from "react";

export default function AddHabitForm({ onAdd }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✅");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await onAdd(name.trim(), emoji.trim() || "✅");
    setName("");
    setEmoji("✅");
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nayi habit ka naam (e.g. Meditation)"
        className="w-full sm:flex-1 bg-surface-2 border border-line rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold/40"
      />
      <div className="flex items-center gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="w-12 shrink-0 text-center bg-surface-2 border border-line rounded-md py-2 text-lg focus:outline-none focus:ring-2 focus:ring-gold/40"
          maxLength={4}
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="flex-1 sm:flex-initial px-4 py-2 rounded-md bg-gold text-surface text-sm font-medium disabled:opacity-40 hover:bg-gold-bright transition-colors"
        >
          + Add
        </button>
      </div>
    </form>
  );
}
