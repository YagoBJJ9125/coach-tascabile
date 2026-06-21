// Profilo tab: edit profile, tracker settings, data export/import/reset.
import { useState } from "react";
import Header from "../components/Header.jsx";
import { Card, Button, Label, Input, Select, Toggle, Segmented, H1, MiniLine } from "../components/ui.jsx";
import { T } from "../theme.js";
import { useStore, setState, resetState, replaceState } from "../lib/store.js";
import { getState } from "../lib/store.js";
import { exportJSON } from "../lib/storage.js";
import { nutritionPlan } from "../lib/nutrition.js";
import { logWeight, weightTrend } from "../lib/progress.js";
import { logSleep, sleepStats, sleepHoursFrom } from "../lib/sleep.js";
import { fmtDateShort } from "../lib/format.js";
import ExercisePicker from "../components/ExercisePicker.jsx";
import { exerciseById } from "../data/exercises.js";
import { PROVIDERS, providerInfo } from "../lib/ai.js";

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

      {/* weight tracking */}
      <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>
        Peso e progressi
      </h2>
      <WeightCard goalWeight={profile.goalWeight} goal={profile.goal} />
      <SleepCard sleepGoal={profile.sleepGoal} />

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

      {/* training preferences */}
      <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>
        Preferenze allenamento
      </h2>
      <PrefsCard />

      {/* AI coach */}
      <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>
        Coach AI 🧠
      </h2>
      <AiCard settings={settings} setSetting={setSetting} />

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

function WeightCard({ goalWeight, goal: bodyGoal }) {
  const weights = useStore((s) => s.weights);
  const [val, setVal] = useState("");
  const trend = weightTrend();
  const goal = Number(goalWeight) || null;
  // trend color depends on the body goal: gaining wants +, losing wants -
  const trendColor = (() => {
    if (!trend) return T.text;
    const pw = trend.perWeek;
    if (Math.abs(pw) < 0.05) return bodyGoal === "mantenere" ? T.green : T.mut;
    if (bodyGoal === "aumentare") return pw > 0 ? T.green : T.amber;
    if (bodyGoal === "dimagrire") return pw < 0 ? T.green : T.amber;
    return T.mut; // mantenere with movement
  })();
  const points = weights.slice(-14).map((w) => ({ label: fmtDateShort(w.date), v: w.kg }));
  const latest = weights.length ? weights[weights.length - 1].kg : null;

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <Input
          inputMode="decimal"
          placeholder="Peso di oggi (kg)"
          value={val}
          onChange={(e) => setVal(e.target.value.replace(",", "."))}
          style={{ marginBottom: 0 }}
        />
        <Button
          disabled={!val}
          onClick={() => { logWeight(val); setVal(""); }}
          style={{ flexShrink: 0 }}
        >
          Registra
        </Button>
      </div>

      {points.length >= 2 ? (
        <>
          <MiniLine points={points} goal={goal} />
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
            <Mini2 label="Attuale" value={`${latest} kg`} />
            {goal && <Mini2 label="Obiettivo" value={`${goal} kg`} color={T.green} />}
            {trend && (
              <Mini2
                label="Trend/sett."
                value={`${trend.perWeek > 0 ? "+" : ""}${trend.perWeek.toFixed(2)} kg`}
                color={trendColor}
              />
            )}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 12.5, color: T.mut, textAlign: "center", padding: "8px 0" }}>
          {latest ? `Ultimo: ${latest} kg. ` : ""}Registra il peso per qualche giorno per vedere il grafico.
        </div>
      )}
    </Card>
  );
}

function Mini2({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10.5, color: T.mut }}>{label}</div>
      <div className="font-display" style={{ fontSize: 16, fontWeight: 700, color: color || T.text }}>{value}</div>
    </div>
  );
}

function AiCard({ settings, setSetting }) {
  const [show, setShow] = useState(false);
  const provider = settings.aiProvider || "ollama";
  const info = providerInfo(provider);
  const models = info.models;
  // current model: explicit or provider default
  const curModel = settings.aiModel || (provider === "ollama" ? settings.ollamaModel : models[0]);
  const setModel = (v) =>
    provider === "ollama" ? setSetting({ ollamaModel: v }) : setSetting({ aiModel: v });
  const ready = !info.needsKey || settings.aiKey?.trim();

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, color: T.mut, lineHeight: 1.5, marginBottom: 12 }}>
        Coach che parla e consiglia sui tuoi numeri. Scegli un provider <b>gratuito</b>.
        Tutto resta su questo dispositivo.
      </div>

      <Label>Provider</Label>
      <Select
        value={provider}
        onChange={(e) => setSetting({ aiProvider: e.target.value, aiModel: "" })}
      >
        {Object.entries(PROVIDERS).map(([k, p]) => (
          <option key={k} value={k}>{p.label}</option>
        ))}
      </Select>

      <div style={{ fontSize: 11.5, color: T.mut, lineHeight: 1.5, marginBottom: 12, padding: "8px 10px", background: "var(--surface2)", borderRadius: 10 }}>
        ℹ️ {info.help}
      </div>

      {provider === "ollama" && (
        <>
          <Label>Indirizzo Ollama</Label>
          <Input
            value={settings.ollamaUrl}
            onChange={(e) => setSetting({ ollamaUrl: e.target.value })}
            placeholder="http://localhost:11434"
          />
        </>
      )}

      {info.needsKey && (
        <>
          <Label>Chiave API ({info.label.split(" ")[0]})</Label>
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              type={show ? "text" : "password"}
              placeholder="incolla la chiave…"
              value={settings.aiKey}
              onChange={(e) => setSetting({ aiKey: e.target.value })}
              style={{ marginBottom: 0 }}
            />
            <button onClick={() => setShow((s) => !s)} style={{ flexShrink: 0, background: "var(--surface2)", border: "1px solid var(--line)", color: T.text, borderRadius: 12, padding: "0 12px" }}>
              {show ? "🙈" : "👁"}
            </button>
          </div>
        </>
      )}

      <Label>Modello</Label>
      <Select value={curModel} onChange={(e) => setModel(e.target.value)}>
        {models.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </Select>

      <div style={{ fontSize: 11.5, color: ready ? T.green : T.amber }}>
        {ready
          ? "✓ Coach AI pronto"
          : "Inserisci la chiave, oppure usa Ollama locale (gratis). Senza config: modalità base."}
      </div>
      <div style={{ fontSize: 11, color: T.mut, marginTop: 8 }}>
        📱 Sul telefono usa <b>Gemini</b> o <b>OpenRouter</b> (gratis): Ollama gira solo sul PC.
      </div>
    </Card>
  );
}

