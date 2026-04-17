// frontend/src/components/forms/Forms.tsx
import { useEffect, useState } from 'react'
import FormField from '../FormField'
import type {
  Activity, ActivityCreate,
  Accommodation, AccommodationCreate,
  Flight, FlightCreate,
  Transport, TransportCreate,
  ExtraCreate,
  PackingItemCreate,
  TripCreate,
  Note, NoteCreate,
  Status, AccommodationType, TransportType, ExtraCategory, PackingCategory,
} from '../../types'

// ── Options ───────────────────────────────────────────────────────────────────
export const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'to_book', label: 'To Book' },
  { value: 'booked', label: 'Booked' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]

export const ACCOM_TYPES: { value: AccommodationType; label: string }[] = [
  { value: 'hotel', label: 'Hotel' }, { value: 'hostel', label: 'Hostel' },
  { value: 'airbnb', label: 'Airbnb' }, { value: 'lodge', label: 'Lodge' },
  { value: 'camping', label: 'Camping' }, { value: 'resort', label: 'Resort' },
  { value: 'apartment', label: 'Apartment' }, { value: 'other', label: 'Other' },
]

export const TRANSPORT_TYPES: { value: TransportType; label: string }[] = [
  { value: 'train', label: 'Train' }, { value: 'bus', label: 'Bus' },
  { value: 'car', label: 'Car' }, { value: 'shuttle', label: 'Shuttle' },
  { value: 'ferry', label: 'Ferry' }, { value: 'taxi', label: 'Taxi' },
  { value: 'other', label: 'Other' },
]

export const EXTRA_CATS: { value: ExtraCategory; label: string }[] = [
  { value: 'accommodation', label: 'Accommodation' }, { value: 'transport', label: 'Transport' },
  { value: 'activities', label: 'Activities' }, { value: 'food', label: 'Food' },
  { value: 'shopping', label: 'Shopping' }, { value: 'other', label: 'Other' },
]

export const PACKING_CATS: { value: PackingCategory; label: string }[] = [
  { value: 'documents', label: 'Documents' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'technology', label: 'Technology' },
  { value: 'toiletries', label: 'Toiletries' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'food', label: 'Food' },
  { value: 'comfort', label: 'Comfort' },
  { value: 'extras', label: 'Extras' },
]

// ── TripForm ──────────────────────────────────────────────────────────────────
type TripFormProps = {
  initial?: Partial<TripCreate>
  onSubmit: (data: TripCreate) => void
  loading: boolean
}

export function TripForm({ initial, onSubmit, loading }: TripFormProps) {
  const [title, setTitle]      = useState(initial?.title ?? '')
  const [destination, setDest] = useState(initial?.destination ?? '')
  const [description, setDesc] = useState(initial?.description ?? '')
  const [startDate, setStart]  = useState(initial?.start_date ?? '')
  const [endDate, setEnd]      = useState(initial?.end_date ?? '')
  const [coverImage, setCover] = useState(initial?.cover_image ?? '')

  return (
    <div className="form-stack">
      <FormField label="Trip Title" type="input" value={title} onChange={setTitle} placeholder="e.g. Japanese Adventure" required />
      <FormField label="Destination" type="input" value={destination} onChange={setDest} placeholder="e.g. Tokyo, Kyoto" />
      <div className="form-grid-2">
        <FormField label="Start Date" type="input" inputType="date" value={startDate} onChange={setStart} max={endDate || undefined} required />
        <FormField label="End Date" type="input" inputType="date" value={endDate} onChange={setEnd} min={startDate || undefined} required />
      </div>
      <FormField label="Description" type="textarea" value={description} onChange={setDesc} placeholder="Trip notes..." rows={2} />
      <FormField label="Cover Image URL" type="input" value={coverImage} onChange={setCover} placeholder="https://images.unsplash.com/..." />
      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
        onClick={() => title.trim() && onSubmit({ title: title.trim(), destination: destination || null, description: description || null, start_date: startDate || null, end_date: endDate || null, cover_image: coverImage || null })}
        disabled={loading || !title.trim() || !startDate || !endDate}
      >
        {loading ? 'Saving...' : 'Save Trip'}
      </button>
    </div>
  )
}

// ── ActivityForm ──────────────────────────────────────────────────────────────
type ActivityFormProps = {
  initial?: Partial<Activity>
  onSubmit: (data: ActivityCreate) => void
  loading: boolean
  showDayPicker?: boolean
  lockDate?: boolean
  tripStartDate?: string | null
  tripEndDate?: string | null
}

