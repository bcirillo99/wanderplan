import { useState } from 'react'
import FormField from '../FormField'
import type { Accommodation, AccommodationCreate, AccommodationType, Status } from '../../types'
import { ACCOM_TYPES, STATUS_OPTIONS } from './tripOptions'


type AccommodationFormProps = {
  initial?: Partial<Accommodation>
  onSubmit: (data: AccommodationCreate) => void
  loading: boolean
  minDate?: string
  maxDate?: string
}

export default function AddAccommodationForm({ initial, onSubmit, loading, minDate, maxDate }: AccommodationFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<AccommodationType | ''>(initial?.accommodation_type ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [checkIn, setCheckIn] = useState(initial?.check_in ?? '')
  const [checkOut, setCheckOut] = useState(initial?.check_out ?? '')
  const [costPerNight, setCost] = useState(initial?.cost_per_night?.toString() ?? '')
  const [status, setStatus] = useState<Status>(initial?.status ?? 'to_book')
  const [ref, setRef] = useState(initial?.booking_reference ?? '')
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