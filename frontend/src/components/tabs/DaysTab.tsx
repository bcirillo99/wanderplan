// frontend/src/components/tabs/DaysTab.tsx
import { useNavigate } from 'react-router-dom'
import type { Activity, Flight, Transport, Accommodation } from '../../types'
import { TabEmpty } from './TabShared'
import { fmt, PREVIEW_LIMIT } from './tabUtils'

type DayItem = { time: string | null; label: string; kind: 'activity' | 'flight' | 'transport' | 'accommodation' }

function dateOf(datetime?: string | null): string | null {
  if (!datetime) return null
  return datetime.slice(0, 10)
}

function timeOf(datetime?: string | null): string | null {
  if (!datetime) return null
  const t = datetime.slice(11, 16)
  return t.length === 5 ? t : null
}

export function DaysTab({ tripId, dates, activities, flights, transports, accommodations }: {
  tripId: string
  dates: string[]
  activities: Activity[]
  flights: Flight[]
  transports: Transport[]
  accommodations: Accommodation[]
}) {
  const navigate = useNavigate()

  const byDate: Record<string, DayItem[]> = {}

  for (const date of dates) byDate[date] = []

  for (const a of activities) {
    if (!a.activity_date || !byDate[a.activity_date]) continue
    byDate[a.activity_date].push({
      time: a.start_time ? a.start_time.slice(0, 5) : null,
      label: a.title ?? 'Untitled activity',
      kind: 'activity',
    })
  }

  for (const f of flights) {
    const date = dateOf(f.departure_time)
    if (!date || !byDate[date]) continue
    byDate[date].push({
      time: timeOf(f.departure_time),
      label: `${f.origin} → ${f.destination}`,
      kind: 'flight',
    })
  }

  for (const t of transports) {
    const date = dateOf(t.departure_time)
    if (!date || !byDate[date]) continue
    byDate[date].push({
      time: timeOf(t.departure_time),
      label: `${t.origin} → ${t.destination}`,
      kind: 'transport',
    })
  }

  for (const acc of accommodations) {
    const checkIn = dateOf(acc.check_in)
    if (checkIn && byDate[checkIn]) {
      byDate[checkIn].push({ time: null, label: `Check-in: ${acc.name}`, kind: 'accommodation' })
    }
    const checkOut = dateOf(acc.check_out)
    if (checkOut && byDate[checkOut]) {
      byDate[checkOut].push({ time: null, label: `Check-out: ${acc.name}`, kind: 'accommodation' })
    }
  }

  // Sort each day by time (null times go last)
  for (const date of dates) {
    byDate[date].sort((a, b) => {
      if (!a.time) return 1
      if (!b.time) return -1
      return a.time.localeCompare(b.time)
    })
  }

  // Warm role palette from the design tokens — no cool accents
  const kindDot: Record<DayItem['kind'], string> = {
    activity:      'var(--coral)',
    flight:        'var(--rust)',
    transport:     'var(--saffron-deep)',
    accommodation: 'var(--plum)',
  }

  return (
    <>
      <div className="section-header">
        <h3 className="section-title">Trip Days</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--fog)' }}>
          Days are created automatically from your trip dates
        </p>
      </div>
      {dates.length === 0 ? (
        <TabEmpty msg="No days yet — set start/end dates for your trip to see days here" />
      ) : (
        <div className="trips-grid">
          {dates.map((date) => {
            const items = byDate[date] ?? []
            const preview = items.slice(0, PREVIEW_LIMIT)
            const extra = items.length - PREVIEW_LIMIT

            return (
              <div
                key={date}
                className="item-card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/trips/${tripId}/days/${date}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--surface-warm)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem',
                    color: 'var(--charcoal)', flexShrink: 0,
                  }}>
                    {new Date(date).getDate()}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--fog)', fontWeight: 500 }}>
                    {fmt(date)}
                  </span>
                </div>
                {preview.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--border-strong)', fontStyle: 'italic' }}>
                    Nothing planned yet
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {preview.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: kindDot[item.kind], flexShrink: 0,
                          marginTop: 2, display: 'inline-block',
                        }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--fog)', lineHeight: 1.4 }}>
                          {item.time && (
                            <span style={{ color: 'var(--fog)', marginRight: 4 }}>
                              {item.time}
                            </span>
                          )}
                          {item.label}
                        </span>
                      </div>
                    ))}
                    {extra > 0 && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--fog)', margin: '2px 0 0 11px' }}>
                        +{extra} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
