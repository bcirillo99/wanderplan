// frontend/src/pages/TripDetailPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { getTrip } from '../api/trips'
import { getFlights, createFlight, updateFlight, deleteFlight } from '../api/flights'
import { getAccommodations, createAccommodation, updateAccommodation, deleteAccommodation } from '../api/accommodations'
import { getTransports, createTransport, updateTransport, deleteTransport } from '../api/transports'
import { getExpenses, createExpense, deleteExpense } from '../api/expenses'
import { getPackingItems, createPackingItem, deletePackingItem, togglePackingItem } from '../api/packing_items'
import { getTripStats } from '../api/stats'
import { getActivities, createActivity, updateActivity, deleteActivity } from '../api/activities'
import type {
  Trip, Activity, Flight, Accommodation, Transport, Expense, PackingItem, TripStats,
  ActivityCreate, FlightCreate, AccommodationCreate, TransportCreate, ExpenseCreate, PackingItemCreate,
} from '../types'
import {
  ActivityForm, FlightForm, AccommodationForm, TransportForm, ExpenseForm, PackingForm,
} from '../components/forms/Forms'
import { PACKING_CATS } from '../components/forms/tripOptions'

// ── Utility ───────────────────────────────────────────────────────────────────
function fmt(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
function fmtDateTime(d?: string): string | null {
  if (!d) return null;
  return new Date(d).toLocaleString('en-US', { 
    weekday: 'short',      // Lun
    month: 'short',        // Apr
    day: 'numeric',        // 12
    hour: '2-digit',       // 14
    minute: '2-digit'      // 30
  });
}

// ── Tab types ─────────────────────────────────────────────────────────────────
type Tab = 'days' | 'activities' | 'flights' | 'accommodations' | 'transports' | 'expenses' | 'packing' | 'stats'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'days',           label: 'Days',           icon: '📅' },
  { id: 'activities',     label: 'Activities',     icon: '🗓️' },
  { id: 'flights',        label: 'Flights',        icon: '✈️' },
  { id: 'accommodations', label: 'Accommodations', icon: '🏨' },
  { id: 'transports',     label: 'Transports',     icon: '🚌' },
  { id: 'expenses',       label: 'Expenses',       icon: '💰' },
  { id: 'packing',        label: 'Packing',        icon: '🎒' },
  { id: 'stats',          label: 'Budget',         icon: '📊' },
]

// ── Shared small components ───────────────────────────────────────────────────
function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="section-header">
      <h3 className="section-title">{title}</h3>
      <button className="btn-add" onClick={onAdd}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        Add
      </button>
    </div>
  )
}

