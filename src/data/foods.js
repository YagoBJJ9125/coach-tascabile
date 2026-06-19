// Seed food database. Macros stored per 100 g (per100). `portions` lists
// selectable serving sizes (label + grams) — first is default.
// `micros` optional, per 100 g; missing keys render as 0 in the detail view.
import { getState } from "../lib/store.js";

export const MICRO_KEYS = [
  { key: "grassiTrans", label: "Grassi Trans", unit: "g", group: "macro" },
  { key: "grassiSaturi", label: "Grassi Saturi", unit: "g", group: "macro" },
  { key: "fibra", label: "Fibra", unit: "g", group: "macro" },
  { key: "vitA", label: "Vitamina A", unit: "mcg", group: "micro" },
  { key: "vitC", label: "Vitamina C", unit: "mg", group: "micro" },
  { key: "vitD", label: "Vitamina D", unit: "mcg", group: "micro" },
  { key: "vitE", label: "Vitamina E", unit: "mg", group: "micro" },
  { key: "vitK", label: "Vitamina K", unit: "mcg", group: "micro" },
  { key: "b1", label: "Vitamina B1", unit: "mg", group: "micro" },
  { key: "b2", label: "Vitamina B2", unit: "mg", group: "micro" },
  { key: "b3", label: "Vitamina B3", unit: "mg", group: "micro" },
  { key: "b5", label: "Vitamina B5", unit: "mg", group: "micro" },
  { key: "b6", label: "Vitamina B6", unit: "mg", group: "micro" },
  { key: "b12", label: "Vitamina B12", unit: "mcg", group: "micro" },
  { key: "calcio", label: "Calcio", unit: "mg", group: "micro" },
  { key: "ferro", label: "Ferro", unit: "mg", group: "micro" },
  { key: "magnesio", label: "Magnesio", unit: "mg", group: "micro" },
  { key: "fosforo", label: "Fosforo", unit: "mg", group: "micro" },
  { key: "potassio", label: "Potassio", unit: "mg", group: "micro" },
  { key: "sodio", label: "Sodio", unit: "mg", group: "micro" },
  { key: "zinco", label: "Zinco", unit: "mg", group: "micro" },
  { key: "rame", label: "Rame", unit: "mg", group: "micro" },
  { key: "manganese", label: "Manganese", unit: "mg", group: "micro" },
];

const g100 = (grams) => [{ label: "g", grams: 1 }, { label: "100 g", grams: 100 }];

