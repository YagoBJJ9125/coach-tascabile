// Bottom-sheet exercise library: search + filters + multi-select.
import { useMemo, useState } from "react";
import { Sheet, Chip, Button, Input } from "./ui.jsx";
import { T } from "../theme.js";
import { allExercises } from "../data/exercises.js";
import { MUSCLE_GROUPS, muscleLabel, equipLabel } from "../data/muscles.js";
import { norm } from "../lib/format.js";

export default function ExercisePicker({ open, onClose, onConfirm }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("all");
  const [sel, setSel] = useState({});

  const list = useMemo(() => {
    const nq = norm(q);
    return allExercises()
      .filter((e) => (muscle === "all" ? true : e.muscle === muscle))
      .filter((e) => (nq ? norm(e.name).includes(nq) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [q, muscle, open]);

  const count = Object.values(sel).filter(Boolean).length;

  const toggle = (id) => setSel((s) => ({ ...s, [id]: !s[id] }));

  const confirm = () => {
    const ids = Object.keys(sel).filter((k) => sel[k]);
    onConfirm(ids);
    setSel({});
    setQ("");
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Aggiungi esercizi">
      <Input
        placeholder="🔎 Cerca esercizio"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 6,
          marginBottom: 8,
        }}
      >
        <Chip active={muscle === "all"} onClick={() => setMuscle("all")}>
          Tutti
        </Chip>
        {MUSCLE_GROUPS.map((m) => (
          <Chip key={m.key} active={muscle === m.key} onClick={() => setMuscle(m.key)}>
            {m.label}
          </Chip>
        ))}
      </div>

      <div style={{ maxHeight: "48vh", overflowY: "auto", margin: "0 -4px" }}>
        {list.map((e) => {
          const on = !!sel[e.id];
          return (
            <button
              key={e.id}
              onClick={() => toggle(e.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                marginBottom: 8,
                borderRadius: 14,
                border: `1px solid ${on ? T.blue : "var(--line)"}`,
                background: on ? "rgba(77,166,255,.12)" : "var(--surface2)",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--surface3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {e.emoji}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 11, color: T.blue }}>
                  {equipLabel(e.equipment)} · {muscleLabel(e.muscle)}
                </span>
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{e.name}</span>
              </span>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: `2px solid ${on ? T.blue : "var(--mut2)"}`,
                  background: on ? T.blue : "transparent",
                  color: "#06121f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {on ? "✓" : ""}
              </span>
            </button>
          );
        })}
        {!list.length && (
          <div style={{ textAlign: "center", color: T.mut, padding: 20 }}>
            Nessun esercizio trovato
          </div>
        )}
      </div>

      <Button full disabled={!count} onClick={confirm} style={{ marginTop: 10 }}>
        {count ? `Aggiungi ${count} esercizi` : "Seleziona esercizi"}
      </Button>
    </Sheet>
  );
}
