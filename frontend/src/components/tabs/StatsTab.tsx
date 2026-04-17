// frontend/src/components/tabs/StatsTab.tsx
import type { TripStats } from '../../types'
import { TabEmpty } from './TabShared'

export function StatsTab({ stats }: { stats: TripStats | null }) {
  if (!stats) return <TabEmpty msg="Loading budget..." />
  const items = [
    { label: 'Flights',        value: stats.flights,       bg: '#eff6ff', color: '#1d4ed8' },
    { label: 'Transports',     value: stats.transport,     bg: '#fefce8', color: '#a16207' },
    { label: 'Accommodations', value: stats.accommodation, bg: '#faf5ff', color: '#7e22ce' },
    { label: 'Activities',     value: stats.activities,    bg: '#fff7ed', color: '#c2410c' },
    { label: 'Extras',         value: stats.extras,        bg: '#fdf2f8', color: '#be185d' },
  ]
  return (
    <>
      <div className="budget-total noise">
        <p className="budget-total__label">Total Estimated Budget</p>
        <p className="budget-total__amount">€ {stats.total.toFixed(2)}</p>
      </div>
      <div className="budget-grid">
        {items.map((item) => (
          <div key={item.label} className="budget-item" style={{ background: item.bg }}>
            <p className="budget-item__amount" style={{ color: item.color }}>€ {item.value.toFixed(2)}</p>
            <p className="budget-item__label" style={{ color: item.color }}>{item.label}</p>
          </div>
        ))}
      </div>
    </>
  )
}
