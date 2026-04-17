// frontend/src/components/tabs/PackingTab.tsx
import type { PackingItem } from '../../types'
import { PACKING_CATS } from '../forms/tripOptions'
import { SectionHeader, TabEmpty } from './TabShared'

export function PackingTab({ items, onAdd, onDelete, onToggle }: {
  items: PackingItem[]
  onAdd: () => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}) {
  const total = items.length
  const checked = items.filter((i) => i.checked).length
  const grouped = PACKING_CATS.reduce<Record<string, PackingItem[]>>((acc, c) => {
    const list = items.filter((i) => i.category === c.value)
    if (list.length) acc[c.label] = list
    return acc
  }, {})
  const uncategorized = items.filter((i) => !i.category)
  if (uncategorized.length) grouped['Other'] = uncategorized

  return (
    <>
      <SectionHeader title="Packing List" onAdd={onAdd} />
      {total > 0 && (
        <div className="packing-progress">
          <span style={{ fontSize: '0.82rem', color: 'var(--forest-mid)' }}>{checked}/{total} items packed</span>
          <div className="packing-bar">
            <div className="packing-bar__fill" style={{ width: `${total ? (checked / total) * 100 : 0}%` }} />
          </div>
        </div>
      )}
      {items.length === 0 ? <TabEmpty msg="Packing list is empty" /> : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat}>
            <p className="packing-cat-label">{cat}</p>
            {catItems.map((item) => (
              <div
                key={item.id}
                className={`packing-item ${item.checked ? 'packing-item--checked' : ''}`}
                onClick={() => onToggle(item.id)}
              >
                <div className="packing-item__check">
                  {item.checked && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="packing-item__name">{item.name}</span>
                <button className="packing-item__del" onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}>×</button>
              </div>
            ))}
          </div>
        ))
      )}
    </>
  )
}