export function ActivityForm({
  initial,
  onSubmit,
  loading,
  showDayPicker = true,
  lockDate = false,
  tripStartDate,
  tripEndDate,
}: ActivityFormProps) {
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

  const isValid = !loading && activityDate && title

  const handleSubmit = () => {
    onSubmit({
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
    })
  }

  return (
    <div className="form-stack">
      {showDayPicker && (
        lockDate && activityDate ? (
          <div className="form-group">
            <label className="form-label">Date</label>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--forest)', padding: '10px 0' }}>
              {new Date(activityDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        ) : (
          <FormField
            label="Date"
            type="input"
            inputType="date"
            value={activityDate}
            onChange={setActivityDate}
            min={tripStartDate ?? undefined}
            max={tripEndDate ?? undefined}
            required
          />
        )
      )}
      <FormField label="Title" type="input" value={title} onChange={setTitle} placeholder="Visit to the Colosseum" required />
      <FormField label="Description" type="textarea" value={description} onChange={setDesc} rows={2} />
      <div className="form-grid-2">
        <FormField label="Start Time" type="input" inputType="time" value={startTime} onChange={setStart} />
        <FormField label="End Time" type="input" inputType="time" value={endTime} onChange={setEnd} />
      </div>
      <div className="form-grid-2">
        <FormField label="Location" type="input" value={location} onChange={setLocation} placeholder="Via Sacra, Rome" />
        <FormField label="Cost (€)" type="input" inputType="number" value={cost} onChange={setCost} />
      </div>
      <FormField label="Status" type="select" value={status} onChange={(v) => setStatus(v as Status)} options={STATUS_OPTIONS} />
      <FormField label="Link" type="input" value={link} onChange={setLink} placeholder="https://..." />
      <FormField label="Notes" type="textarea" value={notes} onChange={setNotes} rows={2} />
      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={handleSubmit}
        disabled={!isValid}
      >
        {loading ? 'Saving...' : initial?.id ? 'Update Activity' : 'Add Activity'}
      </button>
    </div>
  )
}

// ── AccommodationForm ─────────────────────────────────────────────────────────
type AccommodationFormProps = {
  initial?: Partial<Accommodation>
  onSubmit: (data: AccommodationCreate) => void
  loading: boolean
  minDate?: string
  maxDate?: string
}

export function AccommodationForm({ initial, onSubmit, loading, minDate, maxDate }: AccommodationFormProps) {
  const [name, setName]           = useState(initial?.name ?? '')
  const [type, setType]           = useState<AccommodationType | ''>(initial?.accommodation_type ?? '')
  const [address, setAddress]     = useState(initial?.address ?? '')
  const [checkIn, setCheckIn]     = useState(initial?.check_in ?? '')
  const [checkOut, setCheckOut]   = useState(initial?.check_out ?? '')
  const [costPerNight, setCost]   = useState(initial?.cost_per_night?.toString() ?? '')
  const [status, setStatus]       = useState<Status>(initial?.status ?? 'to_book')
  const [ref, setRef]             = useState(initial?.booking_reference ?? '')

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
        {loading ? 'Saving...' : initial?.id ? 'Update Accommodation' : 'Add Accommodation'}
      </button>
    </div>
  )
}

// ── FlightForm ────────────────────────────────────────────────────────────────
type FlightFormProps = {
  initial?: Partial<Flight>
  onSubmit: (data: FlightCreate) => void
  loading: boolean
  minDateTime?: string
  maxDateTime?: string
}

export function FlightForm({ initial, onSubmit, loading, minDateTime, maxDateTime }: FlightFormProps) {
  const [origin, setOrigin]   = useState(initial?.origin ?? '')
  const [dest, setDest]       = useState(initial?.destination ?? '')
  const [dep, setDep]         = useState(initial?.departure_time ?? '')
  const [arr, setArr]         = useState(initial?.arrival_time ?? '')
  const [airline, setAirline] = useState(initial?.airline ?? '')
  const [flightNo, setFlightNo] = useState(initial?.flight_number ?? '')
  const [cost, setCost]       = useState(initial?.cost?.toString() ?? '')
  const [status, setStatus]   = useState<Status>(initial?.status ?? 'to_book')
  const [ref, setRef]         = useState(initial?.booking_reference ?? '')

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
        {loading ? 'Saving...' : initial?.id ? 'Update Flight' : 'Add Flight'}
      </button>
    </div>
  )
}

