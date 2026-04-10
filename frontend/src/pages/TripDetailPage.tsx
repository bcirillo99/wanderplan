// frontend/src/pages/TripDetailPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import FormField from '../components/FormField'
import StatusBadge from '../components/StatusBadge'
import { getTrip } from '../api/trips'
import { getDays, createDay, deleteDay } from '../api/days'
import { getFlights, createFlight, deleteFlight } from '../api/flights'
import { getAccommodations, createAccommodation, deleteAccommodation } from '../api/accommodations'
import { getTransports, createTransport, deleteTransport } from '../api/transports'
import { getExpenses, createExpense, deleteExpense } from '../api/expenses'
import { getPackingItems, createPackingItem, deletePackingItem, togglePackingItem } from '../api/packing_items'
import { getTripStats } from '../api/stats'
import type {
  Trip, Day, Flight, Accommodation, Transport, Expense, PackingItem, TripStats,
  Status, AccommodationType, TransportType, ExpenseCategory, PackingCategory,
  DayCreate, FlightCreate, AccommodationCreate, TransportCreate, ExpenseCreate, PackingItemCreate,
} from '../types'

// ── Options ───────────────────────────────────────────────────────────────────
const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'draft', label: 'Draft' }, { value: 'to_book', label: 'To Book' },
  { value: 'booked', label: 'Booked' }, { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]
const ACCOM_TYPES: { value: AccommodationType; label: string }[] = [
  { value: 'hotel', label: 'Hotel' }, { value: 'hostel', label: 'Hostel' },
  { value: 'airbnb', label: 'Airbnb' }, { value: 'lodge', label: 'Lodge' },
  { value: 'camping', label: 'Camping' }, { value: 'resort', label: 'Resort' },
  { value: 'apartment', label: 'Apartment' }, { value: 'other', label: 'Other' },
]
const TRANSPORT_TYPES: { value: TransportType; label: string }[] = [
  { value: 'train', label: 'Train' }, { value: 'bus', label: 'Bus' },
  { value: 'car', label: 'Car' }, { value: 'shuttle', label: 'Shuttle' },
  { value: 'ferry', label: 'Ferry' }, { value: 'taxi', label: 'Taxi' }, { value: 'other', label: 'Other' },
]
const EXPENSE_CATS: { value: ExpenseCategory; label: string }[] = [
  { value: 'accommodation', label: 'Accommodation' }, { value: 'transport', label: 'Transport' },
  { value: 'activity', label: 'Activity' }, { value: 'food', label: 'Food' },
  { value: 'shopping', label: 'Shopping' }, { value: 'other', label: 'Other' },
]
const PACKING_CATS: { value: PackingCategory; label: string }[] = [
  { value: 'documents', label: 'Documents' }, { value: 'clothing', label: 'Clothing' },
  { value: 'medicine', label: 'Medicine' }, { value: 'technology', label: 'Technology' },
  { value: 'extras', label: 'Extras' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

type Tab = 'days' | 'flights' | 'accommodations' | 'transports' | 'expenses' | 'packing' | 'stats'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'days',           label: 'Days',    icon: '📅' },
  { id: 'flights',        label: 'Flights',      icon: '✈️' },
  { id: 'accommodations', label: 'Accommodations',   icon: '🏨' },
  { id: 'transports',     label: 'Transports', icon: '🚌' },
  { id: 'expenses',       label: 'Expenses',     icon: '💰' },
  { id: 'packing',        label: 'Packing',   icon: '🎒' },
  { id: 'stats',          label: 'Budget',    icon: '📊' },
]

// ── Shared: Section header + Item card ───────────────────────────────────────
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

function ItemCard({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="item-card">
      <button className="item-card__delete" onClick={onDelete} title="Delete">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      {children}
    </div>
  )
}

function TabEmpty({ msg }: { msg: string }) {
  return <div className="tab-empty">{msg}</div>
}

