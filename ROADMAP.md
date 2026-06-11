# Roadmap — AI Assistant V1 → V2

Ordine pensato per dipendenze: ogni fase produce qualcosa di finito e usabile dalla successiva.
Stime in sere/weekend (progetto personale). Per ogni fase: cosa fare, esempio concreto, cosa studiare prima.

> Principio guida: **una fase finita e documentata > due fasi al 60%**.
> Se devi tagliare, taglia dalla fine (Fase 7-8), non dal mezzo.

---

## Fase 1 — Chiudere V1: modifica item esistenti

**Stima**: 1–2 settimane di sere
**Dipende da**: niente
**Output**: l'utente può dire "sposta la visita alla Tour Eiffel alle 15" e confermare la modifica.

### Cosa fare

1. **Prerequisito non ovvio**: `_summarize()` in `chat_service.py` non include gli ID delle entità.
   Per un update il modello deve dire *quale* item modificare → aggiungi un ID corto a ogni riga:

   ```
   Activity [a3f2]: Tour Eiffel | 2026-06-06 10:00 | Paris | booked
   ```

   Usa un prefisso corto dell'UUID (primi 4-8 char) e tieni una mappa `short_id → UUID` per risolverlo
   al ritorno. UUID interi nel contesto = token sprecati e il modello li ricopia male.

2. **Tool `update_*`** in `TOOLS`: stessi campi degli `insert_*` ma tutti opzionali + campo `item_id` required.

   ```python
   {"type": "function", "function": {
       "name": "update_activity",
       "description": "Modify an existing activity. Only include fields the user wants to change.",
       "parameters": {
           "type": "object",
           "required": ["item_id"],
           "properties": {
               "item_id":    {"type": "string", "description": "ID shown in trip context, e.g. a3f2"},
               "title":      {"type": "string"},
               "start_time": {"type": "string"},
               # ... stessi campi di insert_activity
           },
       },
   }}
   ```

3. **`chat()`**: oggi fa `removeprefix("insert_")` — generalizza a `(verb, entity_type)`,
   es. `update_activity` → `("update", "activity")`. `ProposedAction` prende un campo `verb` + `item_id`.

4. **System prompt**: rimuovi la regola "Only INSERT — never propose edits", aggiungi regola update
   con stessi action words espliciti ("change", "move", "sposta", "cambia", "modifica"...).

5. **Frontend**: `UpdateCard` — copia di `ActionCard` che mostra "campo: vecchio → nuovo" e
   chiama `PATCH /{id}` invece di `POST`. Verifica quali router hanno già `PATCH` (la maggior parte sì).

### Esempio di flusso completo

> User: "sposta la cena da Ramiro alle 21"
> → modello chiama `update_activity(item_id="b41c", start_time="21:00:00")`
> → backend risolve `b41c` → UUID, valida che esista e appartenga al trip
> → frontend mostra UpdateCard "Cena da Ramiro: 20:00 → 21:00 [Conferma] [Annulla]"
> → conferma → `PATCH /trips/{trip_id}/activities/{uuid}`

### Cosa studiare

- **Ollama tool calling**: https://ollama.com/blog/tool-support — come il modello sceglie tra tanti tool (ne avrai 14: 7 insert + 7 update). Più tool = più confusione per un 4B; misura se la precisione cala
- **JSON Schema** (required vs optional, enum) — lo usi già, ripassa `description` come leva di prompt engineering: il modello la legge davvero

---

## Fase 2 — Provider abstraction (`AI_PROVIDER`)

**Stima**: 1 weekend
**Dipende da**: niente (ma falla prima dell'eval, così l'eval gira su tutti i provider)
**Output**: switch Ollama / Claude API / OpenAI-compatible da env var.

### Cosa fare

1. In `config.py`: `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` (pydantic-settings, già in uso).
2. In `chat_service.py`: estrai la chiamata HTTP (righe ~275-291) in:

   ```python
   def _call_llm(messages: list[dict], tools: list[dict]) -> dict:
       """Returns normalized {"content": str | None, "tool_calls": [{"name", "arguments"}]}."""
       match settings.AI_PROVIDER:
           case "ollama":            return _call_ollama(messages, tools)
           case "anthropic":         return _call_anthropic(messages, tools)
           case "openai_compatible": return _call_openai(messages, tools)
   ```

   Il punto chiave è il **formato normalizzato di ritorno**: il resto di `chat()` non deve sapere
   quale provider ha risposto.

3. Mapping formati tool — differenze reali ma piccole:
   - **Ollama/OpenAI**: `{"type": "function", "function": {"name", "parameters"}}`
   - **Anthropic**: `{"name", "description", "input_schema"}` (schema identico, wrapper diverso);
     tool call dentro `content` come blocco `{"type": "tool_use", "name", "input"}`
   - **System prompt**: Anthropic lo vuole come parametro `system` separato, non come messaggio
