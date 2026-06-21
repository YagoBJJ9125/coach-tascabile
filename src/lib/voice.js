// Voice helpers (Web Speech API): TTS + riconoscimento vocale (it-IT). Gratis,
// gira nel browser (Chrome desktop/Android). Beta: serve microfono + permesso.

export function ttsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text, onend) {
  if (!ttsSupported()) {
    onend && onend();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "it-IT";
    u.rate = 1;
    if (onend) u.onend = onend;
    window.speechSynthesis.speak(u);
  } catch {
    onend && onend();
  }
}

export function srSupported() {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createRecognizer({ lang = "it-IT", onresult, onend, onerror } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.lang = lang;
  r.continuous = true;
  r.interimResults = false;
  r.maxAlternatives = 1;
  r.onresult = (e) => {
    const last = e.results[e.results.length - 1];
    const txt = (last[0].transcript || "").trim().toLowerCase();
    onresult && onresult(txt, last.isFinal);
  };
  if (onend) r.onend = onend;
  if (onerror) r.onerror = onerror;
  return r;
}

// estrai secondi da frase: "60", "60 secondi", "sessanta", "un minuto", "novanta"
const NUM_WORDS = {
  dieci: 10, quindici: 15, venti: 20, venticinque: 25, trenta: 30, quaranta: 40,
  quarantacinque: 45, cinquanta: 50, sessanta: 60, settanta: 70, ottanta: 80,
  novanta: 90, novantacinque: 95, cento: 100, "un minuto": 60, "due minuti": 120,
  "minuto e mezzo": 90, minuto: 60,
};
export function parseSeconds(text) {
  const t = (text || "").toLowerCase();
  const m = t.match(/(\d+)/);
  if (m) {
    let n = +m[1];
    if (t.includes("minut")) n = n * 60;
    return n;
  }
  for (const k of Object.keys(NUM_WORDS)) if (t.includes(k)) return NUM_WORDS[k];
  return null;
}

// classifica un comando vocale
export function classifyCommand(text) {
  const t = (text || "").toLowerCase();
  if (/(fine serie|serie finita|serie fatta|finit|fatto|completata|ho finito)/.test(t)) return "set_done";
  if (/(prossimo|avanti|cambia esercizio|esercizio successivo)/.test(t)) return "next_ex";
  if (/(salta riposo|salta pausa|stop riposo)/.test(t)) return "skip_rest";
  if (/(finisci allenamento|termina allenamento|ho finito tutto)/.test(t)) return "finish";
  if (/(stop|basta|ferma|spegni)/.test(t)) return "stop";
  return null;
}

export const WAKE_WORDS = ["coach", "coch", "couch", "ok coach", "ehi coach"];
export function isWake(text) {
  const t = (text || "").toLowerCase();
  return WAKE_WORDS.some((w) => t.includes(w));
}
