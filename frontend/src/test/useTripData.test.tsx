import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTripData, QUERY_KEYS } from '../hooks/useTripData'
import type { Trip, Activity, PackingItem } from '../types'

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
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return { qc, Wrapper: function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }}
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
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
    expect(result.current.loading).toBe(true)
  })

  it('loads trip and activities from API', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.trip?.title).toBe('Japan Trip')
    expect(result.current.activities).toHaveLength(1)
    expect(result.current.activities[0].title).toBe('Shibuya Walk')
  })

  it('computes uniqueDates from trip date range', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.uniqueDates).toHaveLength(10)
    expect(result.current.uniqueDates[0]).toBe('2025-09-01')
    expect(result.current.uniqueDates[9]).toBe('2025-09-10')
  })

  it('computes tripMin and tripMax', async () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tripMin).toBe('2025-09-01T00:00')
    expect(result.current.tripMax).toBe('2025-09-10T23:59')
  })

  it('returns empty arrays as defaults before data loads', () => {
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
    expect(result.current.activities).toEqual([])
    expect(result.current.flights).toEqual([])
    expect(result.current.notes).toEqual([])
  })
})

describe('useTripData — mutations', () => {
  it('addActivity calls API and re-fetches activities', async () => {
    const newActivity = { ...MOCK_ACTIVITY, id: 'a2', title: 'Ramen Tour' }
    vi.mocked(activitiesApi.createActivity).mockResolvedValue(newActivity)

    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
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
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteActivity('a1')
    })

    expect(activitiesApi.deleteActivity).toHaveBeenCalledWith('t1', 'a1')
  })

  it('addActivity mutation also invalidates stats', async () => {
    vi.mocked(activitiesApi.createActivity).mockResolvedValue({ ...MOCK_ACTIVITY, id: 'a2' })
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
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
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
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

// ── Optimistic update tests ────────────────────────────────────────────────────
describe('useTripData — optimistic updates', () => {
  // Helper: deferred promise so we can inspect cache mid-mutation
  function deferred<T>() {
    let resolve!: (v: T) => void
    let reject!: (e: unknown) => void
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
    return { promise, resolve, reject }
  }

  const NEW_ACTIVITY_DATA = {
    title: 'Ramen Tour', activity_date: '2025-09-03',
    location: 'Tokyo', status: 'draft' as const,
    description: null, start_time: null, end_time: null,
    cost: null, pay_method: null, cancellation_date: null, link: null, notes: null,
  }

  it('addActivity: item appears in cache before API resolves', async () => {
    const { promise, resolve } = deferred<Activity>()
    vi.mocked(activitiesApi.createActivity).mockReturnValue(promise)

    const { qc, Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Start mutation without awaiting
    act(() => { result.current.addActivity(NEW_ACTIVITY_DATA) })

    // Cache updated optimistically — new item visible before server responds
    await waitFor(() => {
      const cached = qc.getQueryData<Activity[]>(QUERY_KEYS.activities('t1')) ?? []
      expect(cached.some((a) => a.title === 'Ramen Tour')).toBe(true)
    })

    // Clean up: resolve so mutation completes
    resolve({ ...MOCK_ACTIVITY, id: 'a2', title: 'Ramen Tour' })
  })

  it('deleteActivity: item removed from cache before API resolves', async () => {
    const { promise, resolve } = deferred<void>()
    vi.mocked(activitiesApi.deleteActivity).mockReturnValue(promise)

    const { qc, Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.deleteActivity('a1') })

    await waitFor(() => {
      const cached = qc.getQueryData<Activity[]>(QUERY_KEYS.activities('t1')) ?? []
      expect(cached.find((a) => a.id === 'a1')).toBeUndefined()
    })

    resolve()
  })

  it('updateActivity: patch reflected in cache before API resolves', async () => {
    const { promise, resolve } = deferred<Activity>()
    vi.mocked(activitiesApi.updateActivity).mockReturnValue(promise)

    const { qc, Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.updateActivity('a1', { ...NEW_ACTIVITY_DATA, title: 'Updated Title' })
    })

    await waitFor(() => {
      const cached = qc.getQueryData<Activity[]>(QUERY_KEYS.activities('t1')) ?? []
      expect(cached.find((a) => a.id === 'a1')?.title).toBe('Updated Title')
    })

    resolve({ ...MOCK_ACTIVITY, title: 'Updated Title' })
  })

  it('togglePacking: checked flips in cache before API resolves', async () => {
    const MOCK_ITEM: PackingItem = { id: 'p1', trip_id: 't1', name: 'Passport', category: null, checked: false, notes: null }
    vi.mocked(packingApi.getPackingItems).mockResolvedValue([MOCK_ITEM])

    const { promise, resolve } = deferred<PackingItem>()
    vi.mocked(packingApi.togglePackingItem).mockReturnValue(promise)

    const { qc, Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.togglePacking('p1') })

    await waitFor(() => {
      const cached = qc.getQueryData<PackingItem[]>(QUERY_KEYS.packingItems('t1')) ?? []
      expect(cached.find((i) => i.id === 'p1')?.checked).toBe(true)
    })

    resolve({ ...MOCK_ITEM, checked: true })
  })

  it('addActivity: rolls back cache when API fails', async () => {
    vi.mocked(activitiesApi.createActivity).mockRejectedValue(new Error('network'))

    const { qc, Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addActivity(NEW_ACTIVITY_DATA)
    })

    // Cache rolled back — only original item remains
    const cached = qc.getQueryData<Activity[]>(QUERY_KEYS.activities('t1')) ?? []
    expect(cached).toHaveLength(1)
    expect(cached[0].id).toBe('a1')
  })

  it('deleteActivity: rolls back when API fails', async () => {
    vi.mocked(activitiesApi.deleteActivity).mockRejectedValue(new Error('network'))

    const { qc, Wrapper } = makeWrapper()
    const { result } = renderHook(() => useTripData('t1'), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteActivity('a1')
    })

    // Item restored after rollback
    const cached = qc.getQueryData<Activity[]>(QUERY_KEYS.activities('t1')) ?? []
    expect(cached.find((a) => a.id === 'a1')).toBeDefined()
  })
})
