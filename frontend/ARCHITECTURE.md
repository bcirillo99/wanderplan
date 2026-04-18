# Frontend Architecture

Decisions, rationale, and what each choice enables.

---

## Data fetching — TanStack Query

### Perché

Il vecchio `useTripData` usava `useState` + `useEffect` + `Promise.all` manuale:

```ts
// prima
useEffect(() => {
  Promise.all([getTrip(id), getActivities(id), ...])
    .then(([t, act, ...]) => {
      setTrip(t); setActivities(act); ...
      setLoading(false)
    })
    .catch(() => setLoading(false))   // ← errori silenziosi
}, [tripId])
```

Problemi:
- **Nessun caching** — ogni mount rifaceva 9 richieste parallele
- **Nessun background refetch** — dati stantii senza reload manuale
- **Stato manuale** — ogni mutation aggiornava `setState` a mano, facile sbagliare
- **Errori silenziosi** — il `catch` inghiottiva tutto
- **`saving` globale** — un singolo boolean per tutte le operazioni concorrenti

### Come funziona adesso

Ogni risorsa ha la sua `useQuery` con una chiave tipizzata:

```ts
export const QUERY_KEYS = {
  trip:       (id) => ['trip', id],
  activities: (id) => ['activities', id],
  stats:      (id) => ['stats', id],
  // ...
}

const activitiesQ = useQuery({
  queryKey: QUERY_KEYS.activities(tripId),
  queryFn:  () => getActivities(tripId),
  enabled:  !!tripId,
})
```

Ogni mutation invalida le query interessate:

```ts
const addActivityMut = useMutation({
  mutationFn: (d) => createActivity(tripId, d),
  onSuccess:  () => {
    inv(QUERY_KEYS.activities(tripId))
    inv(QUERY_KEYS.stats(tripId))     // ← stats aggiornate automaticamente
  },
  onError: () => toast.error('Failed to add activity'),
})
```

### Cosa porta

| Comportamento | Prima | Dopo |
|--------------|-------|------|
| Caching | No — ogni mount = 9 fetch | 30s stale time, dati serviti dalla cache |
| Background refetch | No | Sì — dati freschi quando si torna al tab |
| Deduplicazione | No — render concorrenti = fetch duplicati | TQ dedup automatico |
| Stats dopo mutation | Manuale / non aggiornate | Invalidazione automatica su ogni mutation cost-affecting |
| Saving flag | `setSaving(true/false)` globale | `useIsMutating() > 0` — conteggio preciso |
| Errori | Catch silenzioso | `onError` per query + mutation con toast specifici |
| Preparazione LLM | Complicato — stato locale non condivisibile | Query keys = chiavi di cache condivisibili, facile aggiungere `/chat` query |

### Configurazione QueryClient

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,  // 30s — non rifetch se dati freschi
    },
  },
})
```

---

## Gestione errori

### Error Boundary (`src/components/ErrorBoundary.tsx`)

Classe React che wrappa l'intera app. Intercetta errori di render (crash JS inaspettati) e mostra una schermata di fallback con "Reload page" invece di una pagina bianca.

Posizionata **fuori** da `QueryClientProvider` in `main.tsx` — cattura anche errori nel provider stesso.

### Toast notifications (sonner)

Ogni livello di errore ha feedback visibile:

| Livello | Errore | Toast |
|---------|--------|-------|
| Query load | Fetch iniziale fallisce | `Failed to load trip data` |
| Mutation | Add/update/delete fallisce | Messaggio specifico per entity |
| HomePage | Load/create/edit/delete trip | Messaggio specifico |

Configurazione in `App.tsx`:
```tsx
<Toaster position="bottom-right" toastOptions={{ style: { fontFamily: "'DM Sans', sans-serif" } }} />
```

---

## Interfaccia pubblica di `useTripData`

L'interfaccia ritornata è **identica** a prima della migrazione TanStack Query. `TripDetailPage` e tutti i consumer non hanno richiesto modifiche.

```ts
const {
  trip, activities, flights, ...,   // dati (default [] / null)
  loading, saving,                   // stati UI
  uniqueDates, tripMin, tripMax,     // derivati
  addActivity, updateActivity, ...,  // mutations (Promise<void>, non throws)
  deleteTrip,                        // eccezione: propaga errore (navigation guard)
} = useTripData(tripId)
```

**Nota su `deleteTrip`**: è l'unica mutation che propaga l'errore. Il caller in `TripDetailPage` fa `await tripData.deleteTrip(); navigate('/')` — se fallisce, la navigazione non avviene. Tutte le altre mutations swallowano l'errore (toast visibile) e restituiscono `Promise<void>` resolved.

---

## Testing

Stack: **Vitest + @testing-library/react + jsdom**

| File | Cosa testa |
|------|-----------|
| `tabUtils.test.ts` | Funzioni pure `fmt`, `fmtTime`, `fmtDateTime` |
| `tripSearch.test.ts` | Predicato di ricerca trip (title + destination) |
| `ActivitiesTab.test.tsx` | Search per title/location, filtro status, combinazione |
| `ExtraForm.test.tsx` | Add mode (campi vuoti), edit mode (valori iniziali pre-popolati) |
| `useTripData.test.tsx` | Query loading state, dati caricati, mutazioni, invalidazione stats, toast su errore |

Per testare `useTripData`, ogni test usa un `QueryClient` fresco con `retry: false` e un wrapper `QueryClientProvider`. Tutti i moduli API sono mockati con `vi.mock`.

```tsx
function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}
```

---

## Prossimi step

In ordine di priorità:

1. **Auth** — JWT o session. Prerequisito per multi-utente e per associare contesto LLM all'utente.
2. **LLM integration** — endpoint `/trips/{id}/chat` con SSE streaming. TanStack Query gestisce la cache del contesto; l'SSE va gestito con un custom hook separato.
3. **Drag-and-drop** — riordino attività nel day view (react-beautiful-dnd o dnd-kit).
