// CRUD for workout sessions & routines, plus finish/rank bookkeeping.
import { getState, setState, touchStreak, addXp } from "./store.js";
import { uid, todayKey } from "./format.js";
import { exerciseById } from "../data/exercises.js";
import {
  sessionBurn,
  sessionMuscles,
  musclePointsFromSession,
  e1rm,
} from "./workout.js";

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

// finalize: compute duration, burn, update PRs, muscle ranks, xp, streak
export function finishSession(id) {
  const st = getState();
  const session = st.sessions.find((x) => x.id === id);
  if (!session) return null;
  const weightKg = Number(st.profile.weight) || 75;
  const burn = sessionBurn(session, weightKg);
  const muscles = sessionMuscles(session);

  setState((s) => {
    const sess = s.sessions.find((x) => x.id === id);
    sess.finished = true;
    sess.endedAt = Date.now();
    sess.durationSec = Math.round((sess.endedAt - sess.startedAt) / 1000);
    sess.burn = burn;
    sess.muscles = muscles;

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

    // muscle rank points
    for (const mk of Object.keys(muscles)) {
      const pts = musclePointsFromSession(sess, mk);
      const cur = s.muscleRanks[mk] || { points: 0 };
      s.muscleRanks[mk] = { points: cur.points + pts };
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
  return { burn, muscles };
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
