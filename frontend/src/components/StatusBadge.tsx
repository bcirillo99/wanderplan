// frontend/src/components/StatusBadge.tsx
import type { Status } from '../types'

const labels: Record<Status, string> = {
  draft: 'Bozza', to_book: 'Da prenotare',
  booked: 'Prenotato', cancelled: 'Annullato', completed: 'Completato',
}

export default function StatusBadge({ status }: { status?: Status | null }) {
  if (!status) return null
  return (
    <span className={`status-badge status-${status}`}>{labels[status]}</span>
  )
}
