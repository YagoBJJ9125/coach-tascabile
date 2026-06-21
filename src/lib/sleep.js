// Sleep tracking (restored from v1) + readiness + points effect (FASE 3).
import { round, clamp, todayKey } from "./format.js";
import { setState } from "./store.js";

// "23:30" + "07:00" -> hours (handles overnight), rounded to 0.25
export function sleepHoursFrom(asleep, wake) {
  if (!asleep || !wake) return 0;
  const p = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  let d = p(wake) - p(asleep);
  if (d <= 0) d += 1440;
  return Math.round((d / 60) * 4) / 4;
}

export function logSleep(asleep, wake) {
  const hours = sleepHoursFrom(asleep, wake);
  if (!hours) return;
  setState((s) => {
    const today = todayKey();
    const i = s.sleep.findIndex((x) => x.date === today);
    const entry = { date: today, asleep, wake, hours };
    if (i >= 0) s.sleep[i] = entry;
    else s.sleep.push(entry);
    s.sleep.sort((a, b) => a.date.localeCompare(b.date));
    return s;
  });
}

export function sleepStats(sleepLog, goal = 8) {
  if (!sleepLog || !sleepLog.length) return null;
  const sorted = [...sleepLog].sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sorted.slice(-7),
    last3 = sorted.slice(-3);
  const avg = (arr) => arr.reduce((s, x) => s + x.hours, 0) / arr.length;
  const avg7 = +avg(last7).toFixed(1),
    avg3 = +avg(last3).toFixed(1);
  const debt = +last7.reduce((s, x) => s + Math.max(0, goal - x.hours), 0).toFixed(1);
  const mad = last7.reduce((s, x) => s + Math.abs(x.hours - avg7), 0) / last7.length;
  const regularity = clamp(Math.round(100 - mad * 40), 0, 100);
  return { nights: sleepLog.length, avg7, avg3, debt, regularity };
}

// readiness score (0-100) from recent sleep + training load (Lifoff "Prontezza")
export function readiness(sleepLog, sessions, goal = 8) {
  const stats = sleepStats(sleepLog, goal);
  if (!stats) return null;
  const sleepComp = clamp(Math.round(((stats.avg3 - 4) / (goal - 4)) * 100), 0, 100);
  const debtPen = Math.min(25, Math.round(stats.debt * 3));
  // training load last 2 days
  const cut = new Date();
  cut.setDate(cut.getDate() - 2);
  let recentSets = 0,
    minutes = 0;
  for (const s of sessions || []) {
    if (!s.finished) continue;
    if (new Date(s.date + "T00:00:00") < cut) continue;
    minutes += (s.durationSec || 0) / 60;
    for (const ex of s.exercises) recentSets += ex.sets.filter((x) => x.done).length;
  }
  const loadPen = Math.min(25, Math.round(recentSets * 1.5 + (minutes > 90 ? 8 : 0)));
  const score = clamp(sleepComp - debtPen - loadPen, 0, 100);
  let level, advice, color;
  if (score >= 75) {
    level = "Pronto";
    color = "#4ade80";
    advice = "Via libera: oggi puoi spingere su intensità o carico.";
  } else if (score >= 50) {
    level = "Moderato";
    color = "#ff9f43";
    advice = "Meglio intensità media con un buon defaticamento.";
  } else {
    level = "Recupero";
    color = "#ff6b5e";
    advice = "Sotto recupero: oggi mobilità, cardio leggero o riposo.";
  }
  return { score, level, advice, color, debtPen, loadPen, stats };
}

// points delta applied to every muscle for a day's sleep (cause "sonno")
export function sleepEffect(hours, goal = 8) {
  if (!hours) return 0;
  if (hours < goal - 2) return -8; // grave deprivazione
  if (hours < goal - 1) return -4;
  if (hours >= goal) return 3; // buon recupero
  return 0;
}
