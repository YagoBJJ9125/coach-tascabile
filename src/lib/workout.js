// Workout & Rank helpers.
import { round, clamp } from "./format.js";
import { exerciseById, exerciseMeta } from "../data/exercises.js";
import { RANK_TIERS } from "../theme.js";

// Per-set calorie estimate (GROSS), MOTORE MET guidato dai metadati dell'esercizio
// (categoria → MET + sec/rep, vedi exerciseMeta). Scala con la DURATA effettiva:
//  - time/distance: secondi loggati × MET
//  - forza/reps: durata = reps × sec/rep (dalla categoria); il CARICO aumenta lo sforzo (MET)
// Così più ripetizioni e più peso = più kcal, e anche un esercizio non mappato è stimabile.
export function setBurn(def, set, weightKg = 75) {
  const tracks = (def && def.tracks) || "weight_reps";
  const meta = exerciseMeta(def); // { met, secPerRep, category }
  if (tracks === "time" || tracks === "distance") {
    const sec = Number(set.timeSec) || 0;
    return meta.met * weightKg * (sec / 3600);
  }
  const reps = Number(set.reps) || 0;
  if (!reps) return 0; // senza reps non si stima nulla
  let metEff = meta.met;
  if (tracks === "weight_reps") {
    const kg = Number(set.kg) || 0;
    metEff *= clamp(1 + kg / Math.max(40, weightKg), 1, 3); // il carico aumenta lo sforzo
  }
  return metEff * weightKg * ((reps * meta.secPerRep) / 3600);
}

// Estimate a session's calorie burn from its COMPLETED sets (used at finish).
export function sessionBurn(session, weightKg = 75) {
  let kcal = 0;
  for (const ex of session.exercises || []) {
    const def = exerciseById(ex.exerciseId);
    for (const s of ex.sets || []) {
      if (!s.done) continue;
      kcal += setBurn(def, s, weightKg);
    }
  }
  return round(kcal);
}

// Burn over ALL sets (done or not) — the planned estimate for a workout you set up.
export function sessionBurnAll(session, weightKg = 75) {
  let kcal = 0;
  for (const ex of session.exercises || []) {
    const def = exerciseById(ex.exerciseId);
    for (const s of ex.sets || []) kcal += setBurn(def, s, weightKg);
  }
  return round(kcal);
}

export function sessionVolume(session) {
  let vol = 0,
    sets = 0,
    reps = 0;
  for (const ex of session.exercises || []) {
    for (const s of ex.sets || []) {
      if (!s.done) continue;
      sets += 1;
      reps += Number(s.reps) || 0;
      vol += (Number(s.kg) || 0) * (Number(s.reps) || 0);
    }
  }
  return { volume: round(vol), sets, reps };
}

// completed sets per muscle over the last `days` (default 7), across sessions
export function weeklySetsByMuscle(sessions, days = 7) {
  const cut = new Date();
  cut.setDate(cut.getDate() - days);
  const out = {};
  for (const s of sessions || []) {
    if (!s.finished) continue;
    if (new Date(s.date + "T00:00:00") < cut) continue;
    const m = sessionMuscles(s);
    for (const k of Object.keys(m)) out[k] = (out[k] || 0) + m[k];
  }
  return out;
}

// muscles trained in a session -> {muscleKey: setCount}
export function sessionMuscles(session) {
  const out = {};
  for (const ex of session.exercises || []) {
    const def = exerciseById(ex.exerciseId);
    if (!def) continue;
    const done = (ex.sets || []).filter((s) => s.done).length;
    if (!done) continue;
    out[def.muscle] = (out[def.muscle] || 0) + done;
  }
  return out;
}

// estimated 1RM (Epley) for a set
export function e1rm(kg, reps) {
  if (!kg || !reps) return 0;
  return round(kg * (1 + reps / 30));
}

// ---- Rank system (EPIC 5) ----
// Each muscle accrues "points" from volume; thresholds map to tiers.
// 7 tiers; points needed grow ~1.8x per tier.
export const RANK_THRESHOLDS = (() => {
  const out = [];
  let need = 0;
  let step = 2000; // points for first promotion
  for (let i = 0; i < RANK_TIERS.length; i++) {
    out.push(need);
    need += step;
    step = round(step * 1.8);
  }
  return out; // [0, 2000, 5600, ...]
})();

export function tierForPoints(points) {
  let idx = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    if (points >= RANK_THRESHOLDS[i]) idx = i;
  }
  return { idx, tier: RANK_TIERS[idx] };
}

// progress (0..1) toward next tier
export function tierProgress(points) {
  const { idx } = tierForPoints(points);
  const cur = RANK_THRESHOLDS[idx];
  const next = RANK_THRESHOLDS[idx + 1];
  if (next == null) return 1;
  return Math.max(0, Math.min(1, (points - cur) / (next - cur)));
}

// points earned by a muscle from one session (volume-based, reps-only counts too)
export function musclePointsFromSession(session, muscleKey) {
  let pts = 0;
  for (const ex of session.exercises || []) {
    const def = exerciseById(ex.exerciseId);
    if (!def || def.muscle !== muscleKey) continue;
    for (const s of ex.sets || []) {
      if (!s.done) continue;
      const kg = Number(s.kg) || 0;
      const reps = Number(s.reps) || 0;
      if (kg && reps) pts += kg * reps * 0.5;
      else if (reps) pts += reps * 8; // bodyweight reps
      else if (s.timeSec) pts += s.timeSec * 1.5; // holds
    }
  }
  return round(pts);
}