function SleepCard({ sleepGoal }) {
  const sleep = useStore((s) => s.sleep);
  const [asleep, setAsleep] = useState("23:00");
  const [wake, setWake] = useState("07:00");
  const goal = Number(sleepGoal) || 8;
  const stats = sleepStats(sleep, goal);
  const preview = sleepHoursFrom(asleep, wake);
  const timeStyle = {
    flex: 1, background: "var(--surface2)", border: "1px solid var(--line)",
    borderRadius: 12, padding: "11px 12px", color: T.text, fontSize: 15, outline: "none",
  };
  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: T.mut, marginBottom: 4 }}>🌙 Addormentato</div>
          <input type="time" value={asleep} onChange={(e) => setAsleep(e.target.value)} style={timeStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: T.mut, marginBottom: 4 }}>☀️ Sveglia</div>
          <input type="time" value={wake} onChange={(e) => setWake(e.target.value)} style={timeStyle} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, fontSize: 13, color: T.mut }}>
          Stanotte: <b style={{ color: T.text }}>{preview} h</b> (obiettivo {goal} h)
        </div>
        <Button onClick={() => logSleep(asleep, wake)} disabled={!preview}>
          Registra
        </Button>
      </div>
      {stats && (
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 12 }}>
          <Mini2 label="Media 7gg" value={`${stats.avg7} h`} />
          <Mini2 label="Debito" value={`${stats.debt} h`} color={stats.debt > 5 ? T.coral : T.text} />
          <Mini2 label="Regolarità" value={`${stats.regularity}%`} color={stats.regularity >= 70 ? T.green : T.amber} />
        </div>
      )}
    </Card>
  );
}

function PrefsCard() {
  const prefs = useStore((s) => s.prefs);
  const [picker, setPicker] = useState(false);
  const setPref = (patch) =>
    setState((s) => {
      s.prefs = { ...s.prefs, ...patch };
      return s;
    });
  const allowed = prefs.allowedExerciseIds || [];
  const removeAllowed = (id) =>
    setPref({ allowedExerciseIds: allowed.filter((x) => x !== id) });

  return (
    <Card style={{ marginBottom: 14 }}>
      <Row label="Giorni a settimana">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Stepper
            value={prefs.daysPerWeek}
            min={1}
            max={7}
            onChange={(v) => setPref({ daysPerWeek: v })}
          />
        </div>
      </Row>
      <Divider />
      <Row label="Solo i miei esercizi" sub="Genera e consiglia solo dagli esercizi scelti (es. solo push-up e squat).">
        <Toggle on={prefs.restrict} onChange={(v) => setPref({ restrict: v })} />
      </Row>

      {prefs.restrict && (
        <>
          <Button variant="ghost" full onClick={() => setPicker(true)} style={{ marginTop: 12 }}>
            ＋ Scegli esercizi consentiti
          </Button>
          {allowed.length > 0 ? (
            <div style={{ marginTop: 10 }}>
              {allowed.map((id) => (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: "1px solid var(--line)" }}>
                  <span style={{ fontSize: 18 }}>{exerciseById(id)?.emoji || "•"}</span>
                  <span style={{ flex: 1, fontSize: 13.5 }}>{exerciseById(id)?.name || id}</span>
                  <button onClick={() => removeAllowed(id)} style={{ background: "none", border: "none", color: T.coral, fontSize: 15 }}>✕</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: T.mut, marginTop: 8, textAlign: "center" }}>
              Nessun esercizio scelto: vengono usati tutti.
            </div>
          )}
        </>
      )}

      <ExercisePicker
        open={picker}
        onClose={() => setPicker(false)}
        onConfirm={(ids) => setPref({ allowedExerciseIds: [...new Set([...allowed, ...ids])] })}
      />
    </Card>
  );
}

function Stepper({ value, min = 0, max = 99, onChange }) {
  const btn = {
    width: 34, height: 34, borderRadius: 10, border: "1px solid var(--line)",
    background: "var(--surface2)", color: T.text, fontSize: 18, fontWeight: 700,
  };
  return (
    <>
      <button style={btn} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span className="font-display" style={{ fontSize: 18, fontWeight: 700, minWidth: 22, textAlign: "center" }}>{value}</span>
      <button style={btn} onClick={() => onChange(Math.min(max, value + 1))}>＋</button>
    </>
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
