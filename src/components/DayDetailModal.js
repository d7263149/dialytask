"use client";

export default function DayDetailModal({ dateKey, entries, onClose }) {
  if (!dateKey) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-line bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-ink">{dateKey}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink-muted hover:text-gold text-xl leading-none"
          >
            ×
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="text-ink-muted text-sm font-mono">Is din koi entry nahi mili.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li
                key={entry.habit_id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-line bg-surface-2"
              >
                <span className="text-lg leading-none">{entry.emoji}</span>
                <span className={`flex-1 text-sm ${entry.done ? "text-ink" : "text-ink-muted"}`}>
                  {entry.name}
                </span>
                <span
                  className={`text-xs font-mono ${entry.done ? "text-gold" : "text-ink-muted"}`}
                >
                  {entry.done ? "Done" : "Missed"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
