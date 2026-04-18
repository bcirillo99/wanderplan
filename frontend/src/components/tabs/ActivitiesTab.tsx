// frontend/src/components/tabs/ActivitiesTab.tsx
import { useState } from 'react'
import type { Activity, Status } from '../../types'
import StatusBadge from '../StatusBadge'
import { SectionHeader, ItemCard, TabEmpty } from './TabShared'
import { fmt, fmtDateTime } from './tabUtils'

const STATUS_FILTER_OPTIONS: { value: Status | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'to_book', label: 'To Book' },
  { value: 'booked', label: 'Booked' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function ActivitiesTab({ activities, onAdd, onEdit, onDelete }: {
  activities: Activity[]
  onAdd: () => void
  onEdit: (a: Activity) => void
  onDelete: (id: string) => void
}) {
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | ''>('')

  const filtered = activities.filter((a) => {
    const q = search.trim().toLowerCase()
    const matchesSearch = !q ||
      (a.title ?? '').toLowerCase().includes(q) ||
      (a.location ?? '').toLowerCase().includes(q)
    const matchesStatus = !statusFilter || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const grouped = filtered.reduce<Record<string, Activity[]>>((acc, a) => {
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
      {activities.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--sage)', pointerEvents: 'none',
            }}>
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              className="form-control"
              style={{ paddingLeft: 32 }}
              placeholder="Search by title or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            style={{ flex: '0 0 150px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | '')}
          >
            {STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}
      {activities.length === 0 ? <TabEmpty msg="No activities added" /> :
       filtered.length === 0 ? <TabEmpty msg="No activities match filters" /> : (
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
