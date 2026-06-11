// frontend/src/components/forms/AccommodationForm.tsx
import { useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import FormField from '../FormField'
import type { Accommodation, AccommodationCreate, AccommodationType, Status } from '../../types'
import { ACCOM_TYPES, STATUS_OPTIONS } from './formOptions'
import { SearchIcon, PinIcon } from '../Icons'

const pinIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.25 14 22 14 22S28 23.25 28 14C28 6.27 21.73 0 14 0z" fill="#222222" stroke="#fff" stroke-width="2"/>
    <polygon points="14,8 8,14 20,14" fill="#fff" opacity="0.9"/>
    <rect x="10" y="14" width="8" height="5" fill="#fff" opacity="0.9"/>
  </svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
})

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) })
  return null
}

function InvalidateOnMount() {
  const map = useMap()
  useState(() => { setTimeout(() => map.invalidateSize(), 50) })
  return null
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const prevRef = useRef<string>('')
  useState(() => {
    const key = `${lat},${lng}`
    if (key !== prevRef.current) {
      prevRef.current = key
      map.setView([lat, lng], 14, { animate: true })
    }
  })
  return null
}

type AccommodationFormProps = {
  initial?: Partial<Accommodation>
  onSubmit: (data: AccommodationCreate) => void
  loading: boolean
  minDate?: string
  maxDate?: string
}

export function AccommodationForm({ initial, onSubmit, loading, minDate, maxDate }: AccommodationFormProps) {
  const [name, setName]         = useState(initial?.name ?? '')
  const [type, setType]         = useState<AccommodationType | ''>(initial?.accommodation_type ?? '')
  const [address, setAddress]   = useState(initial?.address ?? '')
  const [checkIn, setCheckIn]   = useState(initial?.check_in ?? '')
  const [checkOut, setCheckOut] = useState(initial?.check_out ?? '')
  const [costPerNight, setCost] = useState(initial?.cost_per_night?.toString() ?? '')
  const [status, setStatus]     = useState<Status>(initial?.status ?? 'to_book')
  const [ref, setRef]           = useState(initial?.booking_reference ?? '')

  const [latitude, setLatitude]   = useState<number | null>(initial?.latitude ?? null)
  const [longitude, setLongitude] = useState<number | null>(initial?.longitude ?? null)
  const [showMap, setShowMap]     = useState(initial?.latitude != null)
  const [geocoding, setGeocoding] = useState(false)
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(
    initial?.latitude != null ? { lat: initial.latitude!, lng: initial.longitude! } : null
  )

  const handleMapClick = (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)
    setFlyTarget(null)
  }

  const geocode = async () => {
    const query = address.trim()
    if (!query) return
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
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

  const clearPin = () => { setLatitude(null); setLongitude(null); setFlyTarget(null) }

  const mapCenter: [number, number] = latitude != null && longitude != null
    ? [latitude, longitude] : [41.9, 12.5]

  return (
    <div className="form-stack">
      <FormField label="Property Name" type="input" value={name} onChange={setName} placeholder="Hotel Negresco" required />
      <div className="form-grid-2">
        <FormField label="Type" type="select" value={type} onChange={(v) => setType(v as AccommodationType)} options={ACCOM_TYPES} />
        <FormField label="Status" type="select" value={status} onChange={(v) => setStatus(v as Status)} options={STATUS_OPTIONS} />
      </div>

      {/* Address + map picker */}
      <div className="form-group">
        <label className="form-label">Address</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            className="form-control"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={geocode}
            disabled={geocoding || !address.trim()}
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

      <div className="form-grid-2">
        <FormField label="Check-in" type="date" value={checkIn} onChange={setCheckIn} min={minDate} max={maxDate} />
        <FormField label="Check-out" type="date" value={checkOut} onChange={setCheckOut} min={checkIn || minDate} max={maxDate} />
      </div>
      <div className="form-grid-2">
        <FormField label="Cost/Night (€)" type="input" inputType="number" value={costPerNight} onChange={setCost} />
        <FormField label="Booking Ref" type="input" value={ref} onChange={setRef} placeholder="ABC123" />
      </div>
      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => name && onSubmit({
          name,
          accommodation_type: type as AccommodationType || null,
          address: address || null,
          location: null,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          check_in: checkIn || null,
          check_out: checkOut || null,
          cost_per_night: costPerNight ? parseFloat(costPerNight) : null,
          status,
          pay_method: null,
          cancellation_date: null,
          link: null,
          extra_details: null,
          booking_reference: ref || null,
          notes: null,
        })}
        disabled={loading || !name}
      >
        {loading ? 'Saving...' : initial?.id ? 'Update Accommodation' : 'Add Accommodation'}
      </button>
    </div>
  )
}
