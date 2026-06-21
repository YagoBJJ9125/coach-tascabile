// Seed exercise library. `tracks` = which set fields to log.
//   "weight_reps" -> kg + ripetizioni
//   "reps"        -> ripetizioni (corpo libero)
//   "time"        -> tempo (hold, secondi)
//   "distance"    -> distanza + tempo (cardio)
// `met` used for calorie estimate when only time is logged.
import { getState } from "../lib/store.js";

export const SEED_EXERCISES = [
  // PETTO
  { id: "ex_panca_piana", name: "Panca piana", muscle: "petto", equipment: "bilanciere", tracks: "weight_reps", emoji: "🏋️" },
  { id: "ex_panca_inclinata_manubri", name: "Panca inclinata con manubri", muscle: "petto", equipment: "manubri", tracks: "weight_reps", emoji: "🏋️" },
  { id: "ex_piegamenti", name: "Piegamenti a terra", muscle: "petto", equipment: "corpo_libero", tracks: "reps", emoji: "🤸" },
  { id: "ex_piegamenti_ginocchio", name: "Piegamenti sul ginocchio", muscle: "petto", equipment: "corpo_libero", tracks: "reps", emoji: "🤸" },
  { id: "ex_dip_panca", name: "Dip alla panca", muscle: "petto", equipment: "corpo_libero", tracks: "reps", emoji: "🪑" },
  { id: "ex_croci_cavi", name: "Croci ai cavi", muscle: "petto", equipment: "cavi", tracks: "weight_reps", emoji: "🔗" },

  // SCHIENA
  { id: "ex_trazioni", name: "Trazioni alla sbarra", muscle: "schiena", equipment: "corpo_libero", tracks: "reps", emoji: "🧗" },
  { id: "ex_rematore_bilanciere", name: "Rematore con bilanciere", muscle: "schiena", equipment: "bilanciere", tracks: "weight_reps", emoji: "🚣" },
  { id: "ex_rematore_inverso_tavolo", name: "Rematore a presa inversa con tavolo", muscle: "schiena", equipment: "corpo_libero", tracks: "reps", emoji: "🚣" },
  { id: "ex_stacco", name: "Stacco da terra", muscle: "schiena", equipment: "bilanciere", tracks: "weight_reps", emoji: "🏋️" },
  { id: "ex_lat_machine", name: "Lat machine", muscle: "schiena", equipment: "macchina", tracks: "weight_reps", emoji: "🛠️" },
  { id: "ex_pulldown_cavi", name: "Pulldown ai cavi", muscle: "schiena", equipment: "cavi", tracks: "weight_reps", emoji: "🔗" },

  // SPALLE
  { id: "ex_military_press", name: "Lento avanti con bilanciere", muscle: "spalle", equipment: "bilanciere", tracks: "weight_reps", emoji: "🏋️" },
  { id: "ex_shoulder_press_manubri", name: "Pressa per le spalle con manubri", muscle: "spalle", equipment: "manubri", tracks: "weight_reps", emoji: "🏋️" },
  { id: "ex_alzate_laterali", name: "Alzate laterali con manubri", muscle: "spalle", equipment: "manubri", tracks: "weight_reps", emoji: "🤲" },
  { id: "ex_alzate_frontali", name: "Alzate frontali con manubri", muscle: "spalle", equipment: "manubri", tracks: "weight_reps", emoji: "🤲" },
  { id: "ex_pike_pushup", name: "Piegamenti Pike sul ginocchio", muscle: "spalle", equipment: "corpo_libero", tracks: "reps", emoji: "🤸" },

  // BRACCIA
  { id: "ex_curl_bilanciere", name: "Curl con bilanciere", muscle: "braccia", equipment: "bilanciere", tracks: "weight_reps", emoji: "💪" },
  { id: "ex_curl_manubri", name: "Curl con manubri", muscle: "braccia", equipment: "manubri", tracks: "weight_reps", emoji: "💪" },
  { id: "ex_curl_martello", name: "Curl a martello", muscle: "braccia", equipment: "manubri", tracks: "weight_reps", emoji: "🔨" },
  { id: "ex_french_press", name: "French press", muscle: "braccia", equipment: "bilanciere", tracks: "weight_reps", emoji: "💪" },
  { id: "ex_pushdown_cavi", name: "Push-down ai cavi", muscle: "braccia", equipment: "cavi", tracks: "weight_reps", emoji: "🔗" },
  { id: "ex_dip_parallele", name: "Dip alle parallele", muscle: "braccia", equipment: "corpo_libero", tracks: "reps", emoji: "🤸" },

  // GAMBE
  { id: "ex_squat", name: "Squat", muscle: "gambe", equipment: "bilanciere", tracks: "weight_reps", emoji: "🏋️" },
  { id: "ex_squat_corpo_libero", name: "Squat a corpo libero", muscle: "gambe", equipment: "corpo_libero", tracks: "reps", emoji: "🤸" },
  { id: "ex_affondi", name: "Affondi", muscle: "gambe", equipment: "manubri", tracks: "weight_reps", emoji: "🚶" },
  { id: "ex_leg_press", name: "Leg press", muscle: "gambe", equipment: "macchina", tracks: "weight_reps", emoji: "🛠️" },
  { id: "ex_leg_curl", name: "Leg curl da sdraiato", muscle: "gambe", equipment: "macchina", tracks: "weight_reps", emoji: "🛠️" },
  { id: "ex_leg_extension", name: "Leg extension", muscle: "gambe", equipment: "macchina", tracks: "weight_reps", emoji: "🛠️" },
  { id: "ex_polpacci", name: "Calf raise in piedi", muscle: "gambe", equipment: "corpo_libero", tracks: "reps", emoji: "🦵" },
  { id: "ex_stacco_rumeno", name: "Stacco rumeno", muscle: "gambe", equipment: "bilanciere", tracks: "weight_reps", emoji: "🏋️" },

  // CORE
  { id: "ex_plank", name: "Plank", muscle: "core", equipment: "corpo_libero", tracks: "time", emoji: "🧘" },
  { id: "ex_crunch", name: "Crunch", muscle: "core", equipment: "corpo_libero", tracks: "reps", emoji: "🤸" },
  { id: "ex_crunch_bici", name: "Crunch a bicicletta", muscle: "core", equipment: "corpo_libero", tracks: "reps", emoji: "🚲" },
  { id: "ex_addominali", name: "Addominali", muscle: "core", equipment: "corpo_libero", tracks: "reps", emoji: "🤸" },
  { id: "ex_ab_rollout_trx", name: "Ab rollout con TRX", muscle: "core", equipment: "trx", tracks: "reps", emoji: "🎽" },
  { id: "ex_russian_twist", name: "Russian twist", muscle: "core", equipment: "corpo_libero", tracks: "reps", emoji: "🔄" },
  { id: "ex_mountain_climber", name: "Mountain climber", muscle: "core", equipment: "corpo_libero", tracks: "time", emoji: "⛰️" },

  // CARDIO (core/gambe misti)
  { id: "ex_corsa", name: "Corsa", muscle: "gambe", equipment: "corpo_libero", tracks: "distance", emoji: "🏃", met: 9 },
  { id: "ex_cyclette", name: "Cyclette", muscle: "gambe", equipment: "macchina", tracks: "distance", emoji: "🚴", met: 7 },
];