// ── TransportForm ─────────────────────────────────────────────────────────────
type TransportFormProps = {
  initial?: Partial<Transport>
  onSubmit: (data: TransportCreate) => void
  loading: boolean
  minDateTime?: string
  maxDateTime?: string
}

export function TransportForm({ initial, onSubmit, loading, minDateTime, maxDateTime }: TransportFormProps) {
  const [type, setType]         = useState<TransportType>(initial?.transport_type ?? 'train')
  const [origin, setOrigin]     = useState(initial?.origin ?? '')
  const [dest, setDest]         = useState(initial?.destination ?? '')
  const [dep, setDep]           = useState(initial?.departure_time ?? '')
  const [arr, setArr]           = useState(initial?.arrival_time ?? '')
  const [operator, setOperator] = useState(initial?.operator ?? '')
  const [cost, setCost]         = useState(initial?.cost?.toString() ?? '')
  const [status, setStatus]     = useState<Status>(initial?.status ?? 'to_book')

  useEffect(() => {
    if (initial) {
      setType(initial.transport_type ?? 'train')
      setOrigin(initial.origin ?? '')
      setDest(initial.destination ?? '')
      setDep(initial.departure_time ?? '')
      setArr(initial.arrival_time ?? '')
      setOperator(initial.operator ?? '')
      setCost(initial.cost?.toString() ?? '')
      setStatus(initial.status ?? 'to_book')
    }
  }, [initial])

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
        {loading ? 'Saving...' : initial?.id ? 'Update Transport' : 'Add Transport'}
      </button>
    </div>
  )
}

// ── ExtraForm ─────────────────────────────────────────────────────────────────
type ExtraFormProps = {
  onSubmit: (data: ExtraCreate) => void
  loading: boolean
}

export function ExtraForm({ onSubmit, loading }: ExtraFormProps) {
  const [desc, setDesc]           = useState('')
  const [amount, setAmount]       = useState('')
  const [category, setCategory]   = useState<ExtraCategory | ''>('')
  const [currency, setCurrency]   = useState('EUR')
  const [isEstimated, setIsEst]   = useState(false)

  return (
    <div className="form-stack">
      <FormField label="Description" type="input" value={desc} onChange={setDesc} placeholder="Visa fee, travel insurance…" required />
      <div className="form-grid-2">
        <FormField label="Amount" type="input" inputType="number" value={amount} onChange={setAmount} required />
        <FormField label="Currency" type="input" value={currency} onChange={setCurrency} placeholder="EUR" />
      </div>
      <FormField label="Category" type="select" value={category} onChange={(v) => setCategory(v as ExtraCategory)} options={EXTRA_CATS} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--forest-mid)', cursor: 'pointer' }}>
        <input type="checkbox" checked={isEstimated} onChange={(e) => setIsEst(e.target.checked)} />
        Estimated Amount
      </label>
      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => amount && desc.trim() && onSubmit({ description: desc.trim(), amount: parseFloat(amount), category: category as ExtraCategory || null, currency: currency || null, is_estimated: isEstimated, actual_amount: null, notes: null })}
        disabled={loading || !amount || !desc.trim()}>
        {loading ? 'Saving...' : 'Add Extra'}
      </button>
    </div>
  )
}

// ── PackingForm ───────────────────────────────────────────────────────────────
type PackingFormProps = {
  onSubmit: (data: PackingItemCreate) => void
  loading: boolean
}

export function PackingForm({ onSubmit, loading }: PackingFormProps) {
  const [name, setName]         = useState('')
  const [category, setCategory] = useState<PackingCategory | ''>('')

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

// ── NoteForm ──────────────────────────────────────────────────────────────────
type NoteFormProps = {
  initial?: Partial<Note>
  onSubmit: (data: NoteCreate) => void
  loading: boolean
}

export function NoteForm({ initial, onSubmit, loading }: NoteFormProps) {
  const [text, setText] = useState(initial?.text ?? '')

  useEffect(() => {
    if (initial) setText(initial.text ?? '')
  }, [initial])

  return (
    <div className="form-stack">
      <FormField label="Note" type="textarea" value={text} onChange={setText} placeholder="Write your note..." rows={4} required />
      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
        onClick={() => text.trim() && onSubmit({ text: text.trim() })}
        disabled={loading || !text.trim()}
      >
        {loading ? 'Saving...' : 'Save Note'}
      </button>
    </div>
  )
}