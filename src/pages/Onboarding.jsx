// Minimal onboarding (full mascot flow = EPIC 8, later).
// Collects the data nutrition needs, then flips profile.onboarded.
import { useState } from "react";
import { setState } from "../lib/store.js";
import { T } from "../theme.js";
import { Card, Button, Label, Input, Select, H1 } from "../components/ui.jsx";

export default function Onboarding() {
  const [p, setP] = useState({
    name: "",
    age: "",
    sex: "uomo",
    weight: "",
    height: "",
    activity: "leggero",
    goal: "mantenere",
    goalWeight: "",
    sleepGoal: 8,
  });
  const set = (patch) => setP((cur) => ({ ...cur, ...patch }));
  const ready = p.age && p.weight && p.height;

  const finish = () => {
    setState((s) => {
      s.profile = {
        ...s.profile,
        ...p,
        age: Number(p.age),
        weight: Number(p.weight),
        height: Number(p.height),
        onboarded: true,
      };
      s.gamify.coins = 200;
      return s;
    });
  };

  return (
    <div className="page">
      <div style={{ fontSize: 12, color: T.blue, fontWeight: 800, letterSpacing: 1 }}>
        COACH TASCABILE
      </div>
      <H1 style={{ margin: "6px 0 4px" }}>Iniziamo da te 💪</H1>
      <p style={{ color: T.mut, fontSize: 13.5, marginBottom: 20 }}>
        Pochi dati per calcolare il tuo fabbisogno. Modificabili quando vuoi.
      </p>

      <Card>
        <Label>Nome</Label>
        <Input
          value={p.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Federico"
        />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Label>Età</Label>
            <Input
              inputMode="numeric"
              value={p.age}
              onChange={(e) => set({ age: e.target.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Sesso</Label>
            <Select value={p.sex} onChange={(e) => set({ sex: e.target.value })}>
              <option value="uomo">Uomo</option>
              <option value="donna">Donna</option>
            </Select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Label>Peso (kg)</Label>
            <Input
              inputMode="decimal"
              value={p.weight}
              onChange={(e) => set({ weight: e.target.value.replace(",", ".") })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Altezza (cm)</Label>
            <Input
              inputMode="numeric"
              value={p.height}
              onChange={(e) => set({ height: e.target.value })}
            />
          </div>
        </div>
        <Label>Livello di attività (fuori allenamento)</Label>
        <Select value={p.activity} onChange={(e) => set({ activity: e.target.value })}>
          <option value="sedentario">Sedentario</option>
          <option value="leggero">Leggermente attivo</option>
          <option value="moderato">Moderatamente attivo</option>
          <option value="intenso">Molto attivo</option>
        </Select>
        <Label>Obiettivo</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          {[
            ["dimagrire", "Dimagrire"],
            ["mantenere", "Mantenere"],
            ["aumentare", "Aumentare"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => set({ goal: k })}
              style={{
                flex: 1,
                padding: "11px 4px",
                fontSize: 12.5,
                fontWeight: 700,
                borderRadius: 12,
                border: `1px solid ${p.goal === k ? T.blue : "var(--line)"}`,
                background: p.goal === k ? T.blue : "var(--surface2)",
                color: p.goal === k ? "#06121f" : T.text,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </Card>

      <Button
        full
        disabled={!ready}
        onClick={finish}
        style={{ marginTop: 16 }}
      >
        {ready ? "Crea il mio piano" : "Compila peso, altezza ed età"}
      </Button>
    </div>
  );
}
