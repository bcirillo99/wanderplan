import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivitiesTab } from '../components/tabs/ActivitiesTab'
import type { Activity } from '../types'

const BASE: Activity = {
  id: '1', trip_id: 't1', activity_date: '2025-06-01',
  title: 'Colosseum Tour', location: 'Rome', status: 'booked',
  description: null, start_time: null, end_time: null,
  cost: null, pay_method: null, cancellation_date: null, link: null, notes: null,
}

const ACTIVITIES: Activity[] = [
  BASE,
  { ...BASE, id: '2', title: 'Trastevere Walk', location: 'Rome', status: 'draft' },
  { ...BASE, id: '3', title: 'Pompeii Day Trip', location: 'Naples', status: 'booked', activity_date: '2025-06-02' },
]

const noop = vi.fn()

describe('ActivitiesTab — search', () => {
  it('shows all activities when search is empty', () => {
    render(<ActivitiesTab activities={ACTIVITIES} onAdd={noop} onEdit={noop} onDelete={noop} />)
    expect(screen.getByText('Colosseum Tour')).toBeInTheDocument()
    expect(screen.getByText('Trastevere Walk')).toBeInTheDocument()
    expect(screen.getByText('Pompeii Day Trip')).toBeInTheDocument()
  })

  it('filters by title', async () => {
    render(<ActivitiesTab activities={ACTIVITIES} onAdd={noop} onEdit={noop} onDelete={noop} />)
    await userEvent.type(screen.getByPlaceholderText(/search by title/i), 'colosseum')
    expect(screen.getByText('Colosseum Tour')).toBeInTheDocument()
    expect(screen.queryByText('Trastevere Walk')).not.toBeInTheDocument()
    expect(screen.queryByText('Pompeii Day Trip')).not.toBeInTheDocument()
  })

  it('filters by location', async () => {
    render(<ActivitiesTab activities={ACTIVITIES} onAdd={noop} onEdit={noop} onDelete={noop} />)
    await userEvent.type(screen.getByPlaceholderText(/search by title/i), 'naples')
    expect(screen.getByText('Pompeii Day Trip')).toBeInTheDocument()
    expect(screen.queryByText('Colosseum Tour')).not.toBeInTheDocument()
  })

  it('is case-insensitive', async () => {
    render(<ActivitiesTab activities={ACTIVITIES} onAdd={noop} onEdit={noop} onDelete={noop} />)
    await userEvent.type(screen.getByPlaceholderText(/search by title/i), 'TRASTEVERE')
    expect(screen.getByText('Trastevere Walk')).toBeInTheDocument()
  })

  it('shows empty message when nothing matches', async () => {
    render(<ActivitiesTab activities={ACTIVITIES} onAdd={noop} onEdit={noop} onDelete={noop} />)
    await userEvent.type(screen.getByPlaceholderText(/search by title/i), 'zzznomatch')
    expect(screen.getByText(/no activities match filters/i)).toBeInTheDocument()
  })
})

describe('ActivitiesTab — status filter', () => {
  it('filters by status', async () => {
    render(<ActivitiesTab activities={ACTIVITIES} onAdd={noop} onEdit={noop} onDelete={noop} />)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'draft')
    expect(screen.getByText('Trastevere Walk')).toBeInTheDocument()
    expect(screen.queryByText('Colosseum Tour')).not.toBeInTheDocument()
    expect(screen.queryByText('Pompeii Day Trip')).not.toBeInTheDocument()
  })

  it('combines search and status filter', async () => {
    render(<ActivitiesTab activities={ACTIVITIES} onAdd={noop} onEdit={noop} onDelete={noop} />)
    await userEvent.type(screen.getByPlaceholderText(/search by title/i), 'rome')
    // both Colosseum and Trastevere are in Rome
    expect(screen.getByText('Colosseum Tour')).toBeInTheDocument()
    expect(screen.getByText('Trastevere Walk')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByRole('combobox'), 'booked')
    // only Colosseum is booked in Rome
    expect(screen.getByText('Colosseum Tour')).toBeInTheDocument()
    expect(screen.queryByText('Trastevere Walk')).not.toBeInTheDocument()
  })
})
