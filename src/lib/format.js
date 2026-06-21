// Small pure helpers shared across pages.

export const round = (n) => Math.round(n);
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const norm = (s) => (s || "").trim().toLowerCase();
export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// date keys are LOCAL "YYYY-MM-DD" (not UTC) — using toISOString here would shift
// the day by the timezone offset and break day boundaries / addDays.
export const dateKey = (d) => {
  const x = d instanceof Date ? d : new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const todayKey = () => dateKey(new Date());

export const monthKey = (iso) => (iso || todayKey()).slice(0, 7); // "YYYY-MM"

export const addDays = (iso, n) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return dateKey(d);
};

export const fmtDateLong = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

export const fmtDateShort = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });

export const fmtEur = (n) =>
  (Math.round(n * 100) / 100).toFixed(2).replace(".", ",") + " €";

// seconds → "1m 30s" / "45s"
export const fmtDuration = (s) => {
  s = Math.round(s);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m && r) return `${m}m ${r}s`;
  if (m) return `${m}m`;
  return `${r}s`;
};

// seconds → "MM:SS" or "HH:MM:SS"
export const fmtClock = (s) => {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const p = (n) => String(n).padStart(2, "0");
  return h ? `${p(h)}:${p(m)}:${p(r)}` : `${p(m)}:${p(r)}`;
};

export const isToday = (iso) => iso === todayKey();
