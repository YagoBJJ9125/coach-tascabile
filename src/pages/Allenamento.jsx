// Allenamento tab: Tracker (start/generate/routines) + "Il mio piano".
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import { Card, Button, Segmented, EmptyState, Sheet, Input } from "../components/ui.jsx";
import { T } from "../theme.js";
import { useStore } from "../lib/store.js";
import { createSession, deleteRoutine, createRoutine, generatePlan, clearPlan } from "../lib/sessions.js";
import { coachExercisePool, exerciseById } from "../data/exercises.js";
import { MUSCLE_GROUPS } from "../data/muscles.js";

function generateWorkout(goal) {
  // one exercise per muscle group, from the allowed pool (user prefs)
  const byMuscle = {};
  for (const e of coachExercisePool()) (byMuscle[e.muscle] ||= []).push(e);
  const pick = [];
  for (const m of MUSCLE_GROUPS) {
    const pool = byMuscle[m.key] || [];
    if (!pool.length) continue;
    pool.sort(() => Math.random() - 0.5);
    pick.push(pool[0].id);
  }
  return pick;
}

export default function Allenamento() {
  const nav = useNavigate();
  const [tab, setTab] = useState("tracker");
  const routines = useStore((s) => s.routines);
  const plan = useStore((s) => s.plan);
  const sessions = useStore((s) => s.sessions);
  const goal = useStore((s) => s.profile.goal);
  const active = sessions.find((s) => !s.finished);
  const [newRoutine, setNewRoutine] = useState(false);
  const [rname, setRname] = useState("");

  const startEmpty = () => nav(`/session/${createSession({ title: "Allenamento" })}`);
  const startGenerated = () =>
    nav(`/session/${createSession({ exerciseIds: generateWorkout(goal), title: "Allenamento generato" })}`);
  const startRoutine = (rid) => nav(`/session/${createSession({ routineId: rid })}`);

  return (
    <div className="page">
      <Header />
      <Segmented
        style={{ margin: "8px 0 18px" }}
        value={tab}
        onChange={setTab}
        options={[
          { value: "tracker", label: "Tracker" },
          { value: "piano", label: "Il mio piano" },
        ]}
      />

      {active && (
        <Card
          onClick={() => nav(`/session/${active.id}`)}
          style={{
            marginBottom: 16,
            border: `1px solid ${T.green}`,
            background: "rgba(74,222,128,.08)",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 11, color: T.green, fontWeight: 800 }}>
            ALLENAMENTO IN CORSO
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            {active.title} · riprendi ▶
          </div>
        </Card>
      )}

      {tab === "tracker" ? (
        <>
          <SectionTitle>Nuovo allenamento</SectionTitle>
          <BigAction emoji="🏋️" label="Inizia un allenamento vuoto" onClick={startEmpty} />
          <BigAction emoji="🔄" label="Genera allenamento" onClick={startGenerated} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "22px 4px 10px",
            }}
          >
            <SectionTitle style={{ margin: 0 }}>Routine</SectionTitle>
            <button
              onClick={() => setNewRoutine(true)}
              style={{ background: "none", border: "none", color: T.blue, fontSize: 24 }}
            >
              ＋
            </button>
          </div>

          {routines.length === 0 ? (
            <EmptyState
              icon="📋"
              title="Nessuna routine"
              sub="Crea una routine o salvane una a fine allenamento."
            />
          ) : (
            routines.map((r) => (
              <RoutineCard
                key={r.id}
                routine={r}
                onStart={() => startRoutine(r.id)}
                onDelete={() => deleteRoutine(r.id)}
              />
            ))
          )}
        </>
      ) : (
        <PlanView
          plan={plan}
          onGenerate={generatePlan}
          onClear={clearPlan}
          onStartDay={(ids, title) =>
            nav(`/session/${createSession({ exerciseIds: ids, title })}`)
          }
        />
      )}

      <Sheet open={newRoutine} onClose={() => setNewRoutine(false)} title="Nuova routine">
        <Input
          placeholder="Nome (es. Gambe)"
          value={rname}
          onChange={(e) => setRname(e.target.value)}
        />
        <Button
          full
          disabled={!rname.trim()}
          onClick={() => {
            createRoutine(rname.trim());
            setRname("");
            setNewRoutine(false);
          }}
        >
          Crea routine vuota
        </Button>
        <p style={{ color: T.mut, fontSize: 12, marginTop: 10 }}>
          Aggiungi gli esercizi avviandola, oppure salva una sessione come routine a fine
          allenamento.
        </p>
      </Sheet>
    </div>
  );
}

