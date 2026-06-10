// frontend/src/pages/TripDetailPage.tsx
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { exportTripToDocx, exportTripToPdf } from '../utils/exportTrip'
import Navbar from '../components/Navbar'
import { useDestinationPhoto } from '../hooks/useDestinationPhoto'
import Modal from '../components/Modal'
import CascadeDeleteConfirmModal from '../components/CascadeDeleteConfirmModal'
import { CascadeDeletionRequired, type CascadeDeletionPreview } from '../api/trips'
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
import { MapTab } from '../components/tabs/MapTab'
import ChatAssistant from '../components/ChatAssistant'

// ── Tab types ─────────────────────────────────────────────────────────────────
type Tab = 'summary' | 'days' | 'activities' | 'map' | 'flights' | 'accommodations' | 'transports' | 'extras' | 'packing' | 'stats' | 'notes'
const TABS: { id: Tab; label: string }[] = [
  { id: 'summary',        label: 'Overview'       },
  { id: 'days',           label: 'Days'           },
  { id: 'activities',     label: 'Activities'     },
  { id: 'map',            label: 'Map'            },
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
  const [cascadeState, setCascadeState] = useState<{
    preview: CascadeDeletionPreview; total: number; pendingData: TripCreate
  } | null>(null)
  const [cascadeBusy, setCascadeBusy] = useState(false)

  const handleUpdateTrip = async (data: TripCreate) => {
    try {
      await tripData.updateTrip(data)
      setModal(null)
    } catch (err) {
      if (err instanceof CascadeDeletionRequired) {
        setCascadeState({ preview: err.preview, total: err.total, pendingData: data })
      } else {
        throw err
      }
    }
  }

  const handleCascadeConfirm = async () => {
    if (!cascadeState) return
    setCascadeBusy(true)
    try {
      await tripData.updateTrip(cascadeState.pendingData, true)
      setCascadeState(null)
      setModal(null)
    } finally {
      setCascadeBusy(false)
    }
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
    <div style={{ minHeight: '100vh', background: 'var(--surface-warm)' }}>
      <Navbar />

      {/* Trip header */}
      <div className={`trip-header${hasCover ? '' : ' trip-header--no-cover'}`} style={bgStyle}>
        {hasCover && <div className="trip-header__overlay" />}
        <div className="trip-header__content">
          <div className="trip-header__breadcrumb">
            <Link to="/">My Trips</Link>
            <span aria-hidden="true">›</span>
            <span style={{ color: 'var(--surface-white)' }}>{trip?.title ?? '...'}</span>
          </div>
          {loading ? (
            <div style={{ height: 48, width: 280, background: 'rgba(255,255,255,0.18)', borderRadius: 8 }} />
          ) : (
            <div>
              <h1 className="trip-header__title">{trip?.title}</h1>
              {trip?.destination && (
                <p className="trip-header__meta">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M7 13s-5-4.5-5-8a5 5 0 0 1 10 0c0 3.5-5 8-5 8Z" stroke="currentColor" strokeWidth="1.4"/>
                      <circle cx="7" cy="5" r="1.6" stroke="currentColor" strokeWidth="1.4"/>
                    </svg>
                    {trip.destination}
                  </span>
                </p>
              )}
              {(trip?.start_date || trip?.end_date) && (
                <p className="trip-header__dates">
                  {fmtLong(trip?.start_date)}{trip?.end_date ? ` → ${fmtLong(trip?.end_date)}` : ''}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Material action cluster — floats over photo bottom-right */}
        {!loading && trip && (
          <div className="trip-header__actions" role="toolbar" aria-label="Trip actions">
            <button
              onClick={() => exportTripToDocx({ trip, flights, accommodations, transports, activities, notes, stats, extras, packingItems })}
              className="trip-header__action-btn"
              title="Export as Word document"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 1h6l2 2v10H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M5 6h4M5 8.5h4M5 11h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              DOCX
            </button>
            <button
              onClick={() => exportTripToPdf({ trip, flights, accommodations, transports, activities, notes, stats, extras, packingItems })}
              className="trip-header__action-btn"
              title="Export as PDF"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 1h6l2 2v10H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M4.5 9h1.2c.5 0 .8-.3.8-.8s-.3-.8-.8-.8H4.5V11M8 7.5v3.5h.8c.7 0 1.2-.7 1.2-1.7s-.5-1.8-1.2-1.8H8Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              PDF
            </button>
            <button onClick={() => setModal('edit-trip')} className="trip-header__action-btn" title="Edit trip">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M9.5 1.5l3 3-8 8H1.5v-3l8-8Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Edit
            </button>
            <button onClick={() => setModal('confirm-delete')} className="trip-header__action-btn trip-header__action-btn--danger" title="Delete trip">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 3.5h10M5.5 3.5V2h3v1.5M11 3.5l-.7 9.5H3.7L3 3.5M6 6.5v4M8 6.5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Delete
            </button>
          </div>
        )}
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
      <main className={tab === 'map' ? '' : 'container'} style={tab === 'map' ? { padding: '24px 32px 48px' } : { paddingTop: 32, paddingBottom: 64 }}>
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
        {tab === 'map' && (
          <MapTab
            activities={activities}
            accommodations={accommodations}
            onEditActivity={(a) => { setEditActivity(a); setModal('edit-activity') }}
            onEditAccommodation={(a) => { setEditAccommodation(a); setModal('edit-accommodation') }}
          />
        )}
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

      {/* ── CHAT ASSISTANT ── */}
      <ChatAssistant tripId={tripId} />

      {/* ── CONFIRM DELETE ── */}
      {modal === 'confirm-delete' && (
        <Modal title="Delete Trip" onClose={closeModal} size="sm">
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, background: 'var(--destructive-wash)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="var(--destructive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontWeight: 600, color: 'var(--charcoal)', marginBottom: 8, fontSize: '1.0625rem', letterSpacing: '-0.012em' }}>Delete this trip?</p>
            <p style={{ fontSize: '0.9375rem', color: 'var(--fog)', marginBottom: 28, lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--charcoal)' }}>{trip?.title}</strong> and all associated data will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={closeModal}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={handleDeleteTrip} disabled={saving}>Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {cascadeState && (
        <CascadeDeleteConfirmModal
          preview={cascadeState.preview}
          total={cascadeState.total}
          busy={cascadeBusy}
          onCancel={() => setCascadeState(null)}
          onConfirm={handleCascadeConfirm}
        />
      )}
    </div>
  )
}
