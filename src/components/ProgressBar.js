export default function ProgressBar({ value, label, sublabel }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full">
      {(label || sublabel) && (
        <div className="flex items-baseline justify-between mb-2">
          {label && (
            <span className="font-display text-sm tracking-wide text-ink-muted uppercase">
              {label}
            </span>
          )}
          {sublabel && (
            <span className="font-mono text-xs text-ink-muted">{sublabel}</span>
          )}
        </div>
      )}
      <div className="relative h-3 rounded-full bg-surface-2 overflow-hidden ring-1 ring-line">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-right font-mono text-xs text-ink-muted">{pct}%</div>
    </div>
  );
}