4. Gestione errori per provider: 401 (key sbagliata) → messaggio chiaro, non 500.
5. README: "no API key needed by default; bring your own if you prefer a cloud model" + cosa esce
   dalla macchina quando usi un provider cloud (messaggi chat sì, DB no).

### Cosa studiare

- **Anthropic tool use**: https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview — leggi request E response shape
- **OpenAI function calling** (copre anche Groq/OpenRouter/LM Studio: stessa API, `base_url` diverso)
- Confronta i tre formati side-by-side scrivendo lo stesso tool nei tre dialetti — esercizio da un'ora, chiarisce tutto

---

## Fase 3 — Eval set

**Stima**: 1 settimana di sere
**Dipende da**: Fase 2 (per girare su più provider)
**Output**: `evals/` con casi fissi + runner + report. Perno di tutto il resto: ogni scelta successiva (modello, knowledge backend) si giudica qui.

### Cosa fare

1. 15–20 casi in YAML, tre categorie:

   ```yaml
   # evals/cases/inserts.yaml
   - id: insert-simple-activity
     trip_fixture: lisbon_3days        # DB seed riusabile
     message: "aggiungi visita al Castello di São Jorge il 6 giugno alle 10"
     expect:
       type: action
       entity_type: activity
       data_contains: {title_like: "São Jorge", activity_date: "2026-06-06", start_time: "10:00:00"}

   - id: query-no-tool-call          # il bug noto: query scambiata per insert
     trip_fixture: lisbon_3days
     message: "a che ora è il mio volo?"
     expect:
       type: text                     # se risponde con action → FAIL

   - id: insert-out-of-range
     trip_fixture: lisbon_3days
     message: "aggiungi cena il 20 giugno"   # trip finisce il 8
     expect:
       type: text                     # deve rifiutare, non proporre
   ```

2. Runner: script pytest o standalone che carica fixture, chiama `chat_service.chat()` direttamente
   (no HTTP, no frontend), confronta con `expect`. Salva risultati JSON con timestamp + modello + provider.
3. Report: tabella pass/fail per categoria. Quando hai Fase 2: stessa tabella per `qwen3.5:4b` vs Claude
   — primo confronto concreto locale vs cloud.
4. Metriche: pass rate + latenza media per caso.

### Cosa studiare

- Concetto **eval-driven development** per LLM (Hamel Husain, "Your AI Product Needs Evals" — il riferimento pratico migliore)
- **LLM-as-judge**: per ora non serve (i tuoi expect sono verificabili meccanicamente), ti servirà in Fase 6 per giudicare qualità risposte libere
- Guarda **promptfoo** per ispirazione sul formato YAML — ma scrivi il runner a mano: è poco codice e capisci di più

---

## Fase 4 — Corpus + RAG baseline

**Stima**: 2 weekend
**Dipende da**: niente (parallelo a 1-3 se vuoi)
**Output**: corpus WikiVoyage pulito + `query_knowledge()` con backend RAG funzionante.

### Cosa fare

1. **Corpus** (la parte condivisa con la Fase 5 — falla bene):
   - WikiVoyage dump: https://dumps.wikimedia.org/enwikivoyage/ (oppure API REST per singole pagine —
     per 5-10 destinazioni di test l'API è molto più semplice del dump XML)
   - Pulizia wikitext → markdown (`mwparserfromhell` per il dump, o chiedi le pagine via API in HTML e converti)
   - Salva in `knowledge/raw/lisbon.md`, `knowledge/raw/rome.md`... — immutabili, versionati
2. **Interfaccia**:

   ```python
   # knowledge/base.py
   def query_knowledge(question: str, top_k: int = 4) -> str:
       """Returns context text to inject into the system prompt."""
   ```

   Backend scelto da `KNOWLEDGE_BACKEND` env var (`rag` | `wiki`). Stesso pattern di `AI_PROVIDER`.
3. **RAG backend**: chunking (~500 token, overlap 50) → embedding con `nomic-embed-text` via
   `POST /api/embed` di Ollama → Chroma in persistenza locale → query: embed domanda, top-k, concatena.
4. Script `ingest_rag.py` offline/manuale — mai a query time.
5. Collega al chat: se il messaggio è una domanda di conoscenza (non sul trip), inietta
   `query_knowledge(msg)` nel system prompt. Euristica semplice per ora, va bene così.

### Cosa studiare

- **Embeddings da zero**: cosa sono, cosine similarity, perché il chunking conta. Karpathy "Intro to LLMs" se parti da zero, altrimenti la doc Chroma "usage guide" basta
- **Chunking strategies**: fixed-size vs semantic — per WikiVoyage le sezioni (`== See ==`, `== Eat ==`) sono chunk naturali, meglio dei 500 token fissi: prova entrambi, è il tuo primo micro-esperimento
- **Ollama embeddings API**: `POST /api/embed`, due righe di codice