// ── DAYS ─────────────────────────────────────────────────────────────────────
function DaysTab({ tripId, days, onDelete, onAdd }: {
  tripId: string; days: Day[]; onDelete: (id: string) => void; onAdd: () => void
}) {
  const navigate = useNavigate()
  return (
    <>
      <SectionHeader title="Trip Days" onAdd={onAdd} />
      {days.length === 0 ? <TabEmpty msg="No days added" /> : (
        <div className="trips-grid">
          {days.map((d) => (
            <ItemCard key={d.id} onDelete={() => onDelete(d.id)}>
              <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/trips/${tripId}/days/${d.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--mist)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', color: 'var(--forest)', flexShrink: 0 }}>
                    {new Date(d.day_date).getDate()}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--forest-mid)', fontWeight: 500 }}>{fmt(d.day_date)}</span>
                </div>
                {d.location && <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--forest)', marginBottom: 4 }}>{d.location}</p>}
                {d.notes && <p style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.4 }}>{d.notes}</p>}
                <p style={{ fontSize: '0.75rem', color: 'var(--sage)', marginTop: 10 }}>Tap for activities →</p>
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </>
  )
}

// ── FLIGHTS ───────────────────────────────────────────────────────────────────
function FlightsTab({ flights, onDelete, onAdd }: {
  flights: Flight[]; onDelete: (id: string) => void; onAdd: () => void
}) {
  return (
    <>
      <SectionHeader title="Flights" onAdd={onAdd} />
      {flights.length === 0 ? <TabEmpty msg="No flights added" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {flights.map((f) => (
            <ItemCard key={f.id} onDelete={() => onDelete(f.id)}>
              <div className="flight-route">
                <div className="flight-airport">
                  <p className="flight-airport__code">{f.origin}</p>
                  <p className="flight-airport__time">{fmtTime(f.departure_time)}</p>
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
                  <p className="flight-airport__time">{fmtTime(f.arrival_time)}</p>
                </div>
                <StatusBadge status={f.status} />
              </div>
              <div className="flight-footer">
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
function AccommodationsTab({ accommodations, onDelete, onAdd }: {
  accommodations: Accommodation[]; onDelete: (id: string) => void; onAdd: () => void
}) {
  return (
    <>
      <SectionHeader title="Accommodations" onAdd={onAdd} />
      {accommodations.length === 0 ? <TabEmpty msg="No accommodations added" /> : (
        <div className="accom-grid">
          {accommodations.map((a) => (
            <ItemCard key={a.id} onDelete={() => onDelete(a.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--forest)', marginBottom: 4 }}>{a.name}</p>
                  {a.accommodation_type && (
                    <span style={{ fontSize: '0.72rem', background: 'var(--mist)', color: 'var(--forest-mid)', padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{a.accommodation_type}</span>
                  )}
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.8 }}>
                {a.address && <p>📍 {a.address}</p>}
                <p>Check-in: <strong>{fmt(a.check_in)}</strong> · Check-out: <strong>{fmt(a.check_out)}</strong></p>
                {a.cost_per_night != null && <p>€ {a.cost_per_night}/night{a.total_cost != null ? ` · Total: € ${a.total_cost}` : ''}</p>}
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </>
  )
}

// ── TRANSPORTS ────────────────────────────────────────────────────────────────
function TransportsTab({ transports, onDelete, onAdd }: {
  transports: Transport[]; onDelete: (id: string) => void; onAdd: () => void
}) {
  const icons: Record<string, string> = { train: '🚂', bus: '🚌', car: '🚗', shuttle: '🚐', ferry: '⛴', taxi: '🚕', other: '🚀' }
  return (
    <>
      <SectionHeader title="Transports" onAdd={onAdd} />
      {transports.length === 0 ? <TabEmpty msg="No transports added" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {transports.map((t) => (
            <ItemCard key={t.id} onDelete={() => onDelete(t.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: '1.6rem' }}>{icons[t.transport_type] ?? '🚀'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: 'var(--forest)' }}>{t.origin} → {t.destination}</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
                    {fmtTime(t.departure_time)} {t.operator ? `· ${t.operator}` : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={t.status} />
                  {t.cost != null && <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--forest)', marginTop: 4 }}>€ {t.cost.toFixed(2)}</p>}
                </div>
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </>
  )
}

// ── EXPENSES ──────────────────────────────────────────────────────────────────
function ExpensesTab({ expenses, onDelete, onAdd }: {
  expenses: Expense[]; onDelete: (id: string) => void; onAdd: () => void
}) {
  const total = expenses.reduce((s, e) => s + (e.amount ?? 0), 0)
  return (
    <>
      <SectionHeader title="Expenses" onAdd={onAdd} />
      {expenses.length > 0 && (
        <div style={{ background: 'var(--forest)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--mint)' }}>Total Expenses</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>€ {total.toFixed(2)}</span>
        </div>
      )}
      {expenses.length === 0 ? <TabEmpty msg="No expenses recorded" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {expenses.map((e) => (
            <ItemCard key={e.id} onDelete={() => onDelete(e.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--charcoal)' }}>{e.description ?? '—'}</p>
                  {e.category && <p style={{ fontSize: '0.72rem', color: 'var(--sage)', textTransform: 'capitalize', marginTop: 2 }}>{e.category}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 600, color: 'var(--forest)' }}>{e.currency ?? '€'} {e.amount?.toFixed(2) ?? '—'}</p>
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
function PackingTab({ items, onDelete, onAdd, onToggle }: {
  items: PackingItem[]; onDelete: (id: string) => void; onAdd: () => void; onToggle: (id: string) => void
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
            <div className="packing-bar__fill" style={{ width: `${total ? (checked/total)*100 : 0}%` }} />
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
    { label: 'Flights',       value: stats.flights,       bg: '#eff6ff', color: '#1d4ed8' },
    { label: 'Transports',  value: stats.transport,     bg: '#fefce8', color: '#a16207' },
    { label: 'Accommodations',    value: stats.accommodation, bg: '#faf5ff', color: '#7e22ce' },
    { label: 'Activities',   value: stats.activities,    bg: '#fff7ed', color: '#c2410c' },
    { label: 'Extra Expenses',value: stats.expenses,      bg: '#fdf2f8', color: '#be185d' },
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

// ── ADD FORMS ─────────────────────────────────────────────────────────────────
function AddDayForm({ onSubmit, loading, minDate, maxDate }: { onSubmit: (d: DayCreate) => void; loading: boolean; minDate?: string; maxDate?: string }) {
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  return (
    <div className="form-stack">
      <FormField label="Date" type="input" inputType="date" value={date} onChange={setDate} required min={minDate} max={maxDate} />
      <FormField label="Location" type="input" value={location} onChange={setLocation} placeholder="e.g. Rome" />
      <FormField label="Notes" type="textarea" value={notes} onChange={setNotes} rows={2} />
      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => date && onSubmit({ day_date: date, location: location || null, notes: notes || null })}
        disabled={loading || !date}>
        {loading ? 'Saving...' : 'Add Day'}
      </button>
    </div>
  )
}

function AddFlightForm({ onSubmit, loading, minDateTime, maxDateTime }: { onSubmit: (f: FlightCreate) => void; loading: boolean; minDateTime?: string; maxDateTime?: string }) {
  const [origin, setOrigin] = useState(''); const [dest, setDest] = useState('')
  const [dep, setDep] = useState(''); const [arr, setArr] = useState('')
  const [airline, setAirline] = useState(''); const [flightNo, setFlightNo] = useState('')
  const [cost, setCost] = useState(''); const [status, setStatus] = useState<Status>('to_book')
  const [ref, setRef] = useState('')
  return (
    <div className="form-stack">
      <div className="form-grid-2">
        <FormField label="Origin" type="input" value={origin} onChange={setOrigin} placeholder="MXP" required />
        <FormField label="Destination" type="input" value={dest} onChange={setDest} placeholder="NRT" required />
      </div>
      <div className="form-grid-2">
        <FormField label="Departure" type="input" inputType="datetime-local" value={dep} onChange={setDep} min={minDateTime} max={maxDateTime} />
        <FormField label="Arrival" type="input" inputType="datetime-local" value={arr} onChange={setArr} min={dep || minDateTime} max={maxDateTime} />
      </div>
      <div className="form-grid-2">
        <FormField label="Airline" type="input" value={airline} onChange={setAirline} placeholder="Ryanair" />
        <FormField label="Flight No." type="input" value={flightNo} onChange={setFlightNo} placeholder="FR1234" />
      </div>
      <div className="form-grid-2">
        <FormField label="Cost (€)" type="input" inputType="number" value={cost} onChange={setCost} />
        <FormField label="Status" type="select" value={status} onChange={(v) => setStatus(v as Status)} options={STATUS_OPTIONS} />
      </div>
      <FormField label="Booking Ref" type="input" value={ref} onChange={setRef} placeholder="ABC123" />
      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => origin && dest && onSubmit({ origin, destination: dest, departure_time: dep || null, arrival_time: arr || null, airline: airline || null, flight_number: flightNo || null, cost: cost ? parseFloat(cost) : null, status, booking_reference: ref || null, baggage_included: null, pay_method: null, link: null, notes: null })}
        disabled={loading || !origin || !dest}>
        {loading ? 'Saving...' : 'Add Flight'}
      </button>
    </div>
  )
}

function AddAccommodationForm({ onSubmit, loading, minDate, maxDate }: { onSubmit: (a: AccommodationCreate) => void; loading: boolean; minDate?: string; maxDate?: string }) {
  const [name, setName] = useState(''); const [type, setType] = useState<AccommodationType | ''>('')
  const [address, setAddress] = useState(''); const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState(''); const [costPerNight, setCost] = useState('')
  const [status, setStatus] = useState<Status>('to_book'); const [ref, setRef] = useState('')
  return (
    <div className="form-stack">
      <FormField label="Property Name" type="input" value={name} onChange={setName} placeholder="Hotel Negresco" required />
      <div className="form-grid-2">
        <FormField label="Type" type="select" value={type} onChange={(v) => setType(v as AccommodationType)} options={ACCOM_TYPES} />
        <FormField label="Status" type="select" value={status} onChange={(v) => setStatus(v as Status)} options={STATUS_OPTIONS} />
      </div>
      <FormField label="Address" type="input" value={address} onChange={setAddress} placeholder="123 Main St" />
      <div className="form-grid-2">
        <FormField label="Check-in" type="input" inputType="date" value={checkIn} onChange={setCheckIn} min={minDate} max={maxDate} />
        <FormField label="Check-out" type="input" inputType="date" value={checkOut} onChange={setCheckOut} min={checkIn || minDate} max={maxDate} />
      </div>
      <div className="form-grid-2">
        <FormField label="Cost/Night (€)" type="input" inputType="number" value={costPerNight} onChange={setCost} />
        <FormField label="Booking Ref" type="input" value={ref} onChange={setRef} placeholder="ABC123" />
      </div>
      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => name && onSubmit({ name, accommodation_type: type as AccommodationType || null, address: address || null, location: null, check_in: checkIn || null, check_out: checkOut || null, cost_per_night: costPerNight ? parseFloat(costPerNight) : null, status, pay_method: null, cancellation_date: null, link: null, extra_details: null, booking_reference: ref || null, notes: null })}
        disabled={loading || !name}>
        {loading ? 'Saving...' : 'Add Accommodation'}
      </button>
    </div>
  )
}

function AddTransportForm({ onSubmit, loading, minDateTime, maxDateTime }: { onSubmit: (t: TransportCreate) => void; loading: boolean; minDateTime?: string; maxDateTime?: string }) {
  const [type, setType] = useState<TransportType>('train')
  const [origin, setOrigin] = useState(''); const [dest, setDest] = useState('')
  const [dep, setDep] = useState(''); const [arr, setArr] = useState('')
  const [operator, setOperator] = useState(''); const [cost, setCost] = useState('')
  const [status, setStatus] = useState<Status>('to_book')
  return (
    <div className="form-stack">
      <FormField label="Type" type="select" value={type} onChange={(v) => setType(v as TransportType)} options={TRANSPORT_TYPES} />
      <div className="form-grid-2">
        <FormField label="From" type="input" value={origin} onChange={setOrigin} placeholder="Rome" required />
        <FormField label="To" type="input" value={dest} onChange={setDest} placeholder="Naples" required />
      </div>
      <div className="form-grid-2">
        <FormField label="Departure" type="input" inputType="datetime-local" value={dep} onChange={setDep} min={minDateTime} max={maxDateTime} />
        <FormField label="Arrival" type="input" inputType="datetime-local" value={arr} onChange={setArr} min={dep || minDateTime} max={maxDateTime} />
      </div>
      <div className="form-grid-2">
        <FormField label="Operator" type="input" value={operator} onChange={setOperator} placeholder="Trenitalia" />
        <FormField label="Cost (€)" type="input" inputType="number" value={cost} onChange={setCost} />
      </div>
      <FormField label="Status" type="select" value={status} onChange={(v) => setStatus(v as Status)} options={STATUS_OPTIONS} />
      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => origin && dest && onSubmit({ transport_type: type, origin, destination: dest, departure_time: dep || null, arrival_time: arr || null, operator: operator || null, cost: cost ? parseFloat(cost) : null, status, pay_method: null, link: null, booking_reference: null, extra_details: null, notes: null })}
        disabled={loading || !origin || !dest}>
        {loading ? 'Saving...' : 'Add Transport'}
      </button>
    </div>
  )
}

function AddExpenseForm({ onSubmit, loading }: { onSubmit: (e: ExpenseCreate) => void; loading: boolean }) {
  const [desc, setDesc] = useState(''); const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory | ''>('')
  const [currency, setCurrency] = useState('EUR'); const [isEstimated, setIsEstimated] = useState(false)
  return (
    <div className="form-stack">
      <FormField label="Description" type="input" value={desc} onChange={setDesc} placeholder="Restaurant dinner" />
      <div className="form-grid-2">
        <FormField label="Amount" type="input" inputType="number" value={amount} onChange={setAmount} required />
        <FormField label="Currency" type="input" value={currency} onChange={setCurrency} placeholder="EUR" />
      </div>
      <FormField label="Category" type="select" value={category} onChange={(v) => setCategory(v as ExpenseCategory)} options={EXPENSE_CATS} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--forest-mid)', cursor: 'pointer' }}>
        <input type="checkbox" checked={isEstimated} onChange={(e) => setIsEstimated(e.target.checked)} />
        Estimated Amount
      </label>
      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => amount && onSubmit({ description: desc || null, amount: parseFloat(amount), category: category as ExpenseCategory || null, currency: currency || null, is_estimated: isEstimated, actual_amount: null, notes: null })}
        disabled={loading || !amount}>
        {loading ? 'Saving...' : 'Add Expense'}
      </button>
    </div>
  )
}

function AddPackingForm({ onSubmit, loading }: { onSubmit: (p: PackingItemCreate) => void; loading: boolean }) {
  const [name, setName] = useState(''); const [category, setCategory] = useState<PackingCategory | ''>('')
  return (
    <div className="form-stack">
      <FormField label="Item" type="input" value={name} onChange={setName} placeholder="Passport" required />
      <FormField label="Category" type="select" value={category} onChange={(v) => setCategory(v as PackingCategory)} options={PACKING_CATS} />
      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => name && onSubmit({ name, category: category as PackingCategory || null, notes: null })}
        disabled={loading || !name}>
        {loading ? 'Saving...' : 'Add Item'}
      </button>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [tab, setTab] = useState<Tab>('days')
  const [trip, setTrip] = useState<Trip | null>(null)
  const [days, setDays] = useState<Day[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [packingItems, setPackingItems] = useState<PackingItem[]>([])
  const [stats, setStats] = useState<TripStats | null>(null)
  const [modal, setModal] = useState<Tab | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId) return
    Promise.all([
      getTrip(tripId), getDays(tripId), getFlights(tripId),
      getAccommodations(tripId), getTransports(tripId),
      getExpenses(tripId), getPackingItems(tripId), getTripStats(tripId),
    ]).then(([t, d, f, a, tr, e, p, s]) => {
      setTrip(t); setDays(d); setFlights(f); setAccommodations(a)
      setTransports(tr); setExpenses(e); setPackingItems(p); setStats(s)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [tripId])

  if (!tripId) return null

  const fmtLong = (d?: string | null) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const bgStyle = trip?.cover_image
    ? { backgroundImage: `url(${trip.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, var(--forest) 0%, var(--forest-light) 100%)' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)' }}>
      <Navbar />

      {/* Header */}
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

      {/* Content */}
      <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {tab === 'days' && (
          <DaysTab tripId={tripId} days={days}
            onDelete={async (id) => { await deleteDay(tripId, id); setDays((p) => p.filter((d) => d.id !== id)) }}
            onAdd={() => setModal('days')} />
        )}
        {tab === 'flights' && (
          <FlightsTab flights={flights}
            onDelete={async (id) => { await deleteFlight(tripId, id); setFlights((p) => p.filter((f) => f.id !== id)) }}
            onAdd={() => setModal('flights')} />
        )}
        {tab === 'accommodations' && (
          <AccommodationsTab accommodations={accommodations}
            onDelete={async (id) => { await deleteAccommodation(tripId, id); setAccommodations((p) => p.filter((a) => a.id !== id)) }}
            onAdd={() => setModal('accommodations')} />
        )}
        {tab === 'transports' && (
          <TransportsTab transports={transports}
            onDelete={async (id) => { await deleteTransport(tripId, id); setTransports((p) => p.filter((t) => t.id !== id)) }}
            onAdd={() => setModal('transports')} />
        )}
        {tab === 'expenses' && (
          <ExpensesTab expenses={expenses}
            onDelete={async (id) => { await deleteExpense(tripId, id); setExpenses((p) => p.filter((e) => e.id !== id)) }}
            onAdd={() => setModal('expenses')} />
        )}
        {tab === 'packing' && (
          <PackingTab items={packingItems}
            onDelete={async (id) => { await deletePackingItem(tripId, id); setPackingItems((p) => p.filter((i) => i.id !== id)) }}
            onAdd={() => setModal('packing')}
            onToggle={async (id) => {
              const updated = await togglePackingItem(tripId, id)
              setPackingItems((p) => p.map((i) => i.id === id ? updated : i))
            }} />
        )}
        {tab === 'stats' && <StatsTab stats={stats} />}
      </main>

      {/* Add Modals */}
      {modal === 'days' && (
        <Modal title="Add Day" onClose={() => setModal(null)}>
          <AddDayForm
            loading={saving}
            minDate={trip?.start_date ?? undefined}
            maxDate={trip?.end_date ?? undefined}
            onSubmit={async (d) => { setSaving(true); try { const r = await createDay(tripId, d); setDays((p) => [...p, r]); setModal(null) } finally { setSaving(false) } }}
          />
        </Modal>
      )}
      {modal === 'flights' && (
        <Modal title="Add Flight" onClose={() => setModal(null)} size="lg">
          <AddFlightForm
            loading={saving}
            minDateTime={trip?.start_date ? `${trip.start_date}T00:00` : undefined}
            maxDateTime={trip?.end_date ? `${trip.end_date}T23:59` : undefined}
            onSubmit={async (f) => { setSaving(true); try { const r = await createFlight(tripId, f); setFlights((p) => [...p, r]); setModal(null) } finally { setSaving(false) } }}
          />
        </Modal>
      )}
      {modal === 'accommodations' && (
        <Modal title="Add Accommodation" onClose={() => setModal(null)} size="lg">
          <AddAccommodationForm
            loading={saving}
            minDate={trip?.start_date ?? undefined}
            maxDate={trip?.end_date ?? undefined}
            onSubmit={async (a) => { setSaving(true); try { const r = await createAccommodation(tripId, a); setAccommodations((p) => [...p, r]); setModal(null) } finally { setSaving(false) } }}
          />
        </Modal>
      )}
      {modal === 'transports' && (
        <Modal title="Add Transport" onClose={() => setModal(null)}>
          <AddTransportForm
            loading={saving}
            minDateTime={trip?.start_date ? `${trip.start_date}T00:00` : undefined}
            maxDateTime={trip?.end_date ? `${trip.end_date}T23:59` : undefined}
            onSubmit={async (t) => { setSaving(true); try { const r = await createTransport(tripId, t); setTransports((p) => [...p, r]); setModal(null) } finally { setSaving(false) } }}
          />
        </Modal>
      )}
      {modal === 'expenses' && (
        <Modal title="Add Expense" onClose={() => setModal(null)}>
          <AddExpenseForm loading={saving} onSubmit={async (e) => { setSaving(true); try { const r = await createExpense(tripId, e); setExpenses((p) => [...p, r]); setModal(null) } finally { setSaving(false) } }} />
        </Modal>
      )}
      {modal === 'packing' && (
        <Modal title="Add Item" onClose={() => setModal(null)}>
          <AddPackingForm loading={saving} onSubmit={async (p) => { setSaving(true); try { const r = await createPackingItem(tripId, p); setPackingItems((p2) => [...p2, r]); setModal(null) } finally { setSaving(false) } }} />
        </Modal>
      )}
    </div>
  )
}
