// frontend/src/components/forms/TripForm.tsx
import { useState } from 'react'
import FormField from '../FormField'
import type { TripCreate } from '../../types'

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
        onClick={() => title.trim() && onSubmit({
          title: title.trim(),
          destination: destination || null,
          description: description || null,
          start_date: startDate || null,
          end_date: endDate || null,
          cover_image: coverImage || null,
        })}
        disabled={loading || !title.trim() || !startDate || !endDate}
      >
        {loading ? 'Saving...' : 'Save Trip'}
      </button>
    </div>
  )
}
