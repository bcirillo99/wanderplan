// frontend/src/components/tabs/MapTab.tsx
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Activity, Accommodation } from '../../types'

const DAY_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#6366f1', '#a855f7', '#ec4899',
]

const ACCOM_COLOR = '#222222'

function makeActivityIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.25 14 22 14 22S28 23.25 28 14C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="14" cy="14" r="5" fill="#fff" opacity="0.85"/>
    </svg>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38],
  })
}

const accomIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.25 14 22 14 22S28 23.25 28 14C28 6.27 21.73 0 14 0z" fill="${ACCOM_COLOR}" stroke="#fff" stroke-width="2"/>
    <polygon points="14,8 8,14 20,14" fill="#fff" opacity="0.9"/>
    <rect x="10" y="14" width="8" height="5" fill="#fff" opacity="0.9"/>
  </svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -38],
})

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length === 0) return
    if (coords.length === 1) {
      map.setView(coords[0], 13)
    } else {
      map.fitBounds(L.latLngBounds(coords), { padding: [48, 48] })
    }
  }, [map, coords])
  return null
}

type Props = {
  activities: Activity[]
  accommodations: Accommodation[]
  onEditActivity: (a: Activity) => void
  onEditAccommodation: (a: Accommodation) => void
}

export function MapTab({ activities, accommodations, onEditActivity, onEditAccommodation }: Props) {
  const sortedDates = useMemo(() => {
    const dates = [...new Set(activities.map((a) => a.activity_date).filter(Boolean))] as string[]
    return dates.sort()
  }, [activities])

  const colorByDate = useMemo(() => {
    const map: Record<string, string> = {}
    sortedDates.forEach((d, i) => { map[d] = DAY_COLORS[i % DAY_COLORS.length] })
    return map
  }, [sortedDates])

  const [hiddenDates, setHiddenDates] = useState<Set<string>>(new Set())
  const [showAccom, setShowAccom] = useState(true)

  const toggleDate = (d: string) => {
    setHiddenDates((prev) => {
      const next = new Set(prev)
      next.has(d) ? next.delete(d) : next.add(d)
      return next
    })
  }

  const pinnedActivities = activities.filter(
    (a) => a.latitude != null && a.longitude != null && !hiddenDates.has(a.activity_date ?? '')
  )
  const unpinnedActivities = activities.filter((a) => a.latitude == null || a.longitude == null)

  const pinnedAccoms = accommodations.filter((a) => a.latitude != null && a.longitude != null)
  const visibleAccoms = showAccom ? pinnedAccoms : []

  const allCoords: [number, number][] = [
    ...pinnedActivities.map((a) => [a.latitude!, a.longitude!] as [number, number]),
    ...visibleAccoms.map((a) => [a.latitude!, a.longitude!] as [number, number]),
  ]

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })

  const fmtTime = (t?: string | null) => (t ? t.slice(0, 5) : null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: 500 }}>
      {/* Filter chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {sortedDates.map((d) => {
          const hidden = hiddenDates.has(d)
          const color = colorByDate[d]
          return (
            <button
              key={d}
              onClick={() => toggleDate(d)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20,
                border: `1.5px solid ${hidden ? '#d1d5db' : color}`,
                background: hidden ? '#f9fafb' : color + '18',
                color: hidden ? '#9ca3af' : color,
                fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: hidden ? '#d1d5db' : color, flexShrink: 0,
              }} />
              {fmt(d)}
            </button>
          )
        })}

        {/* Accommodation toggle chip */}
        {pinnedAccoms.length > 0 && (
          <button
            onClick={() => setShowAccom((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 20,
              border: `1.5px solid ${showAccom ? ACCOM_COLOR : '#d1d5db'}`,
              background: showAccom ? ACCOM_COLOR + '18' : '#f9fafb',
              color: showAccom ? ACCOM_COLOR : '#9ca3af',
              fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: showAccom ? ACCOM_COLOR : '#d1d5db', flexShrink: 0,
            }} />
            Accommodations
          </button>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-subtle)', isolation: 'isolate' }}>
        <MapContainer
          center={[41.9, 12.5]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {allCoords.length > 0 && <FitBounds coords={allCoords} />}

          {pinnedActivities.map((a) => {
            const color = colorByDate[a.activity_date ?? ''] ?? '#6366f1'
            const time = fmtTime(a.start_time)
            return (
              <Marker key={a.id} position={[a.latitude!, a.longitude!]} icon={makeActivityIcon(color)}>
                <Popup>
                  <div style={{ minWidth: 160, fontFamily: 'inherit' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2, color: 'var(--charcoal)' }}>
                      {a.title}
                    </div>
                    {time && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--fog)', marginBottom: 2 }}>
                        {time}{a.end_time ? ` – ${fmtTime(a.end_time)}` : ''}
                      </div>
                    )}
                    {a.location && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--fog)', marginBottom: 6 }}>
                        {a.location}
                      </div>
                    )}
                    <button
                      onClick={() => onEditActivity(a)}
                      style={{
                        fontSize: '0.75rem', padding: '3px 10px', borderRadius: 6,
                        border: '1px solid #d1d5db', background: '#f9fafb',
                        cursor: 'pointer', color: '#374151', fontWeight: 500,
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {visibleAccoms.map((a) => (
            <Marker key={a.id} position={[a.latitude!, a.longitude!]} icon={accomIcon}>
              <Popup>
                <div style={{ minWidth: 160, fontFamily: 'inherit' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: ACCOM_COLOR, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>
                    Accommodation
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2, color: 'var(--charcoal)' }}>
                    {a.name}
                  </div>
                  {a.address && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--fog)', marginBottom: 2 }}>
                      {a.address}
                    </div>
                  )}
                  {(a.check_in || a.check_out) && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--fog)', marginBottom: 6 }}>
                      {a.check_in && fmt(a.check_in)}{a.check_out ? ` → ${fmt(a.check_out)}` : ''}
                    </div>
                  )}
                  <button
                    onClick={() => onEditAccommodation(a)}
                    style={{
                      fontSize: '0.75rem', padding: '3px 10px', borderRadius: 6,
                      border: '1px solid #d1d5db', background: '#f9fafb',
                      cursor: 'pointer', color: '#374151', fontWeight: 500,
                    }}
                  >
                    Edit
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Unpinned activities */}
      {unpinnedActivities.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Activities without coordinates ({unpinnedActivities.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {unpinnedActivities.map((a) => (
              <button
                key={a.id}
                onClick={() => onEditActivity(a)}
                style={{
                  fontSize: '0.8rem', padding: '4px 12px', borderRadius: 8,
                  border: '1px solid var(--border-subtle)', background: '#fff',
                  cursor: 'pointer', color: '#374151',
                }}
              >
                {a.title ?? 'Untitled'} {a.activity_date ? `· ${fmt(a.activity_date)}` : ''}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
