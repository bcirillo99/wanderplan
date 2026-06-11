// frontend/src/components/tabs/AccommodationsTab.tsx
import type { Accommodation } from '../../types'
import StatusBadge from '../StatusBadge'
import { SectionHeader, ItemCard, TabEmpty } from './TabShared'
import { fmt } from './tabUtils'
import { PinIcon } from '../Icons'

export function AccommodationsTab({ accommodations, onAdd, onEdit, onDelete }: {
  accommodations: Accommodation[]
  onAdd: () => void
  onEdit: (a: Accommodation) => void
  onDelete: (id: string) => void
}) {
  return (
    <>
      <SectionHeader title="Accommodations" onAdd={onAdd} />
      {accommodations.length === 0 ? <TabEmpty msg="No accommodations added" /> : (
        <div className="accom-grid">
          {accommodations.map((a) => (
            <ItemCard key={a.id} onDelete={() => onDelete(a.id)} onEdit={() => onEdit(a)}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <p style={{ fontWeight: 600, color: 'var(--charcoal)', margin: 0 }}>{a.name}</p>
                  <StatusBadge status={a.status} />
                </div>
                {a.accommodation_type && (
                  <span style={{
                    fontSize: '0.72rem', background: 'var(--surface-warm)',
                    color: 'var(--fog)', padding: '2px 8px',
                    borderRadius: 20, textTransform: 'capitalize',
                  }}>{a.accommodation_type}</span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--fog)', lineHeight: 1.8 }}>
                {a.address && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <PinIcon size={13} /> {a.address}
                  </p>
                )}
                <p>Check-in: <strong>{fmt(a.check_in)}</strong> · Check-out: <strong>{fmt(a.check_out)}</strong></p>
                {a.cost_per_night != null && (
                  <p>€ {a.cost_per_night}/night{a.total_cost != null ? ` · Total: € ${a.total_cost}` : ''}</p>
                )}
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </>
  )
}
