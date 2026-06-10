// frontend/src/components/tabs/SummaryTab.tsx
import { useNavigate } from 'react-router-dom'
import type { Trip, Activity, Flight, Accommodation, Transport, TripStats, Note } from '../../types'
import { ItemCard } from './TabShared'
import { fmt, PREVIEW_LIMIT } from './tabUtils'
import { TripCalendar } from '../TripCalendar'
import { TripMiniMap } from '../TripMiniMap'

type TodoItem = { icon: string; label: string; category: string }

export function SummaryTab({
  trip, tripId, activities, flights, accommodations, transports, stats, dates,
  onEditTrip: _onEditTrip, onDeleteTrip: _onDeleteTrip, notes, onAddNote, onEditNote, onDeleteNote,
}: {
  trip: Trip | null; tripId: string
  activities: Activity[]; flights: Flight[]
  accommodations: Accommodation[]; transports: Transport[]
  stats: TripStats | null; dates: string[]
  onEditTrip: () => void; onDeleteTrip: () => void
  notes: Note[]; onAddNote: () => void; onEditNote: (n: Note) => void; onDeleteNote: (id: string) => void
}) {
  const navigate = useNavigate()

  const byDate = activities.reduce<Record<string, Activity[]>>((acc, a) => {
    if (!a.activity_date) return acc
    if (!acc[a.activity_date]) acc[a.activity_date] = []
    acc[a.activity_date].push(a)
    return acc
  }, {})
  Object.values(byDate).forEach((list) =>
    list.sort((a, b) => (!a.start_time ? 1 : !b.start_time ? -1 : a.start_time.localeCompare(b.start_time)))
  )

  const todoItems: TodoItem[] = [
    ...flights.filter((f) => f.status === 'to_book' || f.status === 'draft')
      .map((f) => ({ icon: '✈️', label: `${f.origin} → ${f.destination}`, category: 'Flight' })),
    ...accommodations.filter((a) => a.status === 'to_book' || a.status === 'draft')
      .map((a) => ({ icon: '🏨', label: a.name, category: 'Accommodation' })),
    ...activities.filter((a) => a.status === 'to_book' || a.status === 'draft')
      .map((a) => ({ icon: '🗓️', label: a.title ?? 'Activity', category: 'Activity' })),
    ...transports.filter((t) => t.status === 'to_book' || t.status === 'draft')
      .map((t) => ({ icon: '🚌', label: `${t.origin} → ${t.destination}`, category: 'Transport' })),
  ]

  return (
    <div>
      <div className="summary-grid">
        {/* Left column: Notes + To-do */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Calendar + Notes side by side */}
          <div className="summary-section">
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

              {/* Calendar */}
              {trip && (
                <div style={{ flexShrink: 0 }}>
                  <p className="summary-section__title" style={{ marginBottom: 12 }}>Calendar</p>
                  <TripCalendar trip={trip} tripId={tripId} activities={activities} dates={dates} />
                </div>
              )}

              {/* Divider */}
              {trip && <div style={{ width: 1, background: 'var(--border-subtle)', alignSelf: 'stretch', flexShrink: 0 }} />}

              {/* Notes */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
                  <p className="summary-section__title" style={{ margin: 0 }}>Trip notes</p>
                  <button className="btn-add" onClick={onAddNote} type="button">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    Add
                  </button>
                </div>
                {notes.length === 0 ? (
                  <p style={{ fontSize: '0.875rem', color: 'var(--fog)', margin: 0, lineHeight: 1.55 }}>
                    No notes yet. Add reminders, booking refs, tips.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
                    {notes.map((note) => (
                      <ItemCard key={note.id} onDelete={() => onDeleteNote(note.id)} onEdit={() => onEditNote(note)}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--fog)', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 500 }}>
                            {new Date(note.created_at).toLocaleString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--charcoal)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {note.text}
                          </p>
                        </div>
                      </ItemCard>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* To-do */}
          <div className="summary-section">
            <p className="summary-section__title">
              {todoItems.length === 0 ? 'All confirmed' : `Still to book · ${todoItems.length}`}
            </p>
            {todoItems.length === 0 ? (
              <p style={{ fontSize: '0.9375rem', color: 'var(--fog)', margin: 0, lineHeight: 1.55 }}>
                Everything is confirmed. You're good to go.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
                {todoItems.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', background: 'var(--surface-warm)', borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '1rem' }} aria-hidden="true">{item.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--charcoal)', margin: 0, letterSpacing: '-0.008em' }}>{item.label}</p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--fog)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 500 }}>{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Budget */}
        <div className="summary-section">
          <p className="summary-section__title">Budget summary</p>
          {!stats ? (
            <p style={{ fontSize: '0.9375rem', color: 'var(--fog)' }}>Loading…</p>
          ) : (
            <>
              <div style={{
                background: 'linear-gradient(135deg, var(--saffron-wash) 0%, var(--surface-white) 75%)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)', padding: '20px 22px', marginBottom: 18,
              }}>
                <p style={{ fontSize: '0.6875rem', color: 'var(--fog)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Total estimated</p>
                <p className="tabular" style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--charcoal)', margin: 0, letterSpacing: '-0.024em', lineHeight: 1 }}>
                  € {stats.total.toFixed(2)}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { icon: '✈️', label: 'Flights',        value: stats.flights },
                  { icon: '🏨', label: 'Accommodations', value: stats.accommodation },
                  { icon: '🚌', label: 'Transports',     value: stats.transport },
                  { icon: '🗓️', label: 'Activities',     value: stats.activities },
                  { icon: '💰', label: 'Extras',         value: stats.extras },
                ].map((row) => (
                  <div key={row.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0', borderBottom: '1px solid var(--border-subtle)',
                  }}>
                    <span style={{ fontSize: '0.9375rem', color: 'var(--charcoal)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span aria-hidden="true">{row.icon}</span> {row.label}
                    </span>
                    <span className="tabular" style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--charcoal)' }}>€ {row.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Day strip */}
      <div style={{ marginTop: 32 }}>
        <p className="summary-section__title" style={{ marginBottom: 16 }}>Days</p>
        {dates.length === 0 ? (
          <p style={{ fontSize: '0.9375rem', color: 'var(--fog)' }}>Set trip start and end dates to see days here.</p>
        ) : (
          <div className="day-strip">
            {dates.map((date) => {
              const dayActs = byDate[date] ?? []
              const preview = dayActs.slice(0, PREVIEW_LIMIT)
              const extra = dayActs.length - PREVIEW_LIMIT
              return (
                <div key={date} className="day-strip__card" onClick={() => navigate(`/trips/${tripId}/days/${date}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--coral-wash)', color: 'var(--coral-deep)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
                      letterSpacing: '-0.014em',
                    }}>
                      {new Date(date).getDate()}
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--fog)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em' }}>{fmt(date)}</span>
                  </div>
                  {preview.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: 'var(--whisper)', margin: 0 }}>No activities</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {preview.map((a) => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--coral)', flexShrink: 0, marginTop: 4, display: 'inline-block' }} />
                          <span style={{ fontSize: '0.75rem', color: 'var(--charcoal)', lineHeight: 1.45 }}>
                            {a.start_time && <span className="tabular" style={{ color: 'var(--fog)', marginRight: 4 }}>{a.start_time.slice(0, 5)}</span>}
                            {a.title ?? 'Untitled'}
                          </span>
                        </div>
                      ))}
                      {extra > 0 && <p style={{ fontSize: '0.6875rem', color: 'var(--fog)', margin: '4px 0 0 10px', fontWeight: 500 }}>+{extra} more</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Mini map */}
      <div style={{ marginTop: 32 }}>
        <TripMiniMap activities={activities} accommodations={accommodations} />
      </div>
    </div>
  )
}
