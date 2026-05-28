// frontend/src/components/tabs/TransportsTab.tsx
import type { Transport } from '../../types'
import StatusBadge from '../StatusBadge'
import { SectionHeader, ItemCard, TabEmpty } from './TabShared'
import { fmtDateTime } from './tabUtils'

const TRANSPORT_ICONS: Record<string, string> = {
  train: '🚂', bus: '🚌', car: '🚗', shuttle: '🚐', ferry: '⛴', taxi: '🚕', other: '🚀',
}

export function TransportsTab({ transports, onAdd, onEdit, onDelete }: {
  transports: Transport[]
  onAdd: () => void
  onEdit: (t: Transport) => void
  onDelete: (id: string) => void
}) {
  return (
    <>
      <SectionHeader title="Transports" onAdd={onAdd} />
      {transports.length === 0 ? <TabEmpty msg="No transports added" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {transports.map((t) => (
            <ItemCard key={t.id} onDelete={() => onDelete(t.id)} onEdit={() => onEdit(t)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: '1.6rem' }}>{TRANSPORT_ICONS[t.transport_type] ?? '🚀'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 600, color: 'var(--forest)', margin: 0 }}>{t.origin} → {t.destination}</p>
                    <StatusBadge status={t.status} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--fog)', marginTop: 2 }}>
                    {fmtDateTime(t.departure_time)}{t.operator ? ` · ${t.operator}` : ''}
                  </p>
                </div>
                {t.cost != null && (
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--forest)' }}>
                    € {t.cost.toFixed(2)}
                  </p>
                )}
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </>
  )
}
