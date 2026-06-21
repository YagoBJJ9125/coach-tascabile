// Live workout tracker (EPIC 2). Sets/reps/kg, rest timer, finish summary.
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store.js";
import {
  getSession,
  updateSession,
  deleteSession,
  finishSession,
  makeSessionExercise,
  saveRoutineFromSession,
} from "../lib/sessions.js";
import { exerciseById } from "../data/exercises.js";
import { muscleLabel } from "../data/muscles.js";
import { uid, fmtClock } from "../lib/format.js";
import { T } from "../theme.js";
import { Button, Sheet, Input } from "../components/ui.jsx";
import ExercisePicker from "../components/ExercisePicker.jsx";
import { speak, srSupported, createRecognizer, isWake, classifyCommand, parseSecondsFromAlts } from "../lib/voice.js";

export default function WorkoutSession() {
  const { id } = useParams();
  const nav = useNavigate();
  const session = useStore((s) => s.sessions.find((x) => x.id === id));
  const settings = useStore((s) => s.settings);

  const [elapsed, setElapsed] = useState(0);
  const [picker, setPicker] = useState(false);
  const [rest, setRest] = useState(null); // {left,total,paused}
  const [summary, setSummary] = useState(null);
  const [saveRoutine, setSaveRoutine] = useState(false);
  const [rname, setRname] = useState("");

  // voice coach
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const recRef = useRef(null);
  const voiceModeRef = useRef("off"); // off | idle | await_cmd | await_rest
  const onRestEndRef = useRef(null);
  const sessionRef = useRef(session);
  const settingsRef = useRef(settings);
  const restSecRef = useRef(settings.restDefaultSec || 90); // durata riposo per la voce
  useEffect(() => { sessionRef.current = session; settingsRef.current = settings; });

  // running clock
  useEffect(() => {
    if (!session || session.finished) return;
    const tick = () =>
      setElapsed(Math.round((Date.now() - session.startedAt) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [session?.startedAt, session?.finished]);

  // rest countdown (skip while paused)
  useEffect(() => {
    if (!rest || rest.paused) return;
    if (rest.left <= 0) {
      onRestEndRef.current && onRestEndRef.current();
      setRest(null);
      return;
    }
    const t = setTimeout(() => setRest((r) => (r && !r.paused ? { ...r, left: r.left - 1 } : r)), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  if (!session) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: 80 }}>
        <p style={{ color: T.mut }}>Allenamento non trovato.</p>
        <Button onClick={() => nav("/allenamento")}>Torna indietro</Button>
      </div>
    );
  }

  // start a rest countdown; sec optional (default from settings)
  const startRest = (sec) => {
    const total = Math.max(1, Math.round(sec || settings.restDefaultSec));
    onRestEndRef.current = null; // default: nessun annuncio (impostato dalla voce)
    setRest({ left: total, total, paused: false });
  };
  const togglePauseRest = () => setRest((r) => (r ? { ...r, paused: !r.paused } : r));

  const setNote = (note) => updateSession(id, (s) => (s.note = note));

  const updateSet = (exId, setId, patch) =>
    updateSession(id, (s) => {
      const ex = s.exercises.find((e) => e.id === exId);
      const st = ex.sets.find((x) => x.id === setId);
      Object.assign(st, patch);
    });

  const toggleDone = (exId, setId) => {
    let nowDone = false;
    updateSession(id, (s) => {
      const ex = s.exercises.find((e) => e.id === exId);
      const st = ex.sets.find((x) => x.id === setId);
      st.done = !st.done;
      nowDone = st.done;
    });
    if (nowDone && settings.restTimerAuto) startRest();
  };

  const addSet = (exId) =>
    updateSession(id, (s) => {
      const ex = s.exercises.find((e) => e.id === exId);
      const last = ex.sets[ex.sets.length - 1];
      ex.sets.push({
        id: uid(),
        kg: "",
        reps: "",
        timeSec: "",
        distance: "",
        done: false,
        prev: last ? { kg: last.kg, reps: last.reps } : null,
      });
    });

  // duplicate a set: copy values into a new set right after it
  const duplicateSet = (exId, setId) =>
    updateSession(id, (s) => {
      const ex = s.exercises.find((e) => e.id === exId);
      const idx = ex.sets.findIndex((x) => x.id === setId);
      if (idx < 0) return;
      const src = ex.sets[idx];
      ex.sets.splice(idx + 1, 0, {
        id: uid(),
        kg: src.kg,
        reps: src.reps,
        timeSec: src.timeSec,
        distance: src.distance,
        done: false,
        prev: src.prev || null,
      });
    });

  const removeSet = (exId, setId) =>
    updateSession(id, (s) => {
      const ex = s.exercises.find((e) => e.id === exId);
      ex.sets = ex.sets.filter((x) => x.id !== setId);
      if (!ex.sets.length) ex.sets.push({ id: uid(), kg: "", reps: "", timeSec: "", distance: "", done: false });
    });

  const removeExercise = (exId) =>
    updateSession(id, (s) => {
      s.exercises = s.exercises.filter((e) => e.id !== exId);
    });

  const addExercises = (ids) =>
    updateSession(id, (s) => {
      for (const eid of ids) s.exercises.push(makeSessionExercise(eid));
    });

  // mark the next not-done set as done; return {name, reps} for the announcement
  const markNextSetDone = () => {
    let info = null;
    updateSession(id, (s) => {
      for (const ex of s.exercises) {
        const set = ex.sets.find((x) => !x.done);
        if (set) {
          set.done = true;
          const def = exerciseById(ex.exerciseId);
          info = { name: def?.name || "esercizio", reps: set.reps || set.timeSec || "" };
          break;
        }
      }
    });
    return info;
  };

  // ---- voice coach state machine ----
  const speakingRef = useRef(false);
  const say = (text, cb) => {
    speakingRef.current = true;
    setVoiceStatus("🔊 " + text);
    const st = settingsRef.current;
    speak(
      text,
      () => setTimeout(() => { speakingRef.current = false; cb && cb(); }, 400),
      { voiceName: st.voiceName, rate: st.voiceRate, pitch: st.voicePitch }
    );
  };

  const fmtSec = (s) => (s % 60 === 0 ? `${s / 60} minut${s === 60 ? "o" : "i"}` : `${s} secondi`);

  // avvia il riposo "vocale" con annuncio di fine
  const voiceStartRest = (sec) => {
    startRest(sec);
    onRestEndRef.current = () => say('Pausa finita, pronto. Di\' "coach, fine serie" per la prossima.');
  };

  // txt + confidence + alternative del riconoscimento
  const handleVoice = (txt, conf, alts) => {
    if (speakingRef.current) return; // ignora la propria voce (TTS)
    if (!txt || txt.length < 2) return; // ignora frammenti
    const mode = voiceModeRef.current;
    const minConf = settingsRef.current.voiceMinConfidence ?? 0.6;

    if (mode === "idle") {
      // wake: tollerante (così puoi sempre riattivarlo), ma non su puro rumore
      if (isWake(txt)) {
        voiceModeRef.current = "await_cmd";
        setVoiceStatus('🎙️ Dimmi… ("fine serie")');
        say("Sì.");
      }
      return;
    }

    // in modalità comando: scarta risultati a bassa confidenza (anti-rumore)
    if (conf && conf < minConf && !isWake(txt)) {
      setVoiceStatus("🔇 (non chiaro, ripeti)");
      return;
    }

    const cmd = classifyCommand(txt);
    if (cmd === "set_rest") {
      const sec = parseSecondsFromAlts([txt, ...(alts || [])]);
      if (sec) { restSecRef.current = sec; say(`Riposo impostato a ${fmtSec(sec)}.`); }
      else say("Non ho capito i secondi. Per esempio: imposta riposo sessanta.");
      voiceModeRef.current = "idle";
      return;
    }
    if (cmd === "set_done") {
      const info = markNextSetDone();
      if (!info) { voiceModeRef.current = "idle"; say("Hai completato tutte le serie. Di' finisci allenamento."); return; }
      voiceStartRest(restSecRef.current);
      voiceModeRef.current = "idle";
      say(`Serie ${info.name} fatta. Riposo ${fmtSec(restSecRef.current)}.`);
      setVoiceStatus("⏳ Riposo " + restSecRef.current + "s");
      return;
    }
    if (cmd === "next_ex") { voiceModeRef.current = "idle"; say("Ok, prossimo esercizio."); return; }
    if (cmd === "skip_rest") { setRest(null); voiceModeRef.current = "idle"; say("Riposo saltato."); return; }
    if (cmd === "finish") { say("Finisco l'allenamento."); stopVoice(); doFinish(); return; }
    if (cmd === "stop") { voiceModeRef.current = "idle"; say('Ok, mi fermo. Di\' "coach" per riattivarmi.'); return; }
    say('Non ho capito. Di\' "fine serie", "imposta riposo", "prossimo esercizio".');
  };

  const startVoice = () => {
    if (!srSupported()) {
      alert("Riconoscimento vocale non supportato. Usa Chrome (anche su Android) e consenti il microfono.");
      return;
    }
    restSecRef.current = settingsRef.current.restDefaultSec || 90;
    const r = createRecognizer({
      onresult: (txt, final, conf, alts) => { if (final) handleVoice(txt, conf, alts); },
      onend: () => { if (voiceModeRef.current !== "off") { try { r.start(); } catch {} } },
      onerror: () => {},
    });
    if (!r) return;
    recRef.current = r;
    voiceModeRef.current = "idle";
    setVoiceOn(true);
    try { r.start(); } catch {}
    say(`Modalità voce attiva. Riposo predefinito ${fmtSec(restSecRef.current)}. Di' "coach", poi "fine serie".`);
    setVoiceStatus('🎙️ Di\' "coach"…');
  };

  const stopVoice = () => {
    voiceModeRef.current = "off";
    setVoiceOn(false);
    setVoiceStatus("");
    try { recRef.current && recRef.current.stop(); } catch {}
    recRef.current = null;
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch {}
  };

  // stop voice when leaving the session
  useEffect(() => () => stopVoice(), []);

  const doFinish = () => {
    stopVoice();
    const res = finishSession(id);
    setSummary(res || { burn: 0, muscles: {} });
  };

  const cancel = () => {
    if (confirm("Annullare e cancellare questo allenamento?")) {
      deleteSession(id);
      nav("/allenamento");
    }
  };

  const doneSets = session.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => s.done).length,
    0
  );

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 120 }}>
      {/* top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(14,14,26,.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "calc(10px + var(--sat)) 14px 10px",
        }}
      >
        <button
          onClick={cancel}
          style={{ background: "none", border: "none", color: T.mut, fontSize: 24 }}
        >
          ✕
        </button>
        <div style={{ textAlign: "center" }}>
          <div className="font-display" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
            {fmtClock(elapsed)}
          </div>
          <div style={{ fontSize: 9, color: T.mut }}>tempo totale</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => (voiceOn ? stopVoice() : startVoice())}
            title="Coach a voce"
            style={{
              background: voiceOn ? T.coral : "none", border: "none",
              color: voiceOn ? "#2a0b08" : T.mut, fontSize: 18, borderRadius: 999,
              width: 34, height: 34,
            }}
          >
            🎙️
          </button>
          <button
            onClick={doFinish}
            style={{ background: "none", border: "none", color: T.blue, fontSize: 22 }}
          >
            ✓
          </button>
        </div>
      </div>

      {/* voice status banner */}
      {voiceOn && (
        <div
          style={{
            position: "sticky", top: "calc(52px + var(--sat))", zIndex: 19,
            background: "rgba(255,107,94,.12)", borderBottom: "1px solid rgba(255,107,94,.3)",
            color: T.text, fontSize: 12.5, padding: "8px 14px", textAlign: "center",
          }}
        >
          {voiceStatus || "🎙️ Coach in ascolto"}
        </div>
      )}

      <div style={{ padding: "14px 14px 0" }}>
        <input
          value={session.note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Le tue note dell'allenamento…"
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: "14px",
            color: T.text,
            fontSize: 14,
            marginBottom: 16,
            outline: "none",
          }}
        />

        {session.exercises.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: T.mut,
              padding: "28px 16px",
              background: "var(--surface)",
              borderRadius: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>💪</div>
            <div style={{ fontWeight: 700, color: T.text }}>Allenamento vuoto</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              Aggiungi esercizi per iniziare.
            </div>
          </div>
        )}

        {session.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            ex={ex}
            onUpdateSet={updateSet}
            onToggleDone={toggleDone}
            onAddSet={addSet}
            onDuplicateSet={duplicateSet}
            onRemoveSet={removeSet}
            onRemove={removeExercise}
          />
        ))}

        <Button full variant="ghost" onClick={() => setPicker(true)} style={{ marginTop: 4 }}>
          ＋ Aggiungi esercizio
        </Button>

        {/* manual rest control */}
        {session.exercises.length > 0 && !rest && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: T.mut, marginRight: 2 }}>⏱ Riposo:</span>
            {[30, 60, 90, 120].map((s) => (
              <button key={s} onClick={() => startRest(s)} style={pill}>
                {s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${s % 60 ? (s % 60) + "s" : ""}`}
              </button>
            ))}
          </div>
        )}

        {session.exercises.length > 0 && (
          <Button
            full
            onClick={doFinish}
            style={{ marginTop: 12 }}
          >
            Finisci l'allenamento
          </Button>
        )}
      </div>

      {/* rest timer floating bar */}
      {rest && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 25,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "var(--maxw)",
              background: "var(--surface2)",
              borderTop: "1px solid var(--line)",
              padding: "12px 16px calc(12px + var(--sab))",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: T.mut }}>
                Timer di Riposo {rest.paused ? "(in pausa)" : ""}
              </div>
              <div className="font-display" style={{ fontSize: 22, fontWeight: 700, color: rest.paused ? T.amber : T.text }}>
                {fmtClock(rest.left)}
              </div>
            </div>
            <button onClick={() => setRest((r) => ({ ...r, left: r.left + 15 }))} style={pill}>
              +15s
            </button>
            <button onClick={togglePauseRest} style={pill}>
              {rest.paused ? "▶" : "⏸"}
            </button>
            <button onClick={() => setRest(null)} style={pill}>
              Salta
            </button>
          </div>
        </div>
      )}

      <ExercisePicker open={picker} onClose={() => setPicker(false)} onConfirm={addExercises} />

      {/* finish summary */}
      <Sheet open={!!summary} onClose={() => { setSummary(null); nav("/"); }} title="Allenamento completato! 🎉">
        {summary && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <Stat label="Durata" value={fmtClock(session.durationSec || elapsed)} />
              <Stat label="Serie" value={doneSets} />
              <Stat label="Kcal" value={`~${summary.burn}`} color={T.green} />
            </div>
            <div style={{ fontSize: 12, color: T.mut, marginBottom: 6 }}>
              PROGRESSO MUSCOLI (+punti)
            </div>
            <div style={{ marginBottom: 16 }}>
              {Object.keys(summary.musclePoints || {}).length ? (
                Object.entries(summary.musclePoints)
                  .sort((a, b) => b[1] - a[1])
                  .map(([m, pts]) => {
                    const d = (summary.levelDeltas || {})[m];
                    return (
                      <div
                        key={m}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 0",
                          borderTop: "1px solid var(--line)",
                        }}
                      >
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                          {muscleLabel(m)}
                        </span>
                        {d?.promoted && (
                          <span style={{ fontSize: 11, color: T.green, fontWeight: 700 }}>
                            ↑ {d.after}
                          </span>
                        )}
                        <span className="font-display" style={{ fontWeight: 700, color: T.blue }}>
                          +{pts}
                        </span>
                      </div>
                    );
                  })
              ) : (
                <span style={{ color: T.mut, fontSize: 13 }}>
                  Nessuna serie completata.
                </span>
              )}
            </div>
            <Button full onClick={() => setSaveRoutine(true)} variant="ghost" style={{ marginBottom: 10 }}>
              💾 Salva come routine
            </Button>
            <Button full onClick={() => { setSummary(null); nav("/"); }}>
              Fatto
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet open={saveRoutine} onClose={() => setSaveRoutine(false)} title="Salva routine">
        <Input
          placeholder="Nome routine"
          value={rname}
          onChange={(e) => setRname(e.target.value)}
        />
        <Button
          full
          disabled={!rname.trim()}
          onClick={() => {
            saveRoutineFromSession(id, rname.trim());
            setSaveRoutine(false);
            setRname("");
          }}
        >
          Salva
        </Button>
      </Sheet>
    </div>
  );
}

const pill = {
  background: "var(--surface3)",
  border: "1px solid var(--line)",
  color: "#f5f6fa",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 700,
};

function Stat({ label, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        background: "var(--surface2)",
        borderRadius: 14,
        padding: "10px 12px",
        border: "1px solid var(--line)",
      }}
    >
      <div style={{ fontSize: 11, color: T.mut }}>{label}</div>
      <div
        className="font-display"
        style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}
      >
        {value}
      </div>
    </div>
  );
}

function ExerciseCard({ ex, onUpdateSet, onToggleDone, onAddSet, onDuplicateSet, onRemoveSet, onRemove }) {
  const def = exerciseById(ex.exerciseId);
  const tracks = def?.tracks || "weight_reps";
  const [menu, setMenu] = useState(false);

  // columns by track type
  const cols =
    tracks === "weight_reps"
      ? ["SERIE", "PREC", "KG", "REPS", ""]
      : tracks === "reps"
      ? ["SERIE", "PREC", "REPS", ""]
      : tracks === "time"
      ? ["SERIE", "PREC", "TEMPO", ""]
      : ["SERIE", "KM", "TEMPO", ""];

  const grid =
    tracks === "weight_reps"
      ? "28px 1fr 1fr 1fr 64px"
      : "28px 1fr 1fr 64px";

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{def?.emoji || "🏋️"}</span>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>
          {def?.name || ex.exerciseId}
        </span>
        <button
          onClick={() => setMenu((m) => !m)}
          style={{ background: "none", border: "none", color: T.mut, fontSize: 20 }}
        >
          ⋮
        </button>
      </div>
      {menu && (
        <button
          onClick={() => onRemove(ex.id)}
          style={{
            background: "none",
            border: "none",
            color: T.coral,
            fontSize: 13,
            padding: "6px 0",
          }}
        >
          🗑 Rimuovi esercizio
        </button>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: grid,
          gap: 8,
          margin: "12px 0 6px",
          fontSize: 11,
          color: T.mut,
        }}
      >
        {cols.map((c, i) => (
          <div key={i} style={{ textAlign: i === 0 ? "center" : "left" }}>
            {c}
          </div>
        ))}
      </div>

      {ex.sets.map((s, i) => (
        <SetRow
          key={s.id}
          n={i + 1}
          set={s}
          tracks={tracks}
          grid={grid}
          onChange={(patch) => onUpdateSet(ex.id, s.id, patch)}
          onToggle={() => onToggleDone(ex.id, s.id)}
          onDuplicate={() => onDuplicateSet(ex.id, s.id)}
          onRemove={() => onRemoveSet(ex.id, s.id)}
        />
      ))}

      <button
        onClick={() => onAddSet(ex.id)}
        style={{
          width: "100%",
          marginTop: 8,
          background: "var(--surface2)",
          border: "1px solid var(--line)",
          color: T.mut,
          borderRadius: 10,
          padding: "10px",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        ＋ Aggiungi serie
      </button>
    </div>
  );
}

function SetRow({ n, set, tracks, grid, onChange, onToggle, onDuplicate, onRemove }) {
  const prevTxt = set.prev
    ? tracks === "weight_reps"
      ? `${set.prev.kg || 0}×${set.prev.reps || 0}`
      : `${set.prev.reps || set.prev.kg || "-"}`
    : "-";

  const cell = {
    background: set.done ? "rgba(74,222,128,.12)" : "var(--surface2)",
    border: `1px solid ${set.done ? "rgba(74,222,128,.4)" : "var(--line)"}`,
    borderRadius: 10,
    padding: "10px 8px",
    color: T.text,
    fontSize: 15,
    textAlign: "center",
    width: "100%",
    outline: "none",
  };

  const numInput = (field, ph) => (
    <input
      inputMode="decimal"
      value={set[field]}
      placeholder={ph}
      onChange={(e) => onChange({ [field]: e.target.value.replace(",", ".") })}
      style={cell}
    />
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: grid,
        gap: 8,
        alignItems: "center",
        marginBottom: 6,
      }}
      onDoubleClick={onRemove}
      title="Doppio click per rimuovere serie"
    >
      <div style={{ textAlign: "center", fontWeight: 700, color: T.mut }}>{n}</div>
      <div style={{ textAlign: "center", color: T.mut2, fontSize: 13 }}>{prevTxt}</div>
      {tracks === "weight_reps" && (
        <>
          {numInput("kg", "0")}
          {numInput("reps", "0")}
        </>
      )}
      {tracks === "reps" && numInput("reps", "0")}
      {tracks === "time" && numInput("timeSec", "sec")}
      {tracks === "distance" && (
        <>
          {numInput("distance", "km")}
          {numInput("timeSec", "sec")}
        </>
      )}
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button
          onClick={onDuplicate}
          title="Duplica serie"
          style={{
            width: 26, height: 36, borderRadius: 8, border: "1px solid var(--line)",
            background: "var(--surface2)", color: T.mut, fontSize: 14,
          }}
        >
          ⧉
        </button>
        <button
          onClick={onToggle}
          style={{
            width: 36, height: 36, borderRadius: "50%", border: "none",
            background: set.done ? T.green : "var(--surface3)",
            color: set.done ? "#06210f" : T.mut, fontSize: 16, fontWeight: 800,
          }}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
