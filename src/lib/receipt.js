// Abbina i prodotti estratti dallo scontrino (vision AI) agli alimenti del DB,
// e stima i grammi dalla stringa quantità.
import { norm } from "./format.js";
import { allFoods } from "../data/foods.js";

// estrae i grammi da una stringa quantità ("125g", "1kg", "500 g", "1l", "330ml")
export function parseQtyGrams(s) {
  if (!s) return null;
  const t = String(s).toLowerCase().replace(",", ".");
  let m = t.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (m) return Math.round(parseFloat(m[1]) * 1000);
  m = t.match(/(\d+(?:\.\d+)?)\s*g\b/);
  if (m) return Math.round(parseFloat(m[1]));
  m = t.match(/(\d+(?:\.\d+)?)\s*l\b/);
  if (m) return Math.round(parseFloat(m[1]) * 1000); // 1 l ≈ 1000 g
  m = t.match(/(\d+(?:\.\d+)?)\s*ml/);
  if (m) return Math.round(parseFloat(m[1]));
  return null;
}

// miglior match locale per un nome generico (punteggio su contiene/overlap parole)
export function matchLocalFood(name) {
  const nq = norm(name);
  if (!nq) return null;
  let best = null;
  let bestScore = 0;
  for (const f of allFoods()) {
    const nf = norm(f.name);
    let score = 0;
    if (nf === nq) score = 100;
    else if (nf.includes(nq)) score = 80 - Math.abs(nf.length - nq.length);
    else if (nq.includes(nf)) score = 70 - Math.abs(nf.length - nq.length);
    else {
      const w1 = nq.split(/\s+/);
      const w2 = nf.split(/\s+/);
      const common = w1.filter((w) => w.length > 2 && w2.includes(w)).length;
      if (common) score = 40 + common * 5;
    }
    if (score > bestScore) { bestScore = score; best = f; }
  }
  return bestScore >= 40 ? best : null;
}

// elenco scontrino [{nome, quantita}] → righe {nome, quantita, food, grams}
export function matchReceipt(items) {
  return (items || []).map((it) => {
    const food = matchLocalFood(it.nome);
    const grams = parseQtyGrams(it.quantita) || (food ? food.portions[0].grams : null);
    return { nome: it.nome, quantita: it.quantita, food, grams };
  });
}
