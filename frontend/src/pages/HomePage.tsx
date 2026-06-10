// frontend/src/pages/HomePage.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import { TripForm } from '../components/forms/Forms'
import { getTrips, createTrip, updateTrip, deleteTrip, CascadeDeletionRequired, type CascadeDeletionPreview } from '../api/trips'
import CascadeDeleteConfirmModal from '../components/CascadeDeleteConfirmModal'
import { useDestinationPhoto } from '../hooks/useDestinationPhoto'
import type { Trip, TripCreate } from '../types'

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Curated warm palettes — seeded from destination/title text */
const CARD_PALETTES = [
  { from: 'oklch(88% 0.09 28)',  to: 'oklch(78% 0.13 18)',  text: 'oklch(38% 0.10 22)'  }, // coral-blush
  { from: 'oklch(90% 0.08 58)',  to: 'oklch(80% 0.11 42)',  text: 'oklch(40% 0.11 48)'  }, // amber
  { from: 'oklch(88% 0.07 338)', to: 'oklch(80% 0.09 322)', text: 'oklch(42% 0.09 330)' }, // rose-mauve
  { from: 'oklch(88% 0.07 162)', to: 'oklch(80% 0.08 148)', text: 'oklch(40% 0.09 155)' }, // sage-teal
  { from: 'oklch(89% 0.08 45)',  to: 'oklch(80% 0.11 32)',  text: 'oklch(42% 0.10 38)'  }, // peach-orange
  { from: 'oklch(87% 0.06 275)', to: 'oklch(79% 0.08 262)', text: 'oklch(40% 0.08 268)' }, // lavender
] as const

function cardPalette(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = seed.charCodeAt(i) + ((h << 5) - h)
  }
  return CARD_PALETTES[Math.abs(h) % CARD_PALETTES.length]
}

