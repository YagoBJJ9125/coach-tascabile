// Coaching engine (deterministic). The "brain": reasons on profile + history
// + lifestyle to prescribe energy/macros/training and ADAPTS over time.
// Every output carries the numbers behind it (the "perché"), so the future
// AI layer (EPIC 12) can explain/refine instead of inventing.
import { round, clamp } from "./format.js";
import { weeklySetsByMuscle } from "./workout.js";
import { MUSCLE_GROUPS, muscleLabel } from "../data/muscles.js";
import { uncoveredMuscles } from "../data/exercises.js";

const KCAL_PER_KG = 7700; // energy in 1 kg of body mass

const ACT_FACTOR = {
  sedentario: 1.2,
  leggero: 1.375,
  moderato: 1.55,
  intenso: 1.725,
};

export function bmr(profile) {
  const age = Number(profile.age),
    w = Number(profile.weight),
    h = Number(profile.height);
  if (!age || !w || !h) return null;
  return 10 * w + 6.25 * h - 5 * age + (profile.sex === "donna" ? -161 : 5);
}

export function maintenance(profile) {
  const b = bmr(profile);
  if (!b) return null;
  return Math.round(b * (ACT_FACTOR[profile.activity] ?? 1.375));
}

// target body-weight change, kg/week, from goal (relative to bodyweight)
export function weeklyRateTarget(profile) {
  const w = Number(profile.weight) || 0;
  if (profile.goal === "dimagrire") return -clamp(w * 0.006, 0.25, 0.9); // 0.6%/wk
  if (profile.goal === "aumentare") return clamp(w * 0.0025, 0.12, 0.4); // 0.25%/wk
  return 0;
}

// Full energy + macro plan, ADAPTIVE on the measured weight trend.
// trend = { perWeek } from progress.weightTrend(), or null.
export function energyPlan(profile, { trend = null, trainedStrength = false } = {}) {
  const maint = maintenance(profile);
  if (!maint) return null;
  const weight = Number(profile.weight);

  const rateKgWk = weeklyRateTarget(profile);
  const baseDailyAdj = round((rateKgWk * KCAL_PER_KG) / 7);
  let target = maint + baseDailyAdj;

  // --- adaptation: compare measured trend vs intended rate ---
  let adapt = 0;
  let adaptReason = null;
  if (trend && profile.goal !== "mantenere") {
    const actual = trend.perWeek; // kg/wk measured
    const diff = actual - rateKgWk; // >0 means gaining faster / losing slower than intended
    if (profile.goal === "dimagrire" && diff > 0.1) {
      // losing slower than planned -> cut more
      adapt = -clamp(round((diff * KCAL_PER_KG) / 7 / 2), 40, 200);
      adaptReason = `Stai calando ${fmtKg(actual)}/sett. invece di ${fmtKg(
        rateKgWk
      )}: riduco di ${Math.abs(adapt)} kcal per rimetterti in linea.`;
    } else if (profile.goal === "dimagrire" && diff < -0.15) {
      adapt = clamp(round((-diff * KCAL_PER_KG) / 7 / 2), 40, 200);
      adaptReason = `Stai calando troppo in fretta (${fmtKg(
        actual
      )}/sett.): aggiungo ${adapt} kcal per proteggere i muscoli.`;
    } else if (profile.goal === "aumentare" && diff < -0.1) {
      adapt = clamp(round((-diff * KCAL_PER_KG) / 7 / 2), 40, 200);
      adaptReason = `Cresci più lento del previsto (${fmtKg(
        actual
      )}/sett.): aggiungo ${adapt} kcal.`;
    } else if (profile.goal === "aumentare" && diff > 0.15) {
      adapt = -clamp(round((diff * KCAL_PER_KG) / 7 / 2), 40, 200);
      adaptReason = `Cresci troppo in fretta (rischio grasso): tolgo ${Math.abs(
        adapt
      )} kcal.`;
    }
  }
  target += adapt;

  // floor & macros
  const floor = profile.sex === "donna" ? 1200 : 1500;
  const flooredAtMin = target < floor;
  if (flooredAtMin) target = floor;

  let protPerKg = 1.8;
  if (trainedStrength) protPerKg = 2;
  if (profile.goal === "dimagrire") protPerKg = Math.max(protPerKg, 2.2);
  if (profile.goal === "aumentare" && trainedStrength) protPerKg = 2.1;

  const proteinG = round(protPerKg * weight);
  const fatG = round(Math.max(0.8 * weight, (target * 0.25) / 9));
  const carbsKcal = Math.max(target - proteinG * 4 - fatG * 9, target * 0.15);
  const carbsG = round(carbsKcal / 4);
  const fiberG = round((target / 1000) * 14); // 14 g per 1000 kcal

  return {
    maintenance: maint,
    rateKgWk,
    baseDailyAdj,
    adapt,
    adaptReason,
    target,
    flooredAtMin,
    protPerKg,
    proteinG,
    carbsG,
    fatG,
    fiberG,
  };
}

