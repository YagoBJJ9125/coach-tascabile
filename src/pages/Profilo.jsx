// Profilo tab: edit profile, tracker settings, data export/import/reset.
import { useState } from "react";
import Header from "../components/Header.jsx";
import { Card, Button, Label, Input, Select, Toggle, Segmented, H1 } from "../components/ui.jsx";
import { T } from "../theme.js";
import { useStore, setState, resetState, replaceState } from "../lib/store.js";
import { getState } from "../lib/store.js";
import { exportJSON } from "../lib/storage.js";
import { nutritionPlan } from "../lib/nutrition.js";

export default function Profilo() {
  const profile = useStore((s) => s.profile);
  const settings = useStore((s) => s.settings);
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    setState((s) => {
      s.profile = {
        ...s.profile,
        ...draft,
        age: Number(draft.age),
        weight: Number(draft.weight),
        height: Number(draft.height),
      };
      return s;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const setSetting = (patch) =>
    setState((s) => {
      s.settings = { ...s.settings, ...patch };
      return s;
    });

  const plan = nutritionPlan(profile);

  const exportData = () => {
    const blob = new Blob([exportJSON(getState())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coach-tascabile-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        replaceState(JSON.parse(r.result));
        alert("Dati importati ✓");
      } catch {
        alert("File non valido");
      }
    };
    r.readAsText(file);
  };

  return (
    <div className="page">
      <Header />
      <H1 style={{ marginTop: 8 }}>Profilo</H1>

      {plan && (
        <Card style={{ marginBottom: 14, display: "flex", gap: 10 }}>
          <PlanStat label="BMR" value={plan.bmr} />
          <PlanStat label="TDEE" value={plan.tdee} />
          <PlanStat label="Target" value={plan.target} color={T.blue} />
        </Card>
      )}

      <Card style={{ marginBottom: 14 }}>
        <Label>Nome</Label>
        <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Label>Età</Label>
            <Input inputMode="numeric" value={draft.age} onChange={(e) => set({ age: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Sesso</Label>
            <Select value={draft.sex} onChange={(e) => set({ sex: e.target.value })}>
              <option value="uomo">Uomo</option>
              <option value="donna">Donna</option>
            </Select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Label>Peso (kg)</Label>
            <Input inputMode="decimal" value={draft.weight} onChange={(e) => set({ weight: e.target.value.replace(",", ".") })} />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Altezza (cm)</Label>
            <Input inputMode="numeric" value={draft.height} onChange={(e) => set({ height: e.target.value })} />
          </div>
        </div>
        <Label>Attività</Label>
        <Select value={draft.activity} onChange={(e) => set({ activity: e.target.value })}>
          <option value="sedentario">Sedentario</option>
          <option value="leggero">Leggermente attivo</option>
          <option value="moderato">Moderatamente attivo</option>
          <option value="intenso">Molto attivo</option>
        </Select>
        <Label>Obiettivo</Label>
        <Select value={draft.goal} onChange={(e) => set({ goal: e.target.value })}>
          <option value="dimagrire">Dimagrire</option>
          <option value="mantenere">Mantenere</option>
          <option value="aumentare">Aumentare</option>
        </Select>
        <Button full onClick={save} style={{ marginTop: 6, background: saved ? T.green : T.blue }}>
          {saved ? "✓ Salvato" : "Salva modifiche"}
        </Button>
      </Card>

      {/* settings */}
      <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>
        Impostazioni Tracker
      </h2>
      <Card style={{ marginBottom: 14 }}>
        <Row label="Unità di peso">
          <Segmented
            style={{ width: 130 }}
            value={settings.unitWeight}
            onChange={(v) => setSetting({ unitWeight: v })}
            options={[{ value: "kg", label: "Kg" }, { value: "lbs", label: "Lbs" }]}
          />
        </Row>
        <Divider />
        <Row label="Timer di riposo automatico" sub="Parte alla fine di ogni serie.">
          <Toggle on={settings.restTimerAuto} onChange={(v) => setSetting({ restTimerAuto: v })} />
        </Row>
        <Divider />
        <Row label="Durata riposo predefinita">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              inputMode="numeric"
              value={settings.restDefaultSec}
              onChange={(e) => setSetting({ restDefaultSec: Number(e.target.value) || 0 })}
              style={{ width: 60, background: "var(--surface2)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px", color: T.text, textAlign: "center" }}
            />
            <span style={{ color: T.mut, fontSize: 13 }}>sec</span>
          </div>
        </Row>
        <Divider />
        <Row label="Calcolatore di Rank" sub="Mostra il rank stimato nel tracker.">
          <Toggle on={settings.rankCalc} onChange={(v) => setSetting({ rankCalc: v })} />
        </Row>
      </Card>

      {/* data */}
      <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>
        Dati
      </h2>
      <Card>
        <div style={{ fontSize: 12, color: T.mut, lineHeight: 1.5, marginBottom: 12 }}>
          I dati sono salvati solo su questo dispositivo (local-first). Esporta un backup
          o ripristinalo su un altro dispositivo.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button full variant="ghost" onClick={exportData}>⬇️ Esporta</Button>
          <label style={{ flex: 1 }}>
            <input type="file" accept="application/json" onChange={importData} style={{ display: "none" }} />
            <span style={{ display: "block", textAlign: "center", background: "var(--surface2)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px", fontWeight: 700, fontSize: 15 }}>
              ⬆️ Importa
            </span>
          </label>
        </div>
        <Button
          full
          variant="ghost"
          onClick={() => {
            if (confirm("Azzerare TUTTI i dati? Operazione irreversibile.")) resetState();
          }}
          style={{ marginTop: 10, color: T.coral }}
        >
          🗑 Azzera tutti i dati
        </Button>
      </Card>

      <div style={{ textAlign: "center", color: T.mut2, fontSize: 11, marginTop: 16 }}>
        Coach Tascabile v2 · stile Lifoff · solo per te
      </div>
    </div>
  );
}

function PlanStat({ label, value, color }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: T.mut }}>{label}</div>
      <div className="font-display" style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}>{value}</div>
    </div>
  );
}

function Row({ label, sub, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: T.mut, marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--line)", margin: "10px 0" }} />;
}