function SectionTitle({ children, style }) {
  return (
    <h2 className="font-display" style={{ fontSize: 19, fontWeight: 700, margin: "0 0 10px", ...style }}>
      {children}
    </h2>
  );
}

function BigAction({ emoji, label, onClick }) {
  return (
    <Card
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 26 }}>{emoji}</span>
    </Card>
  );
}

function RoutineCard({ routine, onStart, onDelete }) {
  const [menu, setMenu] = useState(false);
  const totalSets = routine.items.reduce((n, it) => n + (it.sets?.length || 0), 0);
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{routine.name}</div>
          <div style={{ fontSize: 12, color: T.mut }}>{totalSets} serie</div>
        </div>
        <button
          onClick={() => setMenu((m) => !m)}
          style={{ background: "none", border: "none", color: T.mut, fontSize: 20 }}
        >
          ⋮
        </button>
      </div>
      {routine.items.slice(0, 3).map((it, i) => {
        const def = exerciseById(it.exerciseId);
        return (
          <div
            key={i}
            style={{ fontSize: 13, color: T.mut, marginTop: 6, display: "flex", gap: 8 }}
          >
            <span>{def?.emoji || "•"}</span>
            <span>{def?.name || it.exerciseId}</span>
          </div>
        );
      })}
      {routine.items.length > 3 && (
        <div style={{ fontSize: 12, color: T.mut2, marginTop: 6 }}>
          +{routine.items.length - 3} altri
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Button full onClick={onStart}>
          Avvia ▶
        </Button>
        {menu && (
          <Button variant="ghost" onClick={onDelete} style={{ color: T.coral }}>
            Elimina
          </Button>
        )}
      </div>
    </Card>
  );
}

function PlanView({ plan, onGenerate, onClear, onStartDay }) {
  if (!plan.length) {
    return (
      <>
        <EmptyState
          icon="🗺️"
          title="Nessun piano ancora"
          sub="Genera un piano settimanale su misura per iniziare il tuo percorso."
        />
        <Button full onClick={onGenerate} style={{ marginTop: 8 }}>
          🔄 Genera piano settimanale
        </Button>
      </>
    );
  }
  return (
    <div>
      {plan.map((p, i) => (
        <Card key={p.id} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: T.mut }}>Allenamento {i + 1}</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{p.title}</div>
          <div style={{ fontSize: 12, color: T.mut, marginBottom: 8 }}>
            {p.durationMin} min · {p.exerciseIds.length} esercizi
          </div>
          {p.exerciseIds.slice(0, 4).map((eid) => {
            const def = exerciseById(eid);
            return (
              <div key={eid} style={{ fontSize: 12.5, color: T.mut, display: "flex", gap: 8, marginTop: 4 }}>
                <span>{def?.emoji || "•"}</span>
                <span>{def?.name || eid}</span>
              </div>
            );
          })}
          <Button full onClick={() => onStartDay(p.exerciseIds, p.title)} style={{ marginTop: 12 }}>
            Avvia ▶
          </Button>
        </Card>
      ))}
      <Button full variant="ghost" onClick={onGenerate} style={{ marginTop: 4 }}>
        🔄 Rigenera piano
      </Button>
      <Button full variant="ghost" onClick={onClear} style={{ marginTop: 8, color: T.coral }}>
        Cancella piano
      </Button>
    </div>
  );
}
