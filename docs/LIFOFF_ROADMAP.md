# Coach Tascabile → stile Lifoff (Liftoff) — Roadmap / TODO

Obiettivo: portare Coach Tascabile ad avere funzioni e interfacce simili all'app **Liftoff**
(34 screenshot analizzati). Lista da migliorare insieme — priorità indicative.

## Stato attuale (Coach Tascabile)
- Single-file `index.html`, React UMD precompilato, backend Supabase (auth + sync).
- Tab: Oggi, Allenamenti, Progressi (peso/sonno), Dispensa, Profilo.
- Calcoli: BMR/TDEE, target kcal, macro, MET burn, readiness sonno.

## Differenze chiave vs Lifoff
Lifoff è molto più ampio e **gamificato**: tracker serie/ripetizioni live, libreria
400+ esercizi, sistema Rank per muscolo, anello calorie con DB cibo + micronutrienti,
onboarding con mascotte, avatar, streak, livelli, amici/leghe.

---

> **Scope (deciso 2026-06-19): app MONO-UTENTE, solo per Federico.**
> Rimossi: Amici, online, Leghe, Galleria, post social a fine allenamento.
> Storage **local-first** (localStorage, layer astratto); sync Supabase rimandato. Niente login.

## ✅ FATTO — sessione 2026-06-19 (v2 scaffold + fette verticali)
Migrato a **Vite + React** (vecchio single-file in `legacy/`). Build ok, testato in preview.
- EPIC 1: tema dark-navy/blu, nav 5 tab, header (livello/XP/streak/gemme) — **fatto**
- EPIC 2: tracker live (serie/reps/kg, colonne per tipo, timer riposo, completa serie,
  riepilogo fine + muscoli/kcal) — **fatto** (mancano: tastierino custom, supersets, edit PREC)
- EPIC 3: libreria esercizi seed (~40) con ricerca/filtri muscolo, multi-select — **fatto**
  (mancano: filtri Per Rank/Effettuati, attrezzatura, animazioni, esercizi custom UI)
- EPIC 4: routine (crea/avvia/salva-da-sessione/elimina) — **fatto base**; "Il mio piano"
  timeline — **stub**; genera allenamento — **fatto**
- EPIC 5: rank per muscolo (soglie tier), grafico corporeo SVG colorato, calcolatore 1RM,
  avanzamento a fine workout — **fatto base** (body chart da rifinire, niente Titan promo art)
- EPIC 6/7: anello calorie, macro, micronutrienti (vit/min), pasti, DB cibo (~27) con
  ricerca + dettaglio (porzioni/macro/micro), log/recenti — **fatto** (mancano: barcode, AI scan)
- EPIC 8 Onboarding: versione **minimale** (no mascotte)
- EPIC 9 Gamification: streak/livello/XP/coins — **fatto base** (no avatar che cresce, no notifiche)
- EPIC 10 Impostazioni: unità peso, timer riposo, calcolatore rank, export/import/reset — **fatto base**

### Aggiornamento sessione 2 (2026-06-19, sera)
- **EPIC 11 PWA**: ✅ installabile fatto (vite-plugin-pwa: manifest + service worker +
  icone 192/512/maskable/apple-touch, autoUpdate, precache). Attivo solo in build di
  produzione. Verificato: manifest servito, SW registrato, display standalone.
  Manca: hosting pubblico (GitHub Pages/Netlify) per installare da URL.
- **Tracciamento peso** (era nella v1): ✅ ripristinato — log peso giornaliero, grafico
  storico (MiniLine), linea obiettivo, trend kg/settimana **goal-aware** (verde/ambra).
  In Profilo → "Peso e progressi". Helper in `src/lib/progress.js`.

### Prossimi passi suggeriti
0. **Hosting** della build per installare la PWA da URL (rapido, completa EPIC 11)
1. Onboarding completo con mascotte (EPIC 8) + slide intro
2. Tastierino numerico custom nel tracker + edit valori PREC
3. "Il mio piano" come percorso/timeline reale
4. Barcode scan alimenti (OpenFoodFacts) + più cibi/esercizi seed
5. Rifinire grafico corporeo (silhouette realistica) + tier alti (Titan)
6. (Opz.) sync cloud Supabase riusando il layer storage

---

