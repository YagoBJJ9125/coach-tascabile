// Rank tab (EPIC 5): body chart + per-muscle ranks + rank calculator.
import { useState, useMemo } from "react";
import Header from "../components/Header.jsx";
import BodyChart from "../components/BodyChart.jsx";
import { Card, Segmented, Sheet, Button, Input, ProgressBar } from "../components/ui.jsx";
import { T, RANK_TIERS } from "../theme.js";
import { useStore } from "../lib/store.js";
import { MUSCLE_GROUPS, muscleLabel } from "../data/muscles.js";
import { allExercises, exerciseById, exercisePoints } from "../data/exercises.js";
import { e1rm } from "../lib/workout.js";
import { levelForPoints, monthlyBalance } from "../lib/progression.js";
import { monthKey } from "../lib/format.js";

export default function Rank() {
  const ranks = useStore((s) => s.muscleRanks);
  const prs = useStore((s) => s.prs);
  const pointsLog = useStore((s) => s.pointsLog);
  const [tab, setTab] = useState("grafico");
  const [calc, setCalc] = useState(false);

  return (
    <div className="page">
      <Header />
      <Segmented
        style={{ margin: "8px 0 18px" }}
        value={tab}
        onChange={setTab}
        options={[
          { value: "grafico", label: "Grafico" },
          { value: "bilancio", label: "Bilancio" },
          { value: "calc", label: "Calcolatore" },
        ]}
      />

      {tab === "grafico" ? (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: T.purple, fontWeight: 700, marginBottom: 8 }}>
              GRAFICO CORPOREO
            </div>
            <BodyChart ranks={ranks} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, justifyContent: "center" }}>
              {RANK_TIERS.map((r) => (
                <span key={r.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: T.mut }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: r.color }} />
                  {r.label}
                </span>
              ))}
            </div>
          </Card>

          <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>
            Rank dei muscoli
          </h2>
          {MUSCLE_GROUPS.map((m) => (
            <MuscleRow key={m.key} muscle={m} pts={ranks[m.key]?.points || 0} />
          ))}
        </>
      ) : tab === "bilancio" ? (
        <MonthBalance pointsLog={pointsLog} />
      ) : (
        <RankCalc prs={prs} />
      )}

      <Sheet open={calc} onClose={() => setCalc(false)} />
    </div>
  );
}

function MuscleRow({ muscle, pts }) {
  const [open, setOpen] = useState(false);
  const lvl = levelForPoints(pts);
  const tier = lvl.tier;
  // exercises that develop this muscle (breakdown by specificity)
  const contributors = allExercises()
    .map((e) => ({ e, w: exercisePoints(e)[muscle.key] || 0 }))
    .filter((x) => x.w > 0)
    .sort((a, b) => b.w - a.w)
    .slice(0, 6);

  return (
    <Card
      style={{
        marginBottom: 10,
        background: `linear-gradient(100deg, ${hex(tier.color, 0.16)}, var(--surface))`,
        border: `1px solid ${hex(tier.color, 0.4)}`,
      }}
      onClick={() => setOpen((o) => !o)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: hex(tier.color, 0.25),
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}
        >
          {muscle.emoji}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{muscle.label}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: tier.color, textTransform: "uppercase" }}>
            {lvl.label}
          </div>
        </div>
        <span style={{ color: T.mut, fontSize: 18 }}>{open ? "▴" : "▾"}</span>
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.mut, marginBottom: 4 }}>
          <span>{lvl.points} punti</span>
          <span>{lvl.pointsToNext > 0 ? `+${lvl.pointsToNext} al prossimo livello` : "Livello massimo!"}</span>
        </div>
        <ProgressBar value={lvl.progress} color={tier.color} />
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: T.mut, marginBottom: 6 }}>
            ESERCIZI CHE SVILUPPANO {muscle.label.toUpperCase()}
          </div>
          {contributors.map(({ e, w }) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 0" }}>
              <span>{e.emoji} {e.name}</span>
              <span style={{ color: tier.color, fontWeight: 700 }}>+{w}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function MonthBalance({ pointsLog }) {
  const mKey = monthKey();
  const bal = monthlyBalance(pointsLog, mKey);
  const monthName = new Date(mKey + "-01T00:00:00").toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });
  const empty = MUSCLE_GROUPS.every((m) => bal[m.key].total === 0);

  return (
    <>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: T.purple, fontWeight: 700, marginBottom: 4 }}>
          BILANCIO DI {monthName.toUpperCase()}
        </div>
        <div style={{ fontSize: 12.5, color: T.mut }}>
          Punti guadagnati/persi per gruppo muscolare, divisi per causa.
        </div>
      </Card>
      {empty && (
        <div style={{ textAlign: "center", color: T.mut, fontSize: 13, padding: 16 }}>
          Nessun movimento questo mese. Allenati o registra i pasti.
        </div>
      )}
      {MUSCLE_GROUPS.map((m) => {
        const b = bal[m.key];
        if (!b.total && !b.allenamento && !b.cibo && !b.sonno && !b.inattivita) return null;
        return (
          <Card key={m.key} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{m.emoji}</span>
              <span style={{ flex: 1, fontWeight: 700 }}>{m.label}</span>
              <span
                className="font-display"
                style={{ fontWeight: 700, fontSize: 18, color: b.total >= 0 ? T.green : T.coral }}
              >
                {b.total > 0 ? "+" : ""}{b.total}
              </span>
            </div>
            <CauseRow icon="🏋️" label="Allenamento" v={b.allenamento} />
            <CauseRow icon="🍎" label="Alimentazione" v={b.cibo} />
            <CauseRow icon="😴" label="Sonno" v={b.sonno} />
            <CauseRow icon="🛋️" label="Inattività" v={b.inattivita} />
          </Card>
        );
      })}
    </>
  );
}

