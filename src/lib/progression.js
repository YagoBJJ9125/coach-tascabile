// Progression / points / sub-level rank system (see docs/PROGRESSION_SYSTEM.md).
// Each exercise gives weighted points to muscle groups; points drive a tier+sublevel
// rank per muscle, linked to the avatar. Points decay with inactivity and junk food.
import { round, clamp, todayKey, addDays } from "./format.js";
import { RANK_TIERS } from "../theme.js";
import { exercisePoints, exerciseById } from "../data/exercises.js";
import { getState, setState } from "./store.js";
import { sleepEffect } from "./sleep.js";

export const MUSCLE_KEYS = ["petto", "schiena", "spalle", "braccia", "gambe", "core"];

// ---- config (tunable — FASE 2 bilanceremo sul campo) ----
export const CFG = {
  graceDays: 3, // giorni senza allenare prima del decadimento
  decayPerDay: 15, // punti persi al giorno oltre la grazia
  sublevelsPerTier: 4,
  proteinPerKg: 1.8, // target proteine/kg per il bonus recupero
};

// Parametrizzazione nutrizionale (FASE 2): ogni regola legge un nutriente del giorno
// e produce punti (+/−) su un muscolo. Estendibile con senso (vedi PROGRESSION_SYSTEM.md).
// `over`: soglia oltre cui scatta; `perUnit`: punti per unità eccedente; `cap`: limite.
export const NUTRITION_RULES = [
  { key: "grassiSaturi", label: "Grassi saturi", muscle: "core", over: 20, perUnit: -1.5, cap: -60 },
  { key: "sodio", label: "Sodio", muscle: "core", over: 2300, perUnit: -0.004, cap: -25 },
  { key: "zuccheri", label: "Zuccheri", muscle: "core", over: 50, perUnit: -0.8, cap: -40 },
  { key: "fibra", label: "Fibra", muscle: "core", over: 25, perUnit: 1.2, cap: 20 }, // bonus
];

// ---- points from a single completed set ----
export function setMusclePoints(def, set, bodyweightKg = 75) {
  const matrix = exercisePoints(def);
  let factor;
  if (def?.tracks === "time") {
    factor = (Number(set.timeSec) || 0) / 30; // 30s = 1×
  } else {
    const reps = Number(set.reps) || 0;
    factor = reps / 10; // 10 reps = 1×
    if (def?.tracks === "weight_reps") {
      const kg = Number(set.kg) || 0;
      factor *= clamp(1 + kg / Math.max(40, bodyweightKg), 1, 3); // load matters
    }
  }
  const out = {};
  for (const m of Object.keys(matrix)) out[m] = matrix[m] * factor;
  return out;
}

// sum points per muscle over a finished session's done sets
export function sessionMusclePoints(session, bodyweightKg = 75) {
  const totals = {};
  for (const ex of session.exercises || []) {
    const def = exerciseById(ex.exerciseId);
    for (const s of ex.sets || []) {
      if (!s.done) continue;
      const pts = setMusclePoints(def, s, bodyweightKg);
      for (const m of Object.keys(pts)) totals[m] = (totals[m] || 0) + pts[m];
    }
  }
  for (const m of Object.keys(totals)) totals[m] = round(totals[m]);
  return totals;
}

// ---- rank sub-levels ----
const TOTAL_STEPS = RANK_TIERS.length * CFG.sublevelsPerTier; // 28
export const STEP_THRESHOLDS = (() => {
  const arr = [0];
  let step = 250;
  for (let g = 1; g < TOTAL_STEPS; g++) {
    arr.push(arr[g - 1] + Math.round(step));
    step *= 1.15;
  }
  return arr; // cumulative points to REACH step g
})();

// points -> {step, tier, tierIdx, sublevel(4..1), label, progress, pointsToNext}
export function levelForPoints(points = 0) {
  const p = Math.max(0, points);
  let g = 0;
  for (let i = 0; i < STEP_THRESHOLDS.length; i++) if (p >= STEP_THRESHOLDS[i]) g = i;
  const tierIdx = Math.floor(g / CFG.sublevelsPerTier);
  const within = g % CFG.sublevelsPerTier;
  const sublevel = CFG.sublevelsPerTier - within; // entry=liv.4, top=liv.1
  const tier = RANK_TIERS[tierIdx];
  const cur = STEP_THRESHOLDS[g];
  const next = STEP_THRESHOLDS[g + 1];
  const progress = next != null ? clamp((p - cur) / (next - cur), 0, 1) : 1;
  return {
    step: g,
    tier,
    tierIdx,
    sublevel,
    label: `${tier.label} liv.${sublevel}`,
    points: round(p),
    progress,
    pointsToNext: next != null ? round(next - p) : 0,
  };
}

// current points for a muscle from store (already reconciled)
export function musclePoints(muscleRanks, muscle) {
  return muscleRanks?.[muscle]?.points || 0;
}

