// frontend/src/components/forms/FlightForm.tsx
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import FormField from '../FormField'
import AirportInput from '../AirportInput'
import type { Flight, FlightCreate, FlightSearchResult, Status } from '../../types'
import { STATUS_OPTIONS } from './formOptions'
import { searchFlights } from '../../api/flights'

type FlightFormProps = {
  initial?: Partial<Flight>
  onSubmit: (data: FlightCreate) => void
  loading: boolean
  minDateTime?: string
  maxDateTime?: string
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function toLocalDatetime(iso: string): string {
  if (!iso) return ''
  return iso.slice(0, 16)
}

function fmtTime(iso: string): string {
  if (!iso) return '—'
  return iso.slice(11, 16)
}

const CABIN_OPTIONS = [
  { value: 'economy',         label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business',        label: 'Business' },
  { value: 'first',           label: 'First' },
]

// ─── Flight search modal (nested above parent modal) ──────────────────────────

interface FlightSearchModalProps {
  origin: string
  destination: string
  onSelect: (result: FlightSearchResult) => void
  onClose: () => void
  minDate?: string   // YYYY-MM-DD
  maxDate?: string   // YYYY-MM-DD
}

function FlightSearchModal({ origin, destination, onSelect, onClose, minDate, maxDate }: FlightSearchModalProps) {
  const [searchDate, setSearchDate] = useState('')
  const [cabin, setCabin]           = useState('economy')
  const [results, setResults]       = useState<FlightSearchResult[]>([])
  const [searching, setSearching]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const canSearch = origin.length >= 2 && destination.length >= 2 && searchDate.length === 10

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSearch() {
    if (!canSearch) return
    setSearching(true)
    setError(null)
    setResults([])
    setSelectedIdx(null)
    try {
      const data = await searchFlights(origin, destination, searchDate, cabin)
      setResults(data)
      if (data.length === 0) setError('No flights found for this route and date.')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  function handleSelect(result: FlightSearchResult, idx: number) {
    setSelectedIdx(idx)
    onSelect(result)
    onClose()
  }

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(4px)',
        background: 'rgba(26,58,42,0.50)',
        animation: 'fadeIn 0.2s ease both',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 620,
        background: 'var(--ivory)', borderRadius: 24,
        boxShadow: '0 24px 80px rgba(26,58,42,0.28)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '88vh', overflow: 'hidden',
        animation: 'scaleIn 0.2s ease both',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid var(--cream-dark)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--forest-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2a1 1 0 0 0-.5 1.7l3.5 3.5L3 16l2 2 4-2 3.5 3.5a1 1 0 0 0 1.7-.5z"/>
            </svg>
            <span style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--charcoal)', letterSpacing: '-0.014em' }}>
              Search flights
            </span>
            <span style={{
              background: 'var(--mist)', color: 'var(--forest-mid)',
              fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px',
              borderRadius: 20, letterSpacing: '0.03em',
            }}>
              {origin.toUpperCase()} → {destination.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%', border: 'none',
              background: 'transparent', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--forest-mid)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Disclaimer */}
          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 10, padding: '9px 12px',
            fontSize: '0.75rem', color: '#92400e', lineHeight: 1.5,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
            <span>
              Results come from Google Flights and may not reflect current availability or exact prices. Always verify on the airline's official site before booking.
            </span>
          </div>

          {/* Search controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                value={searchDate}
                min={minDate}
                max={maxDate}
                onChange={e => setSearchDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cabin class</label>
              <select className="form-control" value={cabin} onChange={e => setCabin(e.target.value)}>
                {CABIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ justifyContent: 'center' }}
            onClick={handleSearch}
            disabled={!canSearch || searching}
          >
            {searching
              ? <><Spinner /> Searching…</>
              : <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                  </svg>
                  Search flights
                </>
            }
          </button>

          {error && (
            <p style={{ fontSize: '0.8rem', color: '#dc2626', textAlign: 'center' }}>{error}</p>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {results.length} result{results.length > 1 ? 's' : ''} — click to apply
              </p>
              {results.map((result, idx) => {
                const isSelected = selectedIdx === idx
                const firstLeg   = result.legs[0]
                const lastLeg    = result.legs[result.legs.length - 1]
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(result, idx)}
                    style={{
                      background: isSelected ? 'var(--mist)' : '#fff',
                      border: isSelected ? '1.5px solid var(--forest-light)' : '1px solid var(--cream-dark)',
                      borderRadius: 14,
                      padding: '14px 16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                      boxShadow: isSelected ? '0 0 0 3px rgba(184,221,200,0.35)' : '0 1px 4px rgba(26,58,42,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {/* Top: price + duration + stops badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="tabular" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--charcoal)', letterSpacing: '-0.018em' }}>
                          {result.price != null ? `${result.currency ?? '€'}${result.price.toFixed(0)}` : '—'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--sage)' }}>
                          · {fmtDuration(result.duration_minutes)}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600,
                        padding: '2px 9px', borderRadius: 20,
                        background: result.stops === 0 ? '#d1edda' : '#fff3cd',
                        color: result.stops === 0 ? '#1a6630' : '#856404',
                      }}>
                        {result.stops === 0 ? 'Direct' : `${result.stops} stop${result.stops > 1 ? 's' : ''}`}
                      </span>
                    </div>

                    {/* Route visualization: one row per leg */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {result.legs.map((leg, li) => (
                        <div key={li}>
                          {/* Leg row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                            {/* Departure */}
                            <span style={{ fontWeight: 700, color: 'var(--forest)', width: 36 }}>{leg.departure_airport}</span>
                            <span style={{ color: 'var(--charcoal)', fontWeight: 500, width: 36 }}>{fmtTime(leg.departure_time)}</span>

                            {/* Line + airline badge */}
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{ height: 1, flex: 1, background: 'var(--mint)' }} />
                              <span style={{
                                fontSize: '0.65rem', fontWeight: 600, color: 'var(--forest-mid)',
                                background: 'var(--mist)', padding: '1px 6px', borderRadius: 8,
                                whiteSpace: 'nowrap',
                              }}>
                                {leg.airline} {leg.flight_number}
                              </span>
                              <div style={{ height: 1, flex: 1, background: 'var(--mint)' }} />
                            </div>

                            {/* Arrival */}
                            <span style={{ color: 'var(--charcoal)', fontWeight: 500, width: 36, textAlign: 'right' }}>{fmtTime(leg.arrival_time)}</span>
                            <span style={{ fontWeight: 700, color: 'var(--forest)', width: 36, textAlign: 'right' }}>{leg.arrival_airport}</span>
                          </div>

                          {/* Layover indicator between legs */}
                          {li < result.legs.length - 1 && (
                            <div style={{
                              margin: '4px 0 4px 36px',
                              fontSize: '0.65rem', color: '#9ca3af',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                              </svg>
                              Layover · {leg.arrival_airport}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Summary footer: first departure → last arrival */}
                    {result.legs.length > 1 && firstLeg && lastLeg && (
                      <div style={{
                        paddingTop: 8, borderTop: '1px solid var(--cream-dark)',
                        fontSize: '0.72rem', color: 'var(--sage)',
                        display: 'flex', gap: 6,
                      }}>
                        <span>Total:</span>
                        <span style={{ color: 'var(--charcoal)', fontWeight: 500 }}>
                          {fmtTime(firstLeg.departure_time)} ({firstLeg.departure_airport}) → {fmtTime(lastLeg.arrival_time)} ({lastLeg.arrival_airport})
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function FlightForm({ initial, onSubmit, loading, minDateTime, maxDateTime }: FlightFormProps) {
  const [origin, setOrigin]     = useState(initial?.origin ?? '')
  const [dest, setDest]         = useState(initial?.destination ?? '')
  const [dep, setDep]           = useState(initial?.departure_time ?? '')
  const [arr, setArr]           = useState(initial?.arrival_time ?? '')
  const [airline, setAirline]   = useState(initial?.airline ?? '')
  const [flightNo, setFlightNo] = useState(initial?.flight_number ?? '')
  const [cost, setCost]         = useState(initial?.cost?.toString() ?? '')
  const [status, setStatus]     = useState<Status>(initial?.status ?? 'to_book')
  const [ref, setRef]           = useState(initial?.booking_reference ?? '')

  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [pendingLegs, setPendingLegs]         = useState<FlightSearchResult['legs'] | null>(initial?.legs ?? null)
  const [pendingStops, setPendingStops]       = useState<number | null>(initial?.stops ?? null)

  function applyResult(result: FlightSearchResult) {
    const leg = result.legs[0]
    if (!leg) return
    setAirline(leg.airline)
    setFlightNo(leg.flight_number)
    const lastLeg = result.legs[result.legs.length - 1]
    if (leg.departure_time)    setDep(toLocalDatetime(leg.departure_time))
    if (lastLeg?.arrival_time) setArr(toLocalDatetime(lastLeg.arrival_time))
    if (result.price != null)  setCost(result.price.toFixed(2))
    setPendingLegs(result.legs)
    setPendingStops(result.stops)
  }

  return (
    <div className="form-stack">
      {/* Route */}
      <div className="form-grid-2">
        <AirportInput label="Origin" value={origin} onChange={setOrigin} placeholder="MXP" required />
        <AirportInput label="Destination" value={dest} onChange={setDest} placeholder="NRT" required />
      </div>

      {/* Search button */}
      <button
        type="button"
        className="btn-secondary"
        style={{ justifyContent: 'center', width: '100%' }}
        onClick={() => setSearchModalOpen(true)}
        disabled={origin.length < 2 || dest.length < 2}
        title={origin.length < 2 || dest.length < 2 ? 'Enter origin and destination first' : ''}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2a1 1 0 0 0-.5 1.7l3.5 3.5L3 16l2 2 4-2 3.5 3.5a1 1 0 0 0 1.7-.5z"/>
        </svg>
        Search available flights
      </button>

      {/* Departure / Arrival */}
      <div className="form-grid-2">
        <FormField label="Departure" type="datetime" value={dep} onChange={setDep} min={minDateTime} max={maxDateTime} />
        <FormField label="Arrival" type="datetime" value={arr} onChange={setArr} min={dep || minDateTime} max={maxDateTime} />
      </div>

      {/* Airline / Flight No */}
      <div className="form-grid-2">
        <FormField label="Airline" type="input" value={airline} onChange={setAirline} placeholder="Ryanair" />
        <FormField label="Flight No." type="input" value={flightNo} onChange={setFlightNo} placeholder="FR1234" />
      </div>

      {/* Cost / Status */}
      <div className="form-grid-2">
        <FormField label="Cost (€)" type="input" inputType="number" value={cost} onChange={setCost} />
        <FormField label="Status" type="select" value={status} onChange={(v) => setStatus(v as Status)} options={STATUS_OPTIONS} />
      </div>

      <FormField label="Booking Ref" type="input" value={ref} onChange={setRef} placeholder="ABC123" />

      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => origin && dest && onSubmit({
          origin,
          destination: dest,
          departure_time: dep || null,
          arrival_time: arr || null,
          airline: airline || null,
          flight_number: flightNo || null,
          cost: cost ? parseFloat(cost) : null,
          status,
          booking_reference: ref || null,
          baggage_included: null,
          pay_method: null,
          link: null,
          notes: null,
          stops: pendingStops ?? null,
          legs: pendingLegs ?? null,
        })}
        disabled={loading || !origin || !dest}
      >
        {loading ? 'Saving...' : initial?.id ? 'Update Flight' : 'Add Flight'}
      </button>

      {/* Search modal (renders above parent modal) */}
      {searchModalOpen && (
        <FlightSearchModal
          origin={origin}
          destination={dest}
          onSelect={applyResult}
          onClose={() => setSearchModalOpen(false)}
          minDate={minDateTime?.slice(0, 10)}
          maxDate={maxDateTime?.slice(0, 10)}
        />
      )}
    </div>
  )
}
