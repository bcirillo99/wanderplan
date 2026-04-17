// frontend/src/components/forms/NoteForm.tsx
import { useEffect, useState } from 'react'
import FormField from '../FormField'
import type { Note, NoteCreate } from '../../types'

type NoteFormProps = {
  initial?: Partial<Note>
  onSubmit: (data: NoteCreate) => void
  loading: boolean
}

export function NoteForm({ initial, onSubmit, loading }: NoteFormProps) {
  const [text, setText] = useState(initial?.text ?? '')

  useEffect(() => {
    if (initial) setText(initial.text ?? '')
  }, [initial])

  return (
    <div className="form-stack">
      <FormField label="Note" type="textarea" value={text} onChange={setText} placeholder="Write your note..." rows={4} required />
      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
        onClick={() => text.trim() && onSubmit({ text: text.trim() })}
        disabled={loading || !text.trim()}
      >
        {loading ? 'Saving...' : 'Save Note'}
      </button>
    </div>
  )
}
