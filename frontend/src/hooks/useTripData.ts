// frontend/src/hooks/useTripData.ts
import { useState, useEffect } from 'react'
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

export function useTripData(tripId: string) {
  // ── Data state ──
  const [trip, setTrip]                     = useState<Trip | null>(null)
  const [activities, setActivities]         = useState<Activity[]>([])
  const [flights, setFlights]               = useState<Flight[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [transports, setTransports]         = useState<Transport[]>([])
  const [extras, setExtras]                 = useState<Extra[]>([])
  const [packingItems, setPackingItems]     = useState<PackingItem[]>([])
  const [stats, setStats]                   = useState<TripStats | null>(null)
  const [notes, setNotes]                   = useState<Note[]>([])
  const [loading, setLoading]               = useState(true)
  const [saving, setSaving]                 = useState(false)

  // ── Initial load ──
  useEffect(() => {
    Promise.all([
      getTrip(tripId), getActivities(tripId), getFlights(tripId),
      getAccommodations(tripId), getTransports(tripId),
      getExtras(tripId), getPackingItems(tripId), getTripStats(tripId),
      getNotes(tripId),
    ]).then(([t, act, f, a, tr, e, p, s, n]) => {
      setTrip(t); setActivities(act); setFlights(f)
      setAccommodations(a); setTransports(tr); setExtras(e)
      setPackingItems(p); setStats(s); setNotes(n)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [tripId])

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
  const tripMax = trip?.end_date ? `${trip.end_date}T23:59` : undefined

  // ── Saving wrapper ──
  const withSaving = async (fn: () => Promise<void>) => {
    setSaving(true)
    try { await fn() } finally { setSaving(false) }
  }

  // ── Activity mutations ──
  const addActivity = (data: ActivityCreate) => withSaving(async () => {
    const r = await createActivity(tripId, data)
    setActivities((p) => [...p, r])
  })
  const updateActivity = (id: string, data: ActivityCreate) => withSaving(async () => {
    const r = await apiUpdateActivity(tripId, id, data)
    setActivities((p) => p.map((a) => a.id === id ? r : a))
  })
  const deleteActivity = async (id: string) => {
    await apiDeleteActivity(tripId, id)
    setActivities((p) => p.filter((a) => a.id !== id))
  }

  // ── Flight mutations ──
  const addFlight = (data: FlightCreate) => withSaving(async () => {
    const r = await createFlight(tripId, data)
    setFlights((p) => [...p, r])
  })
  const updateFlight = (id: string, data: FlightCreate) => withSaving(async () => {
    const r = await apiUpdateFlight(tripId, id, data)
    setFlights((p) => p.map((f) => f.id === id ? r : f))
  })
  const deleteFlight = async (id: string) => {
    await apiDeleteFlight(tripId, id)
    setFlights((p) => p.filter((f) => f.id !== id))
  }

  // ── Accommodation mutations ──
  const addAccommodation = (data: AccommodationCreate) => withSaving(async () => {
    const r = await createAccommodation(tripId, data)
    setAccommodations((p) => [...p, r])
  })
  const updateAccommodation = (id: string, data: AccommodationCreate) => withSaving(async () => {
    const r = await apiUpdateAccommodation(tripId, id, data)
    setAccommodations((p) => p.map((a) => a.id === id ? r : a))
  })
  const deleteAccommodation = async (id: string) => {
    await apiDeleteAccommodation(tripId, id)
    setAccommodations((p) => p.filter((a) => a.id !== id))
  }

  // ── Transport mutations ──
  const addTransport = (data: TransportCreate) => withSaving(async () => {
    const r = await createTransport(tripId, data)
    setTransports((p) => [...p, r])
  })
  const updateTransport = (id: string, data: TransportCreate) => withSaving(async () => {
    const r = await apiUpdateTransport(tripId, id, data)
    setTransports((p) => p.map((t) => t.id === id ? r : t))
  })
  const deleteTransport = async (id: string) => {
    await apiDeleteTransport(tripId, id)
    setTransports((p) => p.filter((t) => t.id !== id))
  }

  // ── Extra mutations ──
  const addExtra = (data: ExtraCreate) => withSaving(async () => {
    const r = await createExtra(tripId, data)
    setExtras((p) => [...p, r])
  })
  const updateExtra = (id: string, data: ExtraUpdate) => withSaving(async () => {
    const r = await apiUpdateExtra(tripId, id, data)
    setExtras((p) => p.map((e) => e.id === id ? r : e))
  })
  const deleteExtra = async (id: string) => {
    await apiDeleteExtra(tripId, id)
    setExtras((p) => p.filter((e) => e.id !== id))
  }

  // ── Packing mutations ──
  const addPackingItem = (data: PackingItemCreate) => withSaving(async () => {
    const r = await createPackingItem(tripId, data)
    setPackingItems((p) => [...p, r])
  })
  const deletePackingItem = async (id: string) => {
    await apiDeletePackingItem(tripId, id)
    setPackingItems((p) => p.filter((i) => i.id !== id))
  }
  const togglePacking = async (id: string) => {
    const updated = await togglePackingItem(tripId, id)
    setPackingItems((p) => p.map((i) => i.id === id ? updated : i))
  }

  // ── Note mutations ──
  const addNote = (data: NoteCreate) => withSaving(async () => {
    const r = await createNote(tripId, data)
    setNotes((p) => [r, ...p])
  })
  const updateNote = (id: string, data: NoteCreate) => withSaving(async () => {
    const r = await apiUpdateNote(tripId, id, data)
    setNotes((p) => p.map((n) => n.id === id ? r : n))
  })
  const deleteNote = async (id: string) => {
    await apiDeleteNote(tripId, id)
    setNotes((p) => p.filter((n) => n.id !== id))
  }

  // ── Trip mutations ──
  const updateTrip = (data: TripCreate) => withSaving(async () => {
    const r = await apiUpdateTrip(tripId, data)
    setTrip(r)
  })
  const deleteTrip = () => apiDeleteTrip(tripId)

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
