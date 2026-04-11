// frontend/src/pages/TripDayPage.tsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import StatusBadge from '../components/StatusBadge'
import { getTrip } from '../api/trips'
import { getActivities, createActivity, updateActivity, deleteActivity } from '../api/activities'
import type { Trip, Activity, ActivityCreate, ActivityUpdate, Status } from '../types'

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
function ActivityCard({ activity, onView, onEdit, onDelete }: {
  activity: Activity
  onView: (a: Activity) => void
  onEdit: (a: Activity) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="activity-card animate-fade-up">
      <div className="activity-card__inner" style={{ cursor: 'pointer' }} onClick={() => onView(activity)}>
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
        <div className="activity-card__body">
          <div className="activity-card__header">
            <h4 className="activity-card__title">{activity.title ?? 'Untitled Activity'}</h4>
            <StatusBadge status={activity.status} />
          </div>
          {activity.description && <p className="activity-card__desc">{activity.description}</p>}
          <div className="activity-card__meta">
            {activity.location && <span>📍 {activity.location}</span>}
            {activity.cost != null && <span className="activity-card__cost">€ {activity.cost.toFixed(2)}</span>}
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
      <div className="activity-card__actions">
        <button className="activity-card__action" onClick={(e) => { e.stopPropagation(); onEdit(activity) }} title="Edit">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M7.5 1L10 3.5 3.5 10H1V7.5L7.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="activity-card__action activity-card__action--del" onClick={(e) => { e.stopPropagation(); onDelete(activity.id) }} title="Delete">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
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

// ── Activity Form ─────────────────────────────────────────────────────────────
function ActivityForm({ initial, onSubmit, loading, showDayPicker, tripStartDate, tripEndDate }: {
  initial?: Partial<Activity>
  onSubmit: (d: ActivityCreate) => void
  loading: boolean
  showDayPicker?: boolean
  tripStartDate?: string | null
  tripEndDate?: string | null
}) {
  const [activityDate, setActivityDate] = useState(initial?.activity_date ?? '')
  const [title, setTitle]               = useState(initial?.title ?? '')
  const [description, setDesc]          = useState(initial?.description ?? '')
  const [startTime, setStart]           = useState(initial?.start_time ?? '')
  const [endTime, setEnd]               = useState(initial?.end_time ?? '')
  const [location, setLocation]         = useState(initial?.location ?? '')
  const [status, setStatus]             = useState<Status>(initial?.status ?? 'draft')
  const [cost, setCost]                 = useState(initial?.cost?.toString() ?? '')
  const [link, setLink]                 = useState(initial?.link ?? '')
  const [notes, setNotes]               = useState(initial?.notes ?? '')

  useEffect(() => {
    if (initial) {
      setActivityDate(initial.activity_date ?? '')
      setTitle(initial.title ?? '')
      setDesc(initial.description ?? '')
      setStart(initial.start_time ?? '')
      setEnd(initial.end_time ?? '')
      setLocation(initial.location ?? '')
      setStatus(initial.status ?? 'draft')
      setCost(initial.cost?.toString() ?? '')
      setLink(initial.link ?? '')
      setNotes(initial.notes ?? '')
    }
  }, [initial])

  return (
    <div className="form-stack">
      {showDayPicker && (
        <FormField label="Date" type="input" inputType="date" value={activityDate} onChange={setActivityDate}
          min={tripStartDate ?? undefined} max={tripEndDate ?? undefined} />
      )}
      <FormField label="Title" type="input" value={title} onChange={setTitle} placeholder="Visit to the Colosseum" />
      <FormField label="Description" type="textarea" value={description} onChange={setDesc} rows={2} />
      <div className="form-grid-2">
        <FormField label="Start" type="input" inputType="time" value={startTime} onChange={setStart} />
        <FormField label="End"   type="input" inputType="time" value={endTime}   onChange={setEnd} />
      </div>
      <div className="form-grid-2">
        <FormField label="Location" type="input" value={location} onChange={setLocation} placeholder="Via Sacra, Rome" />
        <FormField label="Cost (€)" type="input" inputType="number" value={cost} onChange={setCost} />
      </div>
      <FormField label="Status" type="select" value={status} onChange={(v) => setStatus(v as Status)} options={STATUS_OPTIONS} />
      <FormField label="Link" type="input" value={link} onChange={setLink} placeholder="https://..." />
      <FormField label="Notes" type="textarea" value={notes} onChange={setNotes} rows={2} />
      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => onSubmit({
          activity_date: activityDate,
          title: title || null,
          description: description || null,
          start_time: startTime || null,
          end_time: endTime || null,
          location: location || null,
          status: status || null,
          cost: cost ? parseFloat(cost) : null,
          pay_method: null,
          cancellation_date: null,
          link: link || null,
          notes: notes || null,
        })}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Activity'}
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TripDayPage() {
  const { tripId, date } = useParams<{ tripId: string; date: string }>()
  const [trip, setTrip]             = useState<Trip | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [modal, setModal]           = useState<'add' | 'edit' | 'view' | null>(null)
  const [editTarget, setEditTarget] = useState<Activity | null>(null)
  const [viewTarget, setViewTarget] = useState<Activity | null>(null)
  const [saving, setSaving]         = useState(false)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!tripId || !date) return
    Promise.all([getTrip(tripId), getActivities(tripId)])
      .then(([t, allActivities]) => {
        setTrip(t)
        setActivities(allActivities.filter((a) => a.activity_date === date))
        setLoading(false)
      })
      .catch((err) => { console.error('Error loading day:', err); setLoading(false) })
  }, [tripId, date])

  if (!tripId || !date) return null

  const sorted = [...activities].sort((a, b) => {
    if (!a.start_time) return 1
    if (!b.start_time) return -1
    return a.start_time.localeCompare(b.start_time)
  })

  const totalCost = activities.reduce((s, a) => s + (a.cost ?? 0), 0)

  const handleAdd = async (data: ActivityCreate) => {
    setSaving(true)
    try {
      const r = await createActivity(tripId, { ...data, activity_date: date })
      setActivities((p) => [...p, r])
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (data: ActivityCreate) => {
    if (!editTarget) return
    setSaving(true)
    try {
      const updateData: ActivityUpdate = { ...data }
      const r = await updateActivity(tripId, editTarget.id, updateData)
      if (r.activity_date !== date) {
        setActivities((p) => p.filter((a) => a.id !== r.id))
      } else {
        setActivities((p) => p.map((a) => a.id === r.id ? r : a))
      }
      setModal(null)
      setEditTarget(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteActivity(tripId, id)
    setActivities((p) => p.filter((a) => a.id !== id))
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
                <button className="btn-primary" style={{ background: '#fff', color: 'var(--forest)' }} onClick={() => setModal('add')}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Activity
                </button>
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
                onView={(act) => { setViewTarget(act); setModal('view') }}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {modal === 'add' && (
        <Modal title="New Activity" onClose={() => setModal(null)} size="lg">
          <ActivityForm loading={saving} onSubmit={handleAdd} />
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