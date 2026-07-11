"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playBeep } from "@/lib/clockAudio";
import { formatTime12 } from "@/lib/dateUtils";
import AnalogClock from "./AnalogClock";

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatStopwatch(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const REMINDER_BEEP_COUNT = 5;
const REMINDER_DURATION_MS = 30000;
const REMINDER_BEEP_INTERVAL_MS = REMINDER_DURATION_MS / REMINDER_BEEP_COUNT;
const REMINDER_END_BEEP_GAP_MS = 260;
const REMINDER_DISMISS_MS = REMINDER_DURATION_MS + REMINDER_END_BEEP_GAP_MS + 300;

const POS_KEY = "kd_clock_widget_pos";
const SCALE_KEY = "kd_clock_widget_scale";
const MODE_KEY = "kd_clock_widget_mode";
const MIN_SCALE = 0.75;
const MAX_SCALE = 1.75;

export default function GlobalClockWidget() {
  const [now, setNow] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | running | paused
  const [reminder, setReminder] = useState(null); // habit currently alerting
  const [mode, setMode] = useState("digital"); // digital | analog
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState(null); // {top,left} px once dragged; null = default top-right corner

  const widgetRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const habitsRef = useRef([]);
  const lastFiredRef = useRef({}); // habit id -> "date HH:MM" already alerted

  // Restore floating position / size / clock style from last session.
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(MODE_KEY);
      if (savedMode === "digital" || savedMode === "analog") setMode(savedMode);
      const savedScale = parseFloat(localStorage.getItem(SCALE_KEY));
      if (!Number.isNaN(savedScale)) setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale)));
      const savedPos = JSON.parse(localStorage.getItem(POS_KEY) || "null");
      if (savedPos && typeof savedPos.top === "number" && typeof savedPos.left === "number") {
        setPos(savedPos);
      }
    } catch {
      // corrupted localStorage value — just fall back to defaults
    }
  }, []);

  // Habits with a "from" time — refetched periodically so edits in Settings
  // are picked up without needing a page reload (this widget lives in the
  // root layout and never remounts across navigation).
  useEffect(() => {
    let cancelled = false;
    async function loadHabits() {
      try {
        const res = await fetch("/api/habits");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) habitsRef.current = data.habits || [];
      } catch {
        // not logged in / offline — reminder just stays quiet
      }
    }
    loadHabits();
    const id = setInterval(loadHabits, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    function tick() {
      const d = new Date();
      setNow(d);

      const hhmm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const fireKey = `${d.toDateString()} ${hhmm}`;
      const match = habitsRef.current.find(
        (h) => h.time_from === hhmm && lastFiredRef.current[h.id] !== fireKey
      );
      if (match) {
        lastFiredRef.current[match.id] = fireKey;
        setReminder(match);
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Blinks the whole page content (not just this widget) for as long as the
  // reminder is active. The clock widget itself lives outside #page-content-wrap
  // so it stays put and unaffected while the page behind it pulses.
  useEffect(() => {
    const el = document.getElementById("page-content-wrap");
    if (!el) return;
    el.classList.toggle("reminder-blink", !!reminder);
    return () => el.classList.remove("reminder-blink");
  }, [reminder]);

  // Reminder alert: 5 beeps spread across 30s (blink keeps running the whole
  // time), then 2 closing beeps right at the end before it dismisses.
  useEffect(() => {
    if (!reminder) return;

    let beepCount = 0;
    const beep = () => {
      playBeep({ freq: 1046, duration: 0.2, volume: 0.25 });
      beepCount += 1;
      if (beepCount >= REMINDER_BEEP_COUNT) clearInterval(beepId);
    };
    beep();
    const beepId = setInterval(beep, REMINDER_BEEP_INTERVAL_MS);

    const endBeepId = setTimeout(() => {
      playBeep({ freq: 660, duration: 0.18, volume: 0.25 });
      setTimeout(() => playBeep({ freq: 660, duration: 0.18, volume: 0.25 }), REMINDER_END_BEEP_GAP_MS);
    }, REMINDER_DURATION_MS);

    const dismissId = setTimeout(() => setReminder(null), REMINDER_DISMISS_MS);

    return () => {
      clearInterval(beepId);
      clearTimeout(endBeepId);
      clearTimeout(dismissId);
    };
  }, [reminder]);

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  // --- Drag to move -----------------------------------------------------
  const handleDragMove = useCallback((e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const el = widgetRef.current;
    const w = el?.offsetWidth ?? 200;
    const h = el?.offsetHeight ?? 40;
    const nextLeft = Math.min(Math.max(0, dragRef.current.startLeft + dx), window.innerWidth - w);
    const nextTop = Math.min(Math.max(0, dragRef.current.startTop + dy), window.innerHeight - h);
    setPos({ top: nextTop, left: nextLeft });
  }, []);

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("pointermove", handleDragMove);
    window.removeEventListener("pointerup", handleDragEnd);
    setPos((p) => {
      try {
        if (p) localStorage.setItem(POS_KEY, JSON.stringify(p));
      } catch {
        // ignore storage failures (private browsing etc.)
      }
      return p;
    });
  }, [handleDragMove]);

  function handleDragStart(e) {
    const el = widgetRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startTop: rect.top, startLeft: rect.left };
    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  }

  // --- Drag to resize -----------------------------------------------------
  const handleResizeMove = useCallback((e) => {
    if (!resizeRef.current) return;
    const delta = e.clientX - resizeRef.current.startX + (e.clientY - resizeRef.current.startY);
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, resizeRef.current.startScale + delta / 150));
    setScale(next);
  }, []);

  const handleResizeEnd = useCallback(() => {
    resizeRef.current = null;
    window.removeEventListener("pointermove", handleResizeMove);
    window.removeEventListener("pointerup", handleResizeEnd);
    setScale((s) => {
      try {
        localStorage.setItem(SCALE_KEY, String(s));
      } catch {
        // ignore storage failures
      }
      return s;
    });
  }, [handleResizeMove]);

  function handleResizeStart(e) {
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startScale: scale };
    window.addEventListener("pointermove", handleResizeMove);
    window.addEventListener("pointerup", handleResizeEnd);
  }

  function toggleMode() {
    setMode((m) => {
      const next = m === "digital" ? "analog" : "digital";
      try {
        localStorage.setItem(MODE_KEY, next);
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }

  const hours24 = now?.getHours() ?? 0;
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const ampm = hours24 >= 12 ? "PM" : "AM";

  const widgetPosStyle = pos ? { top: pos.top, left: pos.left } : { top: 12, right: 12 };

  return (
    <>
      <div
        ref={widgetRef}
        style={{
          ...widgetPosStyle,
          transform: `scale(${scale})`,
          transformOrigin: pos ? "top left" : "top right",
        }}
        className={`fixed z-40 flex flex-col gap-2 border border-line bg-surface/90 backdrop-blur px-3 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.3)] ${
          mode === "analog" ? "rounded-2xl items-center" : "rounded-full"
        }`}
      >
        <div className="flex items-center gap-2 w-full">
          <span
            onPointerDown={handleDragStart}
            aria-label="Drag to move"
            title="Drag to move"
            className="shrink-0 cursor-grab active:cursor-grabbing select-none text-ink-muted hover:text-gold text-xs tracking-widest touch-none"
          >
            ⠿
          </span>

          <button
            type="button"
            onClick={toggleMode}
            aria-label={mode === "digital" ? "Switch to analog clock" : "Switch to digital clock"}
            title={mode === "digital" ? "Switch to analog clock" : "Switch to digital clock"}
            className="shrink-0 text-[11px] text-ink-muted hover:text-gold cursor-pointer"
          >
            {mode === "digital" ? "🕐" : "🔢"}
          </button>

          {mode === "digital" && (
            <>
              <span className="font-mono text-xs sm:text-sm text-gold tabular-nums whitespace-nowrap">
                {now ? `${pad(hours12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${ampm}` : "--:--:-- --"}
              </span>
              <span className="w-px h-4 bg-line shrink-0" />
            </>
          )}

          <span className="font-mono text-xs sm:text-sm text-ink tabular-nums whitespace-nowrap">
            {formatStopwatch(seconds)}
          </span>

          <div className="flex items-center gap-1 shrink-0 ml-auto">
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

          <span
            onPointerDown={handleResizeStart}
            aria-label="Drag to resize"
            title="Drag to resize"
            className="shrink-0 cursor-nwse-resize select-none text-ink-muted hover:text-gold text-[11px] touch-none"
          >
            ⤡
          </span>
        </div>

        {mode === "analog" && <AnalogClock now={now} size={68} />}
      </div>

      {reminder && (
        <button
          type="button"
          onClick={() => setReminder(null)}
          aria-label="Dismiss reminder"
          className="fixed top-16 right-3 z-50 flex items-center gap-3 rounded-xl border border-gold bg-surface px-4 py-2.5 cursor-pointer shadow-[0_8px_24px_rgba(199,154,75,0.35)]"
        >
          <span className="text-2xl leading-none">{reminder.emoji}</span>
          <div className="text-left">
            <p className="font-display text-sm text-ink leading-tight">{reminder.name}</p>
            <p className="font-mono text-[10px] text-gold uppercase tracking-wide">
              {formatTime12(reminder.time_from)} · reminder
            </p>
          </div>
        </button>
      )}
    </>
  );
}
