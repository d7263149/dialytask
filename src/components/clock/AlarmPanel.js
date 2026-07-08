"use client";

import { useEffect, useRef, useState } from "react";
import { startAlarmSound } from "@/lib/clockAudio";

function formatTime12h(time) {
  const [h, m] = time.split(":").map(Number);
  const hours12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${String(hours12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function AlarmPanel() {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [newTime, setNewTime] = useState("07:00");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [ringingAlarm, setRingingAlarm] = useState(null);
  const stopSoundRef = useRef(null);
  const lastFiredRef = useRef({}); // alarmId -> "YYYY-MM-DD HH:MM" last fired, so it rings once per day and repeats daily

  useEffect(() => {
    async function init() {
      setLoading(true);
      const res = await fetch("/api/alarms");
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error);
        setLoading(false);
        return;
      }
      setAlarms(data.alarms || []);
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const fireKey = `${now.toDateString()} ${hhmm}`;

      setAlarms((current) => {
        const match = current.find(
          (a) => a.enabled && a.time === hhmm && lastFiredRef.current[a.id] !== fireKey
        );
        if (match) {
          lastFiredRef.current[match.id] = fireKey;
          setRingingAlarm(match);
        }
        return current;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (ringingAlarm && !stopSoundRef.current) {
      stopSoundRef.current = startAlarmSound({ freq: 1000, intervalMs: 500 });
    }
    if (!ringingAlarm && stopSoundRef.current) {
      stopSoundRef.current();
      stopSoundRef.current = null;
    }
  }, [ringingAlarm]);

  async function handleAdd() {
    if (!newTime) return;
    setAdding(true);
    setErrorMsg("");
    const res = await fetch("/api/alarms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time: newTime, label: newLabel }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) {
      setErrorMsg(data.error);
      return;
    }
    setAlarms((prev) => [...prev, data.alarm].sort((a, b) => a.time.localeCompare(b.time)));
    setNewLabel("");
  }

  async function handleToggle(alarm) {
    const nextEnabled = !alarm.enabled;
    setAlarms((prev) => prev.map((a) => (a.id === alarm.id ? { ...a, enabled: nextEnabled } : a)));
    const res = await fetch(`/api/alarms/${alarm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: nextEnabled }),
    });
    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.error);
      setAlarms((prev) => prev.map((a) => (a.id === alarm.id ? { ...a, enabled: alarm.enabled } : a)));
    }
  }

  async function handleDelete(id) {
    const prev = alarms;
    setAlarms((current) => current.filter((a) => a.id !== id));
    const res = await fetch(`/api/alarms/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setErrorMsg(data.error);
      setAlarms(prev);
    }
  }

  function handleDismiss() {
    setRingingAlarm(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {ringingAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-xl border border-gold bg-surface p-6 text-center flex flex-col items-center gap-4">
            <span className="text-4xl animate-heartbeat">⏰</span>
            <div>
              <p className="font-display text-3xl text-ink">{formatTime12h(ringingAlarm.time)}</p>
              {ringingAlarm.label && (
                <p className="text-ink-muted text-sm mt-1">{ringingAlarm.label}</p>
              )}
            </div>
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

      {errorMsg && (
        <div className="px-4 py-3 rounded-lg border border-red-800/50 bg-red-950/30 text-red-300 text-sm font-mono">
          {errorMsg}
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface p-5">
        <h3 className="font-display text-base text-ink mb-4">Naya alarm add karo</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="px-3 py-2 rounded-md border border-line bg-surface-2 text-ink font-mono text-sm focus:outline-none focus:border-gold/60"
          />
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (optional)"
            className="flex-1 px-3 py-2 rounded-md border border-line bg-surface-2 text-ink text-sm focus:outline-none focus:border-gold/60"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="px-4 py-2 rounded-md bg-gold text-surface font-mono text-sm hover:bg-gold-bright transition-colors whitespace-nowrap disabled:opacity-40"
          >
            {adding ? "Adding…" : "Add alarm"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        <h3 className="font-display text-base text-ink mb-4">Alarms</h3>
        {loading ? (
          <p className="text-ink-muted font-mono text-sm">Loading…</p>
        ) : alarms.length === 0 ? (
          <p className="text-ink-muted text-sm font-mono">Koi alarm set nahi hai.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {alarms.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 sm:gap-4 px-4 py-3 rounded-lg border border-line bg-surface-2 flex-wrap"
              >
                <div className="flex-1 min-w-[120px]">
                  <p
                    className={`font-display text-2xl ${a.enabled ? "text-ink" : "text-ink-muted"}`}
                  >
                    {formatTime12h(a.time)}
                  </p>
                  {a.label && <p className="text-ink-muted text-xs mt-0.5">{a.label}</p>}
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={a.enabled}
                  onClick={() => handleToggle(a)}
                  className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${
                    a.enabled ? "bg-gold" : "bg-line-strong"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-transform ${
                      a.enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="px-3 py-1.5 rounded-md border border-red-800/50 text-red-300 hover:bg-red-950/30 text-xs font-mono transition-colors shrink-0"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
