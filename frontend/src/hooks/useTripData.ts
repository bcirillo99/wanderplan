// frontend/src/hooks/useTripData.ts
import { useQuery, useMutation, useQueryClient, useIsMutating } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getTrip, updateTrip as apiUpdateTrip, deleteTrip as apiDeleteTrip } from '../api/trips'
import { getFlights, createFlight, updateFlight as apiUpdateFlight, deleteFlight as apiDeleteFlight } from '../api/flights'
import { getAccommodations, createAccommodation, updateAccommodation as apiUpdateAccommodation, deleteAccommodation as apiDeleteAccommodation } from '../api/accommodations'
import { getTransports, createTransport, updateTransport as apiUpdateTransport, deleteTransport as apiDeleteTransport } from '../api/transports'
import { getExtras, createExtra, updateExtra as apiUpdateExtra, deleteExtra as apiDeleteExtra } from '../api/extras'
import { getPackingItems, createPackingItem, deletePackingItem as apiDeletePackingItem, togglePackingItem } from '../api/packing_items'
import { getTripStats } from '../api/stats'
import { getActivities, createActivity, updateActivity as apiUpdateActivity, deleteActivity as apiDeleteActivity } from '../api/activities'
import { getNotes, createNote, updateNote as apiUpdateNote, deleteNote as apiDeleteNote } from '../api/notes'
import type {
  Trip, Activity, Flight, Accommodation, Transport, Extra, PackingItem, TripStats, Note,
  ActivityCreate, FlightCreate, AccommodationCreate, TransportCreate, ExtraCreate, ExtraUpdate,
  PackingItemCreate, TripCreate, NoteCreate,
} from '../types'

// ── Query keys ─────────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  trip:           (id: string) => ['trip', id] as const,
  activities:     (id: string) => ['activities', id] as const,
  flights:        (id: string) => ['flights', id] as const,
  accommodations: (id: string) => ['accommodations', id] as const,
  transports:     (id: string) => ['transports', id] as const,
  extras:         (id: string) => ['extras', id] as const,
  packingItems:   (id: string) => ['packingItems', id] as const,
  stats:          (id: string) => ['stats', id] as const,
  notes:          (id: string) => ['notes', id] as const,
}

// ── Optimistic update helpers ──────────────────────────────────────────────────
type Rollback = () => void

function optimisticAdd<T extends { id: string }>(
  qc: ReturnType<typeof useQueryClient>,
  key: readonly unknown[],
  item: T,
): Rollback {
  qc.cancelQueries({ queryKey: key })
  const prev = qc.getQueryData<T[]>(key)
  qc.setQueryData<T[]>(key, (old) => [...(old ?? []), item])
  return () => qc.setQueryData(key, prev)
}

function optimisticUpdate<T extends { id: string }>(
  qc: ReturnType<typeof useQueryClient>,
  key: readonly unknown[],
  id: string,
  patch: Partial<T>,
): Rollback {
  qc.cancelQueries({ queryKey: key })
  const prev = qc.getQueryData<T[]>(key)
  qc.setQueryData<T[]>(key, (old) =>
    (old ?? []).map((item) => (item.id === id ? { ...item, ...patch } : item)),
  )
  return () => qc.setQueryData(key, prev)
}

