import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExtraForm } from '../components/forms/ExtraForm'
import type { Extra } from '../types'

const EXISTING_EXTRA: Extra = {
  id: 'e1', trip_id: 't1',
  description: 'Travel insurance',
  amount: 89.50,
  category: 'other',
  currency: 'USD',
  is_estimated: true,
  actual_amount: null,
  notes: null,
}

describe('ExtraForm — add mode', () => {
  it('renders empty fields', () => {
    render(<ExtraForm onSubmit={vi.fn()} loading={false} />)
    expect(screen.getByPlaceholderText(/visa fee/i)).toHaveValue('')
    expect(screen.getByRole('button')).toHaveTextContent('Add Extra')
  })

  it('disables submit when fields empty', () => {
    render(<ExtraForm onSubmit={vi.fn()} loading={false} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onSubmit with correct data', async () => {
    const onSubmit = vi.fn()
    render(<ExtraForm onSubmit={onSubmit} loading={false} />)
    await userEvent.type(screen.getByPlaceholderText(/visa fee/i), 'Visa')
    await userEvent.type(screen.getByDisplayValue(''), '50')
    await userEvent.click(screen.getByRole('button'))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Visa',
      amount: 50,
    }))
  })
})

describe('ExtraForm — edit mode', () => {
  it('pre-populates fields from initial', () => {
    render(<ExtraForm initial={EXISTING_EXTRA} onSubmit={vi.fn()} loading={false} />)
    expect(screen.getByDisplayValue('Travel insurance')).toBeInTheDocument()
    expect(screen.getByDisplayValue('89.5')).toBeInTheDocument()
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument()
  })

  it('shows Update Extra button', () => {
    render(<ExtraForm initial={EXISTING_EXTRA} onSubmit={vi.fn()} loading={false} />)
    expect(screen.getByRole('button')).toHaveTextContent('Update Extra')
  })

  it('pre-checks estimated checkbox', () => {
    render(<ExtraForm initial={EXISTING_EXTRA} onSubmit={vi.fn()} loading={false} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('submits updated values', async () => {
    const onSubmit = vi.fn()
    render(<ExtraForm initial={EXISTING_EXTRA} onSubmit={onSubmit} loading={false} />)
    const descInput = screen.getByDisplayValue('Travel insurance')
    await userEvent.clear(descInput)
    await userEvent.type(descInput, 'Updated insurance')
    await userEvent.click(screen.getByRole('button'))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Updated insurance',
      amount: 89.50,
    }))
  })
})
