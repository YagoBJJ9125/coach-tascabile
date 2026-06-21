// AI Coach client — multi-provider, con opzioni GRATUITE (nessun token a pagamento).
// Default: Ollama locale (gratis, privato, gira sul PC dell'utente).
// Alternative gratis: Google Gemini (free tier), OpenRouter (modelli :free).
// Anthropic resta opzionale (a pagamento).
import { buildCoachContext, contextSummary } from "./aiContext.js";
import { getState } from "./store.js";
import { coachExercisePool, exerciseById } from "../data/exercises.js";

export const PROVIDERS = {
  ollama: {
    label: "Ollama locale (gratis, sul tuo PC)",
    cloud: false,
    needsKey: false,
    help: "Installa Ollama (ollama.com) e scarica un modello: `ollama pull gemma3`. Avvia con CORS: imposta la variabile OLLAMA_ORIGINS=* e riavvia Ollama.",
    models: ["gemma3", "qwen2.5", "llama3.2", "phi4", "mistral"],
  },
  gemini: {
    label: "Google Gemini (free tier)",
    cloud: true,
    needsKey: true,
    help: "Chiave gratuita su aistudio.google.com/app/apikey (piano gratuito con limiti generosi).",
    models: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"],
  },
  openrouter: {
    label: "OpenRouter (modelli :free)",
    cloud: true,
    needsKey: true,
    help: "Chiave gratuita su openrouter.ai/keys; usa modelli che finiscono in ':free'.",
    models: [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemma-2-9b-it:free",
      "qwen/qwen-2.5-72b-instruct:free",
    ],
  },
  anthropic: {
    label: "Anthropic Claude (a pagamento)",
    cloud: true,
    needsKey: true,
    help: "Chiave su console.anthropic.com (consuma credito a pagamento).",
    models: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-opus-4-8"],
  },
};

export function providerInfo(key) {
  return PROVIDERS[key] || PROVIDERS.ollama;
}

const SYSTEM = `Sei "Coach Tascabile", il personal coach di fitness e alimentazione dell'utente.
Parli SEMPRE in italiano, con tono competente, diretto e motivante, come un vero coach/nutrizionista.
REGOLE:
- Usa ESCLUSIVAMENTE i dati numerici nel CONTESTO fornito. NON inventare numeri.
- Quando consigli, spiega il PERCHÉ citando i numeri (calorie, proteine, punti, prontezza, ecc.).
- Tieni conto di: obiettivo, energia/macro, allenamenti recenti, rank muscolari, frigo/spesa,
  sonno/prontezza, preferenze esercizi.
- Sii concreto e sintetico: consigli azionabili, niente disclaimer lunghi.
- Non sei un medico: per problemi di salute, rimanda a un professionista (una riga, solo se serve).`;

function systemWithContext() {
  const ctx = buildCoachContext(getState());
  return `${SYSTEM}\n\nCONTESTO (dati attuali dell'utente, in JSON):\n${JSON.stringify(ctx)}`;
}

function noKey() {
  const e = new Error("no-key");
  e.code = "NO_KEY";
  return e;
}

async function readError(res) {
  try {
    const j = await res.json();
    return j?.error?.message || j?.error || JSON.stringify(j);
  } catch {
    return (await res.text().catch(() => "")) || `HTTP ${res.status}`;
  }
}

// ---- providers ----
async function callOllama(history, settings, sys) {
  const url = (settings.ollamaUrl || "http://localhost:11434").replace(/\/$/, "");
  const model = settings.ollamaModel || "gemma3";
  let res;
  try {
    res = await fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [{ role: "system", content: sys }, ...history.map((m) => ({ role: m.role, content: m.text }))],
      }),
    });
  } catch (e) {
    const err = new Error(
      "Ollama non raggiungibile su " + url + ". Avvialo e imposta OLLAMA_ORIGINS=* per permettere il browser."
    );
    err.code = "OLLAMA_DOWN";
    throw err;
  }
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data?.message?.content || "";
}

