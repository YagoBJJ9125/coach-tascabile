// AI Coach chat. Talks using the numeric context (aiContext) + Claude (ai.js).
// Falls back to a deterministic numeric summary if no API key is set.
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, setState } from "../lib/store.js";
import { askCoach, localCoachReply, providerInfo, generateRoutineViaAI } from "../lib/ai.js";
import { createRoutineFull, createSession } from "../lib/sessions.js";
import { exerciseById } from "../data/exercises.js";
import { T } from "../theme.js";

const SUGGESTIONS = [
  "Cosa dovrei mangiare stasera?",
  "Che allenamento mi consigli oggi?",
  "Come stanno andando i miei progressi?",
  "Cosa devo comprare per il mio piano?",
];

const GREETING = {
  role: "assistant",
  text: "Ciao! Sono il tuo coach. Conosco i tuoi numeri (calorie, allenamenti, rank, sonno, frigo). Chiedimi cosa vuoi fare oggi 💪",
};

export default function CoachChat() {
  const nav = useNavigate();
  const settings = useStore((s) => s.settings);
  const chat = useStore((s) => s.coachChat);
  const messages = chat && chat.length ? chat : [GREETING];
  // store-backed setter; accepts a value or an updater fn; keeps last 40
  const setMessages = (updater) =>
    setState((s) => {
      const base = s.coachChat && s.coachChat.length ? s.coachChat : [GREETING];
      const next = typeof updater === "function" ? updater(base) : updater;
      s.coachChat = next.slice(-40);
      return s;
    });
  const clearChat = () => setState((s) => { s.coachChat = []; return s; });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    const history = [...messages, { role: "user", text: q }];
    setMessages(history);
    setInput("");
    setBusy(true);
    try {
      let reply;
      try {
        reply = await askCoach(history.filter((m) => m.role !== "system"), settings);
      } catch (e) {
        if (e.code === "NO_KEY") reply = localCoachReply();
        else throw e;
      }
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "⚠️ " + e.message + "\n(Configura un provider gratuito in Profilo → Coach AI.)", error: true },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const genPlan = async () => {
    if (busy) return;
    setMessages((m) => [...m, { role: "user", text: "📋 Generami la scheda di oggi" }]);
    setBusy(true);
    try {
      const { name, items } = await generateRoutineViaAI(settings);
      const rid = createRoutineFull(name, items);
      const lines = items
        .map((it) => `• ${exerciseById(it.exerciseId)?.name} — ${it.sets.length}×${it.sets[0]?.reps}`)
        .join("\n");
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Ho creato la scheda «${name}»:\n${lines}`, routineId: rid },
      ]);
    } catch (e) {
      const msg =
        e.code === "NO_KEY"
          ? "Per generare la scheda serve un provider AI. Configuralo (gratis) in Profilo → Coach AI."
          : "⚠️ " + e.message;
      setMessages((m) => [...m, { role: "assistant", text: msg, error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* top bar */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "rgba(14,14,26,.95)", backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", gap: 10,
          padding: "calc(10px + var(--sat)) 14px 10px",
        }}
      >
        <button onClick={() => nav("/")} style={{ background: "none", border: "none", color: T.mut, fontSize: 24 }}>✕</button>
        <div style={{ flex: 1 }}>
          <div className="font-display" style={{ fontWeight: 700, fontSize: 17 }}>Coach AI 🧠</div>
          {(() => {
            const info = providerInfo(settings.aiProvider || "ollama");
            const ready = !info.needsKey || settings.aiKey?.trim();
            return (
              <div style={{ fontSize: 11, color: ready ? T.green : T.amber }}>
                {ready ? info.label : "Modalità base (configura provider gratuito)"}
              </div>
            );
          })()}
        </div>
        <button
          onClick={clearChat}
          title="Azzera conversazione"
          style={{ background: "none", border: "none", color: T.mut, fontSize: 18 }}
        >
          🗑
        </button>
      </div>

      {/* messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>
        {messages.map((m, i) => (
          <Bubble
            key={i}
            role={m.role}
            text={m.text}
            error={m.error}
            routineId={m.routineId}
            onStart={(rid) => nav(`/session/${createSession({ routineId: rid })}`)}
          />
        ))}
        {busy && <Bubble role="assistant" text="…" />}
        <div ref={endRef} />
      </div>

      {/* suggestions */}
      {messages.length <= 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 14px 10px" }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              style={{
                whiteSpace: "nowrap", background: "var(--surface2)", border: "1px solid var(--line)",
                color: T.text, borderRadius: 999, padding: "8px 12px", fontSize: 12.5,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* generate plan action */}
      <div style={{ padding: "0 14px 8px" }}>
        <button
          onClick={genPlan}
          disabled={busy}
          style={{
            width: "100%", background: "var(--surface2)", border: "1px solid var(--line)",
            color: T.text, borderRadius: 12, padding: "11px", fontSize: 13.5, fontWeight: 700,
            opacity: busy ? 0.5 : 1,
          }}
        >
          📋 Generami la scheda di oggi
        </button>
      </div>

      {/* input */}
      <div
        style={{
          display: "flex", gap: 8, padding: "10px 14px calc(12px + var(--sab))",
          borderTop: "1px solid var(--line)", background: "var(--bg)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Scrivi al coach…"
          style={{
            flex: 1, background: "var(--surface2)", border: "1px solid var(--line)",
            borderRadius: 14, padding: "12px 14px", color: T.text, fontSize: 15, outline: "none",
          }}
        />
        <button
          onClick={() => send()}
          disabled={busy || !input.trim()}
          style={{
            background: T.blue, border: "none", color: "#06121f", borderRadius: 14,
            padding: "0 18px", fontWeight: 700, fontSize: 16, opacity: busy || !input.trim() ? 0.5 : 1,
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

function Bubble({ role, text, error, routineId, onStart }) {
  const me = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", marginBottom: 10 }}>
      <div
        style={{
          maxWidth: "82%", whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: 14,
          padding: "10px 13px", borderRadius: 16,
          background: me ? T.blue : error ? "rgba(255,107,94,.12)" : "var(--surface)",
          color: me ? "#06121f" : T.text,
          border: me ? "none" : `1px solid ${error ? "rgba(255,107,94,.4)" : "var(--line)"}`,
          borderBottomRightRadius: me ? 4 : 16,
          borderBottomLeftRadius: me ? 16 : 4,
        }}
      >
        {text}
        {routineId && (
          <button
            onClick={() => onStart(routineId)}
            style={{
              display: "block", marginTop: 10, width: "100%", background: T.green,
              border: "none", color: "#06210f", borderRadius: 10, padding: "10px",
              fontWeight: 700, fontSize: 14,
            }}
          >
            ▶ Avvia questa scheda
          </button>
        )}
      </div>
    </div>
  );
}
