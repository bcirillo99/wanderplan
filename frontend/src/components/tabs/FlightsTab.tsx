// frontend/src/components/tabs/FlightsTab.tsx
import type { Flight } from '../../types'
import StatusBadge from '../StatusBadge'
import { SectionHeader, ItemCard, TabEmpty } from './TabShared'
import { fmtDateTime } from './tabUtils'

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
            <ItemCard key={f.id} onDelete={() => onDelete(f.id)} onEdit={() => onEdit(f)}>
              <div className="flight-route">
                <div className="flight-airport">
                  <p className="flight-airport__code">{f.origin}</p>
                  <p className="flight-airport__time">{fmtDateTime(f.departure_time)}</p>
                </div>
                <div className="flight-line">
                  <div className="flight-line__track">
                    <div className="flight-line__bar" />
                    <span style={{ fontSize: '0.9rem' }}>✈</span>
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
                {f.flight_number && <span>Flight: <strong>{f.flight_number}</strong></span>}
                {f.booking_reference && <span>Ref: <strong>{f.booking_reference}</strong></span>}
                {f.cost != null && <span className="flight-footer__cost">€ {f.cost.toFixed(2)}</span>}
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </>
  )
}
