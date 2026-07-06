"use client";

import { useEffect, useRef, useState } from "react";
import { playBeep } from "@/lib/clockAudio";

function formatElapsed(ms) {
  const totalCentis = Math.floor(ms / 10);
  const centis = totalCentis % 100;
  const totalSeconds = Math.floor(totalCentis / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const pad = (n) => String(n).padStart(2, "0");
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centis)}`
    : `${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
}

export default function StopwatchPanel() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState([]);
  const startedAtRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(Date.now() - startedAtRef.current);
    }, 30);
    return () => clearInterval(id);
  }, [running]);

  function handleStart() {
    startedAtRef.current = Date.now() - elapsed;
    setRunning(true);
    playBeep({ freq: 700, duration: 0.08 });
  }

  function handlePause() {
    setRunning(false);
    playBeep({ freq: 500, duration: 0.08 });
  }

  function handleLap() {
    setLaps((prev) => [{ n: prev.length + 1, time: elapsed }, ...prev]);
  }

  function handleReset() {
    setRunning(false);
    setElapsed(0);
    setLaps([]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-line bg-surface p-6 sm:p-10 flex flex-col items-center gap-6">
        <p className="font-mono text-4xl sm:text-6xl text-ink tabular-nums">
          {formatElapsed(elapsed)}
        </p>

        <div className="flex flex-wrap justify-center gap-3 w-full">
          {!running ? (
            <button
              type="button"
              onClick={handleStart}
              className="flex-1 min-w-[100px] px-5 py-3 rounded-lg bg-gold text-surface font-mono text-sm hover:bg-gold-bright transition-colors"
            >
              {elapsed > 0 ? "Resume" : "Start"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="flex-1 min-w-[100px] px-5 py-3 rounded-lg border border-gold text-gold font-mono text-sm hover:bg-gold/10 transition-colors"
            >
              Pause
            </button>
          )}

          <button
            type="button"
            onClick={handleLap}
            disabled={!running}
            className="flex-1 min-w-[100px] px-5 py-3 rounded-lg border border-line text-ink-muted font-mono text-sm hover:text-gold hover:border-gold/50 transition-colors disabled:opacity-40"
          >
            Lap
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={running || elapsed === 0}
            className="flex-1 min-w-[100px] px-5 py-3 rounded-lg border border-red-800/50 text-red-300 font-mono text-sm hover:bg-red-950/30 transition-colors disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </div>

      {laps.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="font-display text-base text-ink mb-3">Laps</h3>
          <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {laps.map((lap) => (
              <li
                key={lap.n}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-line bg-surface-2 font-mono text-sm"
              >
                <span className="text-ink-muted">Lap {lap.n}</span>
                <span className="text-ink tabular-nums">{formatElapsed(lap.time)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
