import { describe, it, expect } from 'vitest'
import { fmt, fmtTime, fmtDateTime } from '../components/tabs/tabUtils'

describe('fmt', () => {
  it('returns — for null', () => {
    expect(fmt(null)).toBe('—')
  })
  it('returns — for undefined', () => {
    expect(fmt(undefined)).toBe('—')
  })
  it('formats a date string', () => {
    // Use UTC date to avoid timezone shifts on date-only strings
    const result = fmt('2025-06-15')
    expect(result).toMatch(/Jun/)
    expect(result).toMatch(/2025/)
    expect(result).toMatch(/15/)
  })
})

describe('fmtTime', () => {
  it('returns — for null', () => {
    expect(fmtTime(null)).toBe('—')
  })
  it('returns a time string with hours and minutes', () => {
    const result = fmtTime('2025-06-15T14:30:00')
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })
})

describe('fmtDateTime', () => {
  it('returns null for null', () => {
    expect(fmtDateTime(null)).toBeNull()
  })
  it('returns null for undefined', () => {
    expect(fmtDateTime(undefined)).toBeNull()
  })
  it('includes weekday, month, day, and time', () => {
    const result = fmtDateTime('2025-06-15T09:00:00')
    expect(result).not.toBeNull()
    expect(result).toMatch(/\d{1,2}:\d{2}/)
    expect(result).toMatch(/Jun/)
  })
})