async function callGemini(history, settings, sys) {
  const key = settings.aiKey?.trim();
  if (!key) throw noKey();
  const model = settings.aiModel || PROVIDERS.gemini.models[0];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: history.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.text }],
        })),
      }),
    }
  );
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text).join("\n");
}

async function callOpenAICompatible(endpoint, history, settings, sys) {
  const key = settings.aiKey?.trim();
  if (!key) throw noKey();
  const model = settings.aiModel || PROVIDERS.openrouter.models[0];
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: sys }, ...history.map((m) => ({ role: m.role, content: m.text }))],
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

async function callAnthropic(history, settings, sys) {
  const key = settings.aiKey?.trim();
  if (!key) throw noKey();
  const model = settings.aiModel || PROVIDERS.anthropic.models[1];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: sys,
      messages: history.map((m) => ({ role: m.role, content: m.text })),
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

// low-level: send history with an arbitrary system prompt, dispatch by provider
export async function chatRaw(history, settings, sys) {
  const provider = settings?.aiProvider || "ollama";
  switch (provider) {
    case "gemini":
      return callGemini(history, settings, sys);
    case "openrouter":
      return callOpenAICompatible("https://openrouter.ai/api/v1/chat/completions", history, settings, sys);
    case "anthropic":
      return callAnthropic(history, settings, sys);
    case "ollama":
    default:
      return callOllama(history, settings, sys);
  }
}

// history: [{role:'user'|'assistant', text}]
export async function askCoach(history, settings) {
  return chatRaw(history, settings, systemWithContext());
}

// extract first balanced {...} JSON object from a string (tolerant a testo extra)
function extractJSON(text) {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// Ask the model to build a workout from OUR library; returns {name, items} ready
// for createRoutine, or throws. Respects exercise preferences (coachExercisePool).
export async function generateRoutineViaAI(settings) {
  const pool = coachExercisePool();
  const list = pool.map((e) => ({ id: e.id, nome: e.name, muscolo: e.muscle }));
  const ctx = buildCoachContext(getState());
  const sys = `Sei un personal trainer. Crea UNA scheda di allenamento per oggi per l'utente.
Profilo: ${JSON.stringify(ctx.profilo)}.
Rank muscoli (allena di più i più deboli): ${JSON.stringify(ctx.muscoli)}.
Prontezza: ${ctx.sonno ? ctx.sonno.prontezza + "/100" : "n/d"}.
Scegli da 4 a 7 esercizi SOLO da questa lista, usando gli "id" ESATTI:
${JSON.stringify(list)}.
Rispondi ESCLUSIVAMENTE con JSON valido, senza testo prima o dopo, in questo formato:
{"nome":"Nome scheda","esercizi":[{"id":"ex_xxx","serie":3,"ripetizioni":10}]}`;

  const raw = await chatRaw([{ role: "user", text: "Genera la scheda di oggi in JSON." }], settings, sys);
  const parsed = extractJSON(raw);
  if (!parsed || !Array.isArray(parsed.esercizi)) {
    throw new Error("Il modello non ha restituito una scheda valida. Riprova.");
  }
  const items = parsed.esercizi
    .filter((e) => exerciseById(e.id))
    .map((e) => {
      const serie = Math.max(1, Math.min(8, Number(e.serie) || 3));
      const reps = Math.max(1, Math.min(50, Number(e.ripetizioni) || 10));
      return {
        exerciseId: e.id,
        sets: Array.from({ length: serie }, () => ({ kg: 0, reps })),
      };
    });
  if (!items.length) throw new Error("La scheda non conteneva esercizi validi. Riprova.");
  return { name: parsed.nome || "Scheda AI", items };
}

// deterministic reply (no provider configured / fallback) — uses numeric context directly
export function localCoachReply() {
  const ctx = buildCoachContext(getState());
  return (
    "💡 (Coach base, senza AI) Ecco la tua situazione coi numeri:\n\n" +
    contextSummary(ctx) +
    "\n\nPer risposte conversazionali, configura un provider GRATUITO in Profilo → Coach AI " +
    "(consigliato: Ollama locale, oppure Google Gemini free)."
  );
}
