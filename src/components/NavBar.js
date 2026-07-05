"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Daily Register" },
  { href: "/timetable", label: "Timetable" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 rounded-lg border border-line bg-surface-2 p-1 w-fit mb-8">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-1.5 rounded-md text-sm font-mono transition-colors ${
            pathname === tab.href
              ? "bg-gold text-surface"
              : "text-ink-muted hover:text-gold"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
