// Nutrition math: BMR (Mifflin-St Jeor) → TDEE → daily target + macros.
import { round } from "./format.js";

const ACT_FACTOR = {
  sedentario: 1.2,
  leggero: 1.375,
  moderato: 1.55,
  intenso: 1.725,
};
const GOAL_ADJ = { dimagrire: -400, mantenere: 0, aumentare: 320 };

export function nutritionPlan(profile, burnedToday = 0, trainedStrength = false) {
  const age = Number(profile.age);
  const weight = Number(profile.weight);
  const height = Number(profile.height);
  if (!weight || !height || !age) return null;

  const bmr =
    10 * weight + 6.25 * height - 5 * age + (profile.sex === "donna" ? -161 : 5);
  const tdee = bmr * (ACT_FACTOR[profile.activity] ?? 1.375);
  // count half of exercise burn toward intake (conservative, like legacy)
  const burnAdj = round(burnedToday * 0.5);
  const goalAdj = GOAL_ADJ[profile.goal] ?? 0;

  let target = round(tdee + burnAdj + goalAdj);
  const floor = profile.sex === "donna" ? 1300 : 1550;
  const flooredAtMin = target < floor;
  if (flooredAtMin) target = floor;

  let protPerKg = 1.8;
  if (trainedStrength) protPerKg = 2;
  if (profile.goal === "dimagrire") protPerKg = Math.max(protPerKg, 2);
  if (profile.goal === "aumentare" && trainedStrength) protPerKg = 2.1;

  const proteinG = round(protPerKg * weight);
  const fatG = round(Math.max(0.8 * weight, (target * 0.22) / 9));
  const carbsKcal = Math.max(target - proteinG * 4 - fatG * 9, target * 0.2);
  const carbsG = round(carbsKcal / 4);

  return {
    bmr: round(bmr),
    tdee: round(tdee),
    burnedToday: round(burnedToday),
    target,
    proteinG,
    carbsG,
    fatG,
    flooredAtMin,
  };
}

// sum logged food for a day's meal map -> totals
export function sumDayFood(dayLog) {
  const tot = { kcal: 0, p: 0, c: 0, f: 0 };
  if (!dayLog) return tot;
  for (const meal of Object.keys(dayLog)) {
    for (const e of dayLog[meal] || []) {
      tot.kcal += e.kcal || 0;
      tot.p += e.p || 0;
      tot.c += e.c || 0;
      tot.f += e.f || 0;
    }
  }
  tot.kcal = round(tot.kcal);
  tot.p = round(tot.p);
  tot.c = round(tot.c);
  tot.f = round(tot.f);
  return tot;
}

// sum micronutrients for a day -> { microKey: value }
export function sumDayMicros(dayLog, microKeys) {
  const out = {};
  for (const m of microKeys) out[m.key] = 0;
  if (!dayLog) return out;
  for (const meal of Object.keys(dayLog)) {
    for (const e of dayLog[meal] || []) {
      if (!e.micros) continue;
      for (const m of microKeys) out[m.key] += e.micros[m.key] || 0;
    }
  }
  return out;
}
