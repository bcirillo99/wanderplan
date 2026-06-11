// frontend/src/components/forms/ActivityForm.tsx
import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import FormField from '../FormField'
import type { Activity, ActivityCreate, Status } from '../../types'
import { STATUS_OPTIONS } from './formOptions'
import { SearchIcon, PinIcon } from '../Icons'

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#FF5A5F;border:2.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.45)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) })
  return null
}

function InvalidateOnMount() {
  const map = useMap()
  useEffect(() => { setTimeout(() => map.invalidateSize(), 50) }, [map])
  return null
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const prevRef = useRef<string>('')
  useEffect(() => {
    const key = `${lat},${lng}`
    if (key !== prevRef.current) {
      prevRef.current = key
      map.setView([lat, lng], 14, { animate: true })
    }
  }, [map, lat, lng])
  return null
}

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

  const [latitude, setLatitude]   = useState<number | null>(initial?.latitude ?? null)
  const [longitude, setLongitude] = useState<number | null>(initial?.longitude ?? null)
  const [showMap, setShowMap]     = useState(initial?.latitude != null)
  const [geocoding, setGeocoding] = useState(false)
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(
    initial?.latitude != null ? { lat: initial.latitude!, lng: initial.longitude! } : null
  )

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
      setLatitude(initial.latitude ?? null)
      setLongitude(initial.longitude ?? null)
      setShowMap(initial.latitude != null)
      setFlyTarget(initial.latitude != null ? { lat: initial.latitude!, lng: initial.longitude! } : null)
    }
  }, [initial])

  const isValid = !loading && activityDate && title

  const handleMapClick = (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)
    setFlyTarget(null)
  }

  const geocode = async () => {
    if (!location.trim()) return
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        setLatitude(lat)
        setLongitude(lng)
        setFlyTarget({ lat, lng })
        if (!showMap) setShowMap(true)
      }
    } finally {
      setGeocoding(false)
    }
  }

  const clearPin = () => {
    setLatitude(null)
    setLongitude(null)
    setFlyTarget(null)
  }

  const handleSubmit = () => {
    onSubmit({
      activity_date: activityDate,
      title: title || null,
      description: description || null,
      start_time: startTime || null,
      end_time: endTime || null,
      location: location || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      status: status || null,
      cost: cost ? parseFloat(cost) : null,
      pay_method: null,
      cancellation_date: null,
      link: link || null,
      notes: notes || null,
    })
  }

  const mapCenter: [number, number] = latitude != null && longitude != null
    ? [latitude, longitude]
    : [41.9, 12.5]

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
            type="date"
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
        <FormField label="Start Time" type="time" value={startTime} onChange={setStart} />
        <FormField label="End Time" type="time" value={endTime} onChange={setEnd} />
      </div>
      <div className="form-grid-2">
        <FormField label="Cost (€)" type="input" inputType="number" value={cost} onChange={setCost} />
        <FormField label="Status" type="select" value={status} onChange={(v) => setStatus(v as Status)} options={STATUS_OPTIONS} />
      </div>
      <FormField label="Link" type="input" value={link} onChange={setLink} placeholder="https://..." />
      <FormField label="Notes" type="textarea" value={notes} onChange={setNotes} rows={2} />

      {/* Location + map picker */}
      <div className="form-group">
        <label className="form-label">Location</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            className="form-control"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Via Sacra, Rome"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={geocode}
            disabled={geocoding || !location.trim()}
            title="Find on map"
            aria-label="Find on map"
            style={{
              padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-subtle)',
              background: 'var(--surface-white)', cursor: 'pointer',
              color: 'var(--fog)', whiteSpace: 'nowrap', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center',
            }}
          >
            {geocoding ? '…' : <SearchIcon size={15} />}
          </button>
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            title={showMap ? 'Hide map' : 'Pick on map'}
            aria-label={showMap ? 'Hide map' : 'Pick on map'}
            style={{
              padding: '0 12px', borderRadius: 8,
              border: `1px solid ${showMap ? 'var(--coral-tint)' : 'var(--border-subtle)'}`,
              background: showMap ? 'var(--coral-wash)' : 'var(--surface-white)', cursor: 'pointer',
              color: showMap ? 'var(--coral-deep)' : 'var(--fog)', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center',
            }}
          >
            <PinIcon size={15} />
          </button>
        </div>

        {latitude != null && longitude != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--fog)', fontFamily: 'var(--font-mono)' }}>
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </span>
            <button
              type="button"
              onClick={clearPin}
              style={{ fontSize: '0.72rem', color: 'var(--destructive)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Remove pin
            </button>
          </div>
        )}

        {showMap && (
          <div style={{ marginTop: 8, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', height: 240 }}>
            <MapContainer
              center={mapCenter}
              zoom={latitude != null ? 13 : 5}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <InvalidateOnMount />
              {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
              <MapClickHandler onMapClick={handleMapClick} />
              {latitude != null && longitude != null && (
                <Marker position={[latitude, longitude]} icon={pinIcon} />
              )}
            </MapContainer>
          </div>
        )}
      </div>

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
