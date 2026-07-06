"use client";

import { useState } from "react";
import NavBar from "@/components/NavBar";
import DigitalClock from "@/components/clock/DigitalClock";
import AlarmPanel from "@/components/clock/AlarmPanel";
import StopwatchPanel from "@/components/clock/StopwatchPanel";
import TimerPanel from "@/components/clock/TimerPanel";

const SUB_TABS = [
  { key: "clock", label: "Clock" },
  { key: "alarm", label: "Alarm" },
  { key: "stopwatch", label: "Stopwatch" },
  { key: "timer", label: "Timer" },
];

export default function ClockPage() {
  const [tab, setTab] = useState("clock");

  return (
    <div className="grain-bg min-h-full flex-1">
      <div className="max-w-5xl mx-auto px-5 py-10 md:py-14">
        <NavBar />

        <header className="mb-8">
          <p className="font-mono text-xs tracking-[0.2em] text-gold uppercase mb-2">
            Utilities
          </p>
          <h1 className="font-display italic text-4xl md:text-5xl text-ink">Clock</h1>
          <p className="text-ink-muted text-sm mt-2 max-w-md">
            Alarm, stopwatch aur timer — sab ek hi jagah, mobile clock jaisa.
          </p>
        </header>

        <nav className="flex gap-1 rounded-lg border border-line bg-surface-2 p-1 w-full sm:w-fit mb-8 overflow-x-auto">
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-mono whitespace-nowrap transition-colors ${
                tab === t.key ? "bg-gold text-surface" : "text-ink-muted hover:text-gold"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="max-w-xl">
          {tab === "clock" && <DigitalClock />}
          {tab === "alarm" && <AlarmPanel />}
          {tab === "stopwatch" && <StopwatchPanel />}
          {tab === "timer" && <TimerPanel />}
        </div>

        <footer className="mt-14 text-center text-ink-muted text-xs font-mono">
          KD Protek · connected to Supabase · har din ka register apne aap ban jaata hai
        </footer>
      </div>
    </div>
  );
}
