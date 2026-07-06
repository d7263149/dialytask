"use client";

import { useEffect, useRef, useState } from "react";
import { startAlarmSound } from "@/lib/clockAudio";

function formatCountdown(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function TimerPanel() {
  const [inputH, setInputH] = useState(0);
  const [inputM, setInputM] = useState(5);
  const [inputS, setInputS] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const deadlineRef = useRef(null);
  const stopSoundRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const secsLeft = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setRemaining(secsLeft);
      if (secsLeft <= 0) {
        setRunning(false);
        setDone(true);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (done && !stopSoundRef.current) {
      stopSoundRef.current = startAlarmSound({ freq: 880, intervalMs: 400 });
    }
    if (!done && stopSoundRef.current) {
      stopSoundRef.current();
      stopSoundRef.current = null;
    }
  }, [done]);

  const totalInputSeconds = inputH * 3600 + inputM * 60 + inputS;

  function handleStart() {
    const startSeconds = remaining > 0 ? remaining : totalInputSeconds;
    if (startSeconds <= 0) return;
    deadlineRef.current = Date.now() + startSeconds * 1000;
    setRemaining(startSeconds);
    setDone(false);
    setRunning(true);
  }

  function handlePause() {
    setRunning(false);
  }

  function handleReset() {
    setRunning(false);
    setDone(false);
    setRemaining(0);
  }

  function handleDismiss() {
    setDone(false);
    setRemaining(0);
  }

  const isIdle = !running && remaining === 0 && !done;

  return (
    <div className="flex flex-col gap-6">
      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-xl border border-gold bg-surface p-6 text-center flex flex-col items-center gap-4">
            <span className="text-4xl animate-heartbeat">⏳</span>
            <p className="font-display text-2xl text-ink">Time&apos;s up!</p>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full px-4 py-3 rounded-lg bg-gold text-surface font-mono text-sm hover:bg-gold-bright transition-colors"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface p-6 sm:p-10 flex flex-col items-center gap-6">
        {isIdle ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {[
              { value: inputH, setter: setInputH, label: "hr", max: 23 },
              { value: inputM, setter: setInputM, label: "min", max: 59 },
              { value: inputS, setter: setInputS, label: "sec", max: 59 },
            ].map((field) => (
              <div key={field.label} className="flex flex-col items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={field.max}
                  value={field.value}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(field.max, Number(e.target.value) || 0));
                    field.setter(v);
                  }}
                  className="w-16 sm:w-20 px-2 py-2 rounded-md border border-line bg-surface-2 text-ink font-mono text-2xl text-center focus:outline-none focus:border-gold/60 tabular-nums"
                />
                <span className="text-ink-muted text-xs font-mono">{field.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-mono text-5xl sm:text-7xl text-ink tabular-nums">
            {formatCountdown(remaining)}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3 w-full">
          {!running ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={isIdle && totalInputSeconds === 0}
              className="flex-1 min-w-[100px] px-5 py-3 rounded-lg bg-gold text-surface font-mono text-sm hover:bg-gold-bright transition-colors disabled:opacity-40"
            >
              {remaining > 0 ? "Resume" : "Start"}
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
            onClick={handleReset}
            disabled={running === false && remaining === 0}
            className="flex-1 min-w-[100px] px-5 py-3 rounded-lg border border-red-800/50 text-red-300 font-mono text-sm hover:bg-red-950/30 transition-colors disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
