"use client";

import { useEffect, useState } from "react";

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatStopwatch(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function GlobalClockWidget() {
  const [now, setNow] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | running | paused

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  const hours24 = now?.getHours() ?? 0;
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const ampm = hours24 >= 12 ? "PM" : "AM";

  return (
    <div className="fixed top-3 right-3 z-40 flex items-center gap-2.5 rounded-full border border-line bg-surface/90 backdrop-blur px-3 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
      <span className="font-mono text-xs sm:text-sm text-gold tabular-nums whitespace-nowrap">
        {now ? `${pad(hours12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${ampm}` : "--:--:-- --"}
      </span>

      <span className="w-px h-4 bg-line shrink-0" />

      <span className="font-mono text-xs sm:text-sm text-ink tabular-nums whitespace-nowrap">
        {formatStopwatch(seconds)}
      </span>

      <div className="flex items-center gap-1 shrink-0">
        {(status === "idle" || status === "paused") && (
          <button
            type="button"
            onClick={() => setStatus("running")}
            aria-label={status === "paused" ? "Resume timer" : "Start timer"}
            className="w-6 h-6 flex items-center justify-center rounded-full border border-gold/50 text-gold hover:bg-gold/10 transition-colors text-[10px] leading-none cursor-pointer"
          >
            ▶
          </button>
        )}
        {status === "running" && (
          <button
            type="button"
            onClick={() => setStatus("paused")}
            aria-label="Pause timer"
            className="w-6 h-6 flex items-center justify-center rounded-full border border-gold/50 text-gold hover:bg-gold/10 transition-colors text-[10px] leading-none cursor-pointer"
          >
            ⏸
          </button>
        )}
        {status === "paused" && (
          <button
            type="button"
            onClick={() => {
              setSeconds(0);
              setStatus("idle");
            }}
            aria-label="Restart timer"
            className="w-6 h-6 flex items-center justify-center rounded-full border border-line-strong text-ink-muted hover:text-gold hover:border-gold/50 transition-colors text-[10px] leading-none cursor-pointer"
          >
            ↺
          </button>
        )}
      </div>
    </div>
  );
}
