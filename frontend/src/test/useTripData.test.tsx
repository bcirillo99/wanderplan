import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTripData } from '../hooks/useTripData'
import type { Trip, Activity } from '../types'

// ── API mocks ──────────────────────────────────────────────────────────────────
const MOCK_TRIP: Trip = {
  id: 't1', title: 'Japan Trip', destination: 'Tokyo',
  start_date: '2025-09-01', end_date: '2025-09-10',
  description: null, cover_image: null, notes: null,
}
const MOCK_ACTIVITY: Activity = {
  id: 'a1', trip_id: 't1', title: 'Shibuya Walk', activity_date: '2025-09-02',
  location: 'Tokyo', status: 'booked',
  description: null, start_time: null, end_time: null,
  cost: 0, pay_method: null, cancellation_date: null, link: null, notes: null,
}

vi.mock('../api/trips',          () => ({ getTrip: vi.fn(), updateTrip: vi.fn(), deleteTrip: vi.fn() }))
vi.mock('../api/activities',     () => ({ getActivities: vi.fn(), createActivity: vi.fn(), updateActivity: vi.fn(), deleteActivity: vi.fn() }))
vi.mock('../api/flights',        () => ({ getFlights: vi.fn(), createFlight: vi.fn(), updateFlight: vi.fn(), deleteFlight: vi.fn() }))
vi.mock('../api/accommodations', () => ({ getAccommodations: vi.fn(), createAccommodation: vi.fn(), updateAccommodation: vi.fn(), deleteAccommodation: vi.fn() }))
vi.mock('../api/transports',     () => ({ getTransports: vi.fn(), createTransport: vi.fn(), updateTransport: vi.fn(), deleteTransport: vi.fn() }))
vi.mock('../api/extras',         () => ({ getExtras: vi.fn(), createExtra: vi.fn(), updateExtra: vi.fn(), deleteExtra: vi.fn() }))
vi.mock('../api/packing_items',  () => ({ getPackingItems: vi.fn(), createPackingItem: vi.fn(), deletePackingItem: vi.fn(), togglePackingItem: vi.fn() }))
vi.mock('../api/stats',          () => ({ getTripStats: vi.fn() }))
vi.mock('../api/notes',          () => ({ getNotes: vi.fn(), createNote: vi.fn(), updateNote: vi.fn(), deleteNote: vi.fn() }))
vi.mock('sonner',                () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import * as tripsApi           from '../api/trips'
import * as activitiesApi      from '../api/activities'
import * as flightsApi         from '../api/flights'
import * as accommodationsApi  from '../api/accommodations'
import * as transportsApi      from '../api/transports'
import * as extrasApi          from '../api/extras'
import * as packingApi         from '../api/packing_items'
import * as statsApi           from '../api/stats'
import * as notesApi           from '../api/notes'
import { toast }               from 'sonner'

// ── Test wrapper ───────────────────────────────────────────────────────────────
function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

const EMPTY_STATS = { flights: 0, transport: 0, accommodation: 0, activities: 0, extras: 0, total: 0 }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(tripsApi.getTrip).mockResolvedValue(MOCK_TRIP)
  vi.mocked(activitiesApi.getActivities).mockResolvedValue([MOCK_ACTIVITY])
  vi.mocked(flightsApi.getFlights).mockResolvedValue([])
  vi.mocked(accommodationsApi.getAccommodations).mockResolvedValue([])
  vi.mocked(transportsApi.getTransports).mockResolvedValue([])
  vi.mocked(extrasApi.getExtras).mockResolvedValue([])
  vi.mocked(packingApi.getPackingItems).mockResolvedValue([])
  vi.mocked(notesApi.getNotes).mockResolvedValue([])
  vi.mocked(statsApi.getTripStats).mockResolvedValue(EMPTY_STATS)
})

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('useTripData — queries', () => {
  it('starts in loading state', () => {
    const { result } = renderHook(() => useTripData('t1'), { wrapper: makeWrapper() })
    expect(result.current.loading).toBe(true)
  })

  it('loads trip and activities from API', async () => {
    const { result } = renderHook(() => useTripData('t1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.trip?.title).toBe('Japan Trip')
    expect(result.current.activities).toHaveLength(1)
    expect(result.current.activities[0].title).toBe('Shibuya Walk')
  })

  it('computes uniqueDates from trip date range', async () => {
    const { result } = renderHook(() => useTripData('t1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.uniqueDates).toHaveLength(10)
    expect(result.current.uniqueDates[0]).toBe('2025-09-01')
    expect(result.current.uniqueDates[9]).toBe('2025-09-10')
  })

  it('computes tripMin and tripMax', async () => {
    const { result } = renderHook(() => useTripData('t1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tripMin).toBe('2025-09-01T00:00')
    expect(result.current.tripMax).toBe('2025-09-10T23:59')
  })

  it('returns empty arrays as defaults before data loads', () => {
    const { result } = renderHook(() => useTripData('t1'), { wrapper: makeWrapper() })
    expect(result.current.activities).toEqual([])
    expect(result.current.flights).toEqual([])
    expect(result.current.notes).toEqual([])
  })
})

describe('useTripData — mutations', () => {
  it('addActivity calls API and re-fetches activities', async () => {
    const newActivity = { ...MOCK_ACTIVITY, id: 'a2', title: 'Ramen Tour' }
    vi.mocked(activitiesApi.createActivity).mockResolvedValue(newActivity)

    const { result } = renderHook(() => useTripData('t1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addActivity({
        title: 'Ramen Tour', activity_date: '2025-09-03',
        location: 'Tokyo', status: 'draft',
        description: null, start_time: null, end_time: null,
        cost: null, pay_method: null, cancellation_date: null, link: null, notes: null,
      })
    })

    expect(activitiesApi.createActivity).toHaveBeenCalledWith('t1', expect.objectContaining({ title: 'Ramen Tour' }))
    // invalidation triggers a re-fetch
    expect(activitiesApi.getActivities).toHaveBeenCalledTimes(2)
  })

  it('deleteActivity calls API with correct ids', async () => {
    vi.mocked(activitiesApi.deleteActivity).mockResolvedValue(undefined)
    const { result } = renderHook(() => useTripData('t1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteActivity('a1')
    })

    expect(activitiesApi.deleteActivity).toHaveBeenCalledWith('t1', 'a1')
  })

  it('addActivity mutation also invalidates stats', async () => {
    vi.mocked(activitiesApi.createActivity).mockResolvedValue({ ...MOCK_ACTIVITY, id: 'a2' })
    const { result } = renderHook(() => useTripData('t1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addActivity({
        title: 'x', activity_date: '2025-09-03',
        location: null, status: null, description: null, start_time: null,
        end_time: null, cost: null, pay_method: null, cancellation_date: null, link: null, notes: null,
      })
    })

    // stats re-fetched after activity added
    expect(statsApi.getTripStats).toHaveBeenCalledTimes(2)
  })

  it('shows error toast when addActivity fails', async () => {
    vi.mocked(activitiesApi.createActivity).mockRejectedValue(new Error('network error'))
    const { result } = renderHook(() => useTripData('t1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addActivity({
        title: 'Fail', activity_date: '2025-09-03',
        location: null, status: null, description: null, start_time: null,
        end_time: null, cost: null, pay_method: null, cancellation_date: null, link: null, notes: null,
      })
    })

    expect(toast.error).toHaveBeenCalledWith('Failed to add activity')
  })
})