function optimisticDelete<T extends { id: string }>(
  qc: ReturnType<typeof useQueryClient>,
  key: readonly unknown[],
  id: string,
): Rollback {
  qc.cancelQueries({ queryKey: key })
  const prev = qc.getQueryData<T[]>(key)
  qc.setQueryData<T[]>(key, (old) => (old ?? []).filter((item) => item.id !== id))
  return () => qc.setQueryData(key, prev)
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useTripData(tripId: string) {
  const qc = useQueryClient()

  // Fire-and-forget helper: swallows errors (toast shown via onError)
  const mut = async <T>(fn: () => Promise<T>): Promise<void> => {
    try { await fn() } catch { /* onError handles toast */ }
  }

  const inv      = (key: readonly unknown[]) => qc.invalidateQueries({ queryKey: key })
  const invStats = () => inv(QUERY_KEYS.stats(tripId))

  // ── Queries ──
  const tripQ           = useQuery({ queryKey: QUERY_KEYS.trip(tripId),           queryFn: () => getTrip(tripId),           enabled: !!tripId })
  const activitiesQ     = useQuery({ queryKey: QUERY_KEYS.activities(tripId),     queryFn: () => getActivities(tripId),     enabled: !!tripId })
  const flightsQ        = useQuery({ queryKey: QUERY_KEYS.flights(tripId),        queryFn: () => getFlights(tripId),        enabled: !!tripId })
  const accommodationsQ = useQuery({ queryKey: QUERY_KEYS.accommodations(tripId), queryFn: () => getAccommodations(tripId), enabled: !!tripId })
  const transportsQ     = useQuery({ queryKey: QUERY_KEYS.transports(tripId),     queryFn: () => getTransports(tripId),     enabled: !!tripId })
  const extrasQ         = useQuery({ queryKey: QUERY_KEYS.extras(tripId),         queryFn: () => getExtras(tripId),         enabled: !!tripId })
  const packingQ        = useQuery({ queryKey: QUERY_KEYS.packingItems(tripId),   queryFn: () => getPackingItems(tripId),   enabled: !!tripId })
  const statsQ          = useQuery({ queryKey: QUERY_KEYS.stats(tripId),          queryFn: () => getTripStats(tripId),      enabled: !!tripId })
  const notesQ          = useQuery({ queryKey: QUERY_KEYS.notes(tripId),          queryFn: () => getNotes(tripId),          enabled: !!tripId })

  const loading = [tripQ, activitiesQ, flightsQ, accommodationsQ, transportsQ, extrasQ, packingQ, statsQ, notesQ]
    .some((q) => q.isLoading)

  // Global in-flight mutation count → saving flag
  const saving = useIsMutating() > 0

  // ── Data ──
  const trip           = tripQ.data           ?? null
  const activities     = activitiesQ.data     ?? []
  const flights        = flightsQ.data        ?? []
  const accommodations = accommodationsQ.data ?? []
  const transports     = transportsQ.data     ?? []
  const extras         = extrasQ.data         ?? []
  const packingItems   = packingQ.data        ?? []
  const stats          = statsQ.data          ?? null
  const notes          = notesQ.data          ?? []

  // ── Derived ──
  const uniqueDates: string[] = trip?.start_date && trip?.end_date ? (() => {
    const dates: string[] = []
    const current = new Date(trip.start_date)
    const end = new Date(trip.end_date)
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
    return dates
  })() : []

  const tripMin = trip?.start_date ? `${trip.start_date}T00:00` : undefined
  const tripMax = trip?.end_date   ? `${trip.end_date}T23:59`   : undefined

  // ── Activity mutations ──
  const addActivityMut = useMutation({
    mutationFn: (d: ActivityCreate) => createActivity(tripId, d),
    onMutate: (d) => {
      const rollback = optimisticAdd<Activity>(qc, QUERY_KEYS.activities(tripId), {
        id: `temp-${Date.now()}`, trip_id: tripId, ...d,
      } as Activity)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to add activity') },
    onSuccess: () => { inv(QUERY_KEYS.activities(tripId)); invStats() },
  })

  const updateActivityMut = useMutation({
    mutationFn: ([id, d]: [string, ActivityCreate]) => apiUpdateActivity(tripId, id, d),
    onMutate: ([id, d]) => {
      const rollback = optimisticUpdate<Activity>(qc, QUERY_KEYS.activities(tripId), id, d as Partial<Activity>)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to update activity') },
    onSuccess: () => inv(QUERY_KEYS.activities(tripId)),
  })

  const deleteActivityMut = useMutation({
    mutationFn: (id: string) => apiDeleteActivity(tripId, id),
    onMutate: (id) => {
      const rollback = optimisticDelete<Activity>(qc, QUERY_KEYS.activities(tripId), id)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to delete activity') },
    onSuccess: () => { inv(QUERY_KEYS.activities(tripId)); invStats() },
  })

  const addActivity    = (d: ActivityCreate)             => mut(() => addActivityMut.mutateAsync(d))
  const updateActivity = (id: string, d: ActivityCreate) => mut(() => updateActivityMut.mutateAsync([id, d]))
  const deleteActivity = (id: string)                    => mut(() => deleteActivityMut.mutateAsync(id))

  // ── Flight mutations ──
  const addFlightMut = useMutation({
    mutationFn: (d: FlightCreate) => createFlight(tripId, d),
    onMutate: (d) => {
      const rollback = optimisticAdd<Flight>(qc, QUERY_KEYS.flights(tripId), {
        id: `temp-${Date.now()}`, trip_id: tripId, ...d,
      } as Flight)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to add flight') },
    onSuccess: () => { inv(QUERY_KEYS.flights(tripId)); invStats() },
  })

  const updateFlightMut = useMutation({
    mutationFn: ([id, d]: [string, FlightCreate]) => apiUpdateFlight(tripId, id, d),
    onMutate: ([id, d]) => {
      const rollback = optimisticUpdate<Flight>(qc, QUERY_KEYS.flights(tripId), id, d as Partial<Flight>)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to update flight') },
    onSuccess: () => { inv(QUERY_KEYS.flights(tripId)); invStats() },
  })

  const deleteFlightMut = useMutation({
    mutationFn: (id: string) => apiDeleteFlight(tripId, id),
    onMutate: (id) => {
      const rollback = optimisticDelete<Flight>(qc, QUERY_KEYS.flights(tripId), id)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to delete flight') },
    onSuccess: () => { inv(QUERY_KEYS.flights(tripId)); invStats() },
  })

  const addFlight    = (d: FlightCreate)             => mut(() => addFlightMut.mutateAsync(d))
  const updateFlight = (id: string, d: FlightCreate) => mut(() => updateFlightMut.mutateAsync([id, d]))
  const deleteFlight = (id: string)                  => mut(() => deleteFlightMut.mutateAsync(id))

  // ── Accommodation mutations ──
  const addAccommodationMut = useMutation({
    mutationFn: (d: AccommodationCreate) => createAccommodation(tripId, d),
    onMutate: (d) => {
      const rollback = optimisticAdd<Accommodation>(qc, QUERY_KEYS.accommodations(tripId), {
        id: `temp-${Date.now()}`, trip_id: tripId, ...d,
      } as Accommodation)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to add accommodation') },
    onSuccess: () => { inv(QUERY_KEYS.accommodations(tripId)); invStats() },
  })

  const updateAccommodationMut = useMutation({
    mutationFn: ([id, d]: [string, AccommodationCreate]) => apiUpdateAccommodation(tripId, id, d),
    onMutate: ([id, d]) => {
      const rollback = optimisticUpdate<Accommodation>(qc, QUERY_KEYS.accommodations(tripId), id, d as Partial<Accommodation>)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to update accommodation') },
    onSuccess: () => { inv(QUERY_KEYS.accommodations(tripId)); invStats() },
  })

  const deleteAccommodationMut = useMutation({
    mutationFn: (id: string) => apiDeleteAccommodation(tripId, id),
    onMutate: (id) => {
      const rollback = optimisticDelete<Accommodation>(qc, QUERY_KEYS.accommodations(tripId), id)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to delete accommodation') },
    onSuccess: () => { inv(QUERY_KEYS.accommodations(tripId)); invStats() },
  })

  const addAccommodation    = (d: AccommodationCreate)             => mut(() => addAccommodationMut.mutateAsync(d))
  const updateAccommodation = (id: string, d: AccommodationCreate) => mut(() => updateAccommodationMut.mutateAsync([id, d]))
  const deleteAccommodation = (id: string)                         => mut(() => deleteAccommodationMut.mutateAsync(id))

  // ── Transport mutations ──
  const addTransportMut = useMutation({
    mutationFn: (d: TransportCreate) => createTransport(tripId, d),
    onMutate: (d) => {
      const rollback = optimisticAdd<Transport>(qc, QUERY_KEYS.transports(tripId), {
        id: `temp-${Date.now()}`, trip_id: tripId, ...d,
      } as Transport)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to add transport') },
    onSuccess: () => { inv(QUERY_KEYS.transports(tripId)); invStats() },
  })

  const updateTransportMut = useMutation({
    mutationFn: ([id, d]: [string, TransportCreate]) => apiUpdateTransport(tripId, id, d),
    onMutate: ([id, d]) => {
      const rollback = optimisticUpdate<Transport>(qc, QUERY_KEYS.transports(tripId), id, d as Partial<Transport>)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to update transport') },
    onSuccess: () => { inv(QUERY_KEYS.transports(tripId)); invStats() },
  })

  const deleteTransportMut = useMutation({
    mutationFn: (id: string) => apiDeleteTransport(tripId, id),
    onMutate: (id) => {
      const rollback = optimisticDelete<Transport>(qc, QUERY_KEYS.transports(tripId), id)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to delete transport') },
    onSuccess: () => { inv(QUERY_KEYS.transports(tripId)); invStats() },
  })

  const addTransport    = (d: TransportCreate)             => mut(() => addTransportMut.mutateAsync(d))
  const updateTransport = (id: string, d: TransportCreate) => mut(() => updateTransportMut.mutateAsync([id, d]))
  const deleteTransport = (id: string)                     => mut(() => deleteTransportMut.mutateAsync(id))

  // ── Extra mutations ──
  const addExtraMut = useMutation({
    mutationFn: (d: ExtraCreate) => createExtra(tripId, d),
    onMutate: (d) => {
      const rollback = optimisticAdd<Extra>(qc, QUERY_KEYS.extras(tripId), {
        id: `temp-${Date.now()}`, trip_id: tripId, ...d,
      } as Extra)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to add extra') },
    onSuccess: () => { inv(QUERY_KEYS.extras(tripId)); invStats() },
  })

  const updateExtraMut = useMutation({
    mutationFn: ([id, d]: [string, ExtraUpdate]) => apiUpdateExtra(tripId, id, d),
    onMutate: ([id, d]) => {
      const rollback = optimisticUpdate<Extra>(qc, QUERY_KEYS.extras(tripId), id, d as Partial<Extra>)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to update extra') },
    onSuccess: () => { inv(QUERY_KEYS.extras(tripId)); invStats() },
  })

  const deleteExtraMut = useMutation({
    mutationFn: (id: string) => apiDeleteExtra(tripId, id),
    onMutate: (id) => {
      const rollback = optimisticDelete<Extra>(qc, QUERY_KEYS.extras(tripId), id)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to delete extra') },
    onSuccess: () => { inv(QUERY_KEYS.extras(tripId)); invStats() },
  })

  const addExtra    = (d: ExtraCreate)             => mut(() => addExtraMut.mutateAsync(d))
  const updateExtra = (id: string, d: ExtraUpdate) => mut(() => updateExtraMut.mutateAsync([id, d]))
  const deleteExtra = (id: string)                 => mut(() => deleteExtraMut.mutateAsync(id))

  // ── Packing mutations ──
  const addPackingMut = useMutation({
    mutationFn: (d: PackingItemCreate) => createPackingItem(tripId, d),
    onMutate: (d) => {
      const rollback = optimisticAdd<PackingItem>(qc, QUERY_KEYS.packingItems(tripId), {
        id: `temp-${Date.now()}`, trip_id: tripId, checked: false, ...d,
      } as PackingItem)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to add packing item') },
    onSuccess: () => inv(QUERY_KEYS.packingItems(tripId)),
  })

  const deletePackingMut = useMutation({
    mutationFn: (id: string) => apiDeletePackingItem(tripId, id),
    onMutate: (id) => {
      const rollback = optimisticDelete<PackingItem>(qc, QUERY_KEYS.packingItems(tripId), id)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to delete packing item') },
    onSuccess: () => inv(QUERY_KEYS.packingItems(tripId)),
  })

  const togglePackingMut = useMutation({
    mutationFn: (id: string) => togglePackingItem(tripId, id),
    onMutate: (id) => {
      const key = QUERY_KEYS.packingItems(tripId)
      qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<PackingItem[]>(key)
      qc.setQueryData<PackingItem[]>(key, (old) =>
        (old ?? []).map((item) => item.id === id ? { ...item, checked: !item.checked } : item),
      )
      return { rollback: () => qc.setQueryData(key, prev) }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to update packing item') },
    onSuccess: () => inv(QUERY_KEYS.packingItems(tripId)),
  })

  const addPackingItem    = (d: PackingItemCreate) => mut(() => addPackingMut.mutateAsync(d))
  const deletePackingItem = (id: string)           => mut(() => deletePackingMut.mutateAsync(id))
  const togglePacking     = (id: string)           => mut(() => togglePackingMut.mutateAsync(id))

  // ── Note mutations ──
  const addNoteMut = useMutation({
    mutationFn: (d: NoteCreate) => createNote(tripId, d),
    onMutate: (d) => {
      const rollback = optimisticAdd<Note>(qc, QUERY_KEYS.notes(tripId), {
        id: `temp-${Date.now()}`, trip_id: tripId, created_at: new Date().toISOString(), ...d,
      } as Note)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to add note') },
    onSuccess: () => inv(QUERY_KEYS.notes(tripId)),
  })

  const updateNoteMut = useMutation({
    mutationFn: ([id, d]: [string, NoteCreate]) => apiUpdateNote(tripId, id, d),
    onMutate: ([id, d]) => {
      const rollback = optimisticUpdate<Note>(qc, QUERY_KEYS.notes(tripId), id, d as Partial<Note>)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to update note') },
    onSuccess: () => inv(QUERY_KEYS.notes(tripId)),
  })

  const deleteNoteMut = useMutation({
    mutationFn: (id: string) => apiDeleteNote(tripId, id),
    onMutate: (id) => {
      const rollback = optimisticDelete<Note>(qc, QUERY_KEYS.notes(tripId), id)
      return { rollback }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to delete note') },
    onSuccess: () => inv(QUERY_KEYS.notes(tripId)),
  })

  const addNote    = (d: NoteCreate)             => mut(() => addNoteMut.mutateAsync(d))
  const updateNote = (id: string, d: NoteCreate) => mut(() => updateNoteMut.mutateAsync([id, d]))
  const deleteNote = (id: string)                => mut(() => deleteNoteMut.mutateAsync(id))

  // ── Trip mutations ──
  const updateTripMut = useMutation({
    mutationFn: (d: TripCreate) => apiUpdateTrip(tripId, d),
    onMutate: (d) => {
      const key = QUERY_KEYS.trip(tripId)
      qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Trip>(key)
      qc.setQueryData<Trip>(key, (old) => old ? { ...old, ...d } : old)
      return { rollback: () => qc.setQueryData(key, prev) }
    },
    onError: (_e, _v, ctx) => { ctx?.rollback(); toast.error('Failed to update trip') },
    onSuccess: () => inv(QUERY_KEYS.trip(tripId)),
  })

  const deleteTripMut = useMutation({
    mutationFn: () => apiDeleteTrip(tripId),
    onError: () => toast.error('Failed to delete trip'),
  })

  const updateTrip = (d: TripCreate) => mut(() => updateTripMut.mutateAsync(d))
  // deleteTrip propagates — caller (TripDetailPage) navigates only on success
  const deleteTrip = () => deleteTripMut.mutateAsync()

  return {
    // Data
    trip, activities, flights, accommodations, transports,
    extras, packingItems, stats, notes,
    loading, saving,
    // Derived
    uniqueDates, tripMin, tripMax,
    // Mutations
    addActivity, updateActivity, deleteActivity,
    addFlight, updateFlight, deleteFlight,
    addAccommodation, updateAccommodation, deleteAccommodation,
    addTransport, updateTransport, deleteTransport,
    addExtra, updateExtra, deleteExtra,
    addPackingItem, deletePackingItem, togglePacking,
    addNote, updateNote, deleteNote,
    updateTrip, deleteTrip,
  }
}
