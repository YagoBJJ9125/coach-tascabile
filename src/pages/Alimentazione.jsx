// Alimentazione tab (EPIC 6/7): calorie ring, macros, meals, food DB + detail, micros.
import { useState, useMemo, useEffect } from "react";
import Header from "../components/Header.jsx";
import { Card, Button, Sheet, Input } from "../components/ui.jsx";
import { T } from "../theme.js";
import { useStore } from "../lib/store.js";
import { nutritionPlan, sumDayFood, sumDayMicros } from "../lib/nutrition.js";
import { todayKey, addDays, fmtDateLong, isToday, norm } from "../lib/format.js";
import { allFoods, foodById, MEAL_TYPES, MICRO_KEYS } from "../data/foods.js";
import { buildEntry, logFood, removeFood } from "../lib/food.js";

export default function Alimentazione() {
  const profile = useStore((s) => s.profile);
  const foodLog = useStore((s) => s.foodLog);
  const sessions = useStore((s) => s.sessions);
  const recentFoods = useStore((s) => s.recentFoods);

  const [date, setDate] = useState(todayKey());
  const [page, setPage] = useState(0); // 0 macros, 1 vitamine, 2 minerali
  const [searchMeal, setSearchMeal] = useState(null); // meal key when searching
  const [detail, setDetail] = useState(null); // {food, meal}

  const burned = sessions
    .filter((s) => s.date === date && s.finished)
    .reduce((n, s) => n + (s.burn || 0), 0);
  const plan = useMemo(() => nutritionPlan(profile, burned), [profile, burned]);
  const day = foodLog[date];
  const eaten = sumDayFood(day);
  const micros = useMemo(() => sumDayMicros(day, MICRO_KEYS), [day]);

  const target = plan?.target || 0;
  const exerciseKcal = Math.round(burned * 0.5);
  const remaining = target - eaten.kcal + exerciseKcal;

  return (
    <div className="page">
      <Header />

      {/* date nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, margin: "8px 0 16px" }}>
        <NavArrow dir="‹" onClick={() => setDate((d) => addDays(d, -1))} />
        <div className="font-display" style={{ fontWeight: 700, fontSize: 16, textTransform: "capitalize" }}>
          {isToday(date) ? "Oggi" : fmtDateLong(date)}
        </div>
        <NavArrow dir="›" onClick={() => setDate((d) => addDays(d, 1))} disabled={isToday(date)} />
      </div>

      {/* paged summary */}
      <Card style={{ marginBottom: 8 }}>
        {page === 0 && (
          <MacroPage plan={plan} eaten={eaten} remaining={remaining} burned={burned} exerciseKcal={exerciseKcal} onAdd={() => setSearchMeal("nonclass")} />
        )}
        {page === 1 && <MicroPage micros={micros} group="micro" filter={(m) => m.label.startsWith("Vit")} title="Vitamine" />}
        {page === 2 && <MicroPage micros={micros} group="micro" filter={(m) => !m.label.startsWith("Vit") && m.group === "micro"} title="Minerali" />}
        <Dots n={3} active={page} onSet={setPage} />
      </Card>

      {/* meals */}
      <div style={{ marginTop: 16 }}>
        {MEAL_TYPES.map((m) => (
          <MealSection
            key={m.key}
            meal={m}
            entries={day?.[m.key] || []}
            onAdd={() => setSearchMeal(m.key)}
            onRemove={(eid) => removeFood(date, m.key, eid)}
          />
        ))}
      </div>

      {/* food search */}
      <FoodSearch
        open={!!searchMeal}
        meal={searchMeal}
        recentFoods={recentFoods}
        onClose={() => setSearchMeal(null)}
        onPick={(food) => {
          setDetail({ food, meal: searchMeal });
          setSearchMeal(null);
        }}
      />

      {/* food detail */}
      <FoodDetail
        data={detail}
        onClose={() => setDetail(null)}
        onConfirm={(entry, meal) => {
          logFood(date, meal, entry);
          setDetail(null);
        }}
      />
    </div>
  );
}

function NavArrow({ dir, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: "none", border: "none", color: disabled ? T.mut2 : T.text, fontSize: 28, opacity: disabled ? 0.4 : 1 }}
    >
      {dir}
    </button>
  );
}

