// frontend/src/components/forms/PackingForm.tsx
import { useState } from 'react'
import FormField from '../FormField'
import type { PackingItemCreate, PackingCategory } from '../../types'
import { PACKING_CATS } from './formOptions'

type PackingFormProps = {
  onSubmit: (data: PackingItemCreate) => void
  loading: boolean
}

export function PackingForm({ onSubmit, loading }: PackingFormProps) {
  const [name, setName]         = useState('')
  const [category, setCategory] = useState<PackingCategory | ''>('')

  return (
    <div className="form-stack">
      <FormField label="Item" type="input" value={name} onChange={setName} placeholder="Passport" required />
      <FormField label="Category" type="select" value={category} onChange={(v) => setCategory(v as PackingCategory)} options={PACKING_CATS} />
      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => name && onSubmit({ name, category: category as PackingCategory || null, notes: null })}
        disabled={loading || !name}
      >
        {loading ? 'Saving...' : 'Add Item'}
      </button>
    </div>
  )
}
