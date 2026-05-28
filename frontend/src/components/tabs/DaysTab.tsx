// frontend/src/components/tabs/DaysTab.tsx
import { useNavigate } from 'react-router-dom'
import type { Activity } from '../../types'
import { TabEmpty } from './TabShared'
import { fmt, PREVIEW_LIMIT } from './tabUtils'

export function DaysTab({ tripId, dates, activities }: {
  tripId: string
  dates: string[]
  activities: Activity[]
}) {
  const navigate = useNavigate()

  const byDate = activities.reduce<Record<string, Activity[]>>((acc, a) => {
    if (!a.activity_date) return acc
    if (!acc[a.activity_date]) acc[a.activity_date] = []
    acc[a.activity_date].push(a)
    return acc
  }, {})
  Object.values(byDate).forEach((list) =>
    list.sort((a, b) => {
      if (!a.start_time) return 1
      if (!b.start_time) return -1
      return a.start_time.localeCompare(b.start_time)
    })
  )

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
            const dayActivities = byDate[date] ?? []
            const preview = dayActivities.slice(0, PREVIEW_LIMIT)
            const extra = dayActivities.length - PREVIEW_LIMIT

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
                    No activities for this day
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {preview.map((a) => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: 'var(--coral)', flexShrink: 0,
                          marginTop: 2, display: 'inline-block',
                        }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--fog)', lineHeight: 1.4 }}>
                          {a.start_time && (
                            <span style={{ color: 'var(--fog)', marginRight: 4 }}>
                              {a.start_time.slice(0, 5)}
                            </span>
                          )}
                          {a.title ?? 'Untitled'}
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