function Dots({ n, active, onSet }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 7, marginTop: 14 }}>
      {Array.from({ length: n }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSet(i)}
          style={{
            width: i === active ? 18 : 7, height: 7, borderRadius: 99, border: "none",
            background: i === active ? T.blue : "var(--surface3)", transition: "all .2s",
          }}
        />
      ))}
    </div>
  );
}

function MacroPage({ plan, eaten, remaining, burned, exerciseKcal, onAdd }) {
  if (!plan) {
    return <div style={{ color: T.mut, textAlign: "center", padding: 20 }}>Completa il profilo per il piano calorico.</div>;
  }
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Ring remaining={remaining} target={plan.target} />
        <div style={{ flex: 1 }}>
          <RingLine label="Obiettivo" value={plan.target} icon="🎯" />
          <RingLine label="Cibo" value={eaten.kcal} icon="🍴" />
          <RingLine label="Esercizio" value={`+${exerciseKcal}`} icon="🔥" color={T.green} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, margin: "16px 0" }}>
        <Macro label="Proteine" v={eaten.p} goal={plan.proteinG} color={T.blue} />
        <Macro label="Carboidrati" v={eaten.c} goal={plan.carbsG} color={T.amber} />
        <Macro label="Grassi" v={eaten.f} goal={plan.fatG} color={T.purple} />
      </div>

      <Button full onClick={onAdd}>＋ Aggiungi pasto</Button>
    </>
  );
}

function Ring({ remaining, target }) {
  const eatenPct = target ? Math.max(0, Math.min(1, 1 - remaining / target)) : 0;
  const r = 52, C = 2 * Math.PI * r, size = 128;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface3)" strokeWidth="11" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.blue} strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${eatenPct * C} ${C}`}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div className="font-display" style={{ fontSize: 26, fontWeight: 700, color: T.blue }}>{remaining}</div>
        <div style={{ fontSize: 11, color: T.mut }}>Rimanenti</div>
      </div>
    </div>
  );
}

function RingLine({ label, value, icon, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span className="font-display" style={{ fontWeight: 700, fontSize: 16, color: color || T.text }}>{value}</span>
      <span style={{ fontSize: 12, color: T.mut }}>{label}</span>
    </div>
  );
}

function Macro({ label, v, goal, color }) {
  const pct = goal ? Math.min(1, v / goal) : 0;
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: T.mut, marginBottom: 6 }}>{label}</div>
      <div style={{ height: 6, background: "var(--surface3)", borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ width: `${pct * 100}%`, height: "100%", background: color }} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 700 }}>
        {Math.round(v)}<span style={{ color: T.mut, fontWeight: 400 }}>/{goal}g</span>
      </div>
    </div>
  );
}

