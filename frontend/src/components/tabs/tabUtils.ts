// frontend/src/components/tabs/tabUtils.ts

export const PREVIEW_LIMIT = 3

export function fmt(d?: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtTime(d?: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function fmtDateTime(d?: string | null): string | null {
  if (!d) return null
  return new Date(d).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