---

## Fase 5 — LLM Wiki (Karpathy pattern)

**Stima**: 3–4 settimane di sere. La fase più grossa e quella che vale di più.
**Dipende da**: Fase 4 (corpus)
**Output**: wiki markdown generato/mantenuto dall'LLM + backend `wiki` per `query_knowledge()`.

### Cosa fare

1. **Schema** (`knowledge/wiki/schema.yaml`): struttura delle pagine per tipo:

   ```yaml
   page_types:
     city:
       sections: [Overview, Neighborhoods, Top sights, Food, Transport, Practical]
       links_to: [neighborhood, food-guide]
     neighborhood:
       sections: [Character, Sights, Eat & drink]
   ```

2. **`ingest`**: per ogni sorgente raw → LLM distilla → scrive/aggiorna pagine.
   Prompt tipo: *"You maintain a travel wiki. Given this raw source and the current page (if any),
   produce the updated page following the schema. Preserve existing facts unless contradicted.
   Cross-link related pages with [[wikilinks]]."*
   - Frontmatter per pagina: `sources: [...]`, `last_ingest: <date>` — base per il lint anti-drift
   - Gira con il provider migliore disponibile (Claude via Fase 2): ingest è offline, qualità > costo;
     a query time resta tutto locale
3. **`query`**: risolvi domanda → pagine rilevanti. V0: match su nomi pagina + wikilinks (per dominio
   viaggi spesso basta: "ristoranti ad Alfama" → `Alfama.md` + `Food-Lisbon.md`). V1: indicizza i *titoli*
   con embeddings (non i contenuti — è la differenza chiave vs RAG).
4. **`lint`**: check offline — link rotti, sezioni mancanti rispetto allo schema, pagine con
   `last_ingest` più vecchio della sorgente.
5. Esempio di pagina target:

   ```markdown
   ---
   sources: [raw/lisbon.md]
   last_ingest: 2026-07-01
   ---
   # Alfama
   Oldest district of Lisbon, survived the 1755 earthquake. Steep, maze-like, best on foot.

   ## Sights
   - **Castelo de São Jorge** — go at opening (9:00) to beat crowds, ~3h with views
   - **Miradouro de Santa Luzia** — free viewpoint, sunset spot

   ## Eat & drink
   See [[Food-Lisbon]] — fado dinner houses cluster here, book ahead.
   ```

6. (Opzionale) apri `knowledge/wiki/` come vault Obsidian — zero codice, solo viewer.

### Cosa studiare

- **Il gist di Karpathy** (riferimento nel TODO) — rileggilo *dopo* la Fase 4: con RAG fatto capisci esattamente cosa elimina
- **Prompt engineering per distillazione**: scrittura vincolata da schema, idempotenza (ri-ingestire la stessa sorgente non deve riscrivere tutto). Studia su: Anthropic prompt engineering docs
- Concetto di **structured generation** — quando l'output deve seguire un formato

---

## Fase 6 — Benchmark RAG vs Wiki

**Stima**: 1 settimana
**Dipende da**: Fasi 3, 4, 5
**Output**: tabella comparativa in README. Il deliverable portfolio più forte del progetto.

### Cosa fare

1. Estendi eval set con 10-15 domande di conoscenza (stesso formato Fase 3):
   lookup ("cosa vedere ad Alfama"), planning ("3 giorni a Lisbona"), e 2-3 **out-of-wiki**
   ("posti dove ha girato Wes Anderson in Europa") per quantificare il punto cieco del wiki.
2. Runner gira con `KNOWLEDGE_BACKEND=rag` poi `=wiki`. Misura per backend:
   latenza p50/p95 (query → contesto pronto), RAM residente (`psutil`), qualità risposta
   (LLM-as-judge: Claude giudica risposta vs attesa, scala 1-5), fallimenti qualitativi.
3. README: tabella + paragrafo "why the wiki stays the default" — scritto dai *numeri*, non dall'opinione.
4. Congela il RAG: resta nel repo come baseline riproducibile, basta lavorarci.

### Cosa studiare

- **LLM-as-judge**: bias noti (position bias, verbosity bias) e mitigazioni — ti serve per il punto 2
- `psutil` per RSS del processo; per la RAM di Ollama: `ollama ps` la mostra direttamente

---

## Fase 7 — Model upgrade + ReAct ridotto

**Stima**: 2 settimane
**Dipende da**: Fase 3 (l'eval decide se l'upgrade vale), meglio dopo Fase 6
**Output**: modello 7-8B + loop multi-step con guardrail.

