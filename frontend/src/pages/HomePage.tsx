// frontend/src/pages/HomePage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import { TripForm } from '../components/forms/Forms'
import { getTrips, createTrip, updateTrip, deleteTrip } from '../api/trips'
import type { Trip, TripCreate } from '../types'

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80',
]
const CARD_IMAGES = [
  'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=70',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=70',
  'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&q=70',
  'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&q=70',
  'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=70',
  'https://images.unsplash.com/photo-1543832923-44667a44c804?w=800&q=70',
]

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start) return 'Dates to be defined'
  const s = new Date(start).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  if (!end) return s
  const e = new Date(end).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${s} → ${e}`
}

function tripDays(start?: string | null, end?: string | null) {
  if (!start || !end) return null
  const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000)
  return diff > 0 ? `${diff} days` : null
}

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="empty-state animate-fade-up">
      <div className="empty-state__icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ color: 'var(--sage)' }}>
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M16 9v14M9 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <h3 className="empty-state__title">No trips yet</h3>
      <p className="empty-state__sub">Your next big trip starts here. Create your first itinerary.</p>
      <button className="btn-primary" onClick={onAdd}>Create Your First Trip</button>
    </div>
  )
}

// ── Trip Card ──────────────────────────────────────────────────────────────────
function TripCard({ trip, index, onEdit, onDelete, onClick }: {
  trip: Trip; index: number
  onEdit: (t: Trip) => void; onDelete: (t: Trip) => void; onClick: (t: Trip) => void
}) {
  const imgUrl = trip.cover_image || CARD_IMAGES[index % CARD_IMAGES.length]
  const days = tripDays(trip.start_date, trip.end_date)

  return (
    <article className="trip-card animate-fade-up" style={{ animationDelay: `${0.05 * index}s` }} onClick={() => onClick(trip)}>
      <div className="trip-card__img-wrap">
        <img src={imgUrl} alt={trip.title} className="trip-card__img" />
        <div className="trip-card__img-overlay" />
        {days && <span className="trip-card__days-badge">{days}</span>}
        <div className="trip-card__actions" onClick={(e) => e.stopPropagation()}>
          <button className="trip-card__action-btn" onClick={() => onEdit(trip)} title="Edit">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M9 1.5l2.5 2.5L3.5 11.5H1v-2.5L9 1.5z" stroke="var(--forest)" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="trip-card__action-btn" onClick={() => onDelete(trip)} title="Delete">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 3h9M5 3V2h3v1M4 3l.5 8h4l.5-8" stroke="#9b2020" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        {trip.destination && <span className="trip-card__destination">{trip.destination}</span>}
      </div>
      <div className="trip-card__body">
        <h3 className="trip-card__title">{trip.title}</h3>
        <p className="trip-card__date">{formatDateRange(trip.start_date, trip.end_date)}</p>
        {trip.description && <p className="trip-card__desc">{trip.description}</p>}
        <div className="trip-card__footer">View itinerary →</div>
      </div>
    </article>
  )
}

// ── HomePage ───────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()
  const [trips, setTrips]           = useState<Trip[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editTrip, setEditTrip]     = useState<Trip | null>(null)
  const [deleteTarget, setDelete]   = useState<Trip | null>(null)
  const [heroIdx]                   = useState(() => Math.floor(Math.random() * HERO_IMAGES.length))

  useEffect(() => {
    getTrips().then((d) => { setTrips(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const handleCreate = async (data: TripCreate) => {
    setSaving(true)
    try { const t = await createTrip(data); setTrips((p) => [t, ...p]); setShowCreate(false) }
    finally { setSaving(false) }
  }
  const handleEdit = async (data: TripCreate) => {
    if (!editTrip) return
    setSaving(true)
    try { const t = await updateTrip(editTrip.id, data); setTrips((p) => p.map((x) => x.id === t.id ? t : x)); setEditTrip(null) }
    finally { setSaving(false) }
  }
  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try { await deleteTrip(deleteTarget.id); setTrips((p) => p.filter((x) => x.id !== deleteTarget.id)); setDelete(null) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)' }}>
      <Navbar />

      {/* Hero */}
      <section className="hero noise">
        <img src={HERO_IMAGES[heroIdx]} alt="hero" className="hero__img" />
        <div className="hero__overlay" />
        <div className="hero__content">
          <p className="hero__eyebrow animate-fade-up">Your travel planner</p>
          <h1 className="hero__title animate-fade-up delay-100">
            Plan.<br /><em>Explore.</em>
          </h1>
          <p className="hero__sub animate-fade-up delay-200">
            Organize every detail of your next trip in one place.
          </p>
          <button className="hero__cta animate-fade-up delay-300" onClick={() => setShowCreate(true)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 5v8M5 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New Trip
          </button>
        </div>
      </section>

      {/* Trips */}
      <section className="trips-section">
        <div className="container">
          <div className="trips-header">
            <div>
              <h2 className="trips-header__title">My Trips</h2>
              {trips.length > 0 && (
                <p className="trips-header__count">{trips.length} {trips.length === 1 ? 'trip' : 'trips'} saved</p>
              )}
            </div>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add Trip
            </button>
          </div>

          {loading ? (
            <div className="trips-grid">
              {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 280 }} />)}
            </div>
          ) : trips.length === 0 ? (
            <EmptyState onAdd={() => setShowCreate(true)} />
          ) : (
            <div className="trips-grid">
              {trips.map((trip, i) => (
                <TripCard
                  key={trip.id} trip={trip} index={i}
                  onClick={(t) => navigate(`/trips/${t.id}`)}
                  onEdit={(t) => setEditTrip(t)}
                  onDelete={(t) => setDelete(t)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="footer">Wanderplan — every trip is a story</footer>

      {/* Modals */}
      {showCreate && (
        <Modal title="New Trip" onClose={() => setShowCreate(false)}>
          <TripForm onSubmit={handleCreate} loading={saving} />
        </Modal>
      )}
      {editTrip && (
        <Modal title="Edit Trip" onClose={() => setEditTrip(null)}>
          <TripForm initial={editTrip} onSubmit={handleEdit} loading={saving} />
        </Modal>
      )}
      {deleteTarget && (
        <Modal title="Delete Trip" onClose={() => setDelete(null)} size="sm">
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#9b2020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontWeight: 600, color: 'var(--charcoal)', marginBottom: 6 }}>Are you sure?</p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 24 }}>
              You will delete <strong>{deleteTarget.title}</strong> and all associated data.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDelete(null)}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={handleDelete} disabled={saving}>
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
