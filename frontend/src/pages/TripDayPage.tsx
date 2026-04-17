// frontend/src/pages/TripDayPage.tsx
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { getTrip } from '../api/trips'
import { createActivity, updateActivity } from '../api/activities'
import { createFlight } from '../api/flights'
import { createAccommodation } from '../api/accommodations'
import { createTransport } from '../api/transports'
import { getDailySummary } from '../api/daily_summary'
import type {
  Trip, Activity, ActivityCreate, DailySummaryItem,
  FlightCreate, AccommodationCreate, TransportCreate,
} from '../types'
import {
  ActivityForm, FlightForm, AccommodationForm, TransportForm,
} from '../components/forms/Forms'


function fmtDay(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtTime(d?: string | null) {
  if (!d) return null
  if (d.length <= 5) return d
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
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
function SummaryItemCard({ item }: { item: DailySummaryItem }) {
  const icon = getIconForType(item.type)
  return (
    <div className="activity-card animate-fade-up">
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

// ── Activity Detail View ───────────────────────────────────────────────────────
function ActivityDetailView({ activity, onEdit, onClose }: {
  activity: Activity; onEdit: () => void; onClose: () => void
}) {
  return (
    <div className="form-stack">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, color: 'var(--forest)', margin: 0 }}>
          {activity.title || 'Untitled Activity'}
        </h3>
        <StatusBadge status={activity.status} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem', color: '#4b5563' }}>
        {(activity.start_time || activity.end_time) && (
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ minWidth: 20 }}>🕐</span>
            <span>
              {fmtTime(activity.start_time) ?? '—'}
              {activity.end_time ? ` → ${fmtTime(activity.end_time)}` : ''}
            </span>
          </div>
        )}
        {activity.location && (
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ minWidth: 20 }}>📍</span>
            <span>{activity.location}</span>
          </div>
        )}
        {activity.cost != null && (
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ minWidth: 20 }}>💶</span>
            <span style={{ fontWeight: 600 }}>€ {activity.cost.toFixed(2)}</span>
          </div>
        )}
        {activity.link && (
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ minWidth: 20 }}>🔗</span>
            <a href={activity.link} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--forest-light)', wordBreak: 'break-all' }}>
              {activity.link}
            </a>
          </div>
        )}
        {activity.description && (
          <div style={{ marginTop: 4, padding: '10px 12px', background: 'var(--ivory)', borderRadius: 10, lineHeight: 1.6 }}>
            {activity.description}
          </div>
        )}
        {activity.notes && (
          <div style={{ display: 'flex', gap: 8, fontStyle: 'italic', color: '#9ca3af', borderLeft: '2px solid var(--mint)', paddingLeft: 10 }}>
            <span>{activity.notes}</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onEdit}>Edit</button>
        <button onClick={onClose} style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid var(--cream-dark)', background: '#fff', color: 'var(--forest-mid)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
          Close
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type AddKind = 'activity' | 'flight' | 'accommodation' | 'transport'
type ModalKind = 'add-activity' | 'add-flight' | 'add-accommodation' | 'add-transport' | 'edit' | 'view' | null

export default function TripDayPage() {
  const { tripId, date } = useParams<{ tripId: string; date: string }>()
  const [trip, setTrip]             = useState<Trip | null>(null)
  const [summaryItems, setSummaryItems] = useState<DailySummaryItem[]>([])
  const [modal, setModal]           = useState<ModalKind>(null)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Activity | null>(null)
  const [viewTarget, setViewTarget] = useState<Activity | null>(null)
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

  const handleEdit = async (data: ActivityCreate) => {
    if (!editTarget) return
    setSaving(true)
    try {
      await updateActivity(tripId, editTarget.id, { ...data })
      await loadDaySummary()
      setModal(null)
      setEditTarget(null)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (act: Activity) => {
    setEditTarget(act)
    setViewTarget(null)
    setModal('edit')
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
              <SummaryItemCard key={item.id} item={item} />
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
      {modal === 'view' && viewTarget && (
        <Modal title="Activity Details" onClose={() => { setModal(null); setViewTarget(null) }} size="lg">
          <ActivityDetailView
            activity={viewTarget}
            onEdit={() => openEdit(viewTarget)}
            onClose={() => { setModal(null); setViewTarget(null) }}
          />
        </Modal>
      )}
      {modal === 'edit' && editTarget && (
        <Modal title="Edit Activity" onClose={() => { setModal(null); setEditTarget(null) }} size="lg">
          <ActivityForm
            initial={editTarget}
            loading={saving}
            onSubmit={handleEdit}
            showDayPicker
            tripStartDate={trip?.start_date}
            tripEndDate={trip?.end_date}
          />
        </Modal>
      )}
    </div>
  )
}