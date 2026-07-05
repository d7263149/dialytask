"use client";

import { getMonthMatrix, toDateKey, WEEKDAY_LABELS } from "@/lib/dateUtils";

// completionByDate: { "YYYY-MM-DD": { done, total } }
export default function MonthCalendar({ year, monthIndex, completionByDate, todayKeyStr, onDayClick }) {
  const weeks = getMonthMatrix(year, monthIndex);

  function cellStyle(ratio, hasEntry) {
    if (!hasEntry) return { background: "var(--surface)" };
    // interpolate between empty surface and gold based on ratio
    const alpha = 0.12 + ratio * 0.75;
    return { background: `rgba(199, 154, 75, ${alpha})` };
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center font-mono text-[10px] tracking-wider text-ink-muted uppercase py-1"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((date, di) => {
              if (!date) return <div key={di} className="aspect-square rounded-md" />;
              const key = toDateKey(date);
              const info = completionByDate[key];
              const ratio = info && info.total > 0 ? info.done / info.total : 0;
              const hasEntry = !!info;
              const isToday = key === todayKeyStr;
              return (
                <button
                  type="button"
                  key={di}
                  onClick={() => onDayClick?.(key)}
                  title={
                    hasEntry
                      ? `${key}: ${info.done}/${info.total} done`
                      : `${key}: no entry`
                  }
                  className={`aspect-square rounded-md flex items-center justify-center relative cursor-pointer hover:ring-2 hover:ring-gold/60 transition-all
                    ${isToday ? "ring-2 ring-gold" : "ring-1 ring-line"}`}
                  style={cellStyle(ratio, hasEntry)}
                >
                  <span
                    className={`font-mono text-[11px] ${
                      hasEntry && ratio > 0.5 ? "text-surface" : "text-ink-muted"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
