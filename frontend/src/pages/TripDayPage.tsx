// frontend/src/pages/TripDayPage.tsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import StatusBadge from '../components/StatusBadge'
import { getTrip } from '../api/trips'
import { getDay } from '../api/days'
import { getActivities, createActivity, updateActivity, deleteActivity } from '../api/activities'
import type { Trip, Day, Activity, ActivityCreate, Status } from '../types'

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'draft', label: 'Draft' }, { value: 'to_book', label: 'To Book' },
  { value: 'booked', label: 'Booked' }, { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]

function fmtDay(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtTime(d?: string | null) {
  if (!d) return null
  if (d.length <= 5) return d
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// ── Activity Card ─────────────────────────────────────────────────────────────
function ActivityCard({ activity, onEdit, onDelete }: {
  activity: Activity; onEdit: (a: Activity) => void; onDelete: (id: string) => void
}) {
  return (
    <div className="activity-card animate-fade-up">
      <div className="activity-card__inner">
        {/* Time */}
        <div className="activity-card__time">
          {activity.start_time ? (
            <>
              <p className="activity-card__time-start">{fmtTime(activity.start_time)}</p>
              {activity.end_time && (
                <>
                  <div className="activity-card__time-div" />
                  <p className="activity-card__time-end">{fmtTime(activity.end_time)}</p>
                </>
              )}
            </>
          ) : (
            <div className="activity-card__dot" />
          )}
        </div>

        {/* Body */}
        <div className="activity-card__body">
          <div className="activity-card__header">
            <h4 className="activity-card__title">{activity.title ?? 'Untitled Activity'}</h4>
            <StatusBadge status={activity.status} />
          </div>
          {activity.description && <p className="activity-card__desc">{activity.description}</p>}
          <div className="activity-card__meta">
            {activity.location && (
              <span>📍 {activity.location}</span>
            )}
            {activity.cost != null && (
              <span className="activity-card__cost">€ {activity.cost.toFixed(2)}</span>
            )}
            {activity.link && (
              <a href={activity.link} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--forest-light)', textDecoration: 'none' }}
                onClick={(e) => e.stopPropagation()}>
                Link →
              </a>
            )}
          </div>
          {activity.notes && <p className="activity-card__notes">{activity.notes}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="activity-card__actions">
        <button className="activity-card__action" onClick={() => onEdit(activity)} title="Edit">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M7.5 1L10 3.5 3.5 10H1V7.5L7.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="activity-card__action activity-card__action--del" onClick={() => onDelete(activity.id)} title="Delete">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Activity Form ─────────────────────────────────────────────────────────────
function ActivityForm({ initial, onSubmit, loading }: {
  initial?: Partial<Activity>; onSubmit: (d: ActivityCreate) => void; loading: boolean
}) {
  const [title, setTitle]       = useState(initial?.title ?? '')
  const [description, setDesc]  = useState(initial?.description ?? '')
  const [startTime, setStart]   = useState(initial?.start_time ?? '')
  const [endTime, setEnd]       = useState(initial?.end_time ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [status, setStatus]     = useState<Status>(initial?.status ?? 'draft')
  const [cost, setCost]         = useState(initial?.cost?.toString() ?? '')
  const [link, setLink]         = useState(initial?.link ?? '')
  const [notes, setNotes]       = useState(initial?.notes ?? '')

  return (
    <div className="form-stack">
      <FormField label="Title" type="input" value={title} onChange={setTitle} placeholder="Visit to the Colosseum" />
      <FormField label="Description" type="textarea" value={description} onChange={setDesc} rows={2} />
      <div className="form-grid-2">
        <FormField label="Start" type="input" inputType="time" value={startTime} onChange={setStart} />
        <FormField label="End"   type="input" inputType="time" value={endTime}   onChange={setEnd} />
      </div>
      <div className="form-grid-2">
        <FormField label="Location"    type="input" value={location} onChange={setLocation} placeholder="Via Sacra, Rome" />
        <FormField label="Cost (€)" type="input" inputType="number" value={cost} onChange={setCost} />
      </div>
      <FormField label="Status" type="select" value={status} onChange={(v) => setStatus(v as Status)} options={STATUS_OPTIONS} />
      <FormField label="Link" type="input" value={link} onChange={setLink} placeholder="https://..." />
      <FormField label="Notes" type="textarea" value={notes} onChange={setNotes} rows={2} />
      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => onSubmit({ title: title || null, description: description || null, start_time: startTime || null, end_time: endTime || null, location: location || null, status: status || null, cost: cost ? parseFloat(cost) : null, pay_method: null, cancellation_date: null, link: link || null, notes: notes || null })}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Activity'}
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TripDayPage() {
  const { tripId, dayId } = useParams<{ tripId: string; dayId: string }>()
  const [trip, setTrip]           = useState<Trip | null>(null)
  const [day, setDay]             = useState<Day | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [modal, setModal]         = useState<'add' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<Activity | null>(null)
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!tripId || !dayId) return
    Promise.all([getTrip(tripId), getDay(tripId, dayId), getActivities(tripId, dayId)])
      .then(([t, d, a]) => { setTrip(t); setDay(d); setActivities(a); setLoading(false) })
      .catch((error) => { console.error('Error loading day data:', error); setLoading(false) })
  }, [tripId, dayId])

  if (!tripId || !dayId) return null

  const sorted = [...activities].sort((a, b) => {
    if (!a.start_time) return 1
    if (!b.start_time) return -1
    return a.start_time.localeCompare(b.start_time)
  })

  const totalCost = activities.reduce((s, a) => s + (a.cost ?? 0), 0)

  const handleAdd = async (data: ActivityCreate) => {
    setSaving(true)
    try { const r = await createActivity(tripId, dayId, data); setActivities((p) => [...p, r]); setModal(null) }
    finally { setSaving(false) }
  }
  const handleEdit = async (data: ActivityCreate) => {
    if (!editTarget) return
    setSaving(true)
    try { const r = await updateActivity(tripId, dayId, editTarget.id, data); setActivities((p) => p.map((a) => a.id === r.id ? r : a)); setModal(null); setEditTarget(null) }
    finally { setSaving(false) }
  }
  const handleDelete = async (id: string) => {
    await deleteActivity(tripId, dayId, id)
    setActivities((p) => p.filter((a) => a.id !== id))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)' }}>
      <Navbar />

      {/* Header */}
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
                <h1 className="day-header__title">{fmtDay(day?.day_date)}</h1>
                {day?.location && (
                  <p className="day-header__location">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M5.5 1a3 3 0 0 1 3 3c0 2-3 6-3 6S2.5 6 2.5 4a3 3 0 0 1 3-3z" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                    {day.location}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {totalCost > 0 && (
                  <div className="day-header__cost-badge">
                    <small>Day Expenses</small>
                    <strong>€ {totalCost.toFixed(2)}</strong>
                  </div>
                )}
                <button
                  className="btn-primary"
                  style={{ background: '#fff', color: 'var(--forest)' }}
                  onClick={() => setModal('add')}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Activity
                </button>
              </div>
            </div>
          )}
          {day?.notes && <p className="day-header__notes">{day.notes}</p>}
        </div>
      </div>

      {/* Activities */}
      <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map((i) => <div key={i} style={{ height: 90, background: 'var(--cream-dark)', borderRadius: 16, animation: 'shimmer 1.4s infinite' }} />)}
          </div>
        ) : activities.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🗺️</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 600, color: 'var(--forest)', marginBottom: 8 }}>No Activities</h3>
            <p style={{ color: 'var(--sage)', fontSize: '0.875rem', marginBottom: 24 }}>Start adding activities for this day.</p>
            <button className="btn-primary" onClick={() => setModal('add')}>Add First Activity</button>
          </div>
        ) : (
          <div className="timeline">
            {sorted.map((a) => (
              <ActivityCard key={a.id} activity={a}
                onEdit={(act) => { setEditTarget(act); setModal('edit') }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {modal === 'add' && (
        <Modal title="New Activity" onClose={() => setModal(null)} size="lg">
          <ActivityForm loading={saving} onSubmit={handleAdd} />
        </Modal>
      )}
      {modal === 'edit' && editTarget && (
        <Modal title="Edit Activity" onClose={() => { setModal(null); setEditTarget(null) }} size="lg">
          <ActivityForm initial={editTarget} loading={saving} onSubmit={handleEdit} />
        </Modal>
      )}
    </div>
  )
}
