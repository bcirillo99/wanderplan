// frontend/src/components/tabs/ActivitiesTab.tsx
import type { Activity } from '../../types'
import StatusBadge from '../StatusBadge'
import { SectionHeader, ItemCard, TabEmpty } from './TabShared'
import { fmt, fmtDateTime } from './tabUtils'

export function ActivitiesTab({ activities, onAdd, onEdit, onDelete }: {
  activities: Activity[]
  onAdd: () => void
  onEdit: (a: Activity) => void
  onDelete: (id: string) => void
}) {
  const grouped = activities.reduce<Record<string, Activity[]>>((acc, a) => {
    const key = a.activity_date ?? 'Unscheduled'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const dates = Object.keys(grouped).sort((a, b) => {
    if (a === 'Unscheduled') return 1
    if (b === 'Unscheduled') return -1
    return a.localeCompare(b)
  })

  return (
    <>
      <SectionHeader title="Trip Activities" onAdd={onAdd} />
      {activities.length === 0 ? <TabEmpty msg="No activities added" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {dates.map((date) => (
            <div key={date} style={{
              background: '#fff', borderRadius: 20,
              border: '1px solid var(--cream-dark)',
              padding: 20, boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)',
            }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--forest)', marginBottom: 16 }}>
                {date === 'Unscheduled' ? 'Unscheduled' : fmt(date)}
              </p>
              <div style={{ display: 'grid', gap: 14 }}>
                {grouped[date].map((activity) => (
                  <ItemCard key={activity.id} onDelete={() => onDelete(activity.id)} onEdit={() => onEdit(activity)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--forest)' }}>
                          {activity.title || 'Untitled activity'}
                        </h4>
                        <StatusBadge status={activity.status} />
                        {activity.start_time && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{fmtDateTime(activity.start_time)}</span>}
                        {activity.location && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>· {activity.location}</span>}
                        {activity.cost != null && <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>· €{activity.cost.toFixed(2)}</span>}
                      </div>
                      {activity.description && (
                        <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem' }}>{activity.description}</p>
                      )}
                    </div>
                  </ItemCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
