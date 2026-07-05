"use client";

import { useEffect, useState, useCallback } from "react";
import { FULL_WEEKDAY_LABELS } from "@/lib/dateUtils";
import NavBar from "@/components/NavBar";

function cellKey(columnId, day) {
  return `${columnId}:${day}`;
}

export default function TimetablePage() {
  const [columns, setColumns] = useState([]);
  const [cellValues, setCellValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const applyServerData = useCallback((data) => {
    const nextColumns = (data.columns || []).map((c) => ({ id: c.id, label: c.label }));
    const nextCellValues = {};
    (data.cells || []).forEach((cell) => {
      nextCellValues[cellKey(cell.column_id, cell.day_of_week)] = cell.content;
    });
    setColumns(nextColumns);
    setCellValues(nextCellValues);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const res = await fetch("/api/timetable");
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error);
        setLoading(false);
        return;
      }
      applyServerData(data);
      setLoading(false);
    }
    init();
  }, [applyServerData]);

  function addColumn() {
    setColumns((prev) => [...prev, { id: crypto.randomUUID(), label: "" }]);
  }

  function removeColumn(index) {
    setColumns((prev) => prev.filter((_, i) => i !== index));
  }

  function updateColumnLabel(index, label) {
    setColumns((prev) => prev.map((c, i) => (i === index ? { ...c, label } : c)));
  }

  function updateCell(columnId, day, content) {
    setCellValues((prev) => ({ ...prev, [cellKey(columnId, day)]: content }));
  }

  async function handleSave() {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const cells = [];
    columns.forEach((col, colIndex) => {
      for (let day = 0; day <= 6; day++) {
        const content = cellValues[cellKey(col.id, day)] || "";
        if (content.trim()) cells.push({ colIndex, day, content });
      }
    });

    const res = await fetch("/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columns: columns.map((c) => ({ label: c.label })), cells }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error);
      setSaving(false);
      return;
    }
    applyServerData(data);
    setSaving(false);
    setSuccessMsg("Saved!");
    setTimeout(() => setSuccessMsg(""), 2500);
  }

  return (
    <div className="grain-bg min-h-full flex-1">
      <div className="max-w-5xl mx-auto px-5 py-10 md:py-14">
        <NavBar />

        <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-gold uppercase mb-2">
              Weekly Planner
            </p>
            <h1 className="font-display italic text-4xl md:text-5xl text-ink">Timetable</h1>
            <p className="text-ink-muted text-sm mt-2 max-w-md">
              Apna school jaisa timetable banao — jitne chaho utne time slot add karo,
              har cell khud bharo, aur ek saath Save karo.
            </p>
          </div>
        </header>

        {errorMsg && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-red-800/50 bg-red-950/30 text-red-300 text-sm font-mono">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-gold/40 bg-gold/10 text-gold text-sm font-mono">
            {successMsg}
          </div>
        )}

        {loading ? (
          <p className="text-ink-muted font-mono text-sm">Loading timetable…</p>
        ) : (
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addColumn}
                  className="px-3 py-1.5 rounded-md border border-line text-ink-muted hover:text-gold hover:border-gold/50 text-sm font-mono transition-colors cursor-pointer"
                >
                  + Time Slot
                </button>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 rounded-md bg-gold text-surface text-sm font-medium disabled:opacity-40 hover:bg-gold-bright transition-colors cursor-pointer"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>

            {columns.length === 0 && (
              <p className="text-ink-muted text-sm font-mono mb-4">
                Koi time slot nahi hai — &quot;+ Time Slot&quot; se shuru karo.
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="border-collapse min-w-max">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-surface p-2 text-left text-xs font-mono text-ink-muted uppercase border-b border-line w-28">
                      Day
                    </th>
                    {columns.map((col, idx) => (
                      <th
                        key={col.id}
                        className="p-1 border-b border-l border-line min-w-[150px]"
                      >
                        <div className="flex items-center gap-1">
                          <input
                            value={col.label}
                            onChange={(e) => updateColumnLabel(idx, e.target.value)}
                            placeholder="e.g. 9:00 - 10:00"
                            className="flex-1 bg-surface-2 border border-line rounded px-2 py-1 text-xs font-mono text-ink focus:outline-none focus:ring-2 focus:ring-gold/40"
                          />
                          <button
                            type="button"
                            onClick={() => removeColumn(idx)}
                            aria-label="Remove time slot"
                            className="text-ink-muted hover:text-red-400 text-base leading-none px-1 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FULL_WEEKDAY_LABELS.map((dayLabel, day) => (
                    <tr key={day}>
                      <td
                        className={`sticky left-0 z-10 p-2 text-sm font-mono border-b border-line whitespace-nowrap ${
                          day === 0 ? "text-red-400 bg-red-950/20" : "text-ink-muted bg-surface"
                        }`}
                      >
                        {dayLabel}
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col.id}
                          className={`p-1 border-b border-l border-line ${
                            day === 0 ? "bg-red-950/10" : ""
                          }`}
                        >
                          <input
                            value={cellValues[cellKey(col.id, day)] || ""}
                            onChange={(e) => updateCell(col.id, day, e.target.value)}
                            placeholder="-"
                            className="w-full bg-transparent px-2 py-1.5 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:bg-surface-2 rounded"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <footer className="mt-14 text-center text-ink-muted text-xs font-mono">
          KD Protek · connected to Supabase · har din ka register apne aap ban jaata hai
        </footer>
      </div>
    </div>
  );
}
