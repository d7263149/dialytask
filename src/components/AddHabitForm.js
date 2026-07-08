"use client";

import { useEffect, useRef, useState } from "react";

const EMOJI_CHOICES = [
  "✅", "💪", "🏋️", "🏃", "🚴", "🧘", "🧠", "📚", "📖", "✍️",
  "💻", "🎯", "⏰", "🌅", "🌙", "😴", "💧", "🥗", "🍎", "🚭",
  "🚫", "🙏", "❤️", "🫁", "🩺", "🧴", "🪥", "🚿", "🧹", "🧺",
  "🛏️", "📞", "✉️", "💰", "📈", "🧾", "🛒", "🎸", "🎨", "🎮",
  "⚽", "🏀", "🎾", "🏊", "🚶", "🧗", "🐶", "🌱", "☕", "🚬",
  "📵", "🔋", "🧘‍♂️", "🗣️", "🌞", "❄️", "🔥", "⭐", "🎵", "🏆",
];

export default function AddHabitForm({ onAdd }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✅");
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function handleClickOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);

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
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="w-12 h-[38px] shrink-0 text-center bg-surface-2 border border-line rounded-md text-lg hover:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/40 transition-colors"
            aria-label="Choose icon"
          >
            {emoji}
          </button>
          {pickerOpen && (
            <div className="absolute z-20 mt-2 left-1/2 -translate-x-1/2 w-64 max-h-56 overflow-y-auto grid grid-cols-8 gap-1 p-2 rounded-md border border-line bg-surface shadow-lg">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    setEmoji(e);
                    setPickerOpen(false);
                  }}
                  className={`w-6 h-6 flex items-center justify-center rounded text-base hover:bg-surface-2 transition-colors ${
                    e === emoji ? "ring-2 ring-gold/60" : ""
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
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
