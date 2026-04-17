// frontend/src/components/forms/FlightForm.tsx
import { useState } from 'react'
import FormField from '../FormField'
import type { Flight, FlightCreate, Status } from '../../types'
import { STATUS_OPTIONS } from './formOptions'

type FlightFormProps = {
  initial?: Partial<Flight>
  onSubmit: (data: FlightCreate) => void
  loading: boolean
  minDateTime?: string
  maxDateTime?: string
}

export function FlightForm({ initial, onSubmit, loading, minDateTime, maxDateTime }: FlightFormProps) {
  const [origin, setOrigin]     = useState(initial?.origin ?? '')
  const [dest, setDest]         = useState(initial?.destination ?? '')
  const [dep, setDep]           = useState(initial?.departure_time ?? '')
  const [arr, setArr]           = useState(initial?.arrival_time ?? '')
  const [airline, setAirline]   = useState(initial?.airline ?? '')
  const [flightNo, setFlightNo] = useState(initial?.flight_number ?? '')
  const [cost, setCost]         = useState(initial?.cost?.toString() ?? '')
  const [status, setStatus]     = useState<Status>(initial?.status ?? 'to_book')
  const [ref, setRef]           = useState(initial?.booking_reference ?? '')

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
      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => origin && dest && onSubmit({
          origin,
          destination: dest,
          departure_time: dep || null,
          arrival_time: arr || null,
          airline: airline || null,
          flight_number: flightNo || null,
          cost: cost ? parseFloat(cost) : null,
          status,
          booking_reference: ref || null,
          baggage_included: null,
          pay_method: null,
          link: null,
          notes: null,
        })}
        disabled={loading || !origin || !dest}
      >
        {loading ? 'Saving...' : initial?.id ? 'Update Flight' : 'Add Flight'}
      </button>
    </div>
  )
}
