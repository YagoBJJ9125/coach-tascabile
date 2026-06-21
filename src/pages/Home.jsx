// Home = Coach dashboard. Surfaces the engine (coach.js) + accounting (ledger.js):
// today's balance, reasoned recommendations, weekly projection, fridge coverage.
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import Header from "../components/Header.jsx";
import { Card, Button, ProgressBar, Chip } from "../components/ui.jsx";
import { T } from "../theme.js";
import { useStore } from "../lib/store.js";
import { createSession } from "../lib/sessions.js";
import { todayKey, fmtDateLong } from "../lib/format.js";
import { energyPlan, recommendations } from "../lib/coach.js";
import { dayLedger, weekLedger, fridgeCoverage, activityCredit, isTrainingDay } from "../lib/ledger.js";
import { WORKOUT_TYPES, getDayPlan, setDayWorkout, clearDayWorkout } from "../lib/dayplan.js";
import { weightTrend } from "../lib/progress.js";
import { readiness } from "../lib/sleep.js";

export default function Home() {
  const nav = useNavigate();
  const state = useStore((s) => s);
  const { profile, sessions, fridge } = state;
  const today = todayKey();

  const trend = useMemo(() => weightTrend(), [state.weights]);
  const ready = useMemo(
    () => readiness(state.sleep, sessions, Number(profile.sleepGoal) || 8),
    [state.sleep, sessions, profile.sleepGoal]
  );
  const activity = useMemo(() => activityCredit(state, today), [state, today]);
  const trainingDay = useMemo(() => isTrainingDay(state, today), [state, today]);

  const energy = useMemo(
    () => energyPlan(profile, { trend, trainingDay, activityKcal: activity.credit }),
    [profile, trend, trainingDay, activity]
  );
  const dl = useMemo(() => dayLedger(state, today, energy), [state, energy]);
  const wl = useMemo(() => weekLedger(state, energy), [state, energy]);
  const fc = useMemo(() => fridgeCoverage(fridge, energy), [fridge, energy]);
  const recs = useMemo(
    () => recommendations(state, { energy, dayLedger: dl, weekLedger: wl, trend, fridgeCoverage: fc, ready }),
    [state, energy, dl, wl, trend, fc, ready]
  );

  return (
    <div className="page">
      <Header
        right={
          <button
            onClick={() => nav(`/session/${createSession({})}`)}
            style={{ background: T.blue, border: "none", color: "#06121f", width: 34, height: 34, borderRadius: "50%", fontSize: 22, fontWeight: 700 }}
          >
            ＋
          </button>
        }
      />

      <div style={{ fontSize: 12, color: T.mut, textTransform: "capitalize", marginTop: 6 }}>
        {fmtDateLong(today)}
      </div>
      <h1 className="font-display" style={{ fontSize: 25, fontWeight: 700, margin: "2px 0 16px" }}>
        Ciao {profile.name || "atleta"} 👋
      </h1>

      {/* ---- coach AI ---- */}
      <button
        onClick={() => nav("/coach")}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
          background: "linear-gradient(100deg,#1c2740,#231a3a)", border: "1px solid var(--line)",
          borderRadius: 16, padding: "14px", color: T.text, textAlign: "left",
        }}
      >
        <span style={{ fontSize: 26 }}>🧠</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>Parla col tuo coach</span>
          <span style={{ fontSize: 12, color: T.mut }}>Consigli su misura dai tuoi numeri</span>
        </span>
        <span style={{ color: T.blue, fontSize: 20 }}>›</span>
      </button>

      {/* ---- programma di oggi ---- */}
      {energy && <DayPlanCard date={today} weight={profile.weight} activity={activity} />}

      {/* ---- bilancio di oggi ---- */}
      {energy && (
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>BILANCIO DI OGGI {dl.activity.planned && <span style={{ color: T.amber }}>· da piano</span>}</SectionLabel>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <span className="font-display" style={{ fontSize: 34, fontWeight: 700, color: dl.remaining < 0 ? T.coral : T.blue }}>
              {dl.remaining}
            </span>
            <span style={{ color: T.mut, fontSize: 13 }}>kcal rimanenti</span>
          </div>
          <div style={{ fontSize: 12, color: T.mut, marginBottom: 12 }}>
            {dl.restTarget} base{dl.activity.credit > 0 ? ` + ${dl.activity.credit} allenamento` : ""} − {dl.eaten.kcal} cibo
            {dl.activity.planned && <span style={{ color: T.amber }}> (allenamento pianificato)</span>}
          </div>
          <MacroBudget label={`Carboidrati${energy.trainingDay ? " ⚡" : ""}`} m={dl.macros.c} color={T.amber} />
          <MacroBudget label={`Proteine${energy.trainingDay ? "" : " ⚡"}`} m={dl.macros.p} color={T.blue} />
          <MacroBudget label="Grassi" m={dl.macros.f} color={T.purple} />
          <div style={{ fontSize: 11, color: T.mut, marginTop: 6 }}>
            ⚡ priorità del giorno: {energy.trainingDay ? "carboidrati (allenamento)" : "proteine (riposo)"}.
          </div>
          {energy.adapt !== 0 && (
            <div style={{ fontSize: 11.5, color: T.amber, marginTop: 10 }}>
              ⚖️ Target adattato: {energy.adapt > 0 ? "+" : ""}{energy.adapt} kcal sul mantenimento ({energy.maintenance}).
            </div>
          )}
        </Card>
      )}

      {/* ---- prontezza all'allenamento ---- */}
      {ready && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <SectionLabel>PRONTEZZA ALL'ALLENAMENTO</SectionLabel>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: ready.color }}>{ready.level}</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="font-display" style={{ fontSize: 30, fontWeight: 700, color: ready.color }}>
              {ready.score}
            </span>
            <span style={{ fontSize: 12, color: T.mut }}>/ 100</span>
          </div>
          <div style={{ margin: "8px 0" }}>
            <ProgressBar value={ready.score / 100} color={ready.color} />
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>{ready.advice}</div>
        </Card>
      )}

      {/* ---- il coach consiglia ---- */}
      {recs.length > 0 && (
        <>
          <SectionTitle>Il coach consiglia</SectionTitle>
          {recs.map((r) => (
            <RecCard key={r.id} rec={r} />
          ))}
        </>
      )}

      {/* ---- bilancio settimanale ---- */}
      {wl && wl.days >= 1 && energy && (
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>BILANCIO SETTIMANALE ({wl.days} gg)</SectionLabel>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Mini label="Intake medio" value={`${wl.avgIntake}`} unit="kcal" />
            <Mini
              label="Bilancio/gg"
              value={`${wl.dailyBalance > 0 ? "+" : ""}${wl.dailyBalance}`}
              unit="kcal"
              color={wl.dailyBalance < 0 ? T.green : T.amber}
            />
            <Mini
              label="Proiezione"
              value={`${wl.projectedKgPerWeek > 0 ? "+" : ""}${wl.projectedKgPerWeek}`}
              unit="kg/sett"
            />
          </div>
          <div style={{ fontSize: 11.5, color: T.mut, marginTop: 10 }}>
            Obiettivo: {energy.rateKgWk > 0 ? "+" : ""}{energy.rateKgWk.toFixed(2)} kg/sett · mantenimento {energy.maintenance} kcal.
          </div>
        </Card>
      )}

      {/* ---- frigo ---- */}
      <Card style={{ marginBottom: 14 }} onClick={() => nav("/alimentazione")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SectionLabel>FRIGO / DISPENSA</SectionLabel>
          <span style={{ color: T.blue, fontSize: 13 }}>Gestisci ›</span>
        </div>
        {fc.hasItems ? (
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Mini label="Disponibili" value={`${fc.totals.kcal}`} unit="kcal" />
            <Mini label="Copertura" value={fc.kcalDays.toFixed(1)} unit="giorni" />
            <Mini label="Proteine" value={`${fc.totals.p}`} unit="g" color={fc.proteinDays < 1 ? T.coral : T.green} />
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: T.mut, marginTop: 6 }}>
            Aggiungi cosa hai in frigo per calcolare copertura e lista della spesa.
          </div>
        )}
      </Card>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <Button full onClick={() => nav("/allenamento")}>🏋️ Allenati</Button>
        <Button full variant="ghost" onClick={() => nav("/alimentazione")}>🍎 Cibo</Button>
      </div>
    </div>
  );
}

