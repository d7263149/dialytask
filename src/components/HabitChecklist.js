"use client";

export default function HabitChecklist({ habits, doneMap, onToggle, disabled }) {
  if (!habits.length) {
    return (
      <p className="text-ink-muted text-sm font-mono">
        Koi habit nahi mila. Neeche se ek habit add karo.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {habits.map((h) => {
        const done = !!doneMap[h.id];
        return (
          <li key={h.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggle(h.id, !done)}
              className={`group w-full flex items-center gap-4 px-4 py-3 rounded-lg border transition-all duration-200
                ${done
                  ? "border-gold/60 bg-gold/[0.07]"
                  : "border-line bg-surface hover:border-gold/30 hover:bg-surface-2"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                aria-hidden
                className={`relative flex items-center justify-center w-9 h-9 rounded-full border-2 shrink-0 transition-all duration-200
                  ${done
                    ? "border-gold bg-gold text-surface rotate-0 scale-100"
                    : "border-line-strong text-transparent scale-95"
                  }`}
                style={{
                  fontFamily: "var(--font-display)",
                  boxShadow: done ? "0 0 0 3px rgba(199,154,75,0.15)" : "none",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`w-5 h-5 transition-opacity duration-200 ${done ? "opacity-100" : "opacity-0"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>

              <span className="text-xl leading-none">{h.emoji}</span>

              <span
                className={`flex-1 text-left font-body text-base ${
                  done ? "text-ink line-through decoration-gold/50" : "text-ink"
                }`}
              >
                {h.name}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
