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

export default function WorkoutSession() {
  const { id } = useParams();
  const nav = useNavigate();
  const session = useStore((s) => s.sessions.find((x) => x.id === id));
  const settings = useStore((s) => s.settings);

  const [elapsed, setElapsed] = useState(0);
  const [picker, setPicker] = useState(false);
  const [rest, setRest] = useState(null); // {left,total}
  const [summary, setSummary] = useState(null);
  const [saveRoutine, setSaveRoutine] = useState(false);
  const [rname, setRname] = useState("");

  // running clock
  useEffect(() => {
    if (!session || session.finished) return;
    const tick = () =>
      setElapsed(Math.round((Date.now() - session.startedAt) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [session?.startedAt, session?.finished]);

  // rest countdown
  useEffect(() => {
    if (!rest) return;
    if (rest.left <= 0) {
      setRest(null);
      return;
    }
    const t = setTimeout(() => setRest((r) => r && { ...r, left: r.left - 1 }), 1000);
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

  const startRest = () => {
    if (settings.restTimerAuto)
      setRest({ left: settings.restDefaultSec, total: settings.restDefaultSec });
  };

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
    if (nowDone) startRest();
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

  const doFinish = () => {
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
        <div className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>
          {fmtClock(elapsed)}
        </div>
        <button
          onClick={doFinish}
          style={{ background: "none", border: "none", color: T.blue, fontSize: 22 }}
        >
          ✓
        </button>
      </div>

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
            onRemoveSet={removeSet}
            onRemove={removeExercise}
          />
        ))}

        <Button full variant="ghost" onClick={() => setPicker(true)} style={{ marginTop: 4 }}>
          ＋ Aggiungi esercizio
        </Button>

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
              <div style={{ fontSize: 12, color: T.mut }}>Timer di Riposo</div>
              <div className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>
                {fmtClock(rest.left)}
              </div>
            </div>
            <button
              onClick={() => setRest((r) => ({ ...r, left: r.left + 15 }))}
              style={pill}
            >
              +15s
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
              MUSCOLI ALLENATI
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {Object.keys(summary.muscles || {}).length ? (
                Object.entries(summary.muscles).map(([m, n]) => (
                  <span
                    key={m}
                    style={{
                      background: "var(--surface2)",
                      border: "1px solid var(--line)",
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 13,
                    }}
                  >
                    {muscleLabel(m)} · {n} serie
                  </span>
                ))
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

function ExerciseCard({ ex, onUpdateSet, onToggleDone, onAddSet, onRemoveSet, onRemove }) {
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
      ? "32px 1fr 1fr 1fr 40px"
      : "32px 1fr 1fr 40px";

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

function SetRow({ n, set, tracks, grid, onChange, onToggle, onRemove }) {
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
      <button
        onClick={onToggle}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "none",
          background: set.done ? T.green : "var(--surface3)",
          color: set.done ? "#06210f" : T.mut,
          fontSize: 16,
          fontWeight: 800,
        }}
      >
        ✓
      </button>
    </div>
  );
}
