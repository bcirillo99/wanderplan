// frontend/src/components/StatusBadge.tsx
import type { Status } from '../types'

const labels: Record<Status, string> = {
  draft: 'Draft', to_book: 'To Book', booked: 'Booked', cancelled: 'Cancelled', completed: 'Completed',
}

export default function StatusBadge({ status }: { status?: Status | null }) {
  if (!status) return null
  return (
    <span className={`status-badge status-${status}`}>{labels[status]}</span>
  )
}
