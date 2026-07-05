import { toDateKey, addDays } from "./dateUtils";

export const PROGRESS_RANGES = [
  { key: "week", label: "Weekly", days: 7 },
  { key: "month", label: "Monthly", days: 30 },
  { key: "3m", label: "3 Months", days: 90 },
  { key: "6m", label: "6 Months", days: 180 },
];

export function getRangeBounds(rangeKey, today) {
  const days = PROGRESS_RANGES.find((r) => r.key === rangeKey)?.days ?? 30;
  const start = addDays(today, -(days - 1));
  return { start, end: today, days };
}

export function buildCompletionByDate(logs) {
  const map = {};
  logs.forEach((row) => {
    if (!map[row.log_date]) map[row.log_date] = { done: 0, total: 0 };
    map[row.log_date].total += 1;
    if (row.done) map[row.log_date].done += 1;
  });
  return map;
}

export function averagePct(completionByDate) {
  const entries = Object.values(completionByDate);
  if (!entries.length) return 0;
  const sum = entries.reduce((acc, v) => acc + (v.total > 0 ? v.done / v.total : 0), 0);
  return (sum / entries.length) * 100;
}

// Week/month: one bar per day. 3m/6m: one bar per 7-day bucket (otherwise
// 90-180 daily bars would be unreadable).
export function buildRangeChartData(rangeKey, completionByDate, today) {
  const { start, days } = getRangeBounds(rangeKey, today);
  const dayList = Array.from({ length: days }, (_, i) => addDays(start, i));

  if (rangeKey === "week" || rangeKey === "month") {
    return dayList.map((d) => {
      const info = completionByDate[toDateKey(d)];
      const pct = info && info.total > 0 ? Math.round((info.done / info.total) * 100) : 0;
      const label =
        rangeKey === "week"
          ? d.toLocaleDateString("en-US", { weekday: "short" })
          : `${d.getDate()}`;
      return { label, pct };
    });
  }

  const buckets = [];
  for (let i = 0; i < dayList.length; i += 7) buckets.push(dayList.slice(i, i + 7));

  return buckets.map((bucket) => {
    let doneSum = 0;
    let totalSum = 0;
    bucket.forEach((d) => {
      const info = completionByDate[toDateKey(d)];
      if (info) {
        doneSum += info.done;
        totalSum += info.total;
      }
    });
    const pct = totalSum > 0 ? Math.round((doneSum / totalSum) * 100) : 0;
    const label = bucket[0].toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { label, pct };
  });
}
