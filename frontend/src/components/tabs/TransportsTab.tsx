// frontend/src/components/tabs/TransportsTab.tsx
import type { Transport } from '../../types'
import StatusBadge from '../StatusBadge'
import { SectionHeader, ItemCard, TabEmpty } from './TabShared'
import { fmtDateTime } from './tabUtils'
import { TrainIcon, BusIcon, CarIcon, ShipIcon, PinIcon } from '../Icons'
import type { ComponentType } from 'react'

const TRANSPORT_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  train: TrainIcon, bus: BusIcon, car: CarIcon, shuttle: BusIcon, ferry: ShipIcon, taxi: CarIcon, other: PinIcon,
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
          {transports.map((t) => {
            const Icon = TRANSPORT_ICONS[t.transport_type] ?? PinIcon
            return (
            <ItemCard key={t.id} onDelete={() => onDelete(t.id)} onEdit={() => onEdit(t)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ display: 'inline-flex', color: 'var(--fog)', flexShrink: 0 }}><Icon size={22} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 600, color: 'var(--charcoal)', margin: 0 }}>{t.origin} → {t.destination}</p>
                    <StatusBadge status={t.status} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--fog)', marginTop: 2 }}>
                    {fmtDateTime(t.departure_time)}{t.operator ? ` · ${t.operator}` : ''}
                  </p>
                </div>
                {t.cost != null && (
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--charcoal)' }}>
                    € {t.cost.toFixed(2)}
                  </p>
                )}
              </div>
            </ItemCard>
            )
          })}
        </div>
      )}
    </>
  )
}
