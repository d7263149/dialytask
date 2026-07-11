function handTip(cx, cy, angleDeg, length) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + length * Math.sin(rad), y: cy - length * Math.cos(rad) };
}

export default function AnalogClock({ now, size = 64 }) {
  const seconds = now?.getSeconds() ?? 0;
  const minutes = now?.getMinutes() ?? 0;
  const hours = now ? now.getHours() % 12 : 0;

  const secDeg = seconds * 6;
  const minDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  const hourTip = handTip(50, 50, hourDeg, 22);
  const minTip = handTip(50, 50, minDeg, 32);
  const secTip = handTip(50, 50, secDeg, 38);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0">
      <circle cx="50" cy="50" r="47" fill="var(--surface-2)" stroke="var(--gold-dim)" strokeWidth="2" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = handTip(50, 50, i * 30, 40);
        const b = handTip(50, 50, i * 30, 45);
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="var(--line-strong)"
            strokeWidth={i % 3 === 0 ? 2.5 : 1.5}
          />
        );
      })}
      <line x1="50" y1="50" x2={hourTip.x} y2={hourTip.y} stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="50" x2={minTip.x} y2={minTip.y} stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="50" x2={secTip.x} y2={secTip.y} stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="50" cy="50" r="3" fill="var(--gold)" />
    </svg>
  );
}
