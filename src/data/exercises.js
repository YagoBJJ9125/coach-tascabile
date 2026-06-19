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
