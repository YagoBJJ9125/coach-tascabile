// OpenFoodFacts integration (gratis, CORS ok) — ricerca alimenti reale + barcode.
// Mappa i prodotti OFF nel formato food interno (per100 + micros + portions).
import { uid } from "./format.js";

function mapProduct(p) {
  if (!p) return null;
  const n = p.nutriments || {};
  const name = (p.product_name_it || p.product_name || "").trim();
  if (!name) return null;
  let kcal = n["energy-kcal_100g"];
  if (kcal == null && n["energy_100g"] != null) kcal = n["energy_100g"] / 4.184;
  // sodio in mg: usa sodium_100g (g) se c'è, altrimenti stima da salt_100g
  let sodiumMg = 0;
  if (n["sodium_100g"] != null) sodiumMg = n["sodium_100g"] * 1000;
  else if (n["salt_100g"] != null) sodiumMg = (n["salt_100g"] / 2.5) * 1000;

  const per100 = {
    kcal: Math.round(kcal || 0),
    p: +(n.proteins_100g || 0),
    c: +(n.carbohydrates_100g || 0),
    f: +(n.fat_100g || 0),
  };
  const micros = {
    grassiSaturi: +(n["saturated-fat_100g"] || 0),
    fibra: +(n.fiber_100g || 0),
    zuccheri: +(n.sugars_100g || 0),
    sodio: Math.round(sodiumMg || 0),
  };
  const serving = Number(p.serving_quantity);
  const portions = serving
    ? [{ label: `porzione (${Math.round(serving)}g)`, grams: serving }, { label: "g", grams: 1 }, { label: "100 g", grams: 100 }]
    : [{ label: "g", grams: 1 }, { label: "100 g", grams: 100 }];

  return {
    id: "off_" + (p.code || uid()),
    name: name.slice(0, 60),
    emoji: "🛒",
    cat: "altro",
    off: true,
    per100,
    micros,
    portions,
  };
}

const FIELDS = "code,product_name,product_name_it,nutriments,serving_quantity";

export async function searchOFF(q) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    q
  )}&search_simple=1&action=process&json=1&page_size=20&fields=${FIELDS}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const j = await r.json();
  return (j.products || []).map(mapProduct).filter((f) => f && f.per100.kcal > 0);
}

export async function getByBarcode(code) {
  const r = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`
  );
  if (!r.ok) return null;
  const j = await r.json();
  if (j.status !== 1) return null;
  return mapProduct(j.product);
}
