// Pianificazione & consigli pasti. Distribuisce il target giornaliero (kcal + macro,
// già calcolato da coach.energyPlan in base a obiettivo e allenamento del giorno) sui
// pasti, e per ogni pasto ancora "aperto" compone un consiglio di alimenti dal DB +
// frigo per centrare il target. Tutto reattivo: appena logghi cibo (anche diverso dal
// consiglio) i pasti restanti si ricalcolano sui macro rimanenti.
import { round } from "./format.js";
import { sumDayFood } from "./nutrition.js";
import { allFoods } from "../data/foods.js";

// quote di kcal/macro per pasto; ordine = sequenza nella giornata
export const MEAL_SPLIT = [
  { key: "colazione", label: "Colazione", emoji: "🌅", ratio: 0.25 },
  { key: "pranzo",    label: "Pranzo",    emoji: "☀️", ratio: 0.35 },
  { key: "spuntino",  label: "Spuntino",  emoji: "🍎", ratio: 0.10 },
  { key: "cena",      label: "Cena",      emoji: "🌙", ratio: 0.30 },
];

// categorie alimenti preferite per tipo di pasto (per consigli sensati)
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

// pool alimenti: prima il frigo (usa ciò che hai), poi il DB. Dedup per nome.
export function foodPool(fridge = []) {
  const pool = [];
  const seen = new Set();
  for (const it of fridge) {
    const key = (it.name || "").toLowerCase();
    if (!it.per100 || seen.has(key)) continue;
    seen.add(key);
    pool.push({
      id: it.foodId || it.id,
      name: it.name,
      emoji: it.emoji,
      cat: it.cat || "altro",
      per100: it.per100,
      portions: [{ label: "g", grams: 1 }],
      fromFridge: true,
    });
  }
  for (const f of allFoods()) {
    const key = (f.name || "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push(f);
  }
  return pool;
}

function roundGrams(g) {
  if (g <= 0) return 0;
  if (g < 30) return Math.max(5, Math.round(g / 5) * 5);
  return Math.round(g / 10) * 10;
}

// efficienza di un macro rispetto alle kcal (alto = "pulito": proteina/carbo magro)
const protEff = (f) => (f.per100.p * 4) / Math.max(1, f.per100.kcal);
const carbEff = (f) => (f.per100.c * 4) / Math.max(1, f.per100.kcal);

// compone un pasto a BUDGET di kcal: proteina magra → carbo → riempitivo (frutta/verdura),
// dimensionando le porzioni così che il totale resti ~ entro il target kcal del pasto.
export function composeMeal(target, pool, mealKey) {
  if (!target || target.kcal <= 60) return null;
  const prefs = MEAL_PREFS[mealKey] || [];
  const inPref = (f) => prefs.length === 0 || prefs.includes(f.cat);
  let cand = pool.filter(inPref);
  if (cand.length < 3) cand = pool.slice();

  const items = [];
  const used = new Set();
  let budget = target.kcal; // kcal ancora da assegnare
  const take = (food, grams) => {
    grams = roundGrams(grams);
    if (!food || grams <= 0 || used.has(food.id)) return;
    const m = macrosFor(food, grams);
    items.push({ food, grams, ...roundM(m) });
    used.add(food.id);
    budget -= m.kcal;
  };
  const kcal100 = (f) => f.per100.kcal || 1;
  const gotF = () => items.reduce((s, it) => s + it.f, 0); // grassi accumulati

  // 1) ancora proteica magra: punta a target.p, ma senza superare metà budget
  if (target.p > 6) {
    const prot = cand
      .filter((f) => (f.per100.p || 0) >= 10 && !used.has(f.id))
      .sort((a, b) => protEff(b) - protEff(a))[0];
    if (prot) {
      const gForProtein = (target.p / prot.per100.p) * 100;
      const gForBudget = ((target.kcal * 0.5) / kcal100(prot)) * 100;
      take(prot, Math.min(gForProtein, gForBudget, 250));
    }
  }
  // 1.5) ancora grassi: se i grassi sono sotto target, aggiungi una fonte grassa in piccola
  //      quantità (olio/burro/frutta secca) — chiude il macro grassi senza gonfiare le kcal
  const fatGap = target.f - gotF();
  if (fatGap > 8 && budget > 90) {
    const fat = cand
      .filter((f) => !used.has(f.id) && ((f.per100.f || 0) >= 20) && (f.per100.f || 0) > (f.per100.p || 0))
      .sort((a, b) => (b.per100.f || 0) - (a.per100.f || 0))[0];
    if (fat) {
      const gForFat = (fatGap / fat.per100.f) * 100;
      const capG = fat.per100.f >= 70 ? 20 : fat.per100.f >= 45 ? 35 : 60; // grassi puri → pochi g
      take(fat, Math.min(gForFat, capG));
    }
  }
  // 2) carbo: staple amidaceo (no frutta/bevande), porzione realistica
  if (budget > 60) {
    const STARCHY = ["cereali", "legumi", "verdura", "integratori"];
    const carb = cand
      .filter((f) => STARCHY.includes(f.cat) && (f.per100.c || 0) >= 15 && (f.per100.f || 0) < 12 && !used.has(f.id))
      .sort((a, b) => carbEff(b) - carbEff(a))[0];
    if (carb) take(carb, Math.min(((budget * 0.6) / kcal100(carb)) * 100, 350));
  }
  // 3) chiudi il budget con 1-2 alimenti (frutta/verdura/grassi/dolci) a porzione realistica.
  //    cap per-alimento per densità: pochi grammi se denso (grassi), tanti se leggero (frutta).
  const light = mealKey === "colazione" || mealKey === "spuntino"
    ? ["frutta", "frutta secca", "latticini", "dolci", "cereali"]
    : ["verdura", "frutta", "legumi", "condimenti", "frutta secca", "latticini"];
  let guard = 0;
  while (budget > 110 && items.length < 5 && guard++ < 6) {
    let pickCand = cand.filter((f) => !used.has(f.id) && light.includes(f.cat) && kcal100(f) > 25);
    if (!pickCand.length) pickCand = cand.filter((f) => !used.has(f.id) && kcal100(f) > 40);
    if (!pickCand.length) break;
    // preferisci chi riempie bene il budget con una porzione sensata
    const filler = pickCand.sort((a, b) => kcal100(b) - kcal100(a))[Math.floor(pickCand.length / 2)] || pickCand[0];
    const maxG = kcal100(filler) > 400 ? 40 : kcal100(filler) > 200 ? 120 : 250; // grassi→pochi g
    const before = items.length;
    take(filler, Math.min((budget / kcal100(filler)) * 100, maxG));
    if (items.length === before) break; // niente aggiunto: esci
  }

  if (!items.length) return null;
  const totals = items.reduce(
    (t, it) => ({ kcal: t.kcal + it.kcal, p: t.p + it.p, c: t.c + it.c, f: t.f + it.f }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );
  return { items, totals: roundM(totals), target: roundM(target) };
}

function roundM(m) {
  return { kcal: round(m.kcal), p: round(m.p), c: round(m.c), f: round(m.f) };
}

// piano pasti del giorno: cosa è già stato mangiato per pasto + consiglio per i pasti aperti
export function mealPlan(state, date, energy) {
  if (!energy || !energy.target) return null;
  const day = state.foodLog[date] || {};
  const pool = foodPool(state.fridge || []);

  const dayTarget = { kcal: energy.target, p: energy.proteinG, c: energy.carbsG, f: energy.fatG };
  const eatenAll = sumDayFood(day); // include "nonclass"
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
  for (const m of open) {
    const share = m.ratio / ratioSum;
    m.target = {
      kcal: round(remainingDay.kcal * share),
      p: round(remainingDay.p * share),
      c: round(remainingDay.c * share),
      f: round(remainingDay.f * share),
    };
    m.suggestion = composeMeal(m.target, pool, m.key);
  }

  return { meals, remainingDay, dayTarget, eatenAll: roundM(eatenAll) };
}
