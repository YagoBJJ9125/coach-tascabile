// Pianificazione della giornata: scegli al mattino che allenamento farai, così il
// bilancio (kcal + macro) è noto sin da subito, invece di aggiornarsi solo a sera.
// Stima il consumo (burn) da MET × peso × durata. `training` guida lo split macro
// (giorno di allenamento → più carboidrati; riposo → più proteine).
import { setState } from "./store.js";

export const WORKOUT_TYPES = [
  { key: "riposo",  label: "Riposo",            emoji: "😴", met: 0,   defMin: 0,  training: false },
  { key: "leggero", label: "Attività leggera",  emoji: "🚶", met: 3,   defMin: 40, training: false },
  { key: "forza",   label: "Pesi / Forza",      emoji: "🏋️", met: 5,   defMin: 60, training: true  },
  { key: "cardio",  label: "Cardio",            emoji: "🏃", met: 8,   defMin: 45, training: true  },
  { key: "misto",   label: "Misto pesi+cardio", emoji: "🔥", met: 6.5, defMin: 75, training: true  },
];

export function workoutType(key) {
  return WORKOUT_TYPES.find((t) => t.key === key) || null;
}

// kcal stimate da MET × peso(kg) × ore
export function estimateBurn(typeKey, minutes, weightKg = 75) {
  const t = workoutType(typeKey);
  if (!t || !t.met || !minutes) return 0;
  return Math.round(t.met * weightKg * (minutes / 60));
}

export function getDayPlan(state, date) {
  return (state.dayPlan && state.dayPlan[date]) || null;
}

// imposta/aggiorna il tipo di allenamento pianificato per un giorno
export function setDayWorkout(date, typeKey, minutes, weightKg) {
  const t = workoutType(typeKey);
  const mins = minutes != null ? minutes : (t ? t.defMin : 0);
  const estBurn = estimateBurn(typeKey, mins, weightKg);
  setState((s) => {
    if (!s.dayPlan) s.dayPlan = {};
    s.dayPlan[date] = {
      ...(s.dayPlan[date] || {}),
      workout: {
        type: typeKey,
        minutes: mins,
        estBurn,
        training: !!(t && t.training),
      },
    };
    return s;
  });
}

export function clearDayWorkout(date) {
  setState((s) => {
    if (s.dayPlan && s.dayPlan[date]) delete s.dayPlan[date].workout;
    return s;
  });
}