// MET fallbacks per track type when not specified on the exercise.
export const TRACK_MET = { weight_reps: 5, reps: 4, time: 3, distance: 8 };

// merged library = seed + user custom (from store)
export function allExercises() {
  return [...SEED_EXERCISES, ...getState().exercisesCustom];
}

export function exerciseById(id) {
  return allExercises().find((e) => e.id === id) || null;
}

// pool the coach is allowed to prescribe from, honoring user prefs
// (es. "voglio fare solo push-up e squat"). Falls back to all.
export function coachExercisePool() {
  const { prefs } = getState();
  const all = allExercises();
  if (!prefs || !prefs.restrict || !prefs.allowedExerciseIds?.length) return all;
  const set = new Set(prefs.allowedExerciseIds);
  const pool = all.filter((e) => set.has(e.id));
  return pool.length ? pool : all;
}

// muscle groups that the allowed pool can NOT train (coverage gaps).
// Considers the full points matrix, not just the primary muscle.
export function uncoveredMuscles() {
  const { prefs } = getState();
  if (!prefs || !prefs.restrict || !prefs.allowedExerciseIds?.length) return [];
  const covered = new Set();
  for (const e of coachExercisePool())
    for (const m of Object.keys(exercisePoints(e))) covered.add(m);
  return ["petto", "schiena", "spalle", "braccia", "gambe", "core"].filter(
    (m) => !covered.has(m)
  );
}