### Cosa fare

1. **Upgrade**: prova `qwen3:8b` (più recente del Qwen2.5 citato nel TODO, stesso budget Q4_K_M ~5-6 GB).
   Gira l'eval prima/dopo: se il pass rate non migliora, l'upgrade non vale la latenza — decidi dai numeri.
2. **ReAct ridotto** — non agente generale, loop a step massimi con tool fissi:

   ```python
   MAX_STEPS = 3
   READ_TOOLS = [query_knowledge_tool, check_conflicts_tool]  # read-only: eseguibili senza conferma

   for step in range(MAX_STEPS):
       resp = _call_llm(messages, READ_TOOLS + WRITE_TOOLS)
       if not resp["tool_calls"]:
           return text_response(resp)
       call = resp["tool_calls"][0]
       if call["name"] in WRITE_TOOL_NAMES:
           return proposed_action(call)        # write = fine loop, conferma utente (invariante V1)
       result = execute_read_tool(call)        # read = esegui e continua
       messages += [assistant_msg(call), tool_result_msg(result)]
   return text_response_fallback()              # guardia: mai loop infinito
   ```

   Invariante da non rompere: **i write tool non vengono mai eseguiti dal loop** — sempre ActionCard/UpdateCard.
3. Aspettati fallimenti dal 7B quantizzato: argomenti malformati, tool inventati. Valida ogni call
   contro lo schema; dopo 2 errori consecutivi → risposta testuale di fallback.
4. Aggiungi 5 casi eval multi-step ("pianifica 3 giorni a Lisbona e segnala conflitti").

### Cosa studiare

- **Paper ReAct** (Yao et al. 2022) — leggi le idee (reason/act interleaving), non serve riprodurlo
- **Anthropic "Building effective agents"** — sezione workflow vs agent: il tuo loop ridotto è
  deliberatamente un workflow, e quel post spiega perché spesso è la scelta giusta. Argomento da colloquio
- Tool-calling reliability su modelli piccoli: cerca benchmark BFCL (Berkeley Function Calling Leaderboard) per calibrare aspettative

---

## Fase 8 — Memory management polish

**Stima**: 1 settimana
**Dipende da**: tutto il resto (è rifinitura trasversale)
**Output**: rolling summary + token budget + sezione README "Resource budget".

### Cosa fare

1. **Rolling summary**: quando history > `MAX_HISTORY_MESSAGES`, comprimi i messaggi più vecchi in un
   summary (una chiamata LLM) invece di scartarli; il summary entra come primo messaggio.
2. **Token counter**: stima token prima di ogni chiamata (`len(text) // 4` come approssimazione è
   accettabile e onesta se documentata; il campo `prompt_eval_count` nella risposta Ollama dà il valore
   esatto a posteriori — usalo per loggare e calibrare). Log warning vicino al limite del modello.
3. **README "Resource budget"**: tabella RAM del TODO + numeri *misurati* (`ollama ps`, `psutil`)
   accanto alle stime. Stima vs misura side-by-side = il dettaglio che fa la differenza nel portfolio.

### Cosa studiare

- Come funziona il **KV cache** e perché la RAM di un LLM cresce col contesto — spiega i numeri che misurerai (la RAM di `ollama ps` varia con `num_ctx`)
- Pattern **summarization memory** (LangChain `ConversationSummaryMemory` come riferimento concettuale — non usare la libreria, riscrivilo: sono ~30 righe)

---

## Vista d'insieme

| # | Fase | Stima | Sblocca |
|---|------|-------|---------|
| 1 | V1 update items | 1-2 sett | chiude V1 |
| 2 | Provider abstraction | 1 weekend | eval cross-model, ingest col cloud |
| 3 | Eval set | 1 sett | misura per tutte le fasi dopo |
| 4 | Corpus + RAG baseline | 2 weekend | knowledge layer, baseline benchmark |
| 5 | LLM Wiki | 3-4 sett | il pezzo portfolio principale |
| 6 | Benchmark RAG vs Wiki | 1 sett | il deliverable da README |
| 7 | Model upgrade + ReAct | 2 sett | multi-step planning |
| 8 | Memory polish | 1 sett | rifinitura portfolio |

Totale realistico: ~3 mesi di sere/weekend. Checkpoint naturali dove fermarsi con qualcosa di
completo: dopo Fase 3 (V1 solido e misurato), dopo Fase 6 (knowledge layer benchmarkato).

## Letture trasversali (prima di iniziare, ~mezza giornata)

1. Karpathy — gist LLM Wiki (già nel TODO): https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
2. Anthropic — "Building effective agents" (workflow vs agent, pattern compositivi)
3. Hamel Husain — "Your AI Product Needs Evals"
4. Ollama docs — tool support + embeddings API (le due API che userai di più)
