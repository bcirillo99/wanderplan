# WanderPlan — Frontend

React 19 + TypeScript + Vite client for the WanderPlan trip planning app.

---

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| React | 19 | UI framework |
| TypeScript | 6 | Type safety |
| Vite | 8 | Dev server + bundler |
| React Router | 7 | Client-side routing |
| Axios | 1.x | HTTP client |
| Vitest | 4 | Unit testing |
| Testing Library | 16 | Component testing |
| Tailwind CSS | 4 | Utility styles |

---

## Project Structure

```
src/
├── api/              # Axios functions — one file per resource
│   ├── client.ts     # Axios instance (base URL)
│   ├── trips.ts
│   ├── activities.ts
│   ├── flights.ts
│   ├── accommodations.ts
│   ├── transports.ts
│   ├── extras.ts
│   ├── packing_items.ts
│   ├── notes.ts
│   ├── stats.ts
│   └── daily_summary.ts
├── components/
│   ├── forms/        # Form components (add + edit mode via `initial` prop)
│   │   ├── ActivityForm.tsx
│   │   ├── AccommodationForm.tsx
│   │   ├── ExtraForm.tsx
│   │   ├── FlightForm.tsx
│   │   ├── NoteForm.tsx
│   │   ├── PackingForm.tsx
│   │   ├── TransportForm.tsx
│   │   ├── TripForm.tsx
│   │   ├── Forms.tsx       # Re-export barrel
│   │   └── formOptions.ts  # Shared select options
│   ├── tabs/         # Tab panel components
│   │   ├── ActivitiesTab.tsx   # Search + status filter
│   │   ├── AccommodationsTab.tsx
│   │   ├── DaysTab.tsx
│   │   ├── ExtrasTab.tsx
│   │   ├── FlightsTab.tsx
│   │   ├── NotesTab.tsx
│   │   ├── PackingTab.tsx
│   │   ├── StatsTab.tsx
│   │   ├── SummaryTab.tsx
│   │   ├── TransportsTab.tsx
│   │   ├── TabShared.tsx   # SectionHeader, ItemCard, TabEmpty
│   │   └── tabUtils.ts     # fmt, fmtTime, fmtDateTime helpers
│   ├── FormField.tsx
│   ├── Modal.tsx
│   ├── Navbar.tsx
│   ├── StatusBadge.tsx
│   └── TripCalendar.tsx
├── hooks/
│   └── useTripData.ts  # All data fetching + mutations for a trip
├── pages/
│   ├── HomePage.tsx        # Trip list with search filter
│   ├── TripDetailPage.tsx  # Tab layout + all modals
│   ├── TripDayPage.tsx     # Single-day activity view
│   └── TripPage.tsx
├── types/
│   └── index.ts        # All TypeScript interfaces + Create/Update types
├── utils/
│   └── exportTrip.ts   # PDF + DOCX export logic
└── test/
    ├── setup.ts
    ├── tabUtils.test.ts
    ├── tripSearch.test.ts
    ├── ActivitiesTab.test.tsx
    └── ExtraForm.test.tsx
```

---

## Setup

```bash
npm install
npm run dev   # http://localhost:5173
```

Requires the backend running on `http://localhost:8000`. See root README for backend setup.

---

## Key Patterns

### Forms — add vs edit mode

All forms accept an optional `initial` prop. When present, fields are pre-populated and the submit button reads "Update X" instead of "Add X".

```tsx
<FlightForm onSubmit={handleAdd} loading={saving} />                       // add
<FlightForm initial={editFlight} onSubmit={handleEdit} loading={saving} /> // edit
```

### Data layer — `useTripData`

Single hook owns all server state for a trip. Returns data arrays + mutation functions. Each mutation uses a `withSaving` wrapper to toggle a global `saving` flag.

```ts
const { flights, addFlight, updateFlight, deleteFlight } = useTripData(tripId)
```

### API client

`src/api/client.ts` exports an Axios instance with `baseURL: http://localhost:8000`. All API files import from it.

---

## Testing

```bash
npm test            # single run
npm run test:watch  # watch mode
```

Tests live in `src/test/`. Stack: Vitest + @testing-library/react + jsdom.

| File | What it covers |
|------|---------------|
| `tabUtils.test.ts` | `fmt`, `fmtTime`, `fmtDateTime` pure functions |
| `tripSearch.test.ts` | Trip search filter predicate (title + destination) |
| `ActivitiesTab.test.tsx` | Search by title/location, status filter, combined filter |
| `ExtraForm.test.tsx` | Add mode (empty fields), edit mode (initial values pre-populated) |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | TypeScript check + Vite build |
| `npm run lint` | ESLint |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
