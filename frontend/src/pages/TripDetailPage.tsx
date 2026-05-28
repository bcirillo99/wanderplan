// frontend/src/pages/TripDetailPage.tsx
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { exportTripToDocx, exportTripToPdf } from '../utils/exportTrip'
import Navbar from '../components/Navbar'
import { useDestinationPhoto } from '../hooks/useDestinationPhoto'
import Modal from '../components/Modal'
import { useTripData } from '../hooks/useTripData'
import type {
  Activity, Flight, Accommodation, Transport, Extra, Note,
  ActivityCreate, FlightCreate, AccommodationCreate, TransportCreate, ExtraCreate, ExtraUpdate,
  PackingItemCreate, TripCreate, NoteCreate,
} from '../types'
import {
  ActivityForm, FlightForm, AccommodationForm, TransportForm,
  ExtraForm, PackingForm, TripForm, NoteForm,
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
const TABS: { id: Tab; label: string }[] = [
  { id: 'summary',        label: 'Overview'       },
  { id: 'days',           label: 'Days'           },
  { id: 'activities',     label: 'Activities'     },
  { id: 'flights',        label: 'Flights'        },
  { id: 'accommodations', label: 'Accommodations' },
  { id: 'transports',     label: 'Transports'     },
  { id: 'extras',         label: 'Extras'         },
  { id: 'packing',        label: 'Packing'        },
  { id: 'stats',          label: 'Budget'         },
  { id: 'notes',          label: 'Notes'          },
]

type ModalType =
  | 'add-activity' | 'add-flight' | 'add-accommodation' | 'add-transport' | 'add-extra' | 'add-packing' | 'add-note'
  | 'edit-activity' | 'edit-flight' | 'edit-accommodation' | 'edit-transport' | 'edit-extra' | 'edit-note'
  | 'edit-trip' | 'confirm-delete'
  | null

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()

  // ── UI state ──
  const [tab, setTab]     = useState<Tab>('summary')
  const [modal, setModal] = useState<ModalType>(null)

  // ── Edit targets (UI state) ──
  const [editActivity,      setEditActivity]      = useState<Activity | null>(null)
  const [editFlight,        setEditFlight]        = useState<Flight | null>(null)
  const [editAccommodation, setEditAccommodation] = useState<Accommodation | null>(null)
  const [editTransport,     setEditTransport]     = useState<Transport | null>(null)
  const [editExtra,         setEditExtra]         = useState<Extra | null>(null)
  const [editNote,          setEditNote]          = useState<Note | null>(null)

  const tripData = useTripData(tripId ?? '')
  const {
    trip, activities, flights, accommodations, transports,
    extras, packingItems, stats, notes,
    loading, saving,
    uniqueDates, tripMin, tripMax,
  } = tripData

  if (!tripId) return null

  // ── Handlers: add ──
  const handleAddActivity = async (data: ActivityCreate) => {
    await tripData.addActivity(data); setModal(null)
  }
  const handleAddFlight = async (data: FlightCreate) => {
    await tripData.addFlight(data); setModal(null)
  }
  const handleAddAccommodation = async (data: AccommodationCreate) => {
    await tripData.addAccommodation(data); setModal(null)
  }
  const handleAddTransport = async (data: TransportCreate) => {
    await tripData.addTransport(data); setModal(null)
  }
  const handleAddExtra = async (data: ExtraCreate) => {
    await tripData.addExtra(data); setModal(null)
  }
  const handleAddPacking = async (data: PackingItemCreate) => {
    await tripData.addPackingItem(data); setModal(null)
  }
  const handleAddNote = async (data: NoteCreate) => {
    await tripData.addNote(data); setModal(null)
  }

  // ── Handlers: edit ──
  const handleEditActivity = async (data: ActivityCreate) => {
    if (!editActivity) return
    await tripData.updateActivity(editActivity.id, data)
    setModal(null); setEditActivity(null)
  }
  const handleEditFlight = async (data: FlightCreate) => {
    if (!editFlight) return
    await tripData.updateFlight(editFlight.id, data)
    setModal(null); setEditFlight(null)
  }
  const handleEditAccommodation = async (data: AccommodationCreate) => {
    if (!editAccommodation) return
    await tripData.updateAccommodation(editAccommodation.id, data)
    setModal(null); setEditAccommodation(null)
  }
  const handleEditTransport = async (data: TransportCreate) => {
    if (!editTransport) return
    await tripData.updateTransport(editTransport.id, data)
    setModal(null); setEditTransport(null)
  }
  const handleEditExtra = async (data: ExtraUpdate) => {
    if (!editExtra) return
    await tripData.updateExtra(editExtra.id, data)
    setModal(null); setEditExtra(null)
  }
  const handleEditNote = async (data: NoteCreate) => {
    if (!editNote) return
    await tripData.updateNote(editNote.id, data)
    setModal(null); setEditNote(null)
  }
  const handleUpdateTrip = async (data: TripCreate) => {
    await tripData.updateTrip(data); setModal(null)
  }
  const handleDeleteTrip = async () => {
    await tripData.deleteTrip(); navigate('/')
  }

  const closeModal = () => {
    setModal(null)
    setEditActivity(null); setEditFlight(null)
    setEditAccommodation(null); setEditTransport(null); setEditExtra(null); setEditNote(null)
  }

  // ── Header helpers ──
  const fmtLong = (d?: string | null) => d
    ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const autoPhoto = useDestinationPhoto(trip?.cover_image ? null : trip?.destination)
  const coverUrl  = trip?.cover_image ?? autoPhoto
  const hasCover  = Boolean(coverUrl)
  const bgStyle   = hasCover
    ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}

  // ── Render ──
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)' }}>
      <Navbar />

      {/* Trip header */}
      <div className={`trip-header${hasCover ? '' : ' trip-header--no-cover'}`} style={bgStyle}>
        {hasCover && <div className="trip-header__overlay" />}
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
                <button
                  onClick={() => trip && exportTripToDocx({ trip, flights, accommodations, transports, activities, notes, stats, extras, packingItems })}
                  className="trip-header__action-btn"
                  disabled={!trip}
                  title="Export as Word document"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v7M3 5.5L6 8.5l3-3M1.5 9.5v1h9v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  DOCX
                </button>
                <button
                  onClick={() => trip && exportTripToPdf({ trip, flights, accommodations, transports, activities, notes, stats, extras, packingItems })}
                  className="trip-header__action-btn"
                  disabled={!trip}
                  title="Export as PDF"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v7M3 5.5L6 8.5l3-3M1.5 9.5v1h9v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  PDF
                </button>
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
          <div className="tabs-bar__identity">
            <Link to="/" className="tabs-bar__back-link" aria-label="Back to My Trips">
              ← My trips
            </Link>
          </div>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${tab === t.id ? 'tab-btn--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {tab === 'summary' && (
          <SummaryTab
            trip={trip} tripId={tripId}
            activities={activities} flights={flights}
            accommodations={accommodations} transports={transports}
            stats={stats} dates={uniqueDates}
            onEditTrip={() => setModal('edit-trip')}
            onDeleteTrip={() => setModal('confirm-delete')}
            notes={notes}
            onAddNote={() => setModal('add-note')}
            onEditNote={(n) => { setEditNote(n); setModal('edit-note') }}
            onDeleteNote={tripData.deleteNote}
          />
        )}
        {tab === 'days' && <DaysTab tripId={tripId} dates={uniqueDates} activities={activities} flights={flights} transports={transports} accommodations={accommodations} />}
        {tab === 'activities' && (
          <ActivitiesTab
            activities={activities}
            onAdd={() => setModal('add-activity')}
            onEdit={(a) => { setEditActivity(a); setModal('edit-activity') }}
            onDelete={tripData.deleteActivity}
          />
        )}
        {tab === 'flights' && (
          <FlightsTab
            flights={flights}
            onAdd={() => setModal('add-flight')}
            onEdit={(f) => { setEditFlight(f); setModal('edit-flight') }}
            onDelete={tripData.deleteFlight}
          />
        )}
        {tab === 'accommodations' && (
          <AccommodationsTab
            accommodations={accommodations}
            onAdd={() => setModal('add-accommodation')}
            onEdit={(a) => { setEditAccommodation(a); setModal('edit-accommodation') }}
            onDelete={tripData.deleteAccommodation}
          />
        )}
        {tab === 'transports' && (
          <TransportsTab
            transports={transports}
            onAdd={() => setModal('add-transport')}
            onEdit={(t) => { setEditTransport(t); setModal('edit-transport') }}
            onDelete={tripData.deleteTransport}
          />
        )}
        {tab === 'extras' && (
          <ExtrasTab
            extras={extras}
            onAdd={() => setModal('add-extra')}
            onEdit={(e) => { setEditExtra(e); setModal('edit-extra') }}
            onDelete={tripData.deleteExtra}
          />
        )}
        {tab === 'packing' && (
          <PackingTab
            items={packingItems}
            onAdd={() => setModal('add-packing')}
            onDelete={tripData.deletePackingItem}
            onToggle={tripData.togglePacking}
          />
        )}
        {tab === 'stats' && <StatsTab stats={stats} />}
        {tab === 'notes' && (
          <NotesTab
            notes={notes}
            onAdd={() => setModal('add-note')}
            onEdit={(n) => { setEditNote(n); setModal('edit-note') }}
            onDelete={tripData.deleteNote}
          />
        )}
      </main>

      {/* ── ADD MODALS ── */}
      {modal === 'add-activity' && (
        <Modal title="Add Activity" onClose={closeModal} size="lg">
          <ActivityForm loading={saving} onSubmit={handleAddActivity} showDayPicker tripStartDate={trip?.start_date} tripEndDate={trip?.end_date} />
        </Modal>
      )}
      {modal === 'add-flight' && (
        <Modal title="Add Flight" onClose={closeModal} size="lg">
          <FlightForm loading={saving} onSubmit={handleAddFlight} minDateTime={tripMin} maxDateTime={tripMax} />
        </Modal>
      )}
      {modal === 'add-accommodation' && (
        <Modal title="Add Accommodation" onClose={closeModal} size="lg">
          <AccommodationForm loading={saving} onSubmit={handleAddAccommodation} minDate={trip?.start_date ?? undefined} maxDate={trip?.end_date ?? undefined} />
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
          <ActivityForm initial={editActivity} loading={saving} onSubmit={handleEditActivity} showDayPicker tripStartDate={trip?.start_date} tripEndDate={trip?.end_date} />
        </Modal>
      )}
      {modal === 'edit-flight' && editFlight && (
        <Modal title="Edit Flight" onClose={closeModal} size="lg">
          <FlightForm initial={editFlight} loading={saving} onSubmit={handleEditFlight} minDateTime={tripMin} maxDateTime={tripMax} />
        </Modal>
      )}
      {modal === 'edit-accommodation' && editAccommodation && (
        <Modal title="Edit Accommodation" onClose={closeModal} size="lg">
          <AccommodationForm initial={editAccommodation} loading={saving} onSubmit={handleEditAccommodation} minDate={trip?.start_date ?? undefined} maxDate={trip?.end_date ?? undefined} />
        </Modal>
      )}
      {modal === 'edit-transport' && editTransport && (
        <Modal title="Edit Transport" onClose={closeModal} size="lg">
          <TransportForm initial={editTransport} loading={saving} onSubmit={handleEditTransport} minDateTime={tripMin} maxDateTime={tripMax} />
        </Modal>
      )}
      {modal === 'edit-extra' && editExtra && (
        <Modal title="Edit Extra" onClose={closeModal}>
          <ExtraForm initial={editExtra} loading={saving} onSubmit={handleEditExtra} />
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

      {/* ── CONFIRM DELETE ── */}
      {modal === 'confirm-delete' && (
        <Modal title="Delete Trip" onClose={closeModal} size="sm">
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#9b2020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontWeight: 600, color: 'var(--charcoal)', marginBottom: 6 }}>Delete this trip?</p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 24 }}>
              <strong>{trip?.title}</strong> and all associated data will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={closeModal}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={handleDeleteTrip} disabled={saving}>Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