function DayPlanCard({ date, weight, activity }) {
  const plan = useStore((s) => getDayPlan(s, date));
  const [open, setOpen] = useState(false);
  const w = Number(weight) || 75;
  const cur = plan?.workout;
  const curType = cur ? WORKOUT_TYPES.find((t) => t.key === cur.type) : null;

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionLabel>PROGRAMMA DI OGGI</SectionLabel>
        <button onClick={() => setOpen((o) => !o)} style={{ background: "none", border: "none", color: T.blue, fontSize: 13, fontWeight: 700 }}>
          {cur ? "Cambia" : "Imposta"} {open ? "▴" : "▾"}
        </button>
      </div>

      {cur ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <span style={{ fontSize: 26 }}>{curType?.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{curType?.label}</div>
            <div style={{ fontSize: 12, color: T.mut }}>
              {cur.minutes ? `${cur.minutes} min · ` : ""}
              {cur.estBurn ? `~${cur.estBurn} kcal stimate` : "nessun consumo extra"}
              {activity.doneBurn > 0 ? ` · svolto ${activity.doneBurn} kcal` : ""}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: T.mut, marginTop: 6 }}>
          Imposta che allenamento farai: bilancio e macro si calcolano già da ora.
        </div>
      )}

      {open && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {WORKOUT_TYPES.map((t) => (
              <Chip
                key={t.key}
                active={cur?.type === t.key}
                onClick={() => setDayWorkout(date, t.key, t.defMin, w)}
              >
                {t.emoji} {t.label}
              </Chip>
            ))}
          </div>
          {cur && curType?.met > 0 && (
            <div>
              <div style={{ fontSize: 11, color: T.mut, marginBottom: 6 }}>
                DURATA: {cur.minutes} min (~{cur.estBurn} kcal)
              </div>
              <input
                type="range" min="10" max="150" step="5" value={cur.minutes}
                onChange={(e) => setDayWorkout(date, cur.type, Number(e.target.value), w)}
                style={{ width: "100%" }}
              />
            </div>
          )}
          {cur && (
            <button onClick={() => clearDayWorkout(date)} style={{ background: "none", border: "none", color: T.coral, fontSize: 12.5, marginTop: 8 }}>
              ✕ Rimuovi programma
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, color: T.mut, fontWeight: 800, letterSpacing: 0.5 }}>{children}</div>;
}
function SectionTitle({ children }) {
  return <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, margin: "4px 0 10px" }}>{children}</h2>;
}