// ---- nutrition → muscle points (+/−) for one day, via NUTRITION_RULES ----
export function nutritionEffects(dayLog, weightKg = 75) {
  if (!dayLog) return {};
  // aggregate nutrients of the day (macros + micros)
  const n = { p: 0 };
  for (const meal of Object.keys(dayLog)) {
    for (const e of dayLog[meal] || []) {
      n.p += e.p || 0;
      if (e.micros) for (const k of Object.keys(e.micros)) n[k] = (n[k] || 0) + e.micros[k];
    }
  }
  const out = {};
  const add = (m, v) => {
    if (!v) return;
    out[m] = round((out[m] || 0) + v);
  };
  for (const r of NUTRITION_RULES) {
    const val = n[r.key] || 0;
    const excess = val - r.over;
    if (r.perUnit < 0 && excess > 0) add(r.muscle, Math.max(r.cap, excess * r.perUnit));
    if (r.perUnit > 0 && excess > 0) add(r.muscle, Math.min(r.cap, excess * r.perUnit));
  }
  // protein recovery bonus: hitting the daily target gives a small +pt to ALL muscles
  const proteinTarget = CFG.proteinPerKg * weightKg;
  if (proteinTarget > 0 && n.p >= proteinTarget * 0.9) {
    for (const m of MUSCLE_KEYS) add(m, 4);
  }
  return out;
}

// record a points change into the aggregated log (per date+muscle+cause)
export function recordPoints(s, date, muscle, delta, cause) {
  if (!delta) return;
  if (!s.pointsLog) s.pointsLog = [];
  const hit = s.pointsLog.find(
    (e) => e.date === date && e.muscle === muscle && e.cause === cause
  );
  if (hit) hit.delta = round(hit.delta + delta);
  else s.pointsLog.push({ date, muscle, delta: round(delta), cause });
  // keep last ~120 days
  const cut = addDays(date, -120);
  s.pointsLog = s.pointsLog.filter((e) => e.date >= cut);
}

// ---- reconcile: apply inactivity decay + past-day nutrition effects, once per day ----
export function reconcile(nowKey = todayKey()) {
  setState((s) => {
    const weightKg = Number(s.profile.weight) || 75;
    for (const m of MUSCLE_KEYS) {
      if (!s.muscleRanks[m]) s.muscleRanks[m] = { points: 0 };
    }
    const last = s.gamify.lastReconcile;
    const sleepGoal = Number(s.profile.sleepGoal) || 8;
    // 1) nutrition + sleep effects for each fully-elapsed day since last reconcile
    if (last && last < nowKey) {
      let d = last;
      let guard = 0;
      while (d < nowKey && guard < 121) {
        // nutrition
        const eff = nutritionEffects(s.foodLog[d], weightKg);
        for (const m of Object.keys(eff)) {
          s.muscleRanks[m].points = Math.max(0, (s.muscleRanks[m].points || 0) + eff[m]);
          recordPoints(s, d, m, eff[m], "cibo");
        }
        // sleep
        const sl = s.sleep.find((x) => x.date === d);
        const slEff = sl ? sleepEffect(sl.hours, sleepGoal) : 0;
        if (slEff) {
          for (const m of MUSCLE_KEYS) {
            s.muscleRanks[m].points = Math.max(0, (s.muscleRanks[m].points || 0) + slEff);
            recordPoints(s, d, m, slEff, "sonno");
          }
        }
        d = addDays(d, 1);
        guard++;
      }
    }
    // 2) inactivity decay per muscle
    for (const m of MUSCLE_KEYS) {
      const r = s.muscleRanks[m];
      const lastTrained = r.lastTrained || r.lastDecay || last || nowKey;
      const daysSince = daysBetween(lastTrained, nowKey);
      const decayDays = Math.max(0, daysSince - CFG.graceDays);
      const prevDecayDays = r.lastDecay
        ? Math.max(0, daysBetween(lastTrained, r.lastDecay) - CFG.graceDays)
        : 0;
      const toApply = Math.max(0, decayDays - prevDecayDays);
      if (toApply > 0) {
        const lost = Math.min(r.points || 0, toApply * CFG.decayPerDay);
        r.points = Math.max(0, (r.points || 0) - toApply * CFG.decayPerDay);
        r.lastDecay = nowKey;
        recordPoints(s, nowKey, m, -lost, "inattivita");
      }
    }
    s.gamify.lastReconcile = nowKey;
    return s;
  });
}

// avatar development 0..1 (Legno liv.4 = 0 → Titan liv.1 = 1)
export function development(points) {
  const lvl = levelForPoints(points);
  return clamp(lvl.step / (TOTAL_STEPS - 1), 0, 1);
}

// monthly balance per muscle from the points log: { muscle: {total, allenamento, cibo, inattivita} }
export function monthlyBalance(pointsLog, mKey) {
  const out = {};
  for (const m of MUSCLE_KEYS)
    out[m] = { total: 0, allenamento: 0, cibo: 0, sonno: 0, inattivita: 0 };
  for (const e of pointsLog || []) {
    if (!e.date.startsWith(mKey)) continue;
    if (!out[e.muscle]) continue;
    out[e.muscle].total += e.delta;
    out[e.muscle][e.cause] = (out[e.muscle][e.cause] || 0) + e.delta;
  }
  for (const m of MUSCLE_KEYS)
    for (const k of Object.keys(out[m])) out[m][k] = round(out[m][k]);
  return out;
}

function daysBetween(a, b) {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86400000);
}

// preview a session's contribution + resulting level changes (for the finish summary)
export function levelDeltaFromPoints(beforePts, addPts) {
  const before = levelForPoints(beforePts);
  const after = levelForPoints(beforePts + addPts);
  return { before, after, promoted: after.step > before.step };
}
