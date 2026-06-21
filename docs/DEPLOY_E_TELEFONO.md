# Installare l'app sul telefono + AI su mobile

## A) Mettere l'app online (gratis) → installabile sul telefono
Per installare la PWA serve **HTTPS** (un host). Opzione consigliata: **GitHub Pages**
(gratis, già pronto con il workflow `.github/workflows/deploy.yml`).

1. Pusha il repo su GitHub (branch `main` o `v2-lifoff`).
2. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Ad ogni push, l'app si ricostruisce e va online a:
   `https://<tuo-utente>.github.io/coach-tascabile/`
4. Sul telefono apri quell'URL in Chrome/Safari → menu → **"Aggiungi a schermata Home"**.
   Diventa un'app a tutto schermo, funziona offline (PWA).

Alternative gratis equivalenti: **Netlify** (trascini la cartella `dist/`), **Vercel**,
**Cloudflare Pages**. Tutte danno HTTPS.

> Build locale: `npm run build` → cartella `dist/` (statica). `npm run preview` per provarla.

## B) Far funzionare l'AI sul telefono
Sul telefono **Ollama non è disponibile** (gira sul PC). Due strade:

### Consigliata: provider cloud GRATUITO (funziona ovunque)
In **Profilo → Coach AI** scegli:
- **Google Gemini (free tier)** → chiave gratis su aistudio.google.com/app/apikey
- oppure **OpenRouter** (modelli `:free`) → chiave gratis su openrouter.ai/keys

Incolli la chiave una volta; resta salvata sul dispositivo. Zero costi.

### Avanzata: usare l'Ollama del PC dal telefono (stessa rete WiFi)
Funziona solo se l'app NON è su HTTPS (es. la apri via IP locale del PC), altrimenti il
browser blocca le chiamate http (mixed content). In pratica per il telefono conviene la via
cloud gratuita sopra. Se vuoi comunque provarci:
1. Sul PC: variabile `OLLAMA_ORIGINS=*` e `OLLAMA_HOST=0.0.0.0`, riavvia Ollama.
2. Nell'app (Profilo → Coach AI → Ollama) metti `http://IP-DEL-PC:11434`.
3. Telefono e PC sulla stessa rete.

## Riepilogo
- **PC**: Ollama locale (gratis, privato) come default. ✅
- **Telefono**: Gemini/OpenRouter free. ✅
- L'app è la stessa: i dati restano locali sul dispositivo (puoi esportare/importare il
  backup JSON da Profilo per spostarli tra PC e telefono).