export const SEED_FOODS = [
  { id: "f_uovo", name: "Uovo intero", emoji: "🥚", cat: "uova",
    per100: { kcal: 143, p: 12.6, c: 0.7, f: 9.5 },
    portions: [{ label: "1 uovo", grams: 50 }, { label: "g", grams: 1 }],
    micros: { grassiSaturi: 3.1, vitA: 160, vitD: 2, b12: 1.1, calcio: 56, ferro: 1.8, fosforo: 198, potassio: 138, sodio: 142, zinco: 1.3 } },
  { id: "f_petto_pollo", name: "Petto di pollo", emoji: "🍗", cat: "carne",
    per100: { kcal: 165, p: 31, c: 0, f: 3.6 },
    portions: [{ label: "g", grams: 1 }, { label: "100 g", grams: 100 }, { label: "petto (150g)", grams: 150 }],
    micros: { grassiSaturi: 1, b3: 13.7, b6: 0.6, fosforo: 196, potassio: 256, sodio: 74, zinco: 1 } },
  { id: "f_riso_bianco", name: "Riso bianco cotto", emoji: "🍚", cat: "cereali",
    per100: { kcal: 130, p: 2.7, c: 28, f: 0.3 },
    portions: [{ label: "g", grams: 1 }, { label: "porzione (80g cotto)", grams: 80 }],
    micros: { fibra: 0.4, magnesio: 12, fosforo: 43, potassio: 35 } },
  { id: "f_pasta", name: "Pasta cotta", emoji: "🍝", cat: "cereali",
    per100: { kcal: 158, p: 5.8, c: 31, f: 0.9 },
    portions: [{ label: "g", grams: 1 }, { label: "porzione (80g secca→200g)", grams: 200 }],
    micros: { fibra: 1.8, magnesio: 18, fosforo: 58, potassio: 44 } },
  { id: "f_pane_integrale", name: "Pane integrale", emoji: "🍞", cat: "cereali",
    per100: { kcal: 247, p: 13, c: 41, f: 3.4 },
    portions: [{ label: "fetta (40g)", grams: 40 }, { label: "g", grams: 1 }],
    micros: { fibra: 7, magnesio: 76, ferro: 2.5, sodio: 450 } },
  { id: "f_avena", name: "Fiocchi d'avena", emoji: "🌾", cat: "cereali",
    per100: { kcal: 389, p: 16.9, c: 66, f: 6.9 },
    portions: [{ label: "g", grams: 1 }, { label: "porzione (40g)", grams: 40 }],
    micros: { fibra: 10.6, magnesio: 177, ferro: 4.7, fosforo: 523, potassio: 429, zinco: 4 } },
  { id: "f_yogurt_greco", name: "Yogurt greco 0%", emoji: "🥛", cat: "latticini",
    per100: { kcal: 59, p: 10, c: 3.6, f: 0.4 },
    portions: [{ label: "vasetto (170g)", grams: 170 }, { label: "g", grams: 1 }],
    micros: { calcio: 110, b12: 0.5, potassio: 141, sodio: 36 } },
  { id: "f_latte", name: "Latte parz. scremato", emoji: "🥛", cat: "latticini",
    per100: { kcal: 46, p: 3.3, c: 4.9, f: 1.6 },
    portions: [{ label: "bicchiere (200ml)", grams: 200 }, { label: "ml", grams: 1 }],
    micros: { calcio: 120, b12: 0.5, potassio: 150 } },
  { id: "f_parmigiano", name: "Parmigiano", emoji: "🧀", cat: "latticini",
    per100: { kcal: 392, p: 33, c: 0, f: 28.4 },
    portions: [{ label: "g", grams: 1 }, { label: "cucchiaio (10g)", grams: 10 }],
    micros: { grassiSaturi: 19, calcio: 1180, sodio: 1600 } },
  { id: "f_tonno", name: "Tonno al naturale", emoji: "🐟", cat: "pesce",
    per100: { kcal: 116, p: 26, c: 0, f: 1 },
    portions: [{ label: "scatoletta (80g sgocc.)", grams: 80 }, { label: "g", grams: 1 }],
    micros: { b12: 2.2, fosforo: 200, potassio: 237, sodio: 320, vitD: 1.7 } },
  { id: "f_salmone", name: "Salmone", emoji: "🐟", cat: "pesce",
    per100: { kcal: 208, p: 20, c: 0, f: 13 },
    portions: [{ label: "g", grams: 1 }, { label: "filetto (150g)", grams: 150 }],
    micros: { grassiSaturi: 3.1, vitD: 11, b12: 3.2, potassio: 363 } },
  { id: "f_banana", name: "Banana", emoji: "🍌", cat: "frutta",
    per100: { kcal: 89, p: 1.1, c: 23, f: 0.3 },
    portions: [{ label: "1 banana (120g)", grams: 120 }, { label: "g", grams: 1 }],
    micros: { fibra: 2.6, vitC: 8.7, b6: 0.4, potassio: 358, magnesio: 27 } },
  { id: "f_mela", name: "Mela", emoji: "🍎", cat: "frutta",
    per100: { kcal: 52, p: 0.3, c: 14, f: 0.2 },
    portions: [{ label: "1 mela (150g)", grams: 150 }, { label: "g", grams: 1 }],
    micros: { fibra: 2.4, vitC: 4.6, potassio: 107 } },
  { id: "f_mandorle", name: "Mandorle", emoji: "🌰", cat: "frutta secca",
    per100: { kcal: 579, p: 21, c: 22, f: 49.9 },
    portions: [{ label: "g", grams: 1 }, { label: "manciata (30g)", grams: 30 }],
    micros: { fibra: 12.5, grassiSaturi: 3.8, vitE: 25.6, magnesio: 270, calcio: 269 } },
  { id: "f_olio_evo", name: "Olio extravergine", emoji: "🫒", cat: "condimenti",
    per100: { kcal: 884, p: 0, c: 0, f: 100 },
    portions: [{ label: "cucchiaio (10g)", grams: 10 }, { label: "g", grams: 1 }],
    micros: { grassiSaturi: 14, vitE: 14, vitK: 60 } },
  { id: "f_patata", name: "Patata lessa", emoji: "🥔", cat: "verdura",
    per100: { kcal: 87, p: 2, c: 20, f: 0.1 },
    portions: [{ label: "g", grams: 1 }, { label: "porzione (200g)", grams: 200 }],
    micros: { fibra: 1.8, vitC: 13, potassio: 379 } },
  { id: "f_broccoli", name: "Broccoli", emoji: "🥦", cat: "verdura",
    per100: { kcal: 34, p: 2.8, c: 7, f: 0.4 },
    portions: [{ label: "g", grams: 1 }, { label: "porzione (200g)", grams: 200 }],
    micros: { fibra: 2.6, vitC: 89, vitK: 102, calcio: 47, potassio: 316 } },
  { id: "f_spinaci", name: "Spinaci", emoji: "🥬", cat: "verdura",
    per100: { kcal: 23, p: 2.9, c: 3.6, f: 0.4 },
    portions: [{ label: "g", grams: 1 }, { label: "porzione (150g)", grams: 150 }],
    micros: { fibra: 2.2, vitA: 469, vitC: 28, vitK: 483, ferro: 2.7, magnesio: 79 } },
  { id: "f_lenticchie", name: "Lenticchie cotte", emoji: "🫘", cat: "legumi",
    per100: { kcal: 116, p: 9, c: 20, f: 0.4 },
    portions: [{ label: "g", grams: 1 }, { label: "porzione (150g)", grams: 150 }],
    micros: { fibra: 7.9, ferro: 3.3, magnesio: 36, potassio: 369 } },
  { id: "f_fagioli", name: "Fagioli cotti", emoji: "🫘", cat: "legumi",
    per100: { kcal: 127, p: 8.7, c: 22.8, f: 0.5 },
    portions: [{ label: "g", grams: 1 }, { label: "porzione (150g)", grams: 150 }],
    micros: { fibra: 6.4, ferro: 2.1, magnesio: 45, potassio: 405 } },
  { id: "f_hamburger_mcd", name: "Hamburger (McDonald's)", emoji: "🍔", cat: "fast food",
    per100: { kcal: 263, p: 13, c: 30, f: 9 },
    portions: [{ label: "1 hamburger (100g)", grams: 100 }, { label: "g", grams: 1 }],
    micros: { grassiSaturi: 4, sodio: 510 } },
  { id: "f_burger_king", name: "Hamburger (Burger King)", emoji: "🍔", cat: "fast food",
    per100: { kcal: 254, p: 12, c: 29, f: 9 },
    portions: [{ label: "1 hamburger (100g)", grams: 100 }, { label: "g", grams: 1 }] },
  { id: "f_proteine_whey", name: "Proteine whey", emoji: "🥤", cat: "integratori",
    per100: { kcal: 375, p: 80, c: 7, f: 5 },
    portions: [{ label: "misurino (30g)", grams: 30 }, { label: "g", grams: 1 }],
    micros: { calcio: 500 } },
  { id: "f_caffe", name: "Caffè espresso", emoji: "☕", cat: "bevande",
    per100: { kcal: 2, p: 0.1, c: 0, f: 0 },
    portions: [{ label: "tazzina (30ml)", grams: 30 }, { label: "ml", grams: 1 }] },
  { id: "f_cioccolato_fond", name: "Cioccolato fondente 70%", emoji: "🍫", cat: "dolci",
    per100: { kcal: 598, p: 7.8, c: 46, f: 43 },
    portions: [{ label: "g", grams: 1 }, { label: "quadretto (10g)", grams: 10 }],
    micros: { fibra: 11, ferro: 11.9, magnesio: 228 } },
  { id: "f_pizza_margherita", name: "Pizza margherita", emoji: "🍕", cat: "fast food",
    per100: { kcal: 266, p: 11, c: 33, f: 10 },
    portions: [{ label: "g", grams: 1 }, { label: "pizza intera (300g)", grams: 300 }],
    micros: { grassiSaturi: 4.5, sodio: 598, calcio: 188 } },
  { id: "f_riso_basmati", name: "Riso basmati cotto", emoji: "🍚", cat: "cereali",
    per100: { kcal: 121, p: 3, c: 25, f: 0.4 },
    portions: [{ label: "g", grams: 1 }, { label: "porzione (80g cotto)", grams: 80 }] },
];

export const FOOD_CATS = [
  "uova", "carne", "pesce", "latticini", "cereali", "verdura", "frutta",
  "frutta secca", "legumi", "condimenti", "fast food", "dolci", "bevande",
  "integratori", "altro",
];

export const MEAL_TYPES = [
  { key: "colazione", label: "Colazione", emoji: "🌅" },
  { key: "pranzo", label: "Pranzo", emoji: "☀️" },
  { key: "cena", label: "Cena", emoji: "🌙" },
  { key: "spuntino", label: "Spuntino", emoji: "🍎" },
  { key: "nonclass", label: "Non classificato", emoji: "🍽️" },
];

export function allFoods() {
  return [...SEED_FOODS, ...getState().foodsCustom];
}
export function foodById(id) {
  return allFoods().find((f) => f.id === id) || null;
}

// scale per100 nutrients to a given grams amount
export function scaleNutrients(per100, grams) {
  const k = grams / 100;
  const out = {};
  for (const key of Object.keys(per100)) out[key] = per100[key] * k;
  return out;
}
