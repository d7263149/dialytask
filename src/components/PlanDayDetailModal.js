"use client";

export default function PlanDayDetailModal({ dateKey, entries, onToggle, onClose }) {
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
          <p className="text-ink-muted text-sm font-mono">Is din koi plan schedule nahi tha.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li key={entry.plan_id}>
                <button
                  type="button"
                  onClick={() => onToggle(entry.plan_id, !entry.done)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                    entry.done
                      ? "border-gold/60 bg-gold/[0.07]"
                      : "border-line bg-surface-2 hover:border-gold/30"
                  }`}
                >
                  <span className="text-lg leading-none">{entry.emoji}</span>
                  <span className={`flex-1 text-left text-sm ${entry.done ? "text-ink" : "text-ink-muted"}`}>
                    {entry.name}
                  </span>
                  <span
                    className={`text-xs font-mono ${entry.done ? "text-gold" : "text-ink-muted"}`}
                  >
                    {entry.done ? "Done" : "Missed"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink-muted font-mono">Kisi bhi item par click karke done/missed switch karo.</p>
      </div>
    </div>
  );
}
