// frontend/src/components/CascadeDeleteConfirmModal.tsx
import Modal from './Modal'
import type { CascadeDeletionPreview, DeletionItem } from '../api/trips'

interface Props {
  preview: CascadeDeletionPreview
  total: number
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}

const SECTIONS: { key: keyof CascadeDeletionPreview; label: string }[] = [
  { key: 'flights', label: 'Voli' },
  { key: 'transports', label: 'Trasporti' },
  { key: 'accommodations', label: 'Alloggi' },
  { key: 'activities', label: 'Attività' },
]

function renderRow(item: DeletionItem) {
  return (
    <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0' }}>
      <span>{item.label}</span>
      <span style={{ opacity: 0.7 }}>{item.date ?? ''}</span>
    </li>
  )
}

export default function CascadeDeleteConfirmModal({ preview, total, onConfirm, onCancel, busy }: Props) {
  return (
    <Modal title="Conferma modifica date" onClose={onCancel} size="md">
      <p>
        Restringendo le date del viaggio verranno cancellati <strong>{total}</strong> elementi che cadono fuori dal nuovo intervallo.
        Vuoi procedere?
      </p>
      {SECTIONS.map(({ key, label }) => {
        const items = preview[key]
        if (!items?.length) return null
        return (
          <div key={key} style={{ marginTop: 12 }}>
            <strong>{label} ({items.length})</strong>
            <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0' }}>
              {items.map(renderRow)}
            </ul>
          </div>
        )
      })}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button type="button" onClick={onCancel} disabled={busy}>Annulla</button>
        <button type="button" onClick={onConfirm} disabled={busy} className="btn-danger">
          {busy ? 'Cancellazione…' : 'Cancella e salva'}
        </button>
      </div>
    </Modal>
  )
}