function CauseRow({ icon, label, v }) {
  if (!v) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "3px 0" }}>
      <span>{icon}</span>
      <span style={{ flex: 1, color: T.mut }}>{label}</span>
      <span style={{ fontWeight: 700, color: v >= 0 ? T.green : T.coral }}>
        {v > 0 ? "+" : ""}{v}
      </span>
    </div>
  );
}

function RankCalc({ prs }) {
  const exs = useMemo(() => allExercises().filter((e) => e.tracks === "weight_reps"), []);
  const [exId, setExId] = useState(exs[0]?.id || "");
  const [kg, setKg] = useState("");
  const [reps, setReps] = useState("");

  const est = e1rm(Number(kg), Number(reps));
  // map e1rm to a tier via simple bands (bodyweight-relative would need profile)
  const tierIdx = est ? Math.min(RANK_TIERS.length - 1, Math.floor(est / 30)) : 0;
  const tier = RANK_TIERS[tierIdx];

  return (
    <Card>
      <div style={{ fontSize: 12, color: T.mut, marginBottom: 10 }}>
        Calcola il tuo rank stimato da una serie. Il calcolo usa l'1RM stimato (Epley).
      </div>
      <select
        value={exId}
        onChange={(e) => setExId(e.target.value)}
        style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px", color: T.text, fontSize: 15, marginBottom: 12 }}
      >
        {exs.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Input inputMode="decimal" placeholder="kg" value={kg} onChange={(e) => setKg(e.target.value.replace(",", "."))} />
        </div>
        <div style={{ flex: 1 }}>
          <Input inputMode="numeric" placeholder="ripetizioni" value={reps} onChange={(e) => setReps(e.target.value)} />
        </div>
      </div>

      {est > 0 && (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{ fontSize: 12, color: T.mut }}>1RM stimato</div>
          <div className="font-display" style={{ fontSize: 30, fontWeight: 700 }}>{est} kg</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: tier.color, textTransform: "uppercase", marginTop: 6 }}>
            Rank: {tier.label}
          </div>
        </div>
      )}

      {prs && Object.keys(prs).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: T.mut, marginBottom: 8 }}>I TUOI RECORD (1RM stimato)</div>
          {Object.entries(prs)
            .sort((a, b) => b[1].e1rm - a[1].e1rm)
            .slice(0, 8)
            .map(([eid, pr]) => (
              <div key={eid} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--line)" }}>
                <span>{exerciseById(eid)?.name || eid}</span>
                <span className="font-display" style={{ fontWeight: 700 }}>{pr.e1rm} kg</span>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}

function hex(c, a) {
  // c is #rrggbb -> rgba
  const r = parseInt(c.slice(1, 3), 16);
  const g = parseInt(c.slice(3, 5), 16);
  const b = parseInt(c.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
