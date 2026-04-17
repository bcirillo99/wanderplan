// frontend/src/pages/TripDetailPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import { getTrip, updateTrip, deleteTrip } from '../api/trips'
import { getFlights, createFlight, updateFlight, deleteFlight } from '../api/flights'
import { getAccommodations, createAccommodation, updateAccommodation, deleteAccommodation } from '../api/accommodations'
import { getTransports, createTransport, updateTransport, deleteTransport } from '../api/transports'
import { getExtras, createExtra, deleteExtra } from '../api/extras'
import { getPackingItems, createPackingItem, deletePackingItem, togglePackingItem } from '../api/packing_items'
import { getTripStats } from '../api/stats'
import { getActivities, createActivity, updateActivity, deleteActivity } from '../api/activities'
import { getNotes, createNote, updateNote, deleteNote } from '../api/notes'
import type {
  Trip, Activity, Flight, Accommodation, Transport, Extra, PackingItem, TripStats, Note,
  ActivityCreate, FlightCreate, AccommodationCreate, TransportCreate, ExtraCreate, PackingItemCreate,
  TripCreate, NoteCreate,
} from '../types'
import {
  ActivityForm, FlightForm, AccommodationForm, TransportForm, ExtraForm, PackingForm, TripForm, NoteForm,
} from '../components/forms/Forms'
import { SummaryTab } from '../components/tabs/SummaryTab'
import { DaysTab } from '../components/tabs/DaysTab'
import { ActivitiesTab } from '../components/tabs/ActivitiesTab'
import { FlightsTab } from '../components/tabs/FlightsTab'
import { AccommodationsTab } from '../components/tabs/AccommodationsTab'
import { TransportsTab } from '../components/tabs/TransportsTab'
import { ExtrasTab } from '../components/tabs/ExtrasTab'
import { PackingTab } from '../components/tabs/PackingTab'
import { StatsTab } from '../components/tabs/StatsTab'
import { NotesTab } from '../components/tabs/NotesTab'

// ── Tab types ─────────────────────────────────────────────────────────────────
type Tab = 'summary' | 'days' | 'activities' | 'flights' | 'accommodations' | 'transports' | 'extras' | 'packing' | 'stats' | 'notes'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'summary',        label: 'Overview',       icon: '🗺️' },
  { id: 'days',           label: 'Days',           icon: '📅' },
  { id: 'activities',     label: 'Activities',     icon: '🗓️' },
  { id: 'flights',        label: 'Flights',        icon: '✈️' },
  { id: 'accommodations', label: 'Accommodations', icon: '🏨' },
  { id: 'transports',     label: 'Transports',     icon: '🚌' },
  { id: 'extras',         label: 'Extras',         icon: '💰' },
  { id: 'packing',        label: 'Packing',        icon: '🎒' },
  { id: 'stats',          label: 'Budget',         icon: '📊' },
  { id: 'notes',          label: 'Notes',          icon: '📝' },
]

