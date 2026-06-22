// Consigli pasto ON-DEMAND, frigo-first. L'utente clicca "Genera consiglio <pasto>" e il
// motore compone un pasto: prima usa ciò che ha nel frigo (solo alimenti sensati per quel
// pasto, niente mix improbabili), poi se non basta integra dal database, segnando in ROSSO
// gli alimenti NON posseduti. "Genera altro" (variant++) propone una variante.
import { round } from "./format.js";
import { sumDayFood } from "./nutrition.js";
import { allFoods, foodById } from "../data/foods.js";

// quote di kcal/macro per pasto; ordine = sequenza nella giornata
export const MEAL_SPLIT = [
  { key: "colazione", label: "Colazione", emoji: "🌅", ratio: 0.25 },
  { key: "pranzo",    label: "Pranzo",    emoji: "☀️", ratio: 0.35 },
  { key: "spuntino",  label: "Spuntino",  emoji: "🍎", ratio: 0.10 },
  { key: "cena",      label: "Cena",      emoji: "🌙", ratio: 0.30 },
];

// categorie alimenti sensate per tipo di pasto (evita accostamenti improbabili)
const MEAL_PREFS = {
  colazione: ["latticini", "cereali", "frutta", "frutta secca", "dolci", "bevande"],
  pranzo: ["cereali", "carne", "pesce", "legumi", "verdura", "uova", "condimenti"],
  spuntino: ["frutta", "frutta secca", "latticini", "integratori", "dolci"],
  cena: ["carne", "pesce", "uova", "verdura", "legumi", "cereali", "latticini"],
};

function macrosFor(food, grams) {
  const k = grams / 100;
  return {
    kcal: (food.per100.kcal || 0) * k,
    p: (food.per100.p || 0) * k,
    c: (food.per100.c || 0) * k,
    f: (food.per100.f || 0) * k,
  };
}
function roundM(m) {
  return { kcal: round(m.kcal), p: round(m.p), c: round(m.c), f: round(m.f) };
}
function roundGrams(g) {
  if (g <= 0) return 0;
  if (g < 30) return Math.max(5, Math.round(g / 5) * 5);
  return Math.round(g / 10) * 10;
}
const kcal100 = (f) => f.per100.kcal || 1;
const protEff = (f) => (f.per100.p * 4) / Math.max(1, f.per100.kcal);
const carbEff = (f) => (f.per100.c * 4) / Math.max(1, f.per100.kcal);

