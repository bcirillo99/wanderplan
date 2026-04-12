import { useEffect, useState } from 'react'
import FormField from '../FormField'
import type { Activity, ActivityCreate, Status } from '../../types'
import { STATUS_OPTIONS } from './tripOptions'

type ActivityFormProps = {
  initial?: Partial<Activity>
  onSubmit: (data: ActivityCreate) => void
  loading: boolean
  showDayPicker?: boolean
  tripStartDate?: string | null
  tripEndDate?: string | null
  lockDate?: boolean
}

export default function ActivityForm({
  initial,
  onSubmit,
  loading,
  showDayPicker,
  tripStartDate,
  tripEndDate,
  lockDate,
}: ActivityFormProps) {
  const [activityDate, setActivityDate] = useState(initial?.activity_date ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDesc] = useState(initial?.description ?? '')
  const [startTime, setStart] = useState(initial?.start_time ?? '')
  const [endTime, setEnd] = useState(initial?.end_time ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [status, setStatus] = useState<Status>(initial?.status ?? 'draft')
  const [cost, setCost] = useState(initial?.cost?.toString() ?? '')
  const [link, setLink] = useState(initial?.link ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

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

  // Se la data viene da DayPage (initial.activity_date), non è obbligatoria ma deve rispettare i limiti
  // Se viene dalla pagina comune, diventa obbligatoria
  const isDateRequired = !initial?.activity_date
  const isValid = !loading && (!isDateRequired || activityDate) && title

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
        <FormField
          label="Date"
          type="input"
          inputType="date"
          value={activityDate}
          onChange={setActivityDate}
          min={tripStartDate ?? undefined}
          max={tripEndDate ?? undefined}
          required={isDateRequired}
          disabled={lockDate}
        />
      )}

      <FormField
        label="Title"
        type="input"
        value={title}
        onChange={setTitle}
        placeholder="Visit to the Colosseum"
        required
      />
      <FormField
        label="Description"
        type="textarea"
        value={description}
        onChange={setDesc}
        rows={2}
      />
      <div className="form-grid-2">
        <FormField
          label="Start Time"
          type="input"
          inputType="time"
          value={startTime}
          onChange={setStart}
        />
        <FormField
          label="End Time"
          type="input"
          inputType="time"
          value={endTime}
          onChange={setEnd}
        />
      </div>
      <div className="form-grid-2">
        <FormField
          label="Location"
          type="input"
          value={location}
          onChange={setLocation}
          placeholder="Via Sacra, Rome"
        />
        <FormField
          label="Cost (€)"
          type="input"
          inputType="number"
          value={cost}
          onChange={setCost}
        />
      </div>
      <FormField
        label="Status"
        type="select"
        value={status}
        onChange={(v) => setStatus(v as Status)}
        options={STATUS_OPTIONS}
      />
      <FormField
        label="Link"
        type="input"
        value={link}
        onChange={setLink}
        placeholder="https://..."
      />
      <FormField
        label="Notes"
        type="textarea"
        value={notes}
        onChange={setNotes}
        rows={2}
      />
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
