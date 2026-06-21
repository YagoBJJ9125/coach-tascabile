// Body-weight logging + trend (regression-restore from v1).
import { setState, getState } from "./store.js";
import { todayKey } from "./format.js";

// log/replace today's weight; keeps profile.weight in sync (used by nutrition).
export function logWeight(kg) {
  const v = Number(kg);
  if (!v) return;
  setState((s) => {
    const today = todayKey();
    const i = s.weights.findIndex((w) => w.date === today);
    if (i >= 0) s.weights[i].kg = v;
    else s.weights.push({ date: today, kg: v });
    s.weights.sort((a, b) => a.date.localeCompare(b.date));
    s.profile.weight = v;
    return s;
  });
}

export function latestWeight() {
  const w = getState().weights;
  return w.length ? w[w.length - 1].kg : Number(getState().profile.weight) || null;
}

// linear trend over last N entries -> kg per week
export function weightTrend(n = 14) {
  const w = getState().weights.slice(-n);
  if (w.length < 2) return null;
  const t0 = new Date(w[0].date + "T00:00:00").getTime();
  const pts = w.map((x) => ({
    days: (new Date(x.date + "T00:00:00").getTime() - t0) / 86400000,
    kg: x.kg,
  }));
  const m = pts.length;
  const sx = pts.reduce((a, p) => a + p.days, 0);
  const sy = pts.reduce((a, p) => a + p.kg, 0);
  const sxx = pts.reduce((a, p) => a + p.days * p.days, 0);
  const sxy = pts.reduce((a, p) => a + p.days * p.kg, 0);
  const denom = m * sxx - sx * sx;
  if (!denom) return null;
  const slope = (m * sxy - sx * sy) / denom; // kg/day
  return { perWeek: slope * 7, from: w[0].kg, to: w[w.length - 1].kg, points: w };
}
