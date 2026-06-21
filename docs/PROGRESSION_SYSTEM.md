# Sistema di Progressione, Punti e Rank (collegato all'Avatar)

> Aspetto centrale dell'app, da potenziare nel tempo. Ogni esercizio genera
> **due bilanci**: un **consumo** (calorie) e un **miglioramento** (punti → rank per
> gruppo muscolare → avatar). Questo doc è la fonte di verità della logica.

## 1. Principio: due contabilità per ogni azione
| Azione | Bilancio CONSUMO (energia) | Bilancio MIGLIORAMENTO (progresso) |
|--------|---------------------------|-------------------------------------|
| Allenarsi | brucia kcal → entra nel ledger energetico | **+punti** ai gruppi muscolari coinvolti |
| Mangiare | +kcal/macro → ledger energetico | cibo "buono"/"spazzatura" → **±punti** a gruppi (es. grassi saturi → −addome) |
| Riposo | (nessun consumo) | inattività prolungata → **−punti** a tutti i gruppi (decadimento) |

## 2. Punti per esercizio (matrice specificità)
Ogni esercizio assegna punti a più muscoli, pesati per quanto è specifico.
Esempi (per ~10 ripetizioni "standard"):
- **Push-up**: petto 10, braccia 5, spalle 3, core 2, gambe 0
- **Trazioni**: schiena 8, braccia 6, spalle 4, core 2, petto 1
- **Squat**: gambe 10, core 3, schiena 1

Implementazione: ogni esercizio in `data/exercises.js` ha `points: {muscle: peso}`.
Punti di una serie = `peso_muscolo × repFactor × loadMult` dove:
- `repFactor = reps / 10` (10 push-up = 1×; **100 push-up ≈ 10× → ~100 pt petto**)
- `loadMult` (solo pesi) = `clamp(1 + kg/bodyweight, 1, 3)` (carico pesa di più)
- esercizi a tempo (plank): `repFactor = secondi / 30`

## 3. Rank a livelli con sotto-livelli
Tier (dal più basso): **Legno → Bronzo → Argento → Oro → Platino → Diamante → Titan**.
Ogni tier ha **4 sotto-livelli**: `liv.4` (ingresso) → `liv.3 → liv.2 → liv.1` (max del tier),
poi promozione al tier successivo `liv.4`. Totale 28 gradini.
- Ogni gradino richiede un monte punti crescente (es. ~250 pt iniziali, scala ×1.15).
- I **punti sono cumulativi per muscolo**; la posizione (tier+sottolivello) deriva dal totale.
- Es: 1000 pt/mese su un gruppo lo fanno salire di diversi gradini.

## 4. Cosa fa PERDERE punti (decadimento)
- **Inattività**: dopo una *grazia* (3 giorni) senza allenare un muscolo, `−X/giorno`
  (es. −15/gg). Dopo ~7 giorni il calo è evidente su tutti i gruppi non allenati.
- **Cibo spazzatura**: valori nutrizionali → penalità mirate (PARAMETRIZZARE bene, fase 2):
  - grassi saturi oltre soglia → −addome/core
  - zuccheri elevati → −addome/core
  - (espandibile: sodio, ultra-processati, alcol, ecc.)
- I punti non scendono sotto 0 per tier "Legno liv.4" (pavimento).

## 5. Avatar collegato
- L'avatar mostra ogni gruppo muscolare colorato/sviluppato in base al suo tier+sottolivello.
- Salire di gradino (es. Braccia Bronzo liv.4 → liv.3) = **trasformazione visiva** (braccia
  meno esili). Partenza "Bronzo" = avatar esile; tier alti = muscoloso.
- Per ora: `BodyChart` colora per tier; FASE 2: morphing/sviluppo per sottolivello.

## 6. Reconcile (quando si applicano decadimenti/penalità)
- Alla chiusura allenamento: `+punti` ai muscoli coinvolti, aggiorna `lastTrained`.
- All'apertura app / cambio giorno: applica decadimento inattività + penalità cibo del giorno
  precedente. Stato per muscolo: `{ points, lastTrained, lastDecay }`.

## 7. Bilancio mensile
- Vista "questo mese": punti guadagnati/persi per gruppo, gradini saliti, contributo per
  esercizio e per causa (allenamento vs decadimento vs cibo).

## Roadmap implementazione
- [x] FASE 1 (base): matrice punti per esercizio, accrual su fine workout, rank a
  sotto-livelli, decadimento inattività, penalità cibo (saturi/zuccheri → core),
  Rank page con sotto-livelli + breakdown punti.
- [ ] FASE 2: avatar morphing per sottolivello; parametrizzazione nutrizionale ricca
  (tabella valori → muscoli, con pesi sensati); bilancio mensile dettagliato; bilanciamento
  numerico (soglie, decadimenti) testato sul campo; punti negativi anche per sonno scarso.
- [ ] FASE 3: l'AI Coach legge questi bilanci e spiega/consiglia.
