// frontend/src/components/tabs/NotesTab.tsx
import type { Note } from '../../types'
import { SectionHeader, ItemCard, TabEmpty } from './TabShared'

export function NotesTab({ notes, onAdd, onEdit, onDelete }: {
  notes: Note[]
  onAdd: () => void
  onEdit: (n: Note) => void
  onDelete: (id: string) => void
}) {
  return (
    <>
      <SectionHeader title="Trip Notes" onAdd={onAdd} />
      {notes.length === 0 ? <TabEmpty msg="No notes added" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notes.map((note) => (
            <ItemCard key={note.id} onDelete={() => onDelete(note.id)} onEdit={() => onEdit(note)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--fog)' }}>
                  {new Date(note.created_at).toLocaleString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--charcoal)', whiteSpace: 'pre-wrap' }}>
                  {note.text}
                </p>
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </>
  )
}
