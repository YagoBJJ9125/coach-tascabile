// Pianificazione della giornata. L'allenamento pianificato NON è più un tipo generico:
// è un vero allenamento (sessione) che imposti nel builder e puoi salvare anche senza
// svolgerlo subito. Qui resta solo lo stato "Riposo" esplicito (per i giorni senza
// allenamento) — tutto il resto (consumo, macro) si deriva dalle sessioni del giorno.
import { setState } from "./store.js";

export function getDayPlan(state, date) {
  return (state.dayPlan && state.dayPlan[date]) || null;
}

// segna/desegna il giorno come "Riposo"
export function setRest(date, isRest) {
  setState((s) => {
    if (!s.dayPlan) s.dayPlan = {};
    if (isRest) {
      s.dayPlan[date] = { ...(s.dayPlan[date] || {}), rest: true };
    } else if (s.dayPlan[date]) {
      delete s.dayPlan[date].rest;
    }
    return s;
  });
}
