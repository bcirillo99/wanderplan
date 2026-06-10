// frontend/src/components/TripCalendar.tsx
import { useState, useRef, useEffect, useCallback, forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Activity, Trip } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0')

/** Timezone-safe YYYY-MM-DD from a local Date */
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function fmtMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function fmtDayFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function fmtTime(t?: string | null): string {
  return t ? t.slice(0, 5) : ''
}

/** Parse YYYY-MM-DD safely (local, not UTC) */
function parseLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Returns list of [year, month] pairs covered by trip, capped at 6 */
function getMonthsInRange(start: string, end: string): { year: number; month: number }[] {
  const s = parseLocal(start)
  const e = parseLocal(end)
  const months: { year: number; month: number }[] = []
  const cur = new Date(s.getFullYear(), s.getMonth(), 1)
  const limit = new Date(e.getFullYear(), e.getMonth(), 1)
  while (cur <= limit && months.length < 6) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() })
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

/** Returns a 6×7 grid of date strings (or null for out-of-month padding) */
function buildMonthGrid(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(year, month, 1)
  // Week starts Monday: 0=Mon…6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toYMD(new Date(year, month, d)))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  const rows: (string | null)[][] = []
  for (let r = 0; r < cells.length / 7; r++) rows.push(cells.slice(r * 7, r * 7 + 7))
  return rows
}

// ── Component ──────────────────────────────────────────────────────────────────
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props {
  trip: Trip
  tripId: string
  activities: Activity[]
  dates: string[] // all trip dates YYYY-MM-DD
}

interface PopoverData {
  date: string
  acts: Activity[]
  anchorRect: DOMRect
}

