import { describe, it, expect } from 'vitest'
import type { Trip } from '../types'

// Same predicate used in HomePage
function filterTrips(trips: Trip[], query: string): Trip[] {
  const q = query.trim().toLowerCase()
  if (!q) return trips
  return trips.filter((t) =>
    t.title.toLowerCase().includes(q) ||
    (t.destination ?? '').toLowerCase().includes(q)
  )
}

const TRIPS: Trip[] = [
  { id: '1', title: 'Japan Adventure', destination: 'Tokyo', start_date: null, end_date: null },
  { id: '2', title: 'Road Trip',       destination: 'California', start_date: null, end_date: null },
  { id: '3', title: 'Weekend Break',   destination: null, start_date: null, end_date: null },
]

describe('trip search filter', () => {
  it('returns all trips for empty query', () => {
    expect(filterTrips(TRIPS, '')).toHaveLength(3)
  })

  it('returns all trips for whitespace query', () => {
    expect(filterTrips(TRIPS, '   ')).toHaveLength(3)
  })

  it('matches by title', () => {
    const result = filterTrips(TRIPS, 'japan')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('matches by destination', () => {
    const result = filterTrips(TRIPS, 'california')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('is case-insensitive', () => {
    expect(filterTrips(TRIPS, 'JAPAN')).toHaveLength(1)
    expect(filterTrips(TRIPS, 'Tokyo')).toHaveLength(1)
  })

  it('handles null destination without throwing', () => {
    expect(() => filterTrips(TRIPS, 'weekend')).not.toThrow()
    expect(filterTrips(TRIPS, 'weekend')).toHaveLength(1)
  })

  it('returns empty array when no match', () => {
    expect(filterTrips(TRIPS, 'zzznomatch')).toHaveLength(0)
  })

  it('matches partial strings', () => {
    const result = filterTrips(TRIPS, 'road')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })
})
