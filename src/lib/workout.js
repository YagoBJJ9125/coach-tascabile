// Workout & Rank helpers.
import { round } from "./format.js";
import { exerciseById, TRACK_MET } from "../data/exercises.js";
import { RANK_TIERS } from "../theme.js";

// Estimate a session's calorie burn from its sets.
export function sessionBurn(session, weightKg = 75) {
  let kcal = 0;
  for (const ex of session.exercises || []) {
    const def = exerciseById(ex.exerciseId);
    const met = (def && def.met) || (def && TRACK_MET[def.tracks]) || 4;
    for (const s of ex.sets || []) {
      if (!s.done) continue;
      if (def && def.tracks === "time" && s.timeSec) {
        kcal += met * weightKg * (s.timeSec / 3600);
      } else if (def && def.tracks === "distance" && s.timeSec) {
        kcal += met * weightKg * (s.timeSec / 3600);
      } else {
        // strength/reps set ~ 45s effort
        kcal += met * weightKg * (45 / 3600);
      }
    }
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