function MacroBudget({ label, m, color }) {
  const pct = m.target ? Math.min(1, m.eaten / m.target) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: T.mut }}>{label}</span>
        <span style={{ fontWeight: 600 }}>{m.eaten}/{m.target} g</span>
      </div>
      <ProgressBar value={pct} color={color} height={6} />
    </div>
  );
}

function Mini({ label, value, unit, color }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10.5, color: T.mut }}>{label}</div>
      <div className="font-display" style={{ fontSize: 18, fontWeight: 700, color: color || T.text }}>
        {value} <span style={{ fontSize: 10, color: T.mut, fontWeight: 400 }}>{unit}</span>
      </div>
    </div>
  );
}

function RecCard({ rec }) {
  const [open, setOpen] = useState(false);
  const border =
    rec.level === "action" ? T.amber : rec.level === "info" ? T.blue : T.mut;
  return (
    <Card style={{ marginBottom: 10, borderLeft: `3px solid ${border}` }} onClick={() => setOpen((o) => !o)}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 20 }}>{rec.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{rec.title}</div>
          <div style={{ fontSize: 13, color: T.mut, marginTop: 2 }}>{rec.detail}</div>
          {open && (
            <div style={{ fontSize: 12.5, color: T.text, marginTop: 8, padding: 10, background: "var(--surface2)", borderRadius: 10, lineHeight: 1.5 }}>
              <b style={{ color: border }}>Perché:</b> {rec.why}
            </div>
          )}
          {!open && (
            <div style={{ fontSize: 11.5, color: T.blue, marginTop: 6 }}>perché ▾</div>
          )}
        </div>
      </div>
    </Card>
  );
}
