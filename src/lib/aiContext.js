// Builds the full numeric context for the AI Coach from the app state.
// The model receives THESE numbers and must reason on them (not invent).
import { energyPlan, recommendations, maintenance } from "./coach.js";
import { dayLedger, weekLedger, fridgeCoverage, shoppingGap } from "./ledger.js";
import { weightTrend } from "./progress.js";
import { readiness } from "./sleep.js";
import { levelForPoints } from "./progression.js";
import { sessionVolume } from "./workout.js";
import { todayKey } from "./format.js";
import { MUSCLE_GROUPS, muscleLabel } from "../data/muscles.js";
import { exerciseById } from "../data/exercises.js";

export function buildCoachContext(state) {
  const { profile, sessions, fridge, prefs } = state;
  const today = todayKey();
  const trend = weightTrend();
  const trainedStrength = sessions.some(
    (s) => s.finished && s.date === today && Object.keys(s.muscles || {}).length
  );
  const energy = energyPlan(profile, { trend, trainedStrength });
  const dl = dayLedger(state, today, energy);
  const wl = weekLedger(state, energy);
  const fc = fridgeCoverage(fridge, energy);
  const gap = shoppingGap(fridge, energy, 1);
  const ready = readiness(state.sleep, sessions, Number(profile.sleepGoal) || 8);
  const recs = recommendations(state, {
    energy, dayLedger: dl, weekLedger: wl, trend, fridgeCoverage: fc, ready,
  });

  const muscoli = MUSCLE_GROUPS.map((m) => {
    const pts = state.muscleRanks?.[m.key]?.points || 0;
    const lvl = levelForPoints(pts);
    return { gruppo: m.label, punti: pts, rank: lvl.label, progressoProssimo: lvl.pointsToNext };
  });

  const allowedNames = prefs?.restrict && prefs.allowedExerciseIds?.length
    ? prefs.allowedExerciseIds.map((id) => exerciseById(id)?.name || id)
    : null;

  const recenti = sessions.filter((s) => s.finished).slice(0, 5).map((s) => {
    const v = sessionVolume(s);
    return { data: s.date, titolo: s.title, serie: v.sets, volumeKg: v.volume, kcal: s.burn || 0 };
  });

  return {
    data: today,
    profilo: {
      nome: profile.name, eta: profile.age, sesso: profile.sex,
      pesoKg: profile.weight, altezzaCm: profile.height,
      attivita: profile.activity, obiettivo: profile.goal,
      pesoObiettivoKg: profile.goalWeight || null, obiettivoSonnoH: profile.sleepGoal,
    },
    energia: energy && {
      mantenimentoKcal: energy.maintenance, targetKcal: energy.target,
      tassoObiettivoKgSett: energy.rateKgWk, adattamentoKcal: energy.adapt,
      proteineG: energy.proteinG, carboidratiG: energy.carbsG, grassiG: energy.fatG, fibraG: energy.fiberG,
    },
    oggi: energy && {
      kcalRimanenti: dl.remaining, kcalMangiate: dl.eaten.kcal, kcalBruciate: dl.exercise.burn,
      proteine: dl.macros.p, carboidrati: dl.macros.c, grassi: dl.macros.f,
    },
    settimana: wl && {
      giorniTracciati: wl.days, intakeMedioKcal: wl.avgIntake,
      bilancioGiornalieroKcal: wl.dailyBalance, proiezioneKgSett: wl.projectedKgPerWeek,
    },
    peso: { attualeKg: trend ? trend.to : profile.weight, trendKgSett: trend ? +trend.perWeek.toFixed(2) : null },
    sonno: ready && {
      media7ggH: ready.stats.avg7, debitoH: ready.stats.debt, regolaritaPct: ready.stats.regularity,
      prontezza: ready.score, livelloProntezza: ready.level,
    },
    muscoli,
    frigo: {
      totali: fc.totals, coperturaGiorniKcal: +(fc.kcalDays || 0).toFixed(1),
      coperturaGiorniProteine: +(fc.proteinDays || 0).toFixed(1),
      gapSpesaOggi: gap ? gap.gap : null,
    },
    preferenze: {
      giorniSettimana: prefs?.daysPerWeek, soloEserciziScelti: !!prefs?.restrict,
      eserciziConsentiti: allowedNames,
    },
    consigliMotore: recs.map((r) => ({ titolo: r.title, dettaglio: r.detail, perche: r.why })),
    allenamentiRecenti: recenti,
  };
}

// readable fallback (used when no API key) — riassunto numerico da coach
export function contextSummary(ctx) {
  const L = [];
  const e = ctx.energia, o = ctx.oggi;
  if (e) L.push(`🎯 Target oggi ${e.targetKcal} kcal (mantenimento ${e.mantenimentoKcal}, obiettivo ${e.tassoObiettivoKgSett > 0 ? "+" : ""}${e.tassoObiettivoKgSett} kg/sett). Proteine ${e.proteineG} g, carbo ${e.carboidratiG} g, grassi ${e.grassiG} g.`);
  if (o) L.push(`🍽️ Oggi: ${o.kcalRimanenti} kcal rimanenti (mangiate ${o.kcalMangiate}, bruciate ${o.kcalBruciate}). Proteine ${o.proteine.eaten}/${o.proteine.target} g.`);
  if (ctx.sonno) L.push(`😴 Prontezza ${ctx.sonno.prontezza}/100 (${ctx.sonno.livelloProntezza}). Sonno medio ${ctx.sonno.media7ggH} h, debito ${ctx.sonno.debitoH} h.`);
  if (ctx.peso?.trendKgSett != null) L.push(`⚖️ Peso ${ctx.peso.attualeKg} kg, trend ${ctx.peso.trendKgSett > 0 ? "+" : ""}${ctx.peso.trendKgSett} kg/sett.`);
  L.push(`💪 Rank muscoli: ${ctx.muscoli.map((m) => `${m.gruppo} ${m.rank}`).join(", ")}.`);
  if (ctx.frigo?.gapSpesaOggi && ctx.frigo.gapSpesaOggi.kcal > 0)
    L.push(`🛒 Per coprire oggi mancano ${ctx.frigo.gapSpesaOggi.kcal} kcal e ${ctx.frigo.gapSpesaOggi.p} g proteine dal frigo.`);
  if (ctx.consigliMotore.length)
    L.push("\nConsigli del motore:\n" + ctx.consigliMotore.map((c) => `• ${c.titolo}: ${c.dettaglio} (${c.perche})`).join("\n"));
  return L.join("\n");
}