// ---- Points matrix: how much each exercise develops each muscle group ----
// Weights are "punti per ~10 ripetizioni standard" (vedi docs/PROGRESSION_SYSTEM.md).
// Primario ~10, sinergisti 2-6. Fallback = primario 10 se non in mappa.
export const EXERCISE_POINTS = {
  // PETTO
  ex_panca_piana: { petto: 10, braccia: 5, spalle: 4 },
  ex_panca_inclinata_manubri: { petto: 9, spalle: 5, braccia: 4 },
  ex_piegamenti: { petto: 10, braccia: 5, spalle: 3, core: 2 },
  ex_piegamenti_ginocchio: { petto: 8, braccia: 4, spalle: 3, core: 1 },
  ex_dip_panca: { petto: 7, braccia: 8, spalle: 2 },
  ex_croci_cavi: { petto: 10, spalle: 2 },
  // SCHIENA
  ex_trazioni: { schiena: 10, braccia: 6, spalle: 3, core: 2, petto: 1 },
  ex_rematore_bilanciere: { schiena: 10, braccia: 4, spalle: 2 },
  ex_rematore_inverso_tavolo: { schiena: 8, braccia: 5, spalle: 2, core: 2 },
  ex_stacco: { schiena: 8, gambe: 7, core: 4 },
  ex_lat_machine: { schiena: 9, braccia: 5, spalle: 2 },
  ex_pulldown_cavi: { schiena: 9, braccia: 4 },
  // SPALLE
  ex_military_press: { spalle: 10, braccia: 5, core: 3, petto: 2 },
  ex_shoulder_press_manubri: { spalle: 10, braccia: 4, core: 2 },
  ex_alzate_laterali: { spalle: 10 },
  ex_alzate_frontali: { spalle: 9, petto: 2 },
  ex_pike_pushup: { spalle: 9, braccia: 5, petto: 2, core: 2 },
  // BRACCIA
  ex_curl_bilanciere: { braccia: 10 },
  ex_curl_manubri: { braccia: 10 },
  ex_curl_martello: { braccia: 10 },
  ex_french_press: { braccia: 10 },
  ex_pushdown_cavi: { braccia: 10 },
  ex_dip_parallele: { braccia: 9, petto: 5, spalle: 2 },
  // GAMBE
  ex_squat: { gambe: 10, core: 3, schiena: 1 },
  ex_squat_corpo_libero: { gambe: 9, core: 2 },
  ex_affondi: { gambe: 9, core: 2 },
  ex_leg_press: { gambe: 10 },
  ex_leg_curl: { gambe: 9 },
  ex_leg_extension: { gambe: 9 },
  ex_polpacci: { gambe: 7 },
  ex_stacco_rumeno: { gambe: 8, schiena: 5, core: 2 },
  // CORE
  ex_plank: { core: 10, spalle: 2 },
  ex_crunch: { core: 10 },
  ex_crunch_bici: { core: 10 },
  ex_addominali: { core: 10 },
  ex_ab_rollout_trx: { core: 10, braccia: 3, spalle: 2 },
  ex_russian_twist: { core: 10 },
  ex_mountain_climber: { core: 8, spalle: 3, gambe: 3 },
  // CARDIO
  ex_corsa: { gambe: 6, core: 1 },
  ex_cyclette: { gambe: 6 },
};

export function exercisePoints(ex) {
  if (!ex) return {};
  return EXERCISE_POINTS[ex.id] || (ex.muscle ? { [ex.muscle]: 10 } : {});
}
