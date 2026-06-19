// Rank tab (EPIC 5): body chart + per-muscle ranks + rank calculator.
import { useState, useMemo } from "react";
import Header from "../components/Header.jsx";
import BodyChart from "../components/BodyChart.jsx";
import { Card, Segmented, Sheet, Button, Input, ProgressBar } from "../components/ui.jsx";
import { T, RANK_TIERS } from "../theme.js";
import { useStore } from "../lib/store.js";
import { MUSCLE_GROUPS, muscleLabel } from "../data/muscles.js";
import { allExercises, exerciseById } from "../data/exercises.js";
import {
  tierForPoints,
  tierProgress,
  RANK_THRESHOLDS,
  e1rm,
} from "../lib/workout.js";

export default function Rank() {
  const ranks = useStore((s) => s.muscleRanks);
  const prs = useStore((s) => s.prs);
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
      ) : (
        <RankCalc prs={prs} />
      )}

      <Sheet open={calc} onClose={() => setCalc(false)} />
    </div>
  );
}

function MuscleRow({ muscle, pts }) {
  const [open, setOpen] = useState(false);
  const { idx, tier } = tierForPoints(pts);
  const prog = tierProgress(pts);
  const next = RANK_TIERS[idx + 1];
  const nextNeed = RANK_THRESHOLDS[idx + 1];

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
            {tier.label}
          </div>
        </div>
        <span style={{ color: T.mut, fontSize: 18 }}>{open ? "▴" : "▾"}</span>
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.mut, marginBottom: 4 }}>
            <span>{pts} punti</span>
            <span>{next ? `Prossimo: ${next.label} (${nextNeed})` : "Livello massimo!"}</span>
          </div>
          <ProgressBar value={prog} color={tier.color} />
        </div>
      )}
    </Card>
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
