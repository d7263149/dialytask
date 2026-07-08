"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Daily Register", icon: "📋" },
  { href: "/progress", label: "Progress", icon: "📈" },
  { href: "/timetable", label: "Timetable", icon: "🗓️" },
  { href: "/plans", label: "Plans", icon: "🎯" },
  { href: "/clock", label: "Clock", icon: "⏰" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const current = TABS.find((t) => t.href === pathname) || TABS[0];

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    // extra top clearance on mobile only, so this never sits under the
    // fixed clock/timer widget pinned to the top-right corner
    <nav className="mt-9 sm:mt-0 mb-8">
      {/* Desktop / tablet: horizontal pill tab bar (unchanged) */}
      <div className="hidden sm:flex gap-1 rounded-lg border border-line bg-surface-2 p-1 w-fit overflow-x-auto">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-md text-sm font-mono whitespace-nowrap transition-colors ${
              pathname === tab.href
                ? "bg-gold text-surface"
                : "text-ink-muted hover:text-gold"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Mobile: compact hamburger trigger, left-aligned so it never sits
          under the fixed clock widget pinned top-right. */}
      <div className="sm:hidden relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 pl-2.5 pr-3.5 py-2 max-w-[65vw]"
        >
          <span className="flex flex-col gap-[3px] shrink-0" aria-hidden>
            <span className={`block h-0.5 w-4 bg-gold transition-transform ${open ? "translate-y-[5px] rotate-45" : ""}`} />
            <span className={`block h-0.5 w-4 bg-gold transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-4 bg-gold transition-transform ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
          </span>
          <span className="flex items-center gap-1.5 font-mono text-sm text-ink truncate">
            <span className="text-base leading-none">{current.icon}</span>
            <span className="truncate">{current.label}</span>
          </span>
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-2 z-30 w-64 max-w-[85vw] rounded-xl border border-line bg-surface-2 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-mono transition-colors ${
                  pathname === tab.href
                    ? "bg-gold text-surface"
                    : "text-ink hover:bg-surface"
                }`}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                {tab.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
