// frontend/src/components/forms/ExtraForm.tsx
import { useState } from 'react'
import FormField from '../FormField'
import type { Extra, ExtraCreate, ExtraCategory } from '../../types'
import { EXTRA_CATS } from './formOptions'

type ExtraFormProps = {
  initial?: Partial<Extra>
  onSubmit: (data: ExtraCreate) => void
  loading: boolean
}

export function ExtraForm({ initial, onSubmit, loading }: ExtraFormProps) {
  const [desc, setDesc]         = useState(initial?.description ?? '')
  const [amount, setAmount]     = useState(initial?.amount?.toString() ?? '')
  const [category, setCategory] = useState<ExtraCategory | ''>(initial?.category ?? '')
  const [currency, setCurrency] = useState(initial?.currency ?? 'EUR')
  const [isEstimated, setIsEst] = useState(initial?.is_estimated ?? false)

  return (
    <div className="form-stack">
      <FormField label="Description" type="input" value={desc} onChange={setDesc} placeholder="Visa fee, travel insurance…" required />
      <div className="form-grid-2">
        <FormField label="Amount" type="input" inputType="number" value={amount} onChange={setAmount} required />
        <FormField label="Currency" type="input" value={currency} onChange={setCurrency} placeholder="EUR" />
      </div>
      <FormField label="Category" type="select" value={category} onChange={(v) => setCategory(v as ExtraCategory)} options={EXTRA_CATS} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--forest-mid)', cursor: 'pointer' }}>
        <input type="checkbox" checked={isEstimated} onChange={(e) => setIsEst(e.target.checked)} />
        Estimated Amount
      </label>
      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => amount && desc.trim() && onSubmit({
          description: desc.trim(),
          amount: parseFloat(amount),
          category: category as ExtraCategory || null,
          currency: currency || null,
          is_estimated: isEstimated,
          actual_amount: null,
          notes: null,
        })}
        disabled={loading || !amount || !desc.trim()}
      >
        {loading ? 'Saving...' : initial?.id ? 'Update Extra' : 'Add Extra'}
      </button>
    </div>
  )
}