## EPIC 1 — Tema & shell UI (base visiva Lifoff)
- [ ] Palette dark navy (#0E0E1A) + accent blu (#4DA6FF), tipografia bold
- [ ] Bottom nav a 5 voci: Allenamento · Home · Rank · Alimentazione · Profilo
- [ ] Header globale: avatar+Livello+barra XP, streak 🔥, gemme/coin, pulsante +
- [ ] Componenti riusabili: card arrotondate, chip filtro, toggle, modali bottom-sheet

## EPIC 2 — Tracker allenamento (live workout)  ⭐ alta priorità

### Aggiornamenti 2026-06-20 (tracker avanzato)
- [x] **Duplica serie** (bottone ⧉ per riga: copia valori in una nuova serie). Verificato.
- [x] **Rest timer controllabile**: avvio manuale con preset (30/60/90/120s), **pausa/riprendi**,
      +15s, salta; il cronometro in alto è il **tempo totale** (etichettato). Verificato.
- [x] **Coach a VOCE hands-free** (`src/lib/voice.js`, Web Speech API, it-IT, GRATIS):
      pulsante 🎙️ nel tracker → wake word "coach" → comandi vocali ("fine serie" spunta la
      serie e annuncia, poi chiede i secondi di riposo → avvia timer → "pausa finita").
      TTS + riconoscimento. **Beta: richiede Chrome (anche Android) + microfono**; non
      testabile in preview headless (no mic), logica/parser verificati, build ok.
- [ ] TODO: schermata SETUP pre-allenamento (scegli esercizi+serie+riposo prima di iniziare);
      tastierino numerico custom; robustezza voce (eco TTS, riavvii recognizer).

- [ ] Sessione live con timer cronometro + note allenamento
- [ ] Card esercizio: nome, icona, colonne SERIE / PREC / KG(+KG) / RIPETIZIONI / check
- [ ] Aggiungi serie / aggiungi esercizio / aggiungi routine
- [ ] Tipi colonna: reps, peso, tempo (es. Planche → "TEMPO 01:00"), distanza
- [ ] Tastierino numerico custom (+1/-1, RIR, Avanti, copia serie)
- [ ] Timer di Riposo automatico a fine serie (default 1m30s, modificabile)
- [ ] Riga completata = verde; carica valori "PREC" dalla sessione precedente
- [ ] Schermata "Finisci allenamento": muscoli allenati (body chart) — niente post social

## EPIC 3 — Libreria esercizi
- [ ] DB esercizi (nome, gruppo muscolare, attrezzatura, icona/animazione)
- [ ] Ricerca + filtri: Alfabetico, Per Rank, Effettuati, Gruppo muscolare
- [ ] Tag attrezzatura ("con zavorra", manubri, bilanciere…)
- [ ] Selezione multipla per costruire allenamento
- [ ] (Seed iniziale: subset esercizi corpo libero + pesi, espandibile)

## EPIC 4 — Routine & Piano
- [ ] Routine salvate (template: nome + lista esercizi + serie) — es. "Legs 15 serie"
- [ ] "Il mio piano": percorso/timeline allenamenti (Allenamento 1→2→3, 45 min)
- [ ] Anteprima allenamento: muscoli da allenare con %, lista esercizi, "Inizia"
- [ ] "Genera allenamento" (auto, in base a obiettivo/attrezzatura)
- [ ] Inizia allenamento vuoto

## EPIC 5 — Sistema Rank / Bodyrank  ⭐ tratto distintivo
- [ ] Rank per gruppo muscolare: Bronzo→Argento→Oro→Platino→Diamante (poi Titan…)
- [ ] Grafico corporeo colorato fronte/retro (muscoli per livello)
- [ ] "Rank dei muscoli": lista espandibile (Braccia, Gambe, Busto, Spalle, Petto, Schiena)
- [ ] Rank calculator: scegli esercizio + ripetizioni/peso → assegna rank
- [ ] Avanzamento rank a fine allenamento (notifica "CAMPIONE III")
- [ ] ~~Leghe, Galleria~~ (rimosso: app mono-utente)

## EPIC 6 — Alimentazione (riscrittura sezione esistente)
- [ ] Schermata giorno: anello calorie (Rimanenti / Obiettivo / Cibo / Esercizio)
- [ ] Donut macro Proteine/Carboidrati/Grassi + valori g
- [ ] Sezioni pasti: Colazione/Pranzo/Cena/Spuntino/Non classificato (+ aggiungi)
- [ ] "Registrato di recente"
- [ ] Pagine micro: vitamine + minerali (swipe a 3 pagine)
- [ ] Navigatore data (← Oggi →)

## EPIC 7 — Database cibo & logging
- [ ] Ricerca alimenti (DB) con calorie/porzione
- [ ] Dettaglio alimento: macro principali, altri macro, micronutrienti completi
- [ ] Selettore tipo pasto + unità porzione (g/ml/oz/tazza/pz…) + dimensione
- [ ] Modale "Aggiungi alimento": Database / Scansiona codice a barre / Scansiona cibo (AI)
- [ ] (Integrazione: API food DB esterna — es. OpenFoodFacts per barcode)

## EPIC 8 — Onboarding (mascotte)
- [ ] Flusso domande: obiettivo, luogo allenamento, attrezzatura, zone sensibili
- [ ] Avatar generato + reveal
- [ ] Permesso notifiche + reminder orario
- [ ] Primo rank (miglior sollevamento)
- [ ] Slide promo iniziali (4)
- [ ] Mascotte elefante con fumetti

## EPIC 9 — Gamification (personale, no social)
- [ ] Avatar che cresce con i progressi
- [ ] Streak giornaliero 🔥
- [ ] Livello + XP, gemme/coin
- [ ] ~~Amici (feed/confronto)~~ (rimosso: app mono-utente)
- [ ] Notifiche anteprima allenamento (locali)

## EPIC 10 — Impostazioni
- [ ] Impostazioni Tracker: unità peso (Kg/Lbs), distanza (Km/Mi)
- [ ] Timer riposo auto on/off + default per esercizio
- [ ] Tasto cambio serie, Calcolatore rank on/off, usa serie precedente

---

## Note tecniche / decisioni da prendere insieme
- **Scope**: replica completa è grande. Fatto: scaffold Vite + fette verticali su tutti gli EPIC.
- **Architettura**: ✅ migrato a Vite + React a componenti.
- **DB**: per ora local-first; sync cloud opzionale dopo (Supabase: exercises, routines,
  workout_sessions, sets, food_log, foods, muscle_ranks, ...).
- **Asset**: icone/animazioni esercizi (Lifoff ne ha proprie) — serve fonte libera.

---

# 🚀 NUOVE IDEE (2026-06-19) — da sviluppare insieme

## EPIC 11 — Distribuzione: app installabile "1 click"
Obiettivo: scaricabile/installabile come una vera app (Play Store / software PC).
Percorso consigliato, dal più economico al più completo:
- [ ] **PWA installabile** (priorità): `manifest.json` + service worker + icone →
      "Aggiungi a schermata Home" su Android/iOS e "Installa app" su Chrome/Edge desktop.
      Funziona offline (local-first si presta). Costo basso, resa immediata. ⭐ fare presto
- [x] **Hosting pronto**: workflow `.github/workflows/deploy.yml` (build + deploy su GitHub
      Pages ad ogni push) + guida `docs/DEPLOY_E_TELEFONO.md`. Base "./" già compatibile col
      subpath di Pages. Manca solo: push + abilitare Pages (Source: GitHub Actions). Poi
      installabile sul telefono via "Aggiungi a schermata Home".
- [ ] **Android APK/AAB** (opz.): TWA (Bubblewrap) o Capacitor → pubblicabile anche su Play Store.
- [ ] **Desktop installabile** (opz.): Tauri (leggero, Rust) o Electron → .exe/.dmg.
- Nota: PWA copre il 90% del bisogno "un click e si installa" su mobile e desktop.
  Decisione: si può fare un **mini-pass PWA adesso** (veloce) e rimandare APK/desktop.

## EPIC 12 — AI Coach (Claude integrato) 🧠 (FATTO base, 2026-06-20)
Coach conversazionale che ragiona sui numeri del motore + contabilità.
- [x] **Chat coach** (`src/pages/CoachChat.jsx`, route `/coach`, CTA in Home): parla,
      consiglia, motiva. Bolle, suggerimenti, stati.
- [x] **Contesto completo** (`src/lib/aiContext.js`): impacchetta profilo, energia/macro,
      bilanci giorno/settimana, peso/trend, sonno/prontezza, rank muscoli, frigo/gap spesa,
      preferenze esercizi, consigli del motore, allenamenti recenti → JSON al modello.
- [x] **Client Claude** (`src/lib/ai.js`): chiamata diretta browser ad Anthropic Messages
      API con la **chiave dell'utente** (solo locale) + header
      `anthropic-dangerous-direct-browser-access`. Modelli selezionabili (Haiku/Sonnet/Opus).
      System prompt: usa SOLO i numeri forniti, spiega il perché, italiano.
- [x] **Fallback** senza chiave: risposta deterministica col riassunto numerico (utile da subito).
- [x] **Impostazioni** in Profilo → Coach AI (chiave + modello). Verificato: fallback ok,
      path live raggiunge Anthropic (CORS ok), errori gestiti.
- **Nota tecnica**: per app PUBBLICATA/multi-utente la chiave NON può stare nel client →
  spostare dietro proxy serverless. Per uso personale locale (questo caso) va bene.

### Provider GRATUITI (2026-06-20) — nessun token a pagamento
Client AI reso **multi-provider** (`PROVIDERS` in ai.js):
- [x] **Ollama locale** (default): gratis, privato, gira sul PC. Verificato LIVE con
      gemma3 (l'utente ha gemma3:latest + qwen2.5:7b). CORS localhost ok di default su
      Ollama 0.10. Risposta reale e contestuale (usa i numeri del contesto).
- [x] **Google Gemini** free tier (chiave gratis da aistudio.google.com).
- [x] **OpenRouter** modelli `:free` (chiave gratis).
- [x] Anthropic resta opzionale (a pagamento).
- [x] Selezione provider/modello/chiave/URL in Profilo → Coach AI; stato in chat header.
- [x] **Coach scrive la scheda** (`generateRoutineViaAI`): il modello produce JSON di esercizi
      dalla NOSTRA libreria (id validati) → crea routine reale + bottone "Avvia". Verificato
      LIVE con Ollama (scheda 6 esercizi creata e avviabile).
- [x] **Memoria conversazione** persistente (`store.coachChat`, ultimi 40 msg) + azzera.
      Verificato (chat sopravvive al reload).
- [x] **AI su telefono**: provider cloud gratis (Gemini/OpenRouter); Ollama è solo PC
      (nota in UI + guida). Vedi `docs/DEPLOY_E_TELEFONO.md`.
- [ ] TODO: suggerimenti giornalieri push; auto-detect modelli Ollama installati.

## EPIC 13 — Database alimenti & esercizi (dati reali, non solo seed)
- [x] **Alimenti = OpenFoodFacts LIVE** (`src/lib/openfoodfacts.js`): ricerca online per nome
      (debounced) + **codice a barre**, mappato nel formato interno (per100+micros+porzioni).
      Integrato in FoodSearch (sezione "DA OPENFOODFACTS · online"). Gratis, CORS ok, funziona
      anche su telefono. Verificato (nutella 539 kcal).
- [ ] (Opz.) cache locale dei cibi OFF usati; USDA per micronutrienti dettagliati.
- [ ] **Alimenti (vecchio piano)**: ~~scrivere a mano~~ — superato da OFF live.
- [ ] **Barcode scan** collegato a OpenFoodFacts (EPIC 7).
- [ ] **Esercizi**: importare un DB libero — **free-exercise-db** (open, ~800 esercizi con
      immagini) o **wger** (API open). Mappare a gruppi muscolari/attrezzatura del nostro modello.
- [ ] Normalizzare i dati esterni nel formato interno (`foods.js` / `exercises.js`).

## EPIC 14 — Motore Coach deterministico 🧠 (FATTO base, 2026-06-20)
Il "cervello" su cui ragiona l'app (prima era solo `nutritionPlan` statico). `src/lib/coach.js`:
- [x] BMR (Mifflin) → mantenimento (TDEE) → **tasso obiettivo** kg/sett (es. dimagrire 0,6%/sett del peso, cap)
- [x] Target energetico **adattivo**: confronta trend peso reale vs atteso → corregge kcal (±40-200) con spiegazione numerica
- [x] Macro: proteine per kg (regole obiettivo/forza), grassi, carbo, fibra
- [x] Prescrizione allenamento: serie/sett target per muscolo, frequenza, **copertura muscoli** (cosa è scoperto)
- [x] `recommendations(state)` → consigli ordinati con **"perché"** (numeri): adattamento kcal, proteine basse, proiezione settimanale, muscoli scoperti, spesa
- [x] **Preferenze esercizi consentiti** (es. solo push-up+squat): `store.prefs` +
  `coachExercisePool()`/`uncoveredMuscles()` → generazione piano/allenamento usa solo gli
  esercizi scelti; il coach segnala i muscoli NON copribili. Giorni/sett configurabile.
  UI in Profilo → "Preferenze allenamento".
- [ ] TODO: progressione carichi (quando +kg/+reps), deload, periodizzazione, sonno/stress come variabili

## EPIC 15 — Contabilità / Bilanci 📊 (FATTO base, 2026-06-20)
Tutto ragionato coi numeri. `src/lib/ledger.js` + `src/lib/fridge.js`:
- [x] Bilancio giorno: budget − cibo + esercizio = rimanente, + budget per macro
- [x] Bilancio settimana: intake medio vs mantenimento → bilancio kcal/gg → **proiezione kg/sett**
- [x] **Frigo/Dispensa** (`store.fridge`): inventario con valori nutrizionali, totali
- [x] Copertura frigo: quanti giorni di kcal/proteine ho disponibili
- [x] **Gap spesa**: per coprire N giorni mancano X kcal/macro → suggerimenti alimenti per colmare le proteine
- [ ] TODO: storico bilanci, costo/€ (era in v1), pianificazione pasti dal frigo, orizzonte multi-giorno

> Nota: l'**AI Coach (EPIC 12)** si appoggerà a questi due moduli — riceve i numeri di
> coach.js/ledger.js come contesto e li spiega/affina, invece di inventare.

## EPIC 16 — Progressione, Punti & Rank per muscolo (FASE 1 FATTA, 2026-06-20)
Spec completa: **`docs/PROGRESSION_SYSTEM.md`**. Ogni esercizio = consumo (kcal) +
miglioramento (punti → rank per muscolo → avatar). `src/lib/progression.js` +
`EXERCISE_POINTS` in data/exercises.js.
- [x] **Matrice punti per esercizio** (multi-muscolo, pesata per specificità). Es. push-up
  20 reps → Petto +20, Braccia +10, Spalle +6, Core +4; squat → Gambe +18, Core +4. Verificato.
- [x] Punti per serie = peso_muscolo × (reps/10) × loadMult (carico) / (sec/30 per i tempi)
- [x] **Rank a sotto-livelli**: 7 tier × 4 livelli (es. "Bronzo liv.3"), soglie crescenti,
  progress bar + punti al prossimo. Verificato (Petto 395pt → Legno liv.3).
- [x] **Decadimento inattività**: dopo 3gg grazia, −15 pt/gg per muscolo non allenato.
  Verificato (500→395 dopo 10gg). Reconcile all'avvio app.
- [x] **Penalità cibo spazzatura**: grassi saturi oltre soglia → −core. Verificato (100→55).
- [x] Riepilogo fine workout mostra +punti e promozioni; Rank page mostra breakdown
  "esercizi che sviluppano X"; BodyChart/avatar colorato per tier.
- [x] **Fix bug timezone** in date keys (toISOString UTC slittava i giorni) → ora date locali.

### FASE 2 (FATTA, 2026-06-20)
- [x] **Avatar morphing**: i muscoli del BodyChart crescono di dimensione con lo sviluppo
  (Legno liv.4 esile → tier alti voluminoso), oltre al colore per tier. Verificato.
- [x] **Parametrizzazione nutrizionale ricca**: `NUTRITION_RULES` (tabella estendibile) —
  grassi saturi/sodio/zuccheri → −core, fibra → +core, **bonus proteine** (target raggiunto
  → +4 a tutti i muscoli, recupero). Effetti +/−. Verificato (prot 200→+4 tutti, sodio 5000→core −7).
- [x] **Log eventi punti** (`store.pointsLog`, aggregato per data+muscolo+causa, ultimi 120gg);
  registrato su allenamento/cibo/inattività.
- [x] **Bilancio mensile** per gruppo muscolare diviso per causa (Allenamento/Alimentazione/
  Inattività), nuova tab "Bilancio" in Rank. Verificato.
### FASE 3 (parziale, 2026-06-20)
- [x] **Sonno ripristinato** (era in v1): `src/lib/sleep.js` — log ora addormentato/sveglia →
  ore, statistiche (media 7gg, debito, regolarità). UI card "Sonno" in Profilo.
- [x] **Prontezza all'allenamento** (Lifoff "Readiness"): score 0-100 da sonno recente +
  carico ultimi 2 giorni; card su Home con livello/consiglio. Verificato (5-6h → 12/100 Recupero).
- [x] **Sonno → punti**: `sleepEffect()` applicato nel reconcile (sonno scarso −, buono +,
  causa "sonno"); incluso nel bilancio mensile. Coach consiglia su debito/recupero. Verificato.
- [ ] Ancora FASE 3: tuning numerico soglie sul campo, più nutrienti (ultra-processati/alcol),
  bilancio annuale, avatar illustrato/3D, stress/HRV come variabili.

## Ordine consigliato d'attacco (proposta)
1. **Mini-pass PWA** (EPIC 11) → subito "installabile", morale alto.
2. Completare fasi core mancanti (onboarding mascotte, tastierino tracker, "Il mio piano").
3. **Import DB reali** (EPIC 13) → contenuti veri prima dell'AI.
4. **AI Coach** (EPIC 12) → con backend proxy + dati ricchi già presenti.
