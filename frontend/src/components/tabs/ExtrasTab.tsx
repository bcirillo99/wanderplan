// frontend/src/components/tabs/ExtrasTab.tsx
import type { Extra } from '../../types'
import { SectionHeader, ItemCard, TabEmpty } from './TabShared'

export function ExtrasTab({ extras, onAdd, onEdit, onDelete }: {
  extras: Extra[]
  onAdd: () => void
  onEdit: (e: Extra) => void
  onDelete: (id: string) => void
}) {
  const total = extras.reduce((s, e) => s + (e.amount ?? 0), 0)
  return (
    <>
      <SectionHeader title="Extras" onAdd={onAdd} />
      {extras.length > 0 && (
        <div style={{
          background: 'var(--forest)', borderRadius: 16, padding: '16px 20px',
          marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--mint)' }}>Total Extras</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
            € {total.toFixed(2)}
          </span>
        </div>
      )}
      {extras.length === 0 ? <TabEmpty msg="No extras recorded" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {extras.map((e) => (
            <ItemCard key={e.id} onEdit={() => onEdit(e)} onDelete={() => onDelete(e.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--charcoal)' }}>{e.description ?? '—'}</p>
                  {e.category && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--sage)', textTransform: 'capitalize', marginTop: 2 }}>
                      {e.category}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 600, color: 'var(--forest)' }}>
                    {e.currency ?? '€'} {e.amount?.toFixed(2) ?? '—'}
                  </p>
                  {e.is_estimated && <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>estimated</p>}
                </div>
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </>
  )
}