function ItemCard({ children, onDelete, onEdit }: {
  children: React.ReactNode
  onDelete: () => void
  onEdit?: () => void
}) {
  return (
    <div className="item-card">
      <div className="item-card__actions">
        {onEdit && (
          <button className="item-card__action item-card__action--edit" onClick={onEdit} title="Edit">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 1.5l2.5 2.5-7 7H1v-2.5l7-7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <button className="item-card__action item-card__action--delete" onClick={onDelete} title="Delete">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      {children}
    </div>
  )
}

function TabEmpty({ msg }: { msg: string }) {
  return <div className="tab-empty">{msg}</div>
}

// ── DAYS ──────────────────────────────────────────────────────────────────────
function DaysTab({ tripId, dates }: { tripId: string; dates: string[] }) {
  const navigate = useNavigate()
  return (
    <>
      <div className="section-header">
        <h3 className="section-title">Trip Days</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--sage)' }}>
          Days are created automatically from your trip dates
        </p>
      </div>
      {dates.length === 0 ? (
        <TabEmpty msg="No days yet — set start/end dates for your trip to see days here" />
      ) : (
        <div className="trips-grid">
          {dates.map((date) => (
            <div
              key={date}
              className="item-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/trips/${tripId}/days/${date}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--mist)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem',
                  color: 'var(--forest)', flexShrink: 0,
                }}>
                  {new Date(date).getDate()}
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--forest-mid)', fontWeight: 500 }}>
                  {fmt(date)}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--sage)', marginTop: 10 }}>Tap to see full day →</p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ── ACTIVITIES ────────────────────────────────────────────────────────────────
function ActivitiesTab({ activities, onAdd, onEdit, onDelete }: {
  activities: Activity[]
  onAdd: () => void
  onEdit: (a: Activity) => void
  onDelete: (id: string) => void
}) {
  const grouped = activities.reduce<Record<string, Activity[]>>((acc, a) => {
    const key = a.activity_date ?? 'Unscheduled'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const dates = Object.keys(grouped).sort((a, b) => {
    if (a === 'Unscheduled') return 1
    if (b === 'Unscheduled') return -1
    return a.localeCompare(b)
  })

  return (
    <>
      <SectionHeader title="Trip Activities" onAdd={onAdd} />
      {activities.length === 0 ? <TabEmpty msg="No activities added" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {dates.map((date) => (
            <div key={date} style={{
              background: '#fff', borderRadius: 20,
              border: '1px solid var(--cream-dark)',
              padding: 20, boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)',
            }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--forest)', marginBottom: 16 }}>
                {date === 'Unscheduled' ? 'Unscheduled' : fmt(date)}
              </p>
              <div style={{ display: 'grid', gap: 14 }}>
                {grouped[date].map((activity) => (
                  <ItemCard
                    key={activity.id}
                    onDelete={() => onDelete(activity.id)}
                    onEdit={() => onEdit(activity)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--forest)' }}>
                          {activity.title || 'Untitled activity'}
                        </h4>
                        <StatusBadge status={activity.status} />
                        {activity.start_time && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{fmtDateTime(activity.start_time)}</span>}
                        {activity.location && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>· {activity.location}</span>}
                        {activity.cost != null && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>· €{activity.cost.toFixed(2)}</span>}
                      </div>
                      {activity.description && (
                        <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem' }}>{activity.description}</p>
                      )}
                    </div>
                  </ItemCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ── FLIGHTS ───────────────────────────────────────────────────────────────────
function FlightsTab({ flights, onAdd, onEdit, onDelete }: {
  flights: Flight[]
  onAdd: () => void
  onEdit: (f: Flight) => void
  onDelete: (id: string) => void
}) {
  return (
    <>
      <SectionHeader title="Flights" onAdd={onAdd} />
      {flights.length === 0 ? <TabEmpty msg="No flights added" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {flights.map((f) => (
            <ItemCard key={f.id} onDelete={() => onDelete(f.id)} onEdit={() => onEdit(f)}>
              <div className="flight-route">
                <div className="flight-airport">
                  <p className="flight-airport__code">{f.origin}</p>
                  <p className="flight-airport__time">{fmtDateTime(f.departure_time)}</p>
                </div>
                <div className="flight-line">
                  <div className="flight-line__track">
                    <div className="flight-line__bar" />
                    <span style={{ fontSize: '0.9rem' }}>✈</span>
                    <div className="flight-line__bar" />
                  </div>
                  <span className="flight-line__airline">{f.airline ?? ''}</span>
                </div>
                <div className="flight-airport">
                  <p className="flight-airport__code">{f.destination}</p>
                  <p className="flight-airport__time">{fmtDateTime(f.arrival_time)}</p>
                </div>
              </div>
              <div className="flight-footer">
                <StatusBadge status={f.status} />
                {f.flight_number && <span>Flight: <strong>{f.flight_number}</strong></span>}
                {f.booking_reference && <span>Ref: <strong>{f.booking_reference}</strong></span>}
                {f.cost != null && <span className="flight-footer__cost">€ {f.cost.toFixed(2)}</span>}
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </>
  )
}

// ── ACCOMMODATIONS ────────────────────────────────────────────────────────────
function AccommodationsTab({ accommodations, onAdd, onEdit, onDelete }: {
  accommodations: Accommodation[]
  onAdd: () => void
  onEdit: (a: Accommodation) => void
  onDelete: (id: string) => void
}) {
  return (
    <>
      <SectionHeader title="Accommodations" onAdd={onAdd} />
      {accommodations.length === 0 ? <TabEmpty msg="No accommodations added" /> : (
        <div className="accom-grid">
          {accommodations.map((a) => (
            <ItemCard key={a.id} onDelete={() => onDelete(a.id)} onEdit={() => onEdit(a)}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <p style={{ fontWeight: 600, color: 'var(--forest)', margin: 0 }}>{a.name}</p>
                  <StatusBadge status={a.status} />
                </div>
                {a.accommodation_type && (
                  <span style={{
                    fontSize: '0.72rem', background: 'var(--mist)',
                    color: 'var(--forest-mid)', padding: '2px 8px',
                    borderRadius: 20, textTransform: 'capitalize',
                  }}>{a.accommodation_type}</span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.8 }}>
                {a.address && <p>📍 {a.address}</p>}
                <p>Check-in: <strong>{fmt(a.check_in)}</strong> · Check-out: <strong>{fmt(a.check_out)}</strong></p>
                {a.cost_per_night != null && (
                  <p>€ {a.cost_per_night}/night{a.total_cost != null ? ` · Total: € ${a.total_cost}` : ''}</p>
                )}
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </>
  )
}

// ── TRANSPORTS ────────────────────────────────────────────────────────────────
function TransportsTab({ transports, onAdd, onEdit, onDelete }: {
  transports: Transport[]
  onAdd: () => void
  onEdit: (t: Transport) => void
  onDelete: (id: string) => void
}) {
  const icons: Record<string, string> = {
    train: '🚂', bus: '🚌', car: '🚗', shuttle: '🚐', ferry: '⛴', taxi: '🚕', other: '🚀',
  }
  return (
    <>
      <SectionHeader title="Transports" onAdd={onAdd} />
      {transports.length === 0 ? <TabEmpty msg="No transports added" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {transports.map((t) => (
            <ItemCard key={t.id} onDelete={() => onDelete(t.id)} onEdit={() => onEdit(t)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: '1.6rem' }}>{icons[t.transport_type] ?? '🚀'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 600, color: 'var(--forest)', margin: 0 }}>{t.origin} → {t.destination}</p>
                    <StatusBadge status={t.status} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
                    {fmtDateTime(t.departure_time)}{t.operator ? ` · ${t.operator}` : ''}
                  </p>
                </div>
                {t.cost != null && (
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--forest)' }}>
                    € {t.cost.toFixed(2)}
                  </p>
                )}
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </>
  )
}

// ── EXPENSES ──────────────────────────────────────────────────────────────────
function ExpensesTab({ expenses, onAdd, onDelete }: {
  expenses: Expense[]
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  const total = expenses.reduce((s, e) => s + (e.amount ?? 0), 0)
  return (
    <>
      <SectionHeader title="Expenses" onAdd={onAdd} />
      {expenses.length > 0 && (
        <div style={{
          background: 'var(--forest)', borderRadius: 16, padding: '16px 20px',
          marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--mint)' }}>Total Expenses</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
            € {total.toFixed(2)}
          </span>
        </div>
      )}
      {expenses.length === 0 ? <TabEmpty msg="No expenses recorded" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {expenses.map((e) => (
            <ItemCard key={e.id} onDelete={() => onDelete(e.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--charcoal)' }}>{e.description ?? '—'}</p>
                  {e.category && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--sage)', textTransform: 'capitalize', marginTop: 2 }}>
                      {e.category}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 600, color: 'var(--forest)' }}>
                    {e.currency ?? '€'} {e.amount?.toFixed(2) ?? '—'}
                  </p>
                  {e.is_estimated && <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>estimated</p>}
                </div>
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </>
  )
}

// ── PACKING ───────────────────────────────────────────────────────────────────
function PackingTab({ items, onAdd, onDelete, onToggle }: {
  items: PackingItem[]
  onAdd: () => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}) {
  const total = items.length
  const checked = items.filter((i) => i.checked).length
  const grouped = PACKING_CATS.reduce<Record<string, PackingItem[]>>((acc, c) => {
    const list = items.filter((i) => i.category === c.value)
    if (list.length) acc[c.label] = list
    return acc
  }, {})
  const uncategorized = items.filter((i) => !i.category)
  if (uncategorized.length) grouped['Other'] = uncategorized

  return (
    <>
      <SectionHeader title="Packing List" onAdd={onAdd} />
      {total > 0 && (
        <div className="packing-progress">
          <span style={{ fontSize: '0.82rem', color: 'var(--forest-mid)' }}>{checked}/{total} items packed</span>
          <div className="packing-bar">
            <div className="packing-bar__fill" style={{ width: `${total ? (checked / total) * 100 : 0}%` }} />
          </div>
        </div>
      )}
      {items.length === 0 ? <TabEmpty msg="Packing list is empty" /> : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat}>
            <p className="packing-cat-label">{cat}</p>
            {catItems.map((item) => (
              <div
                key={item.id}
                className={`packing-item ${item.checked ? 'packing-item--checked' : ''}`}
                onClick={() => onToggle(item.id)}
              >
                <div className="packing-item__check">
                  {item.checked && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="packing-item__name">{item.name}</span>
                <button className="packing-item__del" onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}>×</button>
              </div>
            ))}
          </div>
        ))
      )}
    </>
  )
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function StatsTab({ stats }: { stats: TripStats | null }) {
  if (!stats) return <TabEmpty msg="Loading budget..." />
  const items = [
    { label: 'Flights',        value: stats.flights,       bg: '#eff6ff', color: '#1d4ed8' },
    { label: 'Transports',     value: stats.transport,     bg: '#fefce8', color: '#a16207' },
    { label: 'Accommodations', value: stats.accommodation, bg: '#faf5ff', color: '#7e22ce' },
    { label: 'Activities',     value: stats.activities,    bg: '#fff7ed', color: '#c2410c' },
    { label: 'Extra Expenses', value: stats.expenses,      bg: '#fdf2f8', color: '#be185d' },
  ]
  return (
    <>
      <div className="budget-total noise">
        <p className="budget-total__label">Total Estimated Budget</p>
        <p className="budget-total__amount">€ {stats.total.toFixed(2)}</p>
      </div>
      <div className="budget-grid">
        {items.map((item) => (
          <div key={item.label} className="budget-item" style={{ background: item.bg }}>
            <p className="budget-item__amount" style={{ color: item.color }}>€ {item.value.toFixed(2)}</p>
            <p className="budget-item__label" style={{ color: item.color }}>{item.label}</p>
          </div>
        ))}
      </div>
    </>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
type ModalType =
  | 'add-activity' | 'add-flight' | 'add-accommodation' | 'add-transport' | 'add-expense' | 'add-packing'
  | 'edit-activity' | 'edit-flight' | 'edit-accommodation' | 'edit-transport'
  | null

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()

  // ── Data state ──
  const [tab, setTab] = useState<Tab>('days')
  const [trip, setTrip] = useState<Trip | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [packingItems, setPackingItems] = useState<PackingItem[]>([])
  const [stats, setStats] = useState<TripStats | null>(null)

  // ── UI state ──
  const [modal, setModal] = useState<ModalType>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── Edit targets ──
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [editFlight, setEditFlight] = useState<Flight | null>(null)
  const [editAccommodation, setEditAccommodation] = useState<Accommodation | null>(null)
  const [editTransport, setEditTransport] = useState<Transport | null>(null)

  // ── Initial load ──
  useEffect(() => {
    if (!tripId) return
    Promise.all([
      getTrip(tripId), getActivities(tripId), getFlights(tripId),
      getAccommodations(tripId), getTransports(tripId),
      getExpenses(tripId), getPackingItems(tripId), getTripStats(tripId),
    ]).then(([t, act, f, a, tr, e, p, s]) => {
      setTrip(t); setActivities(act); setFlights(f)
      setAccommodations(a); setTransports(tr); setExpenses(e)
      setPackingItems(p); setStats(s)
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

  const handleAddExpense = async (data: ExpenseCreate) => {
    setSaving(true)
    try {
      const r = await createExpense(tripId, data)
      setExpenses((p) => [...p, r])
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

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(tripId, id)
    setExpenses((p) => p.filter((e) => e.id !== id))
  }

  const handleDeletePacking = async (id: string) => {
    await deletePackingItem(tripId, id)
    setPackingItems((p) => p.filter((i) => i.id !== id))
  }

  const handleTogglePacking = async (id: string) => {
    const updated = await togglePackingItem(tripId, id)
    setPackingItems((p) => p.map((i) => i.id === id ? updated : i))
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
            <>
              <h1 className="trip-header__title">{trip?.title}</h1>
              {trip?.destination && <p className="trip-header__meta">{trip.destination}</p>}
              {(trip?.start_date || trip?.end_date) && (
                <p className="trip-header__dates">
                  {fmtLong(trip?.start_date)}{trip?.end_date ? ` → ${fmtLong(trip?.end_date)}` : ''}
                </p>
              )}
            </>
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
        {tab === 'days' && <DaysTab tripId={tripId} dates={uniqueDates} />}

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

        {tab === 'expenses' && (
          <ExpensesTab
            expenses={expenses}
            onAdd={() => setModal('add-expense')}
            onDelete={handleDeleteExpense}
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
          <FlightForm
            loading={saving}
            onSubmit={handleAddFlight}
            minDateTime={tripMin}
            maxDateTime={tripMax}
          />
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
          <TransportForm
            loading={saving}
            onSubmit={handleAddTransport}
            minDateTime={tripMin}
            maxDateTime={tripMax}
          />
        </Modal>
      )}

      {modal === 'add-expense' && (
        <Modal title="Add Expense" onClose={closeModal}>
          <ExpenseForm loading={saving} onSubmit={handleAddExpense} />
        </Modal>
      )}

      {modal === 'add-packing' && (
        <Modal title="Add Item" onClose={closeModal}>
          <PackingForm loading={saving} onSubmit={handleAddPacking} />
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
          <FlightForm
            initial={editFlight}
            loading={saving}
            onSubmit={handleEditFlight}
            minDateTime={tripMin}
            maxDateTime={tripMax}
          />
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
          <TransportForm
            initial={editTransport}
            loading={saving}
            onSubmit={handleEditTransport}
            minDateTime={tripMin}
            maxDateTime={tripMax}
          />
        </Modal>
      )}
    </div>
  )
}
