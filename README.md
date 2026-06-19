# Coach Tascabile v2 🏋️🍎

App personale (mono-utente) per **allenamento + alimentazione**, in stile
**Liftoff**. Dark theme, gamificata (rank per muscolo, streak, livelli), **local-first**
(dati salvati sul dispositivo, nessun login).

> Versione 1 (single-file) archiviata in [`legacy/index.html`](legacy/index.html).

## Stack
- **Vite + React 18** (JSX), **React Router** (HashRouter → deploy statico ovunque)
- Stato in `src/lib/store.js` (localStorage, reattivo via `useSyncExternalStore`)
- Nessun backend: vedi [docs/LIFOFF_ROADMAP.md](docs/LIFOFF_ROADMAP.md) per il sync cloud futuro

## Sviluppo
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output in dist/ (statico)
npm run preview  # anteprima della build
```

## Struttura
```
src/
  main.jsx, App.jsx        # entry + router (gate onboarding)
  index.css, theme.js      # tema dark-navy/blu (CSS vars + mirror JS)
  lib/
    store.js               # stato globale + gamification (xp/streak/coins)
    storage.js             # persistenza localStorage (astratta per sync futuro)
    format.js              # helper (date, clock, numeri)
    nutrition.js           # BMR/TDEE/target/macro + somme giornaliere
    workout.js             # burn, volume, 1RM, sistema Rank (soglie tier)
    sessions.js            # CRUD sessioni + routine + finishSession
    food.js                # log alimenti
  data/
    exercises.js           # libreria esercizi (seed ~40)
    foods.js               # database cibo (seed ~27 + micronutrienti)
    muscles.js             # gruppi muscolari + attrezzatura
  components/
    Header.jsx, BottomNav.jsx, ui.jsx, ExercisePicker.jsx, BodyChart.jsx
  pages/
    Onboarding.jsx, Home.jsx, Allenamento.jsx, WorkoutSession.jsx,
    Rank.jsx, Alimentazione.jsx, Profilo.jsx
```

## Funzioni (v2)
- **Onboarding** rapido → profilo + fabbisogno calorico
- **Home**: snapshot giornata, consiglio coach, attività recente
- **Allenamento**: tracker live (serie/reps/kg, colonne per tipo esercizio, timer
  riposo automatico, completamento serie), genera allenamento, routine salvate
- **Rank**: grafico corporeo colorato per livello, rank per muscolo, calcolatore 1RM
- **Alimentazione**: anello calorie, macro, micronutrienti, sezioni pasti, DB cibo
  con ricerca e dettaglio (porzioni + macro + micro)
- **Profilo**: modifica dati, impostazioni tracker, export/import/reset backup JSON

Dati e privacy: tutto resta su questo dispositivo. Stime indicative, non consiglio medico.
