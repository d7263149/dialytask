// Local-timezone-safe date helpers (avoid UTC shift bugs from toISOString)

export function toDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey() {
  return toDateKey(new Date());
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Inclusive list of "YYYY-MM-DD" keys from startKey to endKey.
export function enumerateDateKeys(startKey, endKey) {
  const keys = [];
  let cursor = new Date(`${startKey}T00:00:00`);
  const end = new Date(`${endKey}T00:00:00`);
  while (cursor <= end) {
    keys.push(toDateKey(cursor));
    cursor = addDays(cursor, 1);
  }
  return keys;
}

export function getMonthMatrix(year, monthIndex) {
  // monthIndex: 0-11
  const firstDay = new Date(year, monthIndex, 1);
  const startWeekday = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, monthIndex, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// index 0 = Sunday .. 6 = Saturday, matching Date#getDay()
export const FULL_WEEKDAY_LABELS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

// "HH:MM" (24-hour, matches <input type="time"> value) -> "h:mm AM/PM"
export function formatTime12(hhmm) {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  const h24 = parseInt(hStr, 10);
  if (Number.isNaN(h24)) return "";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const ampm = h24 >= 12 ? "PM" : "AM";
  return `${h12}:${mStr} ${ampm}`;
}
