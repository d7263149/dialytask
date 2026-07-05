"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setBusy(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error || "Login fail ho gaya.");
      setBusy(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="grain-bg min-h-full flex-1 flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-gold uppercase mb-2">
            Daily Register
          </p>
          <h1 className="font-display italic text-4xl text-ink">KD Protek</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-line bg-surface p-6 flex flex-col gap-4"
        >
          <h2 className="font-display text-xl text-ink mb-1">Login</h2>

          {errorMsg && (
            <div className="px-3 py-2 rounded-lg border border-red-800/50 bg-red-950/30 text-red-300 text-sm font-mono">
              {errorMsg}
            </div>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-xs font-mono text-ink-muted uppercase tracking-wide">
              User ID
            </span>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              className="bg-surface-2 border border-line rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-mono text-ink-muted uppercase tracking-wide">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surface-2 border border-line rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </label>

          <button
            type="submit"
            disabled={busy || !userId.trim() || !password}
            className="mt-2 px-4 py-2 rounded-md bg-gold text-surface text-sm font-medium disabled:opacity-40 hover:bg-gold-bright transition-colors"
          >
            {busy ? "Logging in…" : "Login"}
          </button>

          <p className="text-center text-ink-muted text-sm">
            Naya account? <Link href="/register" className="text-gold hover:underline">Register karo</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
