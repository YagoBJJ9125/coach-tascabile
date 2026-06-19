// Home dashboard: greeting, today snapshot, coach tip, recent activity.
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import Header from "../components/Header.jsx";
import { Card, Button } from "../components/ui.jsx";
import { T } from "../theme.js";
import { useStore } from "../lib/store.js";
import { nutritionPlan, sumDayFood } from "../lib/nutrition.js";
import { createSession } from "../lib/sessions.js";
import { todayKey, fmtDateLong, fmtClock } from "../lib/format.js";
import { sessionVolume } from "../lib/workout.js";
import { muscleLabel } from "../data/muscles.js";

export default function Home() {
  const nav = useNavigate();
  const profile = useStore((s) => s.profile);
  const sessions = useStore((s) => s.sessions);
  const foodLog = useStore((s) => s.foodLog);

  const today = todayKey();
  const todaysSessions = sessions.filter((s) => s.date === today && s.finished);
  const burnedToday = todaysSessions.reduce((n, s) => n + (s.burn || 0), 0);
  const trainedStrength = todaysSessions.some((s) =>
    Object.keys(s.muscles || {}).some((m) => m !== "gambe")
  );
  const plan = useMemo(
    () => nutritionPlan(profile, burnedToday, trainedStrength),
    [profile, burnedToday, trainedStrength]
  );
  const eaten = sumDayFood(foodLog[today]);
  const remaining = plan ? plan.target - eaten.kcal + Math.round(burnedToday * 0.5) : 0;

  const recent = sessions.filter((s) => s.finished).slice(0, 4);
  const tip = coachTip(plan, todaysSessions.length, profile.goal);

  return (
    <div className="page">
      <Header right={
        <button onClick={() => nav(`/session/${createSession({})}`)}
          style={{ background: T.blue, border: "none", color: "#06121f", width: 34, height: 34, borderRadius: "50%", fontSize: 22, fontWeight: 700 }}>
          ＋
        </button>
      }/>

      <div style={{ fontSize: 12, color: T.mut, textTransform: "capitalize", marginTop: 6 }}>
        {fmtDateLong(today)}
      </div>
      <h1 className="font-display" style={{ fontSize: 26, fontWeight: 700, margin: "2px 0 16px" }}>
        Ciao {profile.name || "atleta"} 👋
      </h1>

      {/* today snapshot */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <Mini label="ALLENAMENTI" value={todaysSessions.length} color={T.blue} />
        <Mini label="KCAL RESID." value={plan ? remaining : "—"} color={T.green} />
        <Mini label="BRUCIATE" value={burnedToday ? `~${burnedToday}` : "0"} color={T.amber} />
      </div>

      <Card style={{ borderLeft: `3px solid ${T.blue}`, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: T.blue, fontWeight: 800, marginBottom: 6 }}>
          IL COACH DICE
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.55 }}>{tip}</div>
      </Card>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <Button full onClick={() => nav("/allenamento")}>🏋️ Allenati</Button>
        <Button full variant="ghost" onClick={() => nav("/alimentazione")}>🍎 Cibo</Button>
      </div>

      <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>
        Attività recente
      </h2>
      {recent.length === 0 ? (
        <Card style={{ textAlign: "center", color: T.mut, fontSize: 13 }}>
          Nessun allenamento ancora. Inizia il primo! 💪
        </Card>
      ) : (
        recent.map((s) => {
          const v = sessionVolume(s);
          return (
            <Card key={s.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: T.mut }}>{fmtClock(s.durationSec)}</div>
              </div>
              <div style={{ fontSize: 12, color: T.mut, marginTop: 4 }}>
                {v.sets} serie · {v.volume} kg vol · ~{s.burn || 0} kcal
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {Object.keys(s.muscles || {}).map((m) => (
                  <span key={m} style={{ fontSize: 11, color: T.blue, background: "rgba(77,166,255,.1)", borderRadius: 999, padding: "3px 9px" }}>
                    {muscleLabel(m)}
                  </span>
                ))}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

function Mini({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: "var(--surface)", borderRadius: 14, padding: "12px", border: "1px solid var(--line)" }}>
      <div style={{ fontSize: 10, color: T.mut, marginBottom: 4 }}>{label}</div>
      <div className="font-display" style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function coachTip(plan, workoutsToday, goal) {
  if (!plan) return "Completa il profilo per ricevere consigli su misura.";
  if (workoutsToday > 0)
    return `Ottimo lavoro oggi! Reintegra proteine (${plan.proteinG} g) e idratati bene per recuperare.`;
  if (goal === "dimagrire")
    return `Target di ${plan.target} kcal oggi. Tieni alte le proteine per preservare i muscoli mentre dimagrisci.`;
  if (goal === "aumentare")
    return `Per crescere punta a ${plan.target} kcal e ${plan.proteinG} g di proteine. Non saltare i pasti.`;
  return `Giornata di mantenimento: ${plan.target} kcal, ${plan.proteinG} g proteine. Allenati quando puoi!`;
}
