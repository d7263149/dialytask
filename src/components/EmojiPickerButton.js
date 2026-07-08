"use client";

import { useEffect, useRef, useState } from "react";

export const EMOJI_CHOICES = [
  "✅", "💪", "🏋️", "🏃", "🚴", "🧘", "🧠", "📚", "📖", "✍️",
  "💻", "🎯", "⏰", "🌅", "🌙", "😴", "💧", "🥗", "🍎", "🚭",
  "🚫", "🙏", "❤️", "🫁", "🩺", "🧴", "🪥", "🚿", "🧹", "🧺",
  "🛏️", "📞", "✉️", "💰", "📈", "🧾", "🛒", "🎸", "🎨", "🎮",
  "⚽", "🏀", "🎾", "🏊", "🚶", "🧗", "🐶", "🌱", "☕", "🚬",
  "📵", "🔋", "🧘‍♂️", "🗣️", "🌞", "❄️", "🔥", "⭐", "🎵", "🏆",
];

export default function EmojiPickerButton({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-[38px] shrink-0 text-center bg-surface-2 border border-line rounded-md text-lg hover:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/40 transition-colors"
        aria-label="Choose icon"
      >
        {value}
      </button>
      {open && (
        <div className="absolute z-20 mt-2 left-1/2 -translate-x-1/2 w-64 max-h-56 overflow-y-auto grid grid-cols-8 gap-1 p-2 rounded-md border border-line bg-surface shadow-lg">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                onChange(e);
                setOpen(false);
              }}
              className={`w-6 h-6 flex items-center justify-center rounded text-base hover:bg-surface-2 transition-colors ${
                e === value ? "ring-2 ring-gold/60" : ""
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
