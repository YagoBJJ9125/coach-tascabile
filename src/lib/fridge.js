// Fridge / pantry inventory helpers.
import { setState } from "./store.js";
import { uid } from "./format.js";
import { scaleNutrients } from "../data/foods.js";

// add an item from a food + grams (nutrition snapshot scaled)
export function addFridgeItem(food, grams) {
  const n = scaleNutrients(food.per100, grams);
  setState((s) => {
    const existing = s.fridge.find((x) => x.foodId === food.id);
    if (existing) {
      existing.grams += grams;
      existing.kcal = Math.round((food.per100.kcal * existing.grams) / 100);
      existing.p = Math.round((food.per100.p * existing.grams) / 100);
      existing.c = Math.round((food.per100.c * existing.grams) / 100);
      existing.f = Math.round((food.per100.f * existing.grams) / 100);
    } else {
      s.fridge.unshift({
        id: uid(),
        foodId: food.id,
        name: food.name,
        emoji: food.emoji,
        grams,
        per100: food.per100,
        kcal: Math.round(n.kcal || 0),
        p: Math.round((n.p || 0) * 10) / 10,
        c: Math.round((n.c || 0) * 10) / 10,
        f: Math.round((n.f || 0) * 10) / 10,
      });
    }
    return s;
  });
}

export function removeFridgeItem(id) {
  setState((s) => {
    s.fridge = s.fridge.filter((x) => x.id !== id);
    return s;
  });
}

export function updateFridgeGrams(id, grams) {
  setState((s) => {
    const it = s.fridge.find((x) => x.id === id);
    if (!it) return s;
    if (grams <= 0) {
      s.fridge = s.fridge.filter((x) => x.id !== id);
      return s;
    }
    it.grams = grams;
    it.kcal = Math.round((it.per100.kcal * grams) / 100);
    it.p = Math.round((it.per100.p * grams) / 100);
    it.c = Math.round((it.per100.c * grams) / 100);
    it.f = Math.round((it.per100.f * grams) / 100);
    return s;
  });
}