// weekly training prescription + comparison with what was actually done
export function trainingPlan(profile, sessions, prefs = {}) {
  const goal = profile.goal;
  const daysPerWeek = prefs.daysPerWeek || (goal === "aumentare" ? 4 : 3);
  // target weekly sets per muscle (hypertrophy-ish, scaled by goal)
  const perMuscle =
    goal === "aumentare" ? 16 : goal === "dimagrire" ? 10 : 12;
  const done = weeklySetsByMuscle(sessions); // {muscle: sets in last 7d}
  const balance = MUSCLE_GROUPS.map((m) => ({
    muscle: m.key,
    label: m.label,
    done: done[m.key] || 0,
    target: perMuscle,
    deficit: Math.max(0, perMuscle - (done[m.key] || 0)),
  }));
  return { daysPerWeek, perMuscle, balance, done };
}

// ---- top-level: ranked, reasoned recommendations ----
export function recommendations(state, ctx) {
  const recs = [];
  const { profile, sessions } = state;
  const { energy, weekLedger, dayLedger, trend, fridgeCoverage, ready } = ctx;

  // 1) profile completeness
  if (!maintenance(profile)) {
    recs.push({
      id: "profilo",
      icon: "📝",
      level: "info",
      title: "Completa il profilo",
      detail: "Servono età, peso e altezza per calcolare tutto.",
      why: "Senza questi dati non posso stimare il fabbisogno (BMR/TDEE).",
    });
    return recs;
  }

  // 1b) sleep / readiness
  if (ready && ready.stats) {
    if (ready.score < 50) {
      recs.push({
        id: "recupero",
        icon: "😴",
        level: "action",
        title: "Sei sotto recupero",
        detail: ready.advice,
        why: `Prontezza ${ready.score}/100. Media sonno ultimi 3 giorni ${ready.stats.avg3} h, debito settimanale ${ready.stats.debt} h. Il sonno scarso frena recupero e progressi (penalità punti).`,
      });
    } else if (ready.stats.debt >= 6) {
      recs.push({
        id: "debito-sonno",
        icon: "🌙",
        level: "info",
        title: "Debito di sonno in crescita",
        detail: `Hai accumulato ${ready.stats.debt} h di debito questa settimana.`,
        why: `Media 7 giorni ${ready.stats.avg7} h vs obiettivo. Recupera con qualche notte più lunga per non perdere punti.`,
      });
    }
  }

  // 2) energy adaptation
  if (energy?.adaptReason) {
    recs.push({
      id: "adatta-kcal",
      icon: "⚖️",
      level: "action",
      title: "Aggiusto le calorie",
      detail: `Nuovo target: ${energy.target} kcal.`,
      why: energy.adaptReason,
    });
  }

  // 3) protein adherence today
  if (dayLedger && dayLedger.eaten.kcal > 0) {
    const pPct = energy.proteinG ? dayLedger.eaten.p / energy.proteinG : 0;
    if (pPct < 0.7) {
      const gap = Math.max(0, round(energy.proteinG - dayLedger.eaten.p));
      recs.push({
        id: "proteine",
        icon: "🍗",
        level: "action",
        title: "Proteine basse oggi",
        detail: `Mancano ~${gap} g per arrivare a ${energy.proteinG} g.`,
        why: `Hai assunto ${round(dayLedger.eaten.p)} g (${round(
          pPct * 100
        )}% del target). Le proteine preservano i muscoli, specie in deficit.`,
      });
    }
  }

  // 4) weekly projection vs goal
  if (weekLedger && weekLedger.days >= 3) {
    const proj = weekLedger.projectedKgPerWeek;
    const tgt = energy.rateKgWk;
    if (profile.goal !== "mantenere" && Math.abs(proj - tgt) > 0.15) {
      recs.push({
        id: "proiezione",
        icon: "📉",
        level: "info",
        title: "Proiezione settimanale",
        detail: `Al ritmo attuale ~${fmtKg(proj)}/sett. (obiettivo ${fmtKg(tgt)}).`,
        why: `Basato su ${weekLedger.days} giorni: intake medio ${weekLedger.avgIntake} kcal vs mantenimento ${energy.maintenance} kcal → bilancio ${weekLedger.dailyBalance > 0 ? "+" : ""}${weekLedger.dailyBalance} kcal/giorno.`,
      });
    }
  }

  // 5) training balance — undertrained muscles
  const tp = trainingPlan(profile, sessions, state.prefs);
  const weak = tp.balance.filter((b) => b.deficit >= b.target).slice(0, 2);
  if (weak.length) {
    recs.push({
      id: "muscoli-scoperti",
      icon: "🦴",
      level: "action",
      title: `Muscoli poco allenati`,
      detail: weak.map((w) => muscleLabel(w.muscle)).join(", ") + " da inserire.",
      why: `Negli ultimi 7 giorni: ${weak
        .map((w) => `${muscleLabel(w.muscle)} ${w.done}/${w.target} serie`)
        .join(", ")}. Target ${tp.perMuscle} serie/sett per gruppo.`,
    });
  }

  // 5b) coverage gap from restricted exercise preferences
  const uncovered = uncoveredMuscles();
  if (uncovered.length) {
    recs.push({
      id: "esercizi-scoperti",
      icon: "⚠️",
      level: "info",
      title: "Esercizi scelti: copertura parziale",
      detail: `Non alleni: ${uncovered.map(muscleLabel).join(", ")}.`,
      why: `Con gli esercizi che hai impostato non si stimolano ${uncovered
        .map(muscleLabel)
        .join(", ")}. Per un fisico equilibrato aggiungi almeno un esercizio per questi gruppi (oppure togli la restrizione).`,
    });
  }

  // 6) fridge / shopping
  if (fridgeCoverage && fridgeCoverage.hasItems) {
    if (fridgeCoverage.proteinDays < 1) {
      recs.push({
        id: "spesa-proteine",
        icon: "🛒",
        level: "action",
        title: "Frigo a corto di proteine",
        detail: `Copri solo ${(fridgeCoverage.proteinDays * 100).toFixed(
          0
        )}% del fabbisogno proteico di oggi.`,
        why: `In frigo ~${fridgeCoverage.totals.p} g proteine vs ${energy.proteinG} g/giorno. Compra una fonte proteica.`,
      });
    } else {
      recs.push({
        id: "frigo-ok",
        icon: "🥗",
        level: "info",
        title: "Frigo: copertura",
        detail: `Hai ~${fridgeCoverage.kcalDays.toFixed(1)} giorni di calorie e ${fridgeCoverage.proteinDays.toFixed(1)} di proteine.`,
        why: `Totali frigo: ${fridgeCoverage.totals.kcal} kcal, ${fridgeCoverage.totals.p} g P.`,
      });
    }
  }

  return recs;
}

function fmtKg(n) {
  return `${n > 0 ? "+" : ""}${n.toFixed(2)} kg`;
}
