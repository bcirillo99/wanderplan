// frontend/src/components/TripMiniMap.tsx
import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Activity, Accommodation } from '../types'

const DAY_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#6366f1', '#a855f7', '#ec4899',
]
const ACCOM_COLOR = '#0369a1'

function makeActivityIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="28" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.25 14 22 14 22S28 23.25 28 14C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="14" cy="14" r="5" fill="#fff" opacity="0.85"/>
    </svg>`,
    iconSize: [22, 28],
    iconAnchor: [11, 28],
    popupAnchor: [0, -30],
  })
}

const accomIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="28" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.25 14 22 14 22S28 23.25 28 14C28 6.27 21.73 0 14 0z" fill="${ACCOM_COLOR}" stroke="#fff" stroke-width="2"/>
    <polygon points="14,8 8,14 20,14" fill="#fff" opacity="0.9"/>
    <rect x="10" y="14" width="8" height="5" fill="#fff" opacity="0.9"/>
  </svg>`,
  iconSize: [22, 28],
  iconAnchor: [11, 28],
  popupAnchor: [0, -30],
})

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length === 0) return
    if (coords.length === 1) {
      map.setView(coords[0], 13)
    } else {
      map.fitBounds(L.latLngBounds(coords), { padding: [32, 32] })
    }
  }, [map, coords])
  return null
}

type Props = {
  activities: Activity[]
  accommodations: Accommodation[]
  height?: number
}

export function TripMiniMap({ activities, accommodations, height = 260 }: Props) {
  const sortedDates = useMemo(() => {
    const dates = [...new Set(activities.map((a) => a.activity_date).filter(Boolean))] as string[]
    return dates.sort()
  }, [activities])

  const colorByDate = useMemo(() => {
    const map: Record<string, string> = {}
    sortedDates.forEach((d, i) => { map[d] = DAY_COLORS[i % DAY_COLORS.length] })
    return map
  }, [sortedDates])

  const pinnedActivities = activities.filter((a) => a.latitude != null && a.longitude != null)
  const pinnedAccoms = accommodations.filter((a) => a.latitude != null && a.longitude != null)

  const allCoords: [number, number][] = [
    ...pinnedActivities.map((a) => [a.latitude!, a.longitude!] as [number, number]),
    ...pinnedAccoms.map((a) => [a.latitude!, a.longitude!] as [number, number]),
  ]

  if (allCoords.length === 0) return null

  const fmtTime = (t?: string | null) => (t ? t.slice(0, 5) : null)
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-light, #e5e7eb)', height, isolation: 'isolate' }}>
      <MapContainer
        center={[41.9, 12.5]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <FitBounds coords={allCoords} />

        {pinnedActivities.map((a) => {
          const color = colorByDate[a.activity_date ?? ''] ?? '#6366f1'
          const time = fmtTime(a.start_time)
          return (
            <Marker key={a.id} position={[a.latitude!, a.longitude!]} icon={makeActivityIcon(color)}>
              <Popup>
                <div style={{ minWidth: 140, fontFamily: 'inherit' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1f2937', marginBottom: 2 }}>{a.title}</div>
                  {a.activity_date && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {fmtDate(a.activity_date)}{time ? ` · ${time}` : ''}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}

        {pinnedAccoms.map((a) => (
          <Marker key={a.id} position={[a.latitude!, a.longitude!]} icon={accomIcon}>
            <Popup>
              <div style={{ minWidth: 140, fontFamily: 'inherit' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: ACCOM_COLOR, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>Accommodation</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1f2937', marginBottom: 2 }}>{a.name}</div>
                {a.address && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{a.address}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
