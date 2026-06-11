// frontend/src/components/tabs/FlightsTab.tsx
import { useState } from 'react'
import type { Flight, FlightLegResult } from '../../types'
import StatusBadge from '../StatusBadge'
import { SectionHeader, ItemCard, TabEmpty } from './TabShared'
import { PlaneIcon } from '../Icons'
import { fmtDateTime } from './tabUtils'

function fmtTime(iso: string | undefined | null): string {
  if (!iso) return '—'
  return iso.slice(11, 16)
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function LegsDetail({ legs }: { legs: FlightLegResult[] }) {
  const totalMin = legs.reduce((acc, l) => acc + l.duration_minutes, 0)
  return (
    <div style={{
      marginTop: 10, paddingTop: 10,
      borderTop: '1px dashed var(--border-subtle)',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {legs.map((leg, i) => (
        <div key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--charcoal)', width: 34 }}>{leg.departure_airport}</span>
            <span style={{ color: 'var(--charcoal)', fontWeight: 500, width: 34 }}>{fmtTime(leg.departure_time)}</span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ height: 1, flex: 1, background: 'var(--border-subtle)' }} />
              <span style={{
                fontSize: '0.65rem', fontWeight: 600,
                color: 'var(--fog)', background: 'var(--surface-warm)',
                padding: '1px 6px', borderRadius: 8, whiteSpace: 'nowrap',
              }}>
                {leg.airline} {leg.flight_number}
              </span>
              <div style={{ height: 1, flex: 1, background: 'var(--border-subtle)' }} />
            </div>
            <span style={{ color: 'var(--charcoal)', fontWeight: 500, width: 34, textAlign: 'right' }}>{fmtTime(leg.arrival_time)}</span>
            <span style={{ fontWeight: 700, color: 'var(--charcoal)', width: 34, textAlign: 'right' }}>{leg.arrival_airport}</span>
          </div>
          {i < legs.length - 1 && (
            <div style={{ margin: '3px 0 3px 34px', fontSize: '0.65rem', color: 'var(--whisper)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Layover · {leg.arrival_airport}
            </div>
          )}
        </div>
      ))}
      {totalMin > 0 && (
        <div style={{ fontSize: '0.7rem', color: 'var(--fog)', textAlign: 'right' }}>
          Total flight time: {fmtDuration(totalMin)}
        </div>
      )}
    </div>
  )
}

function FlightCard({ f, onEdit, onDelete }: { f: Flight; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const hasLegs = (f.legs?.length ?? 0) > 0

  return (
    <ItemCard onDelete={onDelete} onEdit={onEdit}>
      <div className="flight-route">
        <div className="flight-airport">
          <p className="flight-airport__code">{f.origin}</p>
          <p className="flight-airport__time">{fmtDateTime(f.departure_time)}</p>
        </div>
        <div className="flight-line">
          <div className="flight-line__track">
            <div className="flight-line__bar" />
            <span style={{ display: 'inline-flex', color: 'var(--fog)' }}><PlaneIcon size={15} /></span>
            <div className="flight-line__bar" />
          </div>
          <span className="flight-line__airline">{f.airline ?? ''}</span>
        </div>
        <div className="flight-airport">
          <p className="flight-airport__code">{f.destination}</p>
          <p className="flight-airport__time">{fmtDateTime(f.arrival_time)}</p>
        </div>
      </div>

      <div className="flight-footer">
        <StatusBadge status={f.status} />
        {f.stops != null && (
          <span
            style={{
              fontSize: '0.7rem', fontWeight: 600,
              padding: '2px 8px', borderRadius: 20,
              background: f.stops === 0 ? 'var(--success-wash)' : 'var(--saffron-wash)',
              color: f.stops === 0 ? 'var(--success)' : 'var(--saffron-deep)',
              cursor: hasLegs ? 'pointer' : 'default',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
            onClick={() => hasLegs && setExpanded(e => !e)}
            title={hasLegs ? (expanded ? 'Hide details' : 'Show leg details') : undefined}
          >
            {f.stops === 0 ? 'Direct' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`}
            {hasLegs && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            )}
          </span>
        )}
        {f.flight_number && <span>Flight: <strong>{f.flight_number}</strong></span>}
        {f.booking_reference && <span>Ref: <strong>{f.booking_reference}</strong></span>}
        {f.cost != null && <span className="flight-footer__cost">€ {f.cost.toFixed(2)}</span>}
      </div>

      {expanded && hasLegs && <LegsDetail legs={f.legs!} />}
    </ItemCard>
  )
}

export function FlightsTab({ flights, onAdd, onEdit, onDelete }: {
  flights: Flight[]
  onAdd: () => void
  onEdit: (f: Flight) => void
  onDelete: (id: string) => void
}) {
  return (
    <>
      <SectionHeader title="Flights" onAdd={onAdd} />
      {flights.length === 0 ? <TabEmpty msg="No flights added" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {flights.map((f) => (
            <FlightCard
              key={f.id}
              f={f}
              onEdit={() => onEdit(f)}
              onDelete={() => onDelete(f.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}
