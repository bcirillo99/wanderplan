// frontend/src/pages/TripDayPage.tsx
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import { getTrip } from '../api/trips'
import { createActivity, updateActivity, deleteActivity, getActivity } from '../api/activities'
import { createFlight, updateFlight, deleteFlight, getFlight } from '../api/flights'
import { createAccommodation, updateAccommodation, deleteAccommodation, getAccommodation } from '../api/accommodations'
import { createTransport, updateTransport, deleteTransport, getTransport } from '../api/transports'
import { getDailySummary } from '../api/daily_summary'
import type {
  Trip, Activity, ActivityCreate, DailySummaryItem,
  Flight, FlightCreate, Accommodation, AccommodationCreate,
  Transport, TransportCreate,
} from '../types'
import {
  ActivityForm, FlightForm, AccommodationForm, TransportForm,
} from '../components/forms/Forms'


function fmtDay(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function getIconForType(type: string): string {
  switch (type) {
    case 'activity': return '🗓️'
    case 'flight': return '✈️'
    case 'transport': return '🚌'
    case 'accommodation': return '🏨'
    default: return '📍'
  }
}

// ── Summary Item Card ─────────────────────────────────────────────────────────
function SummaryItemCard({ item, onClick }: { item: DailySummaryItem; onClick?: () => void }) {
  const icon = getIconForType(item.type)
  return (
    <div
      className="activity-card animate-fade-up"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="activity-card__inner">
        <div className="activity-card__time" style={{ justifyContent: 'center', paddingTop: 4 }}>
          <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        </div>
        <div className="activity-card__body">
          <div className="activity-card__header">
            <h4 className="activity-card__title">{item.label || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`}</h4>
          </div>
          <div className="activity-card__meta">
            {item.time && <span>🕐 {item.time}</span>}
            {item.cost != null && <span className="activity-card__cost">€ {item.cost.toFixed(2)}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type AddKind = 'activity' | 'flight' | 'accommodation' | 'transport'
type ModalKind = 'add-activity' | 'add-flight' | 'add-accommodation' | 'add-transport' | 'edit-item' | null
type SelectedItem =
  | { type: 'activity'; data: Activity }
  | { type: 'flight'; data: Flight }
  | { type: 'accommodation'; data: Accommodation }
  | { type: 'transport'; data: Transport }

export default function TripDayPage() {
  const { tripId, date } = useParams<{ tripId: string; date: string }>()
  const [trip, setTrip]             = useState<Trip | null>(null)
  const [summaryItems, setSummaryItems] = useState<DailySummaryItem[]>([])
  const [modal, setModal]           = useState<ModalKind>(null)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
  const [saving, setSaving]         = useState(false)
  const [loading, setLoading]       = useState(true)
  const addBtnRef = useRef<HTMLButtonElement | null>(null)
  const addMenuRef = useRef<HTMLDivElement | null>(null)
  const [addMenuPos, setAddMenuPos] = useState<{ top: number; right: number } | null>(null)

  // Compute menu position and close on outside click / scroll / resize
  useEffect(() => {
    if (!addMenuOpen) return

    const updatePos = () => {
      const r = addBtnRef.current?.getBoundingClientRect()
      if (!r) return
      setAddMenuPos({
        top: r.bottom + 6,
        right: window.innerWidth - r.right,
      })
    }
    updatePos()

    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        addMenuRef.current && !addMenuRef.current.contains(t) &&
        addBtnRef.current && !addBtnRef.current.contains(t)
      ) {
        setAddMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [addMenuOpen])

  const openAdd = (kind: AddKind) => {
    setAddMenuOpen(false)
    setModal(`add-${kind}` as ModalKind)
  }

  const loadDaySummary = async () => {
    if (!tripId || !date) return
    try {
      const items = await getDailySummary(tripId, date)
      setSummaryItems(items)
    } catch (err) {
      console.error('Error loading day summary:', err)
    }
  }

  useEffect(() => {
    if (!tripId || !date) return
    Promise.all([getTrip(tripId), getDailySummary(tripId, date)])
      .then(([t, items]) => {
        setTrip(t)
        setSummaryItems(items)
        setLoading(false)
      })
      .catch((err) => { console.error('Error loading day:', err); setLoading(false) })
  }, [tripId, date])

  if (!tripId || !date) return null

  const totalCost = summaryItems.reduce((s, item) => s + (item.cost ?? 0), 0)

  const handleAdd = async (data: ActivityCreate) => {
    setSaving(true)
    try {
      await createActivity(tripId, { ...data, activity_date: date })
      await loadDaySummary()
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  const handleAddFlight = async (data: FlightCreate) => {
    setSaving(true)
    try {
      await createFlight(tripId, data)
      await loadDaySummary()
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  const handleAddAccommodation = async (data: AccommodationCreate) => {
    setSaving(true)
    try {
      await createAccommodation(tripId, data)
      await loadDaySummary()
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  const handleAddTransport = async (data: TransportCreate) => {
    setSaving(true)
    try {
      await createTransport(tripId, data)
      await loadDaySummary()
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  const openItem = async (item: DailySummaryItem) => {
    try {
      if (item.type === 'activity') {
        const data = await getActivity(tripId, item.id)
        setSelectedItem({ type: 'activity', data })
      } else if (item.type === 'flight') {
        const data = await getFlight(tripId, item.id)
        setSelectedItem({ type: 'flight', data })
      } else if (item.type === 'accommodation') {
        const data = await getAccommodation(tripId, item.id)
        setSelectedItem({ type: 'accommodation', data })
      } else {
        const data = await getTransport(tripId, item.id)
        setSelectedItem({ type: 'transport', data })
      }
      setModal('edit-item')
    } catch (err) {
      console.error('Error loading item:', err)
    }
  }

  const closeItem = () => { setModal(null); setSelectedItem(null) }

  const handleUpdateActivity = async (data: ActivityCreate) => {
    if (!selectedItem || selectedItem.type !== 'activity') return
    setSaving(true)
    try {
      await updateActivity(tripId, selectedItem.data.id, data)
      await loadDaySummary()
      closeItem()
    } finally { setSaving(false) }
  }

  const handleUpdateFlight = async (data: FlightCreate) => {
    if (!selectedItem || selectedItem.type !== 'flight') return
    setSaving(true)
    try {
      await updateFlight(tripId, selectedItem.data.id, data)
      await loadDaySummary()
      closeItem()
    } finally { setSaving(false) }
  }

  const handleUpdateAccommodation = async (data: AccommodationCreate) => {
    if (!selectedItem || selectedItem.type !== 'accommodation') return
    setSaving(true)
    try {
      await updateAccommodation(tripId, selectedItem.data.id, data)
      await loadDaySummary()
      closeItem()
    } finally { setSaving(false) }
  }

  const handleUpdateTransport = async (data: TransportCreate) => {
    if (!selectedItem || selectedItem.type !== 'transport') return
    setSaving(true)
    try {
      await updateTransport(tripId, selectedItem.data.id, data)
      await loadDaySummary()
      closeItem()
    } finally { setSaving(false) }
  }

  const handleDeleteItem = async () => {
    if (!selectedItem) return
    setSaving(true)
    try {
      if (selectedItem.type === 'activity') await deleteActivity(tripId, selectedItem.data.id)
      else if (selectedItem.type === 'flight') await deleteFlight(tripId, selectedItem.data.id)
      else if (selectedItem.type === 'accommodation') await deleteAccommodation(tripId, selectedItem.data.id)
      else await deleteTransport(tripId, selectedItem.data.id)
      await loadDaySummary()
      closeItem()
    } finally { setSaving(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)' }}>
      <Navbar />

      <div className="day-header">
        <div className="day-header__content">
          <div className="day-header__breadcrumb">
            <Link to="/">Trips</Link>
            <span>/</span>
            <Link to={`/trips/${tripId}`}>{trip?.title ?? '...'}</Link>
            <span>/</span>
            <span style={{ color: '#fff' }}>Day</span>
          </div>
          {loading ? (
            <div style={{ height: 36, width: 240, background: 'rgba(255,255,255,0.2)', borderRadius: 8 }} />
          ) : (
            <div className="day-header__bottom">
              <div>
                <h1 className="day-header__title">{fmtDay(date)}</h1>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {totalCost > 0 && (
                  <div className="day-header__cost-badge">
                    <small>Day Expenses</small>
                    <strong>€ {totalCost.toFixed(2)}</strong>
                  </div>
                )}
                <button
                  ref={addBtnRef}
                  className="btn-primary"
                  style={{ background: '#fff', color: 'var(--forest)' }}
                  onClick={() => setAddMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={addMenuOpen}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ flexShrink: 0, overflow: 'visible', display: 'block' }}
                    aria-hidden="true"
                  >
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Add
                </button>
                {addMenuOpen && addMenuPos && createPortal(
                  <div
                    ref={addMenuRef}
                    role="menu"
                    style={{
                      position: 'fixed',
                      top: addMenuPos.top,
                      right: addMenuPos.right,
                      background: '#fff',
                      border: '1px solid var(--cream-dark)',
                      borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
                      padding: 6,
                      minWidth: 200,
                      zIndex: 1000,
                    }}
                  >
                    {[
                      { kind: 'activity' as AddKind,      icon: '🗓️', label: 'Activity' },
                      { kind: 'flight' as AddKind,        icon: '✈️', label: 'Flight' },
                      { kind: 'accommodation' as AddKind, icon: '🏨', label: 'Accommodation' },
                      { kind: 'transport' as AddKind,     icon: '🚌', label: 'Transportation' },
                    ].map((opt) => (
                      <button
                        key={opt.kind}
                        role="menuitem"
                        onClick={() => openAdd(opt.kind)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '9px 12px',
                          border: 'none',
                          background: 'transparent',
                          borderRadius: 8,
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.875rem',
                          color: 'var(--forest)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ivory)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: '1rem' }}>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => <div key={i} style={{ height: 90, background: 'var(--cream-dark)', borderRadius: 16 }} />)}
          </div>
        ) : summaryItems.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🗺️</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 600, color: 'var(--forest)', marginBottom: 8 }}>No Activities</h3>
            <p style={{ color: 'var(--sage)', fontSize: '0.875rem', marginBottom: 24 }}>Start adding activities for this day.</p>
            <button className="btn-primary" onClick={() => setModal('add-activity')}>Add First Activity</button>
          </div>
        ) : (
          <div className="timeline">
            {summaryItems.map((item) => (
              <SummaryItemCard
                key={item.id}
                item={item}
                onClick={() => openItem(item)}
              />
            ))}
          </div>
        )}
      </main>

      {modal === 'add-activity' && (
        <Modal title="New Activity" onClose={() => setModal(null)} size="lg">
          <ActivityForm
            initial={{ activity_date: date }}
            loading={saving}
            onSubmit={handleAdd}
            showDayPicker={false}
            tripStartDate={trip?.start_date}
            tripEndDate={trip?.end_date}
          />
        </Modal>
      )}

      {modal === 'add-flight' && (
        <Modal title="New Flight" onClose={() => setModal(null)} size="lg">
          <FlightForm
            initial={{ departure_time: `${date}T00:00` }}
            loading={saving}
            onSubmit={handleAddFlight}
            minDateTime={trip?.start_date ? `${trip.start_date}T00:00` : undefined}
            maxDateTime={trip?.end_date ? `${trip.end_date}T23:59` : undefined}
          />
        </Modal>
      )}

      {modal === 'add-accommodation' && (
        <Modal title="New Accommodation" onClose={() => setModal(null)} size="lg">
          <AccommodationForm
            initial={{ check_in: date }}
            loading={saving}
            onSubmit={handleAddAccommodation}
            minDate={trip?.start_date ?? undefined}
            maxDate={trip?.end_date ?? undefined}
          />
        </Modal>
      )}

      {modal === 'add-transport' && (
        <Modal title="New Transportation" onClose={() => setModal(null)} size="lg">
          <TransportForm
            initial={{ departure_time: `${date}T00:00` }}
            loading={saving}
            onSubmit={handleAddTransport}
            minDateTime={trip?.start_date ? `${trip.start_date}T00:00` : undefined}
            maxDateTime={trip?.end_date ? `${trip.end_date}T23:59` : undefined}
          />
        </Modal>
      )}
      {modal === 'edit-item' && selectedItem && (() => {
        const titles = { activity: 'Edit Activity', flight: 'Edit Flight', accommodation: 'Edit Accommodation', transport: 'Edit Transportation' }
        return (
          <Modal title={titles[selectedItem.type]} onClose={closeItem} size="lg">
            {selectedItem.type === 'activity' && (
              <ActivityForm
                initial={selectedItem.data}
                loading={saving}
                onSubmit={handleUpdateActivity}
                showDayPicker
                tripStartDate={trip?.start_date}
                tripEndDate={trip?.end_date}
              />
            )}
            {selectedItem.type === 'flight' && (
              <FlightForm
                initial={selectedItem.data}
                loading={saving}
                onSubmit={handleUpdateFlight}
                minDateTime={trip?.start_date ? `${trip.start_date}T00:00` : undefined}
                maxDateTime={trip?.end_date ? `${trip.end_date}T23:59` : undefined}
              />
            )}
            {selectedItem.type === 'accommodation' && (
              <AccommodationForm
                initial={selectedItem.data}
                loading={saving}
                onSubmit={handleUpdateAccommodation}
                minDate={trip?.start_date ?? undefined}
                maxDate={trip?.end_date ?? undefined}
              />
            )}
            {selectedItem.type === 'transport' && (
              <TransportForm
                initial={selectedItem.data}
                loading={saving}
                onSubmit={handleUpdateTransport}
                minDateTime={trip?.start_date ? `${trip.start_date}T00:00` : undefined}
                maxDateTime={trip?.end_date ? `${trip.end_date}T23:59` : undefined}
              />
            )}
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--cream-dark)' }}>
              <button
                onClick={handleDeleteItem}
                disabled={saving}
                style={{ width: '100%', padding: '10px 16px', borderRadius: 10, border: '1px solid #fca5a5', background: '#fff5f5', color: '#dc2626', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
              >
                {saving ? 'Deleting...' : `Delete ${selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)}`}
              </button>
            </div>
          </Modal>
        )
      })()}
    </div>
  )
}