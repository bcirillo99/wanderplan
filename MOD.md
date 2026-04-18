# WanderPlan — Improvement Roadmap

## Gap Analysis (pre-LLM integration)

---

### Critical — block LLM work

| Gap | Problem |
|-----|---------|
| No auth | Single-user only. LLM needs user context/sessions. |
| Monolithic `useTripData` | 180-line hook with raw `useState` + manual fetch. No caching, no dedup, no background refetch. Replace with TanStack Query. |
| No streaming infra | Axios layer has no SSE/streaming support. LLM responses need it or UX is unusable. |

---

### Important — quality of life

| Gap | Problem |
|-----|---------|
| No error boundaries / toasts | Failures are silent. `catch(() => setLoading(false))` hides all errors. |
| No optimistic updates | Every mutation waits full round-trip. |
| No frontend tests | Zero UI coverage. |
| ~~`updateExtra` missing~~ | ✅ Fixed — edit modal + form initial values wired. |

---

### Nice to have

- ~~No search/filter on any list~~ ✅ Fixed — trip search (title/destination) on HomePage; activity search (title/location) + status filter on ActivitiesTab
- No drag-and-drop reorder for day activities
- No PWA / offline support
- No shared trip links

---

## Priority order before LLM integration

1. **TanStack Query** — replaces `useTripData`, caching + optimistic updates for free
2. **Auth** (JWT or session-based) — required if LLM context is per-user
3. **SSE / streaming support** — without this LLM chat UX is broken
4. **Toast / error layer** — users need feedback when LLM calls fail
