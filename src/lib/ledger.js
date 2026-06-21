// Accounting / balances ("contabilità e bilanci"). Everything reasoned in numbers:
// energy ledger per day & week, fridge inventory totals, coverage, shopping gap.
import { round } from "./format.js";
import { sumDayFood } from "./nutrition.js";
import { todayKey, addDays } from "./format.js";

const KCAL_PER_KG = 7700;

// burn credited from finished workouts on a given date (half, like the rest of the app)
export function exerciseCredit(state, date) {
  const burn = state.sessions
    .filter((s) => s.finished && s.date === date)
    .reduce((n, s) => n + (s.burn || 0), 0);
  return { burn: round(burn), credit: round(burn * 0.5) };
}

// daily energy ledger: budget − food + exercise = remaining (+ per-macro budgets)
export function dayLedger(state, date, energy) {
  const eaten = sumDayFood(state.foodLog[date]);
  const { burn, credit } = exerciseCredit(state, date);
  const budget = energy ? energy.target : 0;
  const remaining = round(budget - eaten.kcal + credit);
  const macros = energy
    ? {
        p: { eaten: round(eaten.p), target: energy.proteinG },
        c: { eaten: round(eaten.c), target: energy.carbsG },
        f: { eaten: round(eaten.f), target: energy.fatG },
      }
    : null;
  return { date, budget, eaten, exercise: { burn, credit }, remaining, macros };
}

// weekly ledger: avg intake vs maintenance → cumulative balance → projected kg/week
export function weekLedger(state, energy) {
  if (!energy) return null;
  const today = todayKey();
  let intakeSum = 0,
    daysWithFood = 0,
    creditSum = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, -i);
    const eaten = sumDayFood(state.foodLog[d]);
    if (eaten.kcal > 0) {
      intakeSum += eaten.kcal;
      creditSum += exerciseCredit(state, d).credit;
      daysWithFood += 1;
    }
  }
  if (!daysWithFood) {
    return { days: 0, avgIntake: 0, dailyBalance: 0, projectedKgPerWeek: 0 };
  }
  const avgIntake = round(intakeSum / daysWithFood);
  const avgCredit = round(creditSum / daysWithFood);
  // balance vs maintenance: positive = surplus
  const dailyBalance = round(avgIntake - (energy.maintenance + avgCredit));
  const projectedKgPerWeek = +((dailyBalance * 7) / KCAL_PER_KG).toFixed(2);
  return {
    days: daysWithFood,
    avgIntake,
    avgCredit,
    dailyBalance,
    projectedKgPerWeek,
  };
}

// ---- fridge / inventory ----
export function fridgeTotals(fridge) {
  const t = { kcal: 0, p: 0, c: 0, f: 0 };
  for (const it of fridge || []) {
    t.kcal += it.kcal || 0;
    t.p += it.p || 0;
    t.c += it.c || 0;
    t.f += it.f || 0;
  }
  return { kcal: round(t.kcal), p: round(t.p), c: round(t.c), f: round(t.f) };
}

// how many days the fridge covers vs the daily plan
export function fridgeCoverage(fridge, energy) {
  const totals = fridgeTotals(fridge);
  const hasItems = (fridge || []).length > 0;
  if (!energy || !energy.target) {
    return { hasItems, totals, kcalDays: 0, proteinDays: 0 };
  }
  return {
    hasItems,
    totals,
    kcalDays: totals.kcal / energy.target,
    proteinDays: energy.proteinG ? totals.p / energy.proteinG : 0,
  };
}

// shopping gap for `days` of plan: needed − fridge = to buy (per macro/kcal)
export function shoppingGap(fridge, energy, days = 1) {
  const totals = fridgeTotals(fridge);
  if (!energy) return null;
  const need = {
    kcal: energy.target * days,
    p: energy.proteinG * days,
    c: energy.carbsG * days,
    f: energy.fatG * days,
  };
  const gap = {
    kcal: Math.max(0, round(need.kcal - totals.kcal)),
    p: Math.max(0, round(need.p - totals.p)),
    c: Math.max(0, round(need.c - totals.c)),
    f: Math.max(0, round(need.f - totals.f)),
  };
  return { days, need, have: totals, gap };
}

// suggest foods from DB to fill a protein gap (cheap heuristic)
export function fillProteinGap(gapP, foods) {
  if (gapP <= 0) return [];
  const sources = foods
    .filter((f) => f.per100.p >= 15)
    .sort((a, b) => b.per100.p - a.per100.p)
    .slice(0, 4);
  return sources.map((f) => {
    const grams = round((gapP / f.per100.p) * 100);
    return { food: f, grams, kcal: round((f.per100.kcal * grams) / 100) };
  });
}
