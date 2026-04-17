// frontend/src/components/forms/TransportForm.tsx
import { useEffect, useState } from 'react'
import FormField from '../FormField'
import type { Transport, TransportCreate, TransportType, Status } from '../../types'
import { TRANSPORT_TYPES, STATUS_OPTIONS } from './formOptions'

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
      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => origin && dest && onSubmit({
          transport_type: type,
          origin,
          destination: dest,
          departure_time: dep || null,
          arrival_time: arr || null,
          operator: operator || null,
          cost: cost ? parseFloat(cost) : null,
          status,
          pay_method: null,
          link: null,
          booking_reference: null,
          extra_details: null,
          notes: null,
        })}
        disabled={loading || !origin || !dest}
      >
        {loading ? 'Saving...' : initial?.id ? 'Update Transport' : 'Add Transport'}
      </button>
    </div>
  )
}
