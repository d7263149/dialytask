"use client";

import { useEffect, useState } from "react";
import { FULL_WEEKDAY_LABELS, MONTH_NAMES } from "@/lib/dateUtils";

function pad(n) {
  return String(n).padStart(2, "0");
}

export default function DigitalClock() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className="h-24 sm:h-32" />;
  }

  const hours24 = now.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const ampm = hours24 >= 12 ? "PM" : "AM";
  const blink = now.getSeconds() % 2 === 0;

  return (
    <div className="rounded-xl border border-line bg-surface p-6 sm:p-10 flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <span
          className="text-2xl sm:text-3xl leading-none animate-heartbeat"
          aria-hidden="true"
        >
          ❤️
        </span>
        <p className="font-mono text-xs tracking-[0.2em] text-gold uppercase">
          Clock
        </p>
      </div>

      <div className="font-display text-5xl sm:text-7xl text-ink tabular-nums flex items-center gap-1 sm:gap-2">
        <span>{pad(hours12)}</span>
        <span className={blink ? "text-gold" : "text-gold/20"}>:</span>
        <span>{pad(now.getMinutes())}</span>
        <span className={blink ? "text-gold" : "text-gold/20"}>:</span>
        <span className="text-3xl sm:text-5xl text-ink-muted">{pad(now.getSeconds())}</span>
        <span className="text-lg sm:text-2xl text-ink-muted ml-1 sm:ml-2">{ampm}</span>
      </div>

      <p className="font-mono text-xs sm:text-sm text-ink-muted text-center">
        {FULL_WEEKDAY_LABELS[now.getDay()]}, {MONTH_NAMES[now.getMonth()]} {now.getDate()} {now.getFullYear()}
      </p>
    </div>
  );
}
