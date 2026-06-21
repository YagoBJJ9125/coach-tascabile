// Voice helpers (Web Speech API): TTS (voce selezionabile, default maschile it) +
// riconoscimento vocale (it-IT) con gate di confidenza. Gratis, gira nel browser
// (Chrome desktop/Android). iOS Safari: TTS sì, riconoscimento no.

export function ttsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// elenco voci italiane disponibili (per il selettore in Profilo)
export function italianVoices() {
  if (!ttsSupported()) return [];
  return window.speechSynthesis.getVoices().filter((v) => (v.lang || "").toLowerCase().startsWith("it"));
}

const MALE_HINTS = /(diego|luca|cosimo|giorgio|carlo|paolo|male|maschi|uomo|man)/i;
const FEMALE_HINTS = /(alice|elsa|federica|paola|female|donna|woman)/i;

// scegli la voce: 1) quella salvata, 2) maschile it, 3) prima it, 4) qualsiasi maschile
export function pickVoice(preferredName) {
  if (!ttsSupported()) return null;
  const all = window.speechSynthesis.getVoices();
  const it = all.filter((v) => (v.lang || "").toLowerCase().startsWith("it"));
  if (preferredName) {
    const exact = all.find((v) => v.name === preferredName);
    if (exact) return exact;
  }
  const itMale = it.find((v) => MALE_HINTS.test(v.name) && !FEMALE_HINTS.test(v.name));
  if (itMale) return itMale;
  if (it.length) return it[0];
  return all.find((v) => MALE_HINTS.test(v.name)) || null;
}

// opts: {voiceName, rate, pitch}
export function speak(text, onend, opts = {}) {
  if (!ttsSupported()) {
    onend && onend();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "it-IT";
    const v = pickVoice(opts.voiceName);
    if (v) u.voice = v;
    u.rate = opts.rate || 1;
    u.pitch = opts.pitch != null ? opts.pitch : 0.8; // più basso = più "maschile"
    if (onend) u.onend = onend;
    window.speechSynthesis.speak(u);
  } catch {
    onend && onend();
  }
}

export function srSupported() {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// onresult(text, isFinal, confidence)
export function createRecognizer({ lang = "it-IT", onresult, onend, onerror } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.lang = lang;
  r.continuous = true;
  r.interimResults = false;
  r.maxAlternatives = 3; // più alternative = miglior parsing dei numeri
  r.onresult = (e) => {
    const res = e.results[e.results.length - 1];
    // unisci le alternative per cercare un numero in una qualsiasi
    let best = "";
    let conf = 0;
    for (let i = 0; i < res.length; i++) {
      if (i === 0) { best = res[0].transcript; conf = res[0].confidence || 0; }
    }
    const alts = [];
    for (let i = 0; i < res.length; i++) alts.push((res[i].transcript || "").trim().toLowerCase());
    onresult && onresult(best.trim().toLowerCase(), res.isFinal, conf, alts);
  };
  if (onend) r.onend = onend;
  if (onerror) r.onerror = onerror;
  return r;
}

// ---- parser numero italiano (secondi) ----
const UNITS = { zero: 0, uno: 1, due: 2, tre: 3, "tré": 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9 };
const TEENS = { dieci: 10, undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15, sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19 };
const TENS = { venti: 20, trenta: 30, quaranta: 40, cinquanta: 50, sessanta: 60, settanta: 70, ottanta: 80, novanta: 90 };

// costruisce mappa parola->numero 0..199 con elisioni (ventuno, ventotto, ...)
function buildWordMap() {
  const m = { ...UNITS, ...TEENS, ...TENS, cento: 100 };
  for (const [tw, tv] of Object.entries(TENS)) {
    for (const [uw, uv] of Object.entries({ uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9 })) {
      let base = tw;
      if (uw === "uno" || uw === "otto") base = tw.slice(0, -1); // ventuno, ventotto
      let unit = uw;
      if (uv === 3) unit = "tré"; // ventitré
      m[base + (uv === 3 ? "tre" : uw)] = tv + uv;
      m[base + unit] = tv + uv;
    }
  }
  // centinaia comuni
  m["centodieci"] = 110; m["centoventi"] = 120; m["centocinquanta"] = 150;
  m["centottanta"] = 180; m["centottata"] = 180; m["centoventicinque"] = 125;
  return m;
}
const WORD_MAP = buildWordMap();

export function parseSeconds(text) {
  const t = (text || "").toLowerCase().replace(/[.,]/g, " ");
  // minuti
  if (/minuto e mezzo|un minuto e mezzo|uno e mezzo/.test(t)) return 90;
  let minMatch = t.match(/(\d+)\s*minut/);
  if (minMatch) return +minMatch[1] * 60;
  if (/\bun minuto\b|\bun minut/.test(t)) return 60;
  if (/\bdue minut/.test(t)) return 120;
  if (/\btre minut/.test(t)) return 180;
  // cifre (preferite)
  const d = t.match(/\b(\d{1,3})\b/);
  if (d) return +d[1];
  // parole composte: cerca la chiave più lunga contenuta
  const keys = Object.keys(WORD_MAP).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const re = new RegExp("\\b" + k + "\\b");
    if (re.test(t)) {
      let v = WORD_MAP[k];
      if (/minut/.test(t)) v *= 60;
      return v;
    }
  }
  return null;
}

// estrai i secondi dalle alternative del riconoscimento (più robusto)
export function parseSecondsFromAlts(alts) {
  for (const a of alts || []) {
    const n = parseSeconds(a);
    if (n) return n;
  }
  return null;
}

export function classifyCommand(text) {
  const t = (text || "").toLowerCase();
  if (/(imposta riposo|imposta pausa|riposo di|pausa di|metti riposo|cambia riposo)/.test(t)) return "set_rest";
  if (/(fine serie|serie finita|serie fatta|finit|fatto|completat|ho finito|ok serie)/.test(t)) return "set_done";
  if (/(prossimo|avanti|cambia esercizio|esercizio successivo)/.test(t)) return "next_ex";
  if (/(salta riposo|salta pausa|stop riposo|togli riposo)/.test(t)) return "skip_rest";
  if (/(finisci allenamento|termina allenamento|ho finito tutto|chiudi allenamento)/.test(t)) return "finish";
  if (/(stop|basta|ferma|spegni|pausa ascolto)/.test(t)) return "stop";
  return null;
}

export const WAKE_WORDS = ["coach", "coch", "couch", "cocho", "ok coach", "ehi coach", "ciao coach"];
export function isWake(text) {
  const t = (text || "").toLowerCase();
  return WAKE_WORDS.some((w) => t.includes(w));
}