// alimenti che ho nel frigo, arricchiti coi metadati del DB (categoria/porzioni)
export function fridgePool(fridge = []) {
  const out = [];
  const seen = new Set();
  for (const it of fridge) {
    if (!it.per100) continue;
    const key = (it.name || "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const base = it.foodId ? foodById(it.foodId) : null;
    out.push({
      id: base?.id || it.foodId || it.id,
      name: it.name,
      emoji: it.emoji,
      cat: base?.cat || it.cat || "altro",
      per100: it.per100,
      portions: base?.portions || [{ label: "g", grams: 1 }],
      micros: base?.micros,
      inFridge: true,
    });
  }
  return out;
}

// alimenti del DB che NON ho nel frigo (da integrare, segnati in rosso)
export function dbPool(fridge = []) {
  const have = new Set((fridge || []).map((x) => (x.name || "").toLowerCase()));
  return allFoods()
    .filter((f) => !have.has((f.name || "").toLowerCase()))
    .map((f) => ({ ...f, inFridge: false }));
}

// scegli un alimento per un "ruolo": PRIMA dal frigo, poi dal DB. `variant` ruota la scelta.
function pickRole(fridgeCand, dbCand, filterFn, sortFn, used, variant) {
  const fr = fridgeCand.filter((f) => !used.has(f.id) && filterFn(f)).sort(sortFn);
  if (fr.length) return fr[variant % fr.length];
  const db = dbCand.filter((f) => !used.has(f.id) && filterFn(f)).sort(sortFn);
  if (db.length) return db[variant % db.length];
  return null;
}

// compone un pasto a budget di kcal, FRIGO-FIRST. Ritorna items con flag inFridge.
export function composeMeal(target, fridgePoolArr, dbPoolArr, mealKey, variant = 0) {
  if (!target || target.kcal <= 60) return null;
  const prefs = MEAL_PREFS[mealKey] || [];
  const inPref = (f) => !prefs.length || prefs.includes(f.cat);
  const frCand = fridgePoolArr.filter(inPref);
  const dbCand = dbPoolArr.filter(inPref);

  const items = [];
  const used = new Set();
  let budget = target.kcal;
  const take = (food, grams) => {
    grams = roundGrams(grams);
    if (!food || grams <= 0 || used.has(food.id)) return;
    const m = macrosFor(food, grams);
    items.push({ food, grams, inFridge: !!food.inFridge, ...roundM(m) });
    used.add(food.id);
    budget -= m.kcal;
  };
  const gotF = () => items.reduce((s, it) => s + it.f, 0);

  // 1) proteina magra
  if (target.p > 6) {
    const prot = pickRole(frCand, dbCand, (f) => (f.per100.p || 0) >= 10,
      (a, b) => protEff(b) - protEff(a), used, variant);
    if (prot) {
      const gForProtein = (target.p / prot.per100.p) * 100;
      const gForBudget = ((target.kcal * 0.5) / kcal100(prot)) * 100;
      take(prot, Math.min(gForProtein, gForBudget, 250));
    }
  }
  // 1.5) grassi se sotto target
  const fatGap = target.f - gotF();
  if (fatGap > 8 && budget > 90) {
    const fat = pickRole(frCand, dbCand,
      (f) => (f.per100.f || 0) >= 20 && (f.per100.f || 0) > (f.per100.p || 0),
      (a, b) => (b.per100.f || 0) - (a.per100.f || 0), used, variant);
    if (fat) {
      const gForFat = (fatGap / fat.per100.f) * 100;
      const capG = fat.per100.f >= 70 ? 20 : fat.per100.f >= 45 ? 35 : 60;
      take(fat, Math.min(gForFat, capG));
    }
  }
  // 2) carboidrato amidaceo
  if (budget > 60) {
    const STARCHY = ["cereali", "legumi", "verdura", "integratori"];
    const carb = pickRole(frCand, dbCand,
      (f) => STARCHY.includes(f.cat) && (f.per100.c || 0) >= 15 && (f.per100.f || 0) < 12,
      (a, b) => carbEff(b) - carbEff(a), used, variant);
    if (carb) take(carb, Math.min(((budget * 0.6) / kcal100(carb)) * 100, 350));
  }
  // 3) riempi il budget con frutta/verdura/grassi/dolci (porzioni sensate)
  const light = mealKey === "colazione" || mealKey === "spuntino"
    ? ["frutta", "frutta secca", "latticini", "dolci", "cereali"]
    : ["verdura", "frutta", "legumi", "condimenti", "frutta secca", "latticini"];
  let guard = 0;
  while (budget > 110 && items.length < 5 && guard++ < 6) {
    const filt = (f) => light.includes(f.cat) && kcal100(f) > 25;
    let filler = pickRole(frCand, dbCand, filt,
      (a, b) => kcal100(b) - kcal100(a), used, variant + guard);
    if (!filler) filler = pickRole(frCand, dbCand, (f) => kcal100(f) > 40,
      (a, b) => kcal100(b) - kcal100(a), used, variant + guard);
    if (!filler) break;
    const maxG = kcal100(filler) > 400 ? 40 : kcal100(filler) > 200 ? 120 : 250;
    const before = items.length;
    take(filler, Math.min((budget / kcal100(filler)) * 100, maxG));
    if (items.length === before) break;
  }

  if (!items.length) return null;
  const totals = items.reduce(
    (t, it) => ({ kcal: t.kcal + it.kcal, p: t.p + it.p, c: t.c + it.c, f: t.f + it.f }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );
  const fromFridge = items.filter((i) => i.inFridge).length;
  return {
    items,
    totals: roundM(totals),
    target: roundM(target),
    fromFridge,
    missing: items.length - fromFridge,
  };
}

// stato dei pasti del giorno + target per pasto (per le quote sui pasti ancora aperti).
// NON compone consigli: la generazione è on-demand (generateMeal).
export function mealTargets(state, date, energy) {
  if (!energy || !energy.target) return null;
  const day = state.foodLog[date] || {};
  const dayTarget = { kcal: energy.target, p: energy.proteinG, c: energy.carbsG, f: energy.fatG };
  const eatenAll = sumDayFood(day);
  const remainingDay = {
    kcal: Math.max(0, round(dayTarget.kcal - eatenAll.kcal)),
    p: Math.max(0, round(dayTarget.p - eatenAll.p)),
    c: Math.max(0, round(dayTarget.c - eatenAll.c)),
    f: Math.max(0, round(dayTarget.f - eatenAll.f)),
  };

  const meals = MEAL_SPLIT.map((m) => {
    const entries = day[m.key] || [];
    const eaten = entries.reduce(
      (t, e) => ({ kcal: t.kcal + (e.kcal || 0), p: t.p + (e.p || 0), c: t.c + (e.c || 0), f: t.f + (e.f || 0) }),
      { kcal: 0, p: 0, c: 0, f: 0 }
    );
    return { ...m, entries, eaten: roundM(eaten), done: entries.length > 0 };
  });

  const open = meals.filter((m) => !m.done);
  const ratioSum = open.reduce((s, m) => s + m.ratio, 0) || 1;
  for (const m of meals) {
    const share = m.done ? 0 : m.ratio / ratioSum;
    m.target = {
      kcal: round(remainingDay.kcal * share),
      p: round(remainingDay.p * share),
      c: round(remainingDay.c * share),
      f: round(remainingDay.f * share),
    };
  }
  return { meals, remainingDay, dayTarget, eatenAll: roundM(eatenAll) };
}

// genera (on-demand) il consiglio per UN pasto. variant ruota le scelte ("Genera altro").
export function generateMeal(state, date, energy, mealKey, variant = 0) {
  const mt = mealTargets(state, date, energy);
  if (!mt) return null;
  const meal = mt.meals.find((m) => m.key === mealKey);
  if (!meal) return null;
  const frP = fridgePool(state.fridge || []);
  const dbP = dbPool(state.fridge || []);
  const sugg = composeMeal(meal.target, frP, dbP, mealKey, variant);
  if (!sugg) return null;
  return { meal: mealKey, label: meal.label, emoji: meal.emoji, target: meal.target, ...sugg };
}