function MicroPage({ micros, filter, title }) {
  const items = MICRO_KEYS.filter(filter);
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
        {items.map((m) => (
          <div key={m.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
            <span style={{ color: T.mut }}>{m.label}</span>
            <span style={{ fontWeight: 600 }}>
              {Math.round((micros[m.key] || 0) * 100) / 100}{m.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MealSection({ meal, entries, onAdd, onRemove }) {
  const total = entries.reduce((n, e) => n + e.kcal, 0);
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
          {meal.emoji} {meal.label}
        </h3>
        <span style={{ fontSize: 13, color: T.mut }}>{total} kcal</span>
      </div>
      {entries.map((e) => (
        <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--line)" }}>
          <span style={{ fontSize: 20 }}>{e.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{e.name}</div>
            <div style={{ fontSize: 11, color: T.mut }}>{e.portionLabel} · P{e.p} C{e.c} G{e.f}</div>
          </div>
          <span className="font-display" style={{ fontWeight: 700, color: T.amber }}>{e.kcal}</span>
          <button onClick={() => onRemove(e.id)} style={{ background: "none", border: "none", color: T.coral, fontSize: 16 }}>✕</button>
        </div>
      ))}
      <button
        onClick={onAdd}
        style={{ width: "100%", marginTop: 8, background: "var(--surface)", border: "1px dashed var(--line)", color: T.mut, borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 600 }}
      >
        ＋ Aggiungi {meal.label}
      </button>
    </div>
  );
}

function FoodSearch({ open, meal, recentFoods, onClose, onPick }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const nq = norm(q);
    const foods = allFoods();
    if (!nq) {
      const recents = recentFoods.map(foodById).filter(Boolean);
      return recents.length ? recents : foods.slice(0, 12);
    }
    return foods.filter((f) => norm(f.name).includes(nq));
  }, [q, open, recentFoods]);

  const mealLabel = MEAL_TYPES.find((m) => m.key === meal)?.label || "";

  return (
    <Sheet open={open} onClose={onClose} title={`Aggiungi a ${mealLabel}`}>
      <Input placeholder="🔎 Cerca alimento" value={q} onChange={(e) => setQ(e.target.value)} />
      {!q && <div style={{ fontSize: 11, color: T.mut, margin: "0 0 8px 2px" }}>{recentFoods.length ? "RECENTI" : "SUGGERITI"}</div>}
      <div style={{ maxHeight: "55vh", overflowY: "auto" }}>
        {list.map((f) => (
          <button
            key={f.id}
            onClick={() => onPick(f)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 12, border: "none", background: "transparent", textAlign: "left", borderBottom: "1px solid var(--line)" }}
          >
            <span style={{ fontSize: 22 }}>{f.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>{f.name}</div>
              <div style={{ fontSize: 12, color: T.mut }}>
                {f.per100.kcal} kcal · 100g
              </div>
            </div>
            <span style={{ color: T.mut, fontSize: 18 }}>›</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function FoodDetail({ data, onClose, onConfirm }) {
  const [meal, setMeal] = useState("colazione");
  const [portionIdx, setPortionIdx] = useState(0);
  const [size, setSize] = useState(1);

  const food = data?.food;
  // sync controls when a new food is opened
  useEffect(() => {
    if (data) {
      setMeal(data.meal || "colazione");
      setPortionIdx(0);
      setSize(1);
    }
  }, [data]);

  if (!food) return <Sheet open={false} onClose={onClose} />;

  const portion = food.portions[portionIdx];
  const grams = portion.grams * size;
  const entry = buildEntry(food, grams, `${size} × ${portion.label}`);

  return (
    <Sheet open={!!data} onClose={onClose} title={food.name}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <span style={{ fontSize: 44 }}>{food.emoji}</span>
        <div>
          <div className="font-display" style={{ fontSize: 30, fontWeight: 700 }}>{entry.kcal}</div>
          <div style={{ fontSize: 12, color: T.mut }}>kcal · {Math.round(grams)} g</div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: T.mut, marginBottom: 6 }}>TIPO DI PASTO</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {MEAL_TYPES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMeal(m.key)}
            style={{
              flex: "1 0 30%", padding: "8px 4px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: `1px solid ${meal === m.key ? T.blue : "var(--line)"}`,
              background: meal === m.key ? T.blue : "var(--surface2)",
              color: meal === m.key ? "#06121f" : T.text,
            }}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: T.mut, marginBottom: 6 }}>UNITÀ</div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12 }}>
        {food.portions.map((p, i) => (
          <button
            key={i}
            onClick={() => setPortionIdx(i)}
            style={{
              padding: "8px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
              border: `1px solid ${portionIdx === i ? T.blue : "var(--line)"}`,
              background: portionIdx === i ? T.blue : "var(--surface2)",
              color: portionIdx === i ? "#06121f" : T.text,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: T.mut, marginBottom: 6 }}>QUANTITÀ</div>
      <Input
        inputMode="decimal"
        value={size}
        onChange={(e) => setSize(Math.max(0, Number(e.target.value.replace(",", ".")) || 0))}
      />

      <div style={{ display: "flex", gap: 10, margin: "8px 0 16px" }}>
        <MacroChip label="Proteine" v={entry.p} color={T.blue} />
        <MacroChip label="Carboid." v={entry.c} color={T.amber} />
        <MacroChip label="Grassi" v={entry.f} color={T.purple} />
      </div>

      <Button full onClick={() => onConfirm(entry, meal)}>Aggiungi</Button>
    </Sheet>
  );
}

function MacroChip({ label, v, color }) {
  return (
    <div style={{ flex: 1, background: "var(--surface2)", borderRadius: 12, padding: "10px", textAlign: "center", border: "1px solid var(--line)" }}>
      <div style={{ fontSize: 11, color: T.mut }}>{label}</div>
      <div style={{ fontWeight: 700, color }}>{v}g</div>
    </div>
  );
}
