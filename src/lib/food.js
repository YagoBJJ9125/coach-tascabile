// Food logging helpers (local-first).
import { setState } from "./store.js";
import { uid } from "./format.js";
import { scaleNutrients, MICRO_KEYS } from "../data/foods.js";

const EMPTY_DAY = () => ({
  colazione: [],
  pranzo: [],
  cena: [],
  spuntino: [],
  nonclass: [],
});

// build a log entry from a food + chosen portion grams
export function buildEntry(food, grams, portionLabel) {
  const n = scaleNutrients(food.per100, grams);
  const micros = {};
  for (const m of MICRO_KEYS) micros[m.key] = (food.micros && food.micros[m.key])
    ? (food.micros[m.key] * grams) / 100
    : 0;
  return {
    id: uid(),
    foodId: food.id,
    name: food.name,
    emoji: food.emoji,
    grams,
    portionLabel,
    kcal: Math.round(n.kcal || 0),
    p: Math.round((n.p || 0) * 10) / 10,
    c: Math.round((n.c || 0) * 10) / 10,
    f: Math.round((n.f || 0) * 10) / 10,
    micros,
  };
}

export function logFood(dateKey, meal, entry) {
  setState((s) => {
    if (!s.foodLog[dateKey]) s.foodLog[dateKey] = EMPTY_DAY();
    if (!s.foodLog[dateKey][meal]) s.foodLog[dateKey][meal] = [];
    s.foodLog[dateKey][meal].push(entry);
    // recent foods
    s.recentFoods = [entry.foodId, ...s.recentFoods.filter((x) => x !== entry.foodId)].slice(0, 20);
    return s;
  });
}

export function removeFood(dateKey, meal, entryId) {
  setState((s) => {
    if (s.foodLog[dateKey]?.[meal]) {
      s.foodLog[dateKey][meal] = s.foodLog[dateKey][meal].filter((e) => e.id !== entryId);
    }
    return s;
  });
}
