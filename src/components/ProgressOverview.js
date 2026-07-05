"use client";

import ProgressBar from "@/components/ProgressBar";
import CompletionChart from "@/components/CompletionChart";
import { PROGRESS_RANGES } from "@/lib/progress";

export default function ProgressOverview({
  range,
  onRangeChange,
  avgPct,
  chartData,
  daysLogged,
  loading,
}) {
  const activeLabel = PROGRESS_RANGES.find((r) => r.key === range)?.label;

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-display text-base text-ink">Progress overview</h3>
        <div className="flex gap-1 rounded-lg border border-line bg-surface-2 p-1">
          {PROGRESS_RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onRangeChange(r.key)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                range === r.key
                  ? "bg-gold text-surface"
                  : "text-ink-muted hover:text-gold"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <ProgressBar value={avgPct} label={activeLabel} sublabel={`${daysLogged} din logged`} />
      </div>

      {loading ? (
        <p className="text-ink-muted font-mono text-sm">Loading…</p>
      ) : (
        <CompletionChart data={chartData} />
      )}
    </div>
  );
}
