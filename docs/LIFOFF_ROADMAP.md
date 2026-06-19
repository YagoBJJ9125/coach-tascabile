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

### Prossimi passi suggeriti
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
- **Scope**: replica completa è grande. Proposta: partire da EPIC 2 (tracker) +
  EPIC 6/7 (alimentazione potenziata) che sono il cuore, poi Rank (EPIC 5).
- **Architettura**: tenere single-file o passare a build (Vite) + componenti? Con
  questa scala conviene valutare un progetto strutturato.
- **DB**: nuove tabelle Supabase (exercises, routines, workout_sessions, sets,
  food_log, foods, muscle_ranks, ...). Definire schema.
- **Asset**: icone/animazioni esercizi (Lifoff ne ha proprie) — serve fonte libera.
