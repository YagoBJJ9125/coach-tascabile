// Reactive app store. Holds the whole state, persists to localStorage,
// and exposes hooks via useSyncExternalStore.
import { useSyncExternalStore } from "react";
import { loadRaw, saveRaw } from "./storage.js";
import { todayKey } from "./format.js";

export const DEFAULT_STATE = {
  version: 2,
  profile: {
    name: "",
    age: "",
    sex: "uomo",
    weight: "",
    height: "",
    activity: "leggero", // sedentario|leggero|moderato|intenso
    goal: "mantenere", // dimagrire|mantenere|aumentare
    goalWeight: "",
    sleepGoal: 8,
    onboarded: false,
  },
  settings: {
    unitWeight: "kg", // kg|lbs
    unitDistance: "km", // km|mi
    restTimerAuto: true,
    restDefaultSec: 90,
    setChangeBtn: false,
    rankCalc: true,
    usePrevSets: true,
    aiProvider: "ollama", // ollama (gratis locale) | gemini | openrouter | anthropic
    aiKey: "", // chiave del provider cloud scelto (solo locale)
    aiModel: "", // modello del provider cloud (vuoto = default del provider)
    ollamaUrl: "http://localhost:11434",
    ollamaModel: "gemma3",
    // voce coach
    voiceName: "", // nome voce TTS (vuoto = auto maschile it)
    voiceRate: 1,
    voicePitch: 0.8, // più basso = più maschile
    voiceMinConfidence: 0.6, // sotto questa soglia ignora (anti-rumore)
  },
  gamify: {
    level: 1,
    xp: 0,
    coins: 200,
    streak: 0,
    lastWorkoutDate: null,
    lastReconcile: null, // last date progression decay/penalties were applied
  },
  exercisesCustom: [], // {id,name,muscle,equipment,custom:true}
  routines: [], // {id,name,items:[{exerciseId,sets:[{kg,reps}]}]}
  plan: [], // {id,title,subtitle,durationMin,exerciseIds:[]}
  sessions: [], // see workout.js
  prs: {}, // exerciseId -> {reps,kg,timeSec,date}
  weights: [], // {date, kg} body-weight log
  sleep: [], // {date, asleep, wake, hours} sleep log
  muscleRanks: {}, // muscleKey -> {points, lastTrained, lastDecay}
  pointsLog: [], // {date, muscle, delta, cause} aggregated — for monthly balance
  foodLog: {}, // dateKey -> {colazione:[],pranzo:[],cena:[],spuntino:[],nonclass:[]}
  foodsCustom: [], // user foods
  recentFoods: [], // last logged foodIds (most recent first)
  dayPlan: {}, // dateKey -> { workout: {type, minutes, estBurn, training} } — pianificazione giornata
  fridge: [], // inventory {id,name,emoji,grams,per100,kcal,p,c,f}
  coachChat: [], // {role,text,routineId?,error?} cronologia chat coach (persistente)
  prefs: {
    daysPerWeek: 3,
    allowedExerciseIds: null, // null = tutti gli esercizi
    restrict: false, // se true, genera/consiglia solo dagli esercizi consentiti
  },
};

// merge persisted state onto defaults (shallow per top key, keeps new fields)
function hydrate(saved) {
  if (!saved) return structuredClone(DEFAULT_STATE);
  const base = structuredClone(DEFAULT_STATE);
  for (const k of Object.keys(base)) {
    if (saved[k] === undefined) continue;
    if (
      base[k] &&
      typeof base[k] === "object" &&
      !Array.isArray(base[k])
    ) {
      base[k] = { ...base[k], ...saved[k] };
    } else {
      base[k] = saved[k];
    }
  }
  return base;
}

let state = hydrate(loadRaw());
const listeners = new Set();

function emit() {
  saveRaw(state);
  for (const l of listeners) l();
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getState() {
  return state;
}

// update with a producer that returns a *new* top-level object (or mutates a clone)
export function setState(updater) {
  const draft = structuredClone(state);
  const next = updater(draft);
  state = next || draft;
  emit();
}

export function resetState() {
  state = structuredClone(DEFAULT_STATE);
  emit();
}

export function replaceState(next) {
  state = hydrate(next);
  emit();
}

// ---- hooks ----
export function useStore(selector = (s) => s) {
  return useSyncExternalStore(
    subscribe,
    () => selector(getState()),
    () => selector(getState())
  );
}

export { getState };

// ---- streak bookkeeping ----
export function touchStreak() {
  setState((s) => {
    const last = s.gamify.lastWorkoutDate;
    const today = todayKey();
    if (last === today) return s;
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })();
    s.gamify.streak = last === yesterday ? s.gamify.streak + 1 : 1;
    s.gamify.lastWorkoutDate = today;
    return s;
  });
}

export function addXp(amount) {
  setState((s) => {
    s.gamify.xp += amount;
    // simple curve: 100 xp per level, escalating 10% each level
    let need = Math.round(100 * Math.pow(1.1, s.gamify.level - 1));
    while (s.gamify.xp >= need) {
      s.gamify.xp -= need;
      s.gamify.level += 1;
      s.gamify.coins += 50;
      need = Math.round(100 * Math.pow(1.1, s.gamify.level - 1));
    }
    return s;
  });
}

export function xpNeededFor(level) {
  return Math.round(100 * Math.pow(1.1, level - 1));
}