export function TripCalendar({ trip, tripId, activities, dates }: Props) {
  const navigate = useNavigate()
  const [popover, setPopover] = useState<PopoverData | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const today = toYMD(new Date())

  const tripDates = new Set(dates)
  const byDate = activities.reduce<Record<string, Activity[]>>((acc, a) => {
    if (!a.activity_date) return acc
    if (!acc[a.activity_date]) acc[a.activity_date] = []
    acc[a.activity_date].push(a)
    return acc
  }, {})

  const start = trip.start_date
  const end = trip.end_date
  const months = start && end ? getMonthsInRange(start, end) : []

  // Close popover on outside click
  useEffect(() => {
    if (!popover) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [popover])

  const handleDayClick = useCallback((dateStr: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!tripDates.has(dateStr)) return
    const rect = e.currentTarget.getBoundingClientRect()
    const acts = byDate[dateStr] ?? []
    setPopover(prev => prev?.date === dateStr ? null : { date: dateStr, acts, anchorRect: rect })
  }, [tripDates, byDate])

  if (!start || !end || months.length === 0) {
    return (
      <div style={{ fontSize: '0.875rem', color: 'var(--fog)' }}>
        Set trip start and end dates to see the calendar.
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Month grids */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 20,
      }}>
        {months.map(({ year, month }) => {
          const rows = buildMonthGrid(year, month)
          return (
            <div key={`${year}-${month}`}>
              {/* Month label */}
              <p style={{
                fontWeight: 600, fontSize: '0.875rem',
                color: 'var(--charcoal)', marginBottom: 12,
                textAlign: 'center', letterSpacing: '-0.012em',
              }}>
                {fmtMonthYear(year, month)}
              </p>

              {/* Days-of-week header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
                {DOW.map(d => (
                  <div key={d} style={{
                    textAlign: 'center', fontSize: '0.625rem',
                    fontWeight: 600, color: 'var(--fog)',
                    textTransform: 'uppercase', letterSpacing: '0.10em', paddingBottom: 4,
                  }}>{d}</div>
                ))}
              </div>

              {/* Day cells */}
              {rows.map((row, ri) => (
                <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                  {row.map((dateStr, ci) => {
                    if (!dateStr) return <div key={ci} style={{ aspectRatio: '1' }} />

                    const inTrip = tripDates.has(dateStr)
                    const isStart = dateStr === start
                    const isEnd = dateStr === end
                    const isToday = dateStr === today
                    const isSelected = popover?.date === dateStr
                    const hasActs = !!(byDate[dateStr]?.length)
                    const dayNum = parseLocal(dateStr).getDate()

                    let bg = 'transparent'
                    let color = inTrip ? 'var(--charcoal)' : 'var(--whisper)'
                    let fontWeight: number = inTrip ? 500 : 400
                    let borderRadius = '50%'
                    let border = 'none'

                    if (isStart || isEnd) {
                      bg = 'var(--coral)'
                      color = 'var(--surface-white)'
                      fontWeight = 700
                    } else if (isSelected) {
                      bg = 'var(--charcoal)'
                      color = 'var(--surface-white)'
                      fontWeight = 700
                    } else if (inTrip) {
                      bg = 'var(--coral-wash)'
                      borderRadius = '6px'
                      color = 'var(--coral-deep)'
                    }

                    if (isToday && !isStart && !isEnd) {
                      border = '1.5px solid var(--coral)'
                    }

                    return (
                      <div key={ci} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <button
                          onClick={inTrip ? (e) => handleDayClick(dateStr, e) : undefined}
                          style={{
                            width: '100%', aspectRatio: '1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: bg, color, fontWeight,
                            fontSize: '0.7rem',
                            borderRadius, border,
                            cursor: inTrip ? 'pointer' : 'default',
                            transition: 'background 0.15s, transform 0.1s',
                            outline: 'none',
                          }}
                          onMouseEnter={e => {
                            if (inTrip && !isStart && !isEnd && !isSelected)
                              e.currentTarget.style.background = 'var(--coral-tint)'
                          }}
                          onMouseLeave={e => {
                            if (inTrip && !isStart && !isEnd && !isSelected)
                              e.currentTarget.style.background = bg
                          }}
                        >
                          {dayNum}
                        </button>
                        {/* Activity dot */}
                        <div style={{
                          width: 4, height: 4, borderRadius: '50%', marginTop: 2,
                          background: hasActs ? 'var(--coral)' : 'transparent',
                          flexShrink: 0,
                        }} />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Popover */}
      {popover && (
        <Popover
          ref={popoverRef}
          data={popover}
          containerRef={containerRef}
          onNavigate={() => navigate(`/trips/${tripId}/days/${popover.date}`)}
          onClose={() => setPopover(null)}
        />
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, marginTop: 18, flexWrap: 'wrap' }}>
        {[
          { bg: 'var(--coral)', label: 'Start / End', radius: '50%' },
          { bg: 'var(--coral-wash)', label: 'Trip days', radius: '4px' },
          { bg: 'var(--coral)', label: 'Activities', dot: true },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.dot ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 16, height: 16, borderRadius: '4px', background: 'var(--coral-wash)' }} />
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--coral)' }} />
              </div>
            ) : (
              <div style={{ width: 16, height: 16, borderRadius: item.radius, background: item.bg }} />
            )}
            <span style={{ fontSize: '0.6875rem', color: 'var(--fog)', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Popover ────────────────────────────────────────────────────────────────────
const Popover = forwardRef<HTMLDivElement, {
  data: PopoverData
  containerRef: React.RefObject<HTMLDivElement | null>
  onNavigate: () => void
  onClose: () => void
}>(({ data, containerRef, onNavigate, onClose }, ref) => {
  const containerRect = containerRef.current?.getBoundingClientRect()
  const anchor = data.anchorRect

  // Position popover below the cell, relative to container
  const top = containerRect ? anchor.bottom - containerRect.top + 8 : anchor.bottom + 8
  const left = containerRect
    ? Math.min(
        Math.max(anchor.left - containerRect.left, 0),
        (containerRect.width ?? 300) - 220
      )
    : anchor.left

  return (
    <div
      ref={ref}
      className="material-panel animate-scale-in"
      style={{
        position: 'absolute',
        top, left,
        width: 240,
        padding: '14px 16px',
        zIndex: 50,
        boxShadow: 'var(--shadow-float)',
        transformOrigin: 'top left',
      }}
    >
      <p style={{
        fontWeight: 600, fontSize: '0.8125rem',
        color: 'var(--charcoal)', marginBottom: 10,
        letterSpacing: '-0.010em',
      }}>
        {fmtDayFull(data.date)}
      </p>

      {data.acts.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--fog)', marginBottom: 12 }}>
          No activities yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, maxHeight: 180, overflowY: 'auto' }}>
          {data.acts
            .sort((a, b) => (!a.start_time ? 1 : !b.start_time ? -1 : a.start_time.localeCompare(b.start_time)))
            .map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--coral)', flexShrink: 0, marginTop: 4, display: 'inline-block' }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--charcoal)', lineHeight: 1.45 }}>
                  {a.start_time && <span className="tabular" style={{ color: 'var(--fog)', marginRight: 4 }}>{fmtTime(a.start_time)}</span>}
                  {a.title ?? 'Untitled'}
                </span>
              </div>
            ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onNavigate}
          className="btn-primary"
          style={{ flex: 1, padding: '8px 12px', justifyContent: 'center' }}
        >
          Open day
        </button>
        <button
          onClick={onClose}
          className="btn-secondary"
          style={{ padding: '8px 12px', justifyContent: 'center', minWidth: 36 }}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  )
})
Popover.displayName = 'Popover'