function formatDateRange(start?: string | null, end?: string | null): string | null {
  if (!start) return null
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

function tripDays(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null
  const diff = Math.ceil(
    (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000
  )
  return diff > 0 ? diff : null
}

type CountdownResult = { label: string; soon: boolean }

function daysToGoLabel(start?: string | null, end?: string | null): CountdownResult | null {
  if (!start) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(start)
  startDate.setHours(0, 0, 0, 0)
  const diff = Math.round((startDate.getTime() - today.getTime()) / 86_400_000)
  if (diff > 1) return { label: `${diff} days to go`, soon: false }
  if (diff === 1) return { label: 'Tomorrow', soon: true }
  if (diff === 0) return { label: 'Today', soon: true }
  if (end) {
    const endDate = new Date(end)
    endDate.setHours(23, 59, 59, 999)
    if (endDate >= new Date()) return { label: 'Ongoing', soon: true }
  }
  return null
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="3"  cy="8" r="1.25" fill="currentColor" />
      <circle cx="8"  cy="8" r="1.25" fill="currentColor" />
      <circle cx="13" cy="8" r="1.25" fill="currentColor" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ── TripCard ───────────────────────────────────────────────────────────────────

type MenuMode = 'options' | 'confirm'

function TripCard({
  trip,
  isPast,
  onNavigate,
  onEdit,
  onDelete,
}: {
  trip: Trip
  isPast: boolean
  onNavigate: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen]   = useState(false)
  const [menuMode, setMenuMode]   = useState<MenuMode>('options')
  const menuZoneRef               = useRef<HTMLDivElement>(null)

  const dateRange  = formatDateRange(trip.start_date, trip.end_date)
  const days       = tripDays(trip.start_date, trip.end_date)
  const countdown  = !isPast ? daysToGoLabel(trip.start_date, trip.end_date) : null

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleOutside(e: MouseEvent) {
      if (menuZoneRef.current && !menuZoneRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setMenuMode('options')
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [menuOpen])

  function toggleMenu(e: React.MouseEvent) {
    e.stopPropagation()
    if (menuOpen) {
      setMenuOpen(false)
      setMenuMode('options')
    } else {
      setMenuOpen(true)
    }
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpen(false)
    setMenuMode('options')
    onEdit()
  }

  function handleDeleteConfirm(e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpen(false)
    setMenuMode('options')
    onDelete()
  }

  function handleCancelDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setMenuMode('options')
    setMenuOpen(false)
  }


  const autoPhoto = useDestinationPhoto(trip.cover_image ? null : trip.destination)
  const photoUrl  = trip.cover_image ?? autoPhoto

  const seed    = trip.destination || trip.title || 'T'
  const initial = (trip.destination || trip.title || '?')[0].toUpperCase()
  const palette = cardPalette(seed)

  return (
    <article
      className="trip-card"
      onClick={() => { if (!menuOpen) onNavigate() }}
      aria-label={`Open ${trip.title}`}
    >
      {/* Image / placeholder zone */}
      <div className="trip-card__image">
        {photoUrl ? (
          <img src={photoUrl} alt={trip.destination ?? trip.title} />
        ) : (
          <div
            className="trip-card__placeholder"
            style={{ background: `linear-gradient(145deg, ${palette.from} 0%, ${palette.to} 100%)` }}
          >
            <span className="trip-card__placeholder-initial" style={{ color: palette.text }}>
              {initial}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="trip-card__body">
        <div className="trip-card__body-header">
          <h3 className="trip-card__title">{trip.title}</h3>
          {countdown && (
            <span className={`trip-card__countdown${countdown.soon ? ' trip-card__countdown--soon' : ''}`}>
              {countdown.label}
            </span>
          )}
        </div>
        {trip.destination && (
          <p className="trip-card__location">{trip.destination}</p>
        )}
        {dateRange ? (
          <p className="trip-card__date">{dateRange}</p>
        ) : (
          <p className="trip-card__date trip-card__date--placeholder">Dates TBD</p>
        )}
        {isPast && (
          <span className="trip-card__past-badge">Past trip</span>
        )}
      </div>

      {/* Footer */}
      <div className="trip-card__footer">
        {days != null ? (
          <span className="trip-card__days">{days} days</span>
        ) : (
          <span />
        )}
        <span className="trip-card__view" aria-hidden="true">View →</span>
      </div>

      {/* ••• menu zone (stops card click from propagating) */}
      <div
        className="trip-card__menu-zone"
        ref={menuZoneRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="trip-card__more"
          data-open={menuOpen ? '' : undefined}
          onClick={toggleMenu}
          aria-label={`Options for ${trip.title}`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <MoreIcon />
        </button>

        {menuOpen && (
          <div className="trip-menu" role="menu">
            {menuMode === 'options' ? (
              <>
                <button
                  className="trip-menu__item"
                  role="menuitem"
                  onClick={handleEdit}
                >
                  Edit trip
                </button>
                <div className="trip-menu__divider" role="separator" />
                <button
                  className="trip-menu__item trip-menu__item--danger"
                  role="menuitem"
                  onClick={(e) => { e.stopPropagation(); setMenuMode('confirm') }}
                >
                  Delete trip
                </button>
              </>
            ) : (
              <div className="trip-menu__confirm">
                <p className="trip-menu__confirm-title">
                  Delete "{trip.title}"?
                </p>
                <p className="trip-menu__confirm-sub">
                  This can't be undone.
                </p>
                <div className="trip-menu__confirm-actions">
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', padding: '8px 12px' }}
                    onClick={handleCancelDelete}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-danger"
                    style={{ flex: 1, padding: '8px 12px' }}
                    onClick={handleDeleteConfirm}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

// ── SkeletonCard ───────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="trip-card-skeleton" aria-hidden="true">
      <div className="skeleton trip-card-skeleton__image" />
      <div style={{ padding: '16px 20px 12px' }}>
        <div
          className="skeleton"
          style={{ height: 18, width: '62%', borderRadius: 6, marginBottom: 10 }}
        />
        <div
          className="skeleton"
          style={{ height: 14, width: '40%', borderRadius: 4, marginBottom: 6 }}
        />
        <div
          className="skeleton"
          style={{ height: 14, width: '54%', borderRadius: 4 }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px 16px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div className="skeleton" style={{ height: 24, width: 68, borderRadius: 9999 }} />
        <div className="skeleton" style={{ height: 14, width: 44, borderRadius: 4 }} />
      </div>
    </div>
  )
}

// ── HeroBar ────────────────────────────────────────────────────────────────────

function HeroBar({ onSubmit }: { onSubmit: (destination: string) => void }) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <section className="home-hero" aria-label="Start planning">
      <span className="home-hero__eyebrow">Plan with intention</span>
      <h1 className="home-hero__headline">Your travel organizer.<br />Crafted, not generated.</h1>
      <p className="home-hero__sub">Flights, stays, days, budget, notes. One quiet place that holds every detail.</p>
      <form className="home-hero__bar" onSubmit={handleSubmit} role="search">
        <label htmlFor="hero-destination" className="sr-only">Where do you want to go?</label>
        <span className="home-hero__bar-icon">
          <SearchIcon size={18} />
        </span>
        <input
          id="hero-destination"
          className="home-hero__bar-input"
          type="text"
          placeholder="Where do you want to go?"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button type="submit" className="home-hero__bar-cta">
          Plan a trip
        </button>
      </form>
    </section>
  )
}

// ── EmptyState ─────────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="empty-state">
      <p className="empty-state__heading">No trips yet.</p>
      <button className="btn-primary" onClick={onAdd}>
        <PlusIcon />
        Plan a trip
      </button>
    </div>
  )
}

// ── HomePage ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()

  const [trips,           setTrips]           = useState<Trip[]>([])
  const [loading,         setLoading]         = useState(true)
  const [saving,          setSaving]          = useState(false)
  const [showCreate,      setShowCreate]      = useState(false)
  const [heroDestination, setHeroDestination] = useState('')
  const [editTrip,        setEditTrip]        = useState<Trip | null>(null)
  const [search,          setSearch]          = useState('')
  const [cascade,         setCascade]         = useState<{ preview: CascadeDeletionPreview; total: number; pending: TripCreate } | null>(null)

  useEffect(() => {
    getTrips()
      .then((d) => { setTrips(d); setLoading(false) })
      .catch(() => { setLoading(false); toast.error('Failed to load trips') })
  }, [])

  // ── Mutations ──────────────────────────────────────────────────────────────

  const handleCreate = async (data: TripCreate) => {
    setSaving(true)
    try {
      const t = await createTrip(data)
      setTrips((prev) => [t, ...prev])
      setShowCreate(false)
      setHeroDestination('')
    } catch {
      toast.error('Failed to create trip')
    } finally {
      setSaving(false)
    }
  }

  const applyTripUpdate = async (data: TripCreate, confirm = false) => {
    if (!editTrip) return
    const t = await updateTrip(editTrip.id, data, confirm)
    setTrips((prev) => prev.map((x) => (x.id === t.id ? t : x)))
    setEditTrip(null)
    setCascade(null)
  }

  const handleEdit = async (data: TripCreate) => {
    if (!editTrip) return
    setSaving(true)
    try {
      await applyTripUpdate(data)
    } catch (err) {
      if (err instanceof CascadeDeletionRequired) {
        setCascade({ preview: err.preview, total: err.total, pending: data })
      } else {
        toast.error('Failed to update trip')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCascadeConfirm = async () => {
    if (!cascade) return
    setSaving(true)
    try {
      await applyTripUpdate(cascade.pending, true)
    } catch {
      toast.error('Failed to update trip')
    } finally {
      setSaving(false)
    }
  }

  // Optimistic delete with rollback on error
  const handleDelete = async (trip: Trip) => {
    setTrips((prev) => prev.filter((x) => x.id !== trip.id))
    try {
      await deleteTrip(trip.id)
    } catch {
      setTrips((prev) => [trip, ...prev])
      toast.error('Failed to delete trip')
    }
  }

  // ── Hero bar handler ───────────────────────────────────────────────────────

  function handleHeroSubmit(destination: string) {
    setHeroDestination(destination)
    setShowCreate(true)
  }

  // ── Filtered + sorted trips ────────────────────────────────────────────────

  const q = search.trim().toLowerCase()
  const filtered = q
    ? trips.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.destination ?? '').toLowerCase().includes(q)
      )
    : trips

  function isTripPast(t: Trip): boolean {
    const ref = t.end_date ?? t.start_date
    if (!ref) return false
    const d = new Date(ref)
    d.setHours(23, 59, 59, 999)
    return d < new Date()
  }

  const sorted = [...filtered].sort((a, b) => {
    const pastA = isTripPast(a)
    const pastB = isTripPast(b)
    // Past trips sink to bottom
    if (!pastA && pastB) return -1
    if (pastA && !pastB) return 1
    // Future/no-date: nearest start_date first; no-date floats to end of group
    if (!pastA && !pastB) {
      if (!a.start_date && !b.start_date) return 0
      if (!a.start_date) return 1
      if (!b.start_date) return -1
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    }
    // Past: most recently ended first
    const refA = a.end_date ?? a.start_date ?? ''
    const refB = b.end_date ?? b.start_date ?? ''
    return new Date(refB).getTime() - new Date(refA).getTime()
  })

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-warm)' }}>
      <Navbar />

      <HeroBar onSubmit={handleHeroSubmit} />

      <main className="container">
        {/* Trips section header */}
        {!loading && trips.length > 0 && (
          <div className="trips-section-header">
            <h1 className="trips-section-header__title">My trips</h1>
            <span className="trips-section-header__count">
              {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
            </span>
          </div>
        )}

        {/* Search — only when trips exist */}
        {!loading && trips.length > 0 && (
          <div className="search-pill-wrap">
            <label htmlFor="trip-search" className="sr-only">Search trips</label>
            <div className="search-pill">
              <span className="search-pill__icon">
                <SearchIcon />
              </span>
              <input
                id="trip-search"
                className="search-pill__input"
                type="text"
                placeholder="Search trips"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
              {search && (
                <button
                  className="search-pill__clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content states */}
        {loading ? (
          <div className="trips-grid" aria-busy="true" aria-label="Loading trips">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <EmptyState onAdd={() => handleHeroSubmit('')} />
        ) : sorted.length === 0 ? (
          <p className="no-results" role="status">
            No results for "{search}"
          </p>
        ) : (
          <div className="trips-grid">
            {sorted.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                isPast={isTripPast(trip)}
                onNavigate={() => navigate(`/trips/${trip.id}`)}
                onEdit={() => setEditTrip(trip)}
                onDelete={() => handleDelete(trip)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="footer">Wanderplan</footer>

      {/* Create modal */}
      {showCreate && (
        <Modal
          title="New Trip"
          onClose={() => { setShowCreate(false); setHeroDestination('') }}
        >
          <TripForm
            initial={heroDestination ? { destination: heroDestination } : undefined}
            onSubmit={handleCreate}
            loading={saving}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editTrip && (
        <Modal title="Edit Trip" onClose={() => setEditTrip(null)}>
          <TripForm initial={editTrip} onSubmit={handleEdit} loading={saving} />
        </Modal>
      )}

      {cascade && (
        <CascadeDeleteConfirmModal
          preview={cascade.preview}
          total={cascade.total}
          busy={saving}
          onCancel={() => setCascade(null)}
          onConfirm={handleCascadeConfirm}
        />
      )}
    </div>
  )
}