// ── Modal types ───────────────────────────────────────────────────────────────
type ModalType =
  | 'add-activity' | 'add-flight' | 'add-accommodation' | 'add-transport' | 'add-extra' | 'add-packing' | 'add-note'
  | 'edit-activity' | 'edit-flight' | 'edit-accommodation' | 'edit-transport' | 'edit-note'
  | 'edit-trip' | 'confirm-delete'
  | null

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()

  // ── Data state ──
  const [tab, setTab] = useState<Tab>('summary')
  const [trip, setTrip] = useState<Trip | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [extras, setExtras] = useState<Extra[]>([])
  const [packingItems, setPackingItems] = useState<PackingItem[]>([])
  const [stats, setStats] = useState<TripStats | null>(null)
  const [notes, setNotes] = useState<Note[]>([])

  // ── UI state ──
  const [modal, setModal] = useState<ModalType>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── Edit targets ──
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [editFlight, setEditFlight] = useState<Flight | null>(null)
  const [editAccommodation, setEditAccommodation] = useState<Accommodation | null>(null)
  const [editTransport, setEditTransport] = useState<Transport | null>(null)
  const [editNote, setEditNote] = useState<Note | null>(null)

  // ── Initial load ──
  useEffect(() => {
    if (!tripId) return
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

  if (!tripId) return null

  // ── Derived data ──
  const uniqueDates = trip?.start_date && trip?.end_date ? (() => {
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

  // ── Add handlers ──
  const handleAddActivity = async (data: ActivityCreate) => {
    setSaving(true)
    try {
      const r = await createActivity(tripId, data)
      setActivities((p) => [...p, r])
      setModal(null)
    } finally { setSaving(false) }
  }

  const handleAddFlight = async (data: FlightCreate) => {
    setSaving(true)
    try {
      const r = await createFlight(tripId, data)
      setFlights((p) => [...p, r])
      setModal(null)
    } finally { setSaving(false) }
  }

  const handleAddAccommodation = async (data: AccommodationCreate) => {
    setSaving(true)
    try {
      const r = await createAccommodation(tripId, data)
      setAccommodations((p) => [...p, r])
      setModal(null)
    } finally { setSaving(false) }
  }

  const handleAddTransport = async (data: TransportCreate) => {
    setSaving(true)
    try {
      const r = await createTransport(tripId, data)
      setTransports((p) => [...p, r])
      setModal(null)
    } finally { setSaving(false) }
  }

  const handleAddExtra = async (data: ExtraCreate) => {
    setSaving(true)
    try {
      const r = await createExtra(tripId, data)
      setExtras((p) => [...p, r])
      setModal(null)
    } finally { setSaving(false) }
  }

  const handleAddPacking = async (data: PackingItemCreate) => {
    setSaving(true)
    try {
      const r = await createPackingItem(tripId, data)
      setPackingItems((p) => [...p, r])
      setModal(null)
    } finally { setSaving(false) }
  }

  const handleAddNote = async (data: NoteCreate) => {
    setSaving(true)
    try {
      const r = await createNote(tripId, data)
      setNotes((p) => [r, ...p])
      setModal(null)
    } finally { setSaving(false) }
  }

  // ── Edit handlers ──
  const handleEditActivity = async (data: ActivityCreate) => {
    if (!editActivity) return
    setSaving(true)
    try {
      const r = await updateActivity(tripId, editActivity.id, data)
      setActivities((p) => p.map((a) => a.id === editActivity.id ? r : a))
      setModal(null); setEditActivity(null)
    } finally { setSaving(false) }
  }

  const handleEditFlight = async (data: FlightCreate) => {
    if (!editFlight) return
    setSaving(true)
    try {
      const r = await updateFlight(tripId, editFlight.id, data)
      setFlights((p) => p.map((f) => f.id === editFlight.id ? r : f))
      setModal(null); setEditFlight(null)
    } finally { setSaving(false) }
  }

  const handleEditAccommodation = async (data: AccommodationCreate) => {
    if (!editAccommodation) return
    setSaving(true)
    try {
      const r = await updateAccommodation(tripId, editAccommodation.id, data)
      setAccommodations((p) => p.map((a) => a.id === editAccommodation.id ? r : a))
      setModal(null); setEditAccommodation(null)
    } finally { setSaving(false) }
  }

  const handleEditTransport = async (data: TransportCreate) => {
    if (!editTransport) return
    setSaving(true)
    try {
      const r = await updateTransport(tripId, editTransport.id, data)
      setTransports((p) => p.map((t) => t.id === editTransport.id ? r : t))
      setModal(null); setEditTransport(null)
    } finally { setSaving(false) }
  }

  const handleEditNote = async (data: NoteCreate) => {
    if (!editNote) return
    setSaving(true)
    try {
      const r = await updateNote(tripId, editNote.id, data)
      setNotes((p) => p.map((n) => n.id === editNote.id ? r : n))
      setModal(null); setEditNote(null)
    } finally { setSaving(false) }
  }

  // ── Delete handlers ──
  const handleDeleteActivity = async (id: string) => {
    await deleteActivity(tripId, id)
    setActivities((p) => p.filter((a) => a.id !== id))
  }

  const handleDeleteFlight = async (id: string) => {
    await deleteFlight(tripId, id)
    setFlights((p) => p.filter((f) => f.id !== id))
  }

  const handleDeleteAccommodation = async (id: string) => {
    await deleteAccommodation(tripId, id)
    setAccommodations((p) => p.filter((a) => a.id !== id))
  }

  const handleDeleteTransport = async (id: string) => {
    await deleteTransport(tripId, id)
    setTransports((p) => p.filter((t) => t.id !== id))
  }

  const handleDeleteExtra = async (id: string) => {
    await deleteExtra(tripId, id)
    setExtras((p) => p.filter((e) => e.id !== id))
  }

  const handleDeletePacking = async (id: string) => {
    await deletePackingItem(tripId, id)
    setPackingItems((p) => p.filter((i) => i.id !== id))
  }

  const handleTogglePacking = async (id: string) => {
    const updated = await togglePackingItem(tripId, id)
    setPackingItems((p) => p.map((i) => i.id === id ? updated : i))
  }

  const handleDeleteNote = async (id: string) => {
    await deleteNote(tripId, id)
    setNotes((p) => p.filter((n) => n.id !== id))
  }

  // ── Trip-level handlers ──
  const handleUpdateTrip = async (data: TripCreate) => {
    setSaving(true)
    try {
      const r = await updateTrip(tripId, data)
      setTrip(r); setModal(null)
    } finally { setSaving(false) }
  }

  const handleDeleteTrip = async () => {
    await deleteTrip(tripId)
    navigate('/')
  }

  // ── Header helpers ──
  const fmtLong = (d?: string | null) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const bgStyle = trip?.cover_image
    ? { backgroundImage: `url(${trip.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, var(--forest) 0%, var(--forest-light) 100%)' }

  const closeModal = () => {
    setModal(null)
    setEditActivity(null); setEditFlight(null)
    setEditAccommodation(null); setEditTransport(null)
    setEditNote(null)
  }

  // ── Render ──
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)' }}>
      <Navbar />

      {/* Trip header */}
      <div className="trip-header" style={bgStyle}>
        <div className="trip-header__overlay" />
        <div className="trip-header__content">
          <div className="trip-header__breadcrumb">
            <Link to="/">My Trips</Link>
            <span>/</span>
            <span style={{ color: '#fff' }}>{trip?.title ?? '...'}</span>
          </div>
          {loading ? (
            <div style={{ height: 32, width: 200, background: 'rgba(255,255,255,0.2)', borderRadius: 8 }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h1 className="trip-header__title">{trip?.title}</h1>
                {trip?.destination && <p className="trip-header__meta">{trip.destination}</p>}
                {(trip?.start_date || trip?.end_date) && (
                  <p className="trip-header__dates">
                    {fmtLong(trip?.start_date)}{trip?.end_date ? ` → ${fmtLong(trip?.end_date)}` : ''}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, paddingBottom: 4 }}>
                <button onClick={() => setModal('edit-trip')} className="trip-header__action-btn">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8 1.5l2.5 2.5-7 7H1v-2.5l7-7Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit
                </button>
                <button onClick={() => setModal('confirm-delete')} className="trip-header__action-btn trip-header__action-btn--danger">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1.5 3h9M5 3V2h2v1M4.5 9.5l-.5-5M7.5 9.5l.5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        <div className="tabs-bar__inner">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${tab === t.id ? 'tab-btn--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {tab === 'summary' && (
          <SummaryTab
            trip={trip}
            tripId={tripId}
            activities={activities}
            flights={flights}
            accommodations={accommodations}
            transports={transports}
            stats={stats}
            dates={uniqueDates}
            onEditTrip={() => setModal('edit-trip')}
            onDeleteTrip={() => setModal('confirm-delete')}
            notes={notes}
            onAddNote={() => setModal('add-note')}
            onEditNote={(n) => { setEditNote(n); setModal('edit-note') }}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {tab === 'days' && <DaysTab tripId={tripId} dates={uniqueDates} activities={activities} />}

        {tab === 'activities' && (
          <ActivitiesTab
            activities={activities}
            onAdd={() => setModal('add-activity')}
            onEdit={(a) => { setEditActivity(a); setModal('edit-activity') }}
            onDelete={handleDeleteActivity}
          />
        )}

        {tab === 'flights' && (
          <FlightsTab
            flights={flights}
            onAdd={() => setModal('add-flight')}
            onEdit={(f) => { setEditFlight(f); setModal('edit-flight') }}
            onDelete={handleDeleteFlight}
          />
        )}

        {tab === 'accommodations' && (
          <AccommodationsTab
            accommodations={accommodations}
            onAdd={() => setModal('add-accommodation')}
            onEdit={(a) => { setEditAccommodation(a); setModal('edit-accommodation') }}
            onDelete={handleDeleteAccommodation}
          />
        )}

        {tab === 'transports' && (
          <TransportsTab
            transports={transports}
            onAdd={() => setModal('add-transport')}
            onEdit={(t) => { setEditTransport(t); setModal('edit-transport') }}
            onDelete={handleDeleteTransport}
          />
        )}

        {tab === 'extras' && (
          <ExtrasTab
            extras={extras}
            onAdd={() => setModal('add-extra')}
            onDelete={handleDeleteExtra}
          />
        )}

        {tab === 'packing' && (
          <PackingTab
            items={packingItems}
            onAdd={() => setModal('add-packing')}
            onDelete={handleDeletePacking}
            onToggle={handleTogglePacking}
          />
        )}

        {tab === 'stats' && <StatsTab stats={stats} />}

        {tab === 'notes' && (
          <NotesTab
            notes={notes}
            onAdd={() => setModal('add-note')}
            onEdit={(n) => { setEditNote(n); setModal('edit-note') }}
            onDelete={handleDeleteNote}
          />
        )}
      </main>

      {/* ── ADD MODALS ── */}
      {modal === 'add-activity' && (
        <Modal title="Add Activity" onClose={closeModal} size="lg">
          <ActivityForm
            loading={saving}
            onSubmit={handleAddActivity}
            showDayPicker
            tripStartDate={trip?.start_date}
            tripEndDate={trip?.end_date}
          />
        </Modal>
      )}

      {modal === 'add-flight' && (
        <Modal title="Add Flight" onClose={closeModal} size="lg">
          <FlightForm loading={saving} onSubmit={handleAddFlight} minDateTime={tripMin} maxDateTime={tripMax} />
        </Modal>
      )}

      {modal === 'add-accommodation' && (
        <Modal title="Add Accommodation" onClose={closeModal} size="lg">
          <AccommodationForm
            loading={saving}
            onSubmit={handleAddAccommodation}
            minDate={trip?.start_date ?? undefined}
            maxDate={trip?.end_date ?? undefined}
          />
        </Modal>
      )}

      {modal === 'add-transport' && (
        <Modal title="Add Transport" onClose={closeModal} size="lg">
          <TransportForm loading={saving} onSubmit={handleAddTransport} minDateTime={tripMin} maxDateTime={tripMax} />
        </Modal>
      )}

      {modal === 'add-extra' && (
        <Modal title="Add Extra" onClose={closeModal}>
          <ExtraForm loading={saving} onSubmit={handleAddExtra} />
        </Modal>
      )}

      {modal === 'add-packing' && (
        <Modal title="Add Item" onClose={closeModal}>
          <PackingForm loading={saving} onSubmit={handleAddPacking} />
        </Modal>
      )}

      {modal === 'add-note' && (
        <Modal title="Add Note" onClose={closeModal}>
          <NoteForm loading={saving} onSubmit={handleAddNote} />
        </Modal>
      )}

      {/* ── EDIT MODALS ── */}
      {modal === 'edit-activity' && editActivity && (
        <Modal title="Edit Activity" onClose={closeModal} size="lg">
          <ActivityForm
            initial={editActivity}
            loading={saving}
            onSubmit={handleEditActivity}
            showDayPicker
            tripStartDate={trip?.start_date}
            tripEndDate={trip?.end_date}
          />
        </Modal>
      )}

      {modal === 'edit-flight' && editFlight && (
        <Modal title="Edit Flight" onClose={closeModal} size="lg">
          <FlightForm initial={editFlight} loading={saving} onSubmit={handleEditFlight} minDateTime={tripMin} maxDateTime={tripMax} />
        </Modal>
      )}

      {modal === 'edit-accommodation' && editAccommodation && (
        <Modal title="Edit Accommodation" onClose={closeModal} size="lg">
          <AccommodationForm
            initial={editAccommodation}
            loading={saving}
            onSubmit={handleEditAccommodation}
            minDate={trip?.start_date ?? undefined}
            maxDate={trip?.end_date ?? undefined}
          />
        </Modal>
      )}

      {modal === 'edit-transport' && editTransport && (
        <Modal title="Edit Transport" onClose={closeModal} size="lg">
          <TransportForm initial={editTransport} loading={saving} onSubmit={handleEditTransport} minDateTime={tripMin} maxDateTime={tripMax} />
        </Modal>
      )}

      {modal === 'edit-trip' && (
        <Modal title="Edit Trip" onClose={closeModal}>
          <TripForm initial={trip ?? undefined} onSubmit={handleUpdateTrip} loading={saving} />
        </Modal>
      )}

      {modal === 'edit-note' && editNote && (
        <Modal title="Edit Note" onClose={closeModal}>
          <NoteForm initial={editNote} loading={saving} onSubmit={handleEditNote} />
        </Modal>
      )}

      {modal === 'confirm-delete' && (
        <Modal title="Delete Trip" onClose={closeModal} size="sm">
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, background: '#fee2e2', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#9b2020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontWeight: 600, color: 'var(--charcoal)', marginBottom: 6 }}>Delete this trip?</p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 24 }}>
              <strong>{trip?.title}</strong> and all associated data will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={closeModal}>
                Cancel
              </button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={handleDeleteTrip} disabled={saving}>
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
