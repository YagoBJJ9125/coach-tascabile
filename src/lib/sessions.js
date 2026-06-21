// CRUD for workout sessions & routines, plus finish/rank bookkeeping.
import { getState, setState, touchStreak, addXp } from "./store.js";
import { uid, todayKey } from "./format.js";
import { exerciseById } from "../data/exercises.js";
import { sessionBurn, sessionMuscles, e1rm } from "./workout.js";
import { sessionMusclePoints, levelForPoints, recordPoints } from "./progression.js";

function blankSet(def, prev) {
  // carry previous values as placeholder ("PREC")
  return {
    id: uid(),
    kg: "",
    reps: "",
    timeSec: "",
    distance: "",
    done: false,
    prev: prev || null,
  };
}

export function makeSessionExercise(exerciseId, sets) {
  const def = exerciseById(exerciseId);
  return {
    id: uid(),
    exerciseId,
    name: def ? def.name : exerciseId,
    sets: sets && sets.length ? sets : [blankSet(def)],
  };
}

// create a session from a list of exercise ids (or empty)
export function createSession({ exerciseIds = [], title = "Allenamento", routineId } = {}) {
  const id = uid();
  let exercises = [];
  if (routineId) {
    const r = getState().routines.find((x) => x.id === routineId);
    if (r) {
      title = r.name;
      exercises = r.items.map((it) =>
        makeSessionExercise(
          it.exerciseId,
          (it.sets || []).map((s) => ({
            id: uid(),
            kg: "",
            reps: "",
            timeSec: "",
            distance: "",
            done: false,
            prev: { kg: s.kg, reps: s.reps },
          }))
        )
      );
    }
  } else {
    exercises = exerciseIds.map((eid) => makeSessionExercise(eid));
  }
  const session = {
    id,
    title,
    date: todayKey(),
    startedAt: Date.now(),
    endedAt: null,
    durationSec: 0,
    note: "",
    finished: false,
    exercises,
  };
  setState((s) => {
    s.sessions.unshift(session);
    return s;
  });
  return id;
}

export function getSession(id) {
  return getState().sessions.find((s) => s.id === id) || null;
}

export function updateSession(id, fn) {
  setState((s) => {
    const idx = s.sessions.findIndex((x) => x.id === id);
    if (idx >= 0) fn(s.sessions[idx], s);
    return s;
  });
}

export function deleteSession(id) {
  setState((s) => {
    s.sessions = s.sessions.filter((x) => x.id !== id);
    return s;
  });
}

// annulla l'effetto sui rank di una sessione finita (punti muscolo + log aggregato).
// XP/streak/PR non vengono ripristinati (effetto minore di gamification).
function reverseSessionPoints(sess, draft) {
  if (!sess.musclePoints) return;
  for (const mk of Object.keys(sess.musclePoints)) {
    const pts = sess.musclePoints[mk] || 0;
    if (draft.muscleRanks[mk]) {
      draft.muscleRanks[mk].points = Math.max(0, (draft.muscleRanks[mk].points || 0) - pts);
    }
    const entry = (draft.pointsLog || []).find(
      (e) => e.date === sess.date && e.muscle === mk && e.cause === "allenamento"
    );
    if (entry) entry.delta -= pts;
  }
}

// cancella una sessione finita ripristinando i punti (es. confermata per sbaglio)
export function deleteFinishedSession(id) {
  setState((s) => {
    const sess = s.sessions.find((x) => x.id === id);
    if (sess && sess.finished) reverseSessionPoints(sess, s);
    s.sessions = s.sessions.filter((x) => x.id !== id);
    return s;
  });
}

// riapri una sessione finita per modificarla: ripristina i punti e la rende editabile;
// al successivo "Finisci" verranno ricalcolati da capo.
export function reopenSession(id) {
  setState((s) => {
    const sess = s.sessions.find((x) => x.id === id);
    if (!sess || !sess.finished) return s;
    reverseSessionPoints(sess, s);
    sess.finished = false;
    sess.endedAt = null;
    sess.durationSec = 0;
    sess.startedAt = Date.now();
    sess.burn = 0;
    sess.muscles = {};
    sess.musclePoints = {};
    return s;
  });
}

// finalize: compute duration, burn, update PRs, muscle ranks, xp, streak
export function finishSession(id) {
  const st = getState();
  const session = st.sessions.find((x) => x.id === id);
  if (!session) return null;
  const weightKg = Number(st.profile.weight) || 75;
  const burn = sessionBurn(session, weightKg);
  const muscles = sessionMuscles(session);
  const musclePts = sessionMusclePoints(session, weightKg);
  // level before/after per muscle (for the finish summary)
  const levelDeltas = {};
  for (const mk of Object.keys(musclePts)) {
    const before = st.muscleRanks[mk]?.points || 0;
    const b = levelForPoints(before);
    const a = levelForPoints(before + musclePts[mk]);
    levelDeltas[mk] = { gained: musclePts[mk], before: b.label, after: a.label, promoted: a.step > b.step };
  }

  setState((s) => {
    const sess = s.sessions.find((x) => x.id === id);
    sess.finished = true;
    sess.endedAt = Date.now();
    sess.durationSec = Math.round((sess.endedAt - sess.startedAt) / 1000);
    sess.burn = burn;
    sess.muscles = muscles;
    sess.musclePoints = musclePts;

    // PRs (best e1rm per exercise)
    for (const ex of sess.exercises) {
      for (const set of ex.sets) {
        if (!set.done) continue;
        const est = e1rm(Number(set.kg), Number(set.reps));
        const cur = s.prs[ex.exerciseId];
        if (est && (!cur || est > cur.e1rm)) {
          s.prs[ex.exerciseId] = {
            e1rm: est,
            kg: Number(set.kg),
            reps: Number(set.reps),
            date: todayKey(),
          };
        }
      }
    }

    // muscle rank points (weighted matrix) + mark trained today + log event
    const today = todayKey();
    for (const mk of Object.keys(musclePts)) {
      const cur = s.muscleRanks[mk] || { points: 0 };
      s.muscleRanks[mk] = {
        ...cur,
        points: (cur.points || 0) + musclePts[mk],
        lastTrained: today,
        lastDecay: today,
      };
      recordPoints(s, today, mk, musclePts[mk], "allenamento");
    }
    return s;
  });

  // xp + streak (outside the same set call is fine; they self-persist)
  const { sets } = (() => {
    let n = 0;
    for (const ex of session.exercises)
      n += ex.sets.filter((x) => x.done).length;
    return { sets: n };
  })();
  addXp(20 + sets * 3);
  touchStreak();
  return { burn, muscles, musclePoints: musclePts, levelDeltas };
}

// ---- routines ----
export function saveRoutineFromSession(id, name) {
  const sess = getSession(id);
  if (!sess) return;
  const items = sess.exercises.map((ex) => ({
    exerciseId: ex.exerciseId,
    sets: ex.sets.map((s) => ({ kg: Number(s.kg) || 0, reps: Number(s.reps) || 0 })),
  }));
  setState((s) => {
    s.routines.unshift({ id: uid(), name: name || sess.title, items });
    return s;
  });
}

export function createRoutine(name, exerciseIds = []) {
  const rid = uid();
  setState((s) => {
    s.routines.unshift({
      id: rid,
      name: name || "Nuova routine",
      items: exerciseIds.map((eid) => ({ exerciseId: eid, sets: [{ kg: 0, reps: 0 }] })),
    });
    return s;
  });
  return rid;
}

export function deleteRoutine(id) {
  setState((s) => {
    s.routines = s.routines.filter((r) => r.id !== id);
    return s;
  });
}

// create a routine from full items [{exerciseId, sets:[{kg,reps}]}] (es. AI-generated)
export function createRoutineFull(name, items) {
  const rid = uid();
  setState((s) => {
    s.routines.unshift({ id: rid, name: name || "Scheda AI", items });
    return s;
  });
  return rid;
}

// ---- "Il mio piano": generate a simple weekly split ----
import { coachExercisePool } from "../data/exercises.js";

const PLAN_TEMPLATES = [
  { title: "Parte superiore", durationMin: 45, muscles: ["petto", "schiena", "spalle", "braccia"] },
  { title: "Gambe", durationMin: 45, muscles: ["gambe", "gambe", "core"] },
  { title: "Spinta", durationMin: 40, muscles: ["petto", "spalle", "braccia"] },
  { title: "Tirata", durationMin: 40, muscles: ["schiena", "braccia", "core"] },
];

function pickByMuscles(muscleList) {
  const byMuscle = {};
  for (const e of coachExercisePool()) (byMuscle[e.muscle] ||= []).push(e);
  const used = new Set();
  const ids = [];
  for (const m of muscleList) {
    const pool = (byMuscle[m] || []).filter((e) => !used.has(e.id));
    if (!pool.length) continue;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    used.add(pick.id);
    ids.push(pick.id);
  }
  return ids;
}

export function generatePlan() {
  setState((s) => {
    s.plan = PLAN_TEMPLATES.map((t) => ({
      id: uid(),
      title: t.title,
      durationMin: t.durationMin,
      exerciseIds: pickByMuscles(t.muscles),
    }));
    return s;
  });
}

export function clearPlan() {
  setState((s) => {
    s.plan = [];
    return s;
  });
}
