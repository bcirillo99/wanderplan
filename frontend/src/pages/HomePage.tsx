import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTrips, createTrip, deleteTrip } from '../api/trips'
import type { Trip, TripCreate } from '../types'

export default function HomePage() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [destination, setDestination] = useState('')
  const [form, setForm] = useState<Partial<TripCreate>>({})

  useEffect(() => {
    getTrips()
      .then(setTrips)
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = () => {
    if (destination.trim()) {
      setForm({ destination: destination.trim() })
      setShowModal(true)
    } else {
      setShowModal(true)
    }
  }

  const handleCreate = async () => {
    if (!form.title) return
    const trip = await createTrip(form as TripCreate)
    setTrips(prev => [...prev, trip])
    setShowModal(false)
    setForm({})
    setDestination('')
    navigate(`/trips/${trip.id}`)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteTrip(id)
    setTrips(prev => prev.filter(t => t.id !== id))
  }

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : null

  const getDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null
    const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return '1 giorno'
    return `${days} giorni`
  }

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", minHeight: '100vh', background: '#0a0a0a', color: '#f5f0e8' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Fraunces:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #e8c547; color: #0a0a0a; }

        .hero {
          position: relative;
          height: 88vh;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 0 5vw 8vh;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse at 20% 50%, rgba(232, 197, 71, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(180, 120, 60, 0.08) 0%, transparent 50%),
            #0a0a0a;
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(245, 240, 232, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245, 240, 232, 0.03) 1px, transparent 1px);
          background-size: 80px 80px;
        }

        .nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 5vw;
          z-index: 100;
          mix-blend-mode: normal;
        }

        .nav-logo {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #f5f0e8;
        }

        .nav-logo span {
          color: #e8c547;
        }

        .nav-links {
          display: flex;
          gap: 36px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(245, 240, 232, 0.5);
        }

        .nav-links a {
          text-decoration: none;
          color: inherit;
          transition: color 0.2s;
          cursor: pointer;
        }

        .nav-links a:hover { color: #f5f0e8; }

        .hero-eyebrow {
          font-family: "'Fraunces', serif";
          font-size: 13px;
          font-weight: 300;
          font-style: italic;
          letter-spacing: 0.15em;
          color: #e8c547;
          margin-bottom: 20px;
          position: relative;
          z-index: 2;
        }

        .hero-title {
          font-size: clamp(52px, 8vw, 110px);
          font-weight: 800;
          line-height: 0.92;
          letter-spacing: -0.03em;
          position: relative;
          z-index: 2;
          margin-bottom: 48px;
        }

        .hero-title .accent {
          color: #e8c547;
          font-style: italic;
          font-family: "'Fraunces', serif";
          font-weight: 300;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: rgba(245, 240, 232, 0.06);
          border: 1px solid rgba(245, 240, 232, 0.12);
          backdrop-filter: blur(20px);
          border-radius: 4px;
          padding: 6px 6px 6px 28px;
          max-width: 580px;
          position: relative;
          z-index: 2;
          transition: border-color 0.2s;
        }

        .search-bar:focus-within {
          border-color: rgba(232, 197, 71, 0.4);
        }

        .search-bar input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #f5f0e8;
          font-family: "'Syne', sans-serif";
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .search-bar input::placeholder {
          color: rgba(245, 240, 232, 0.3);
          font-weight: 400;
        }

        .search-btn {
          background: #e8c547;
          color: #0a0a0a;
          border: none;
          border-radius: 2px;
          padding: 14px 28px;
          font-family: "'Syne', sans-serif";
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          white-space: nowrap;
        }

        .search-btn:hover { background: #f0d060; transform: translateY(-1px); }
        .search-btn:active { transform: translateY(0); }

        .section {
          padding: 80px 5vw;
        }

        .section-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 48px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(245, 240, 232, 0.4);
        }

        .trip-count {
          font-family: "'Fraunces', serif";
          font-size: 13px;
          font-style: italic;
          color: rgba(245, 240, 232, 0.3);
        }

        .trips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2px;
        }

        .trip-card {
          position: relative;
          background: rgba(245, 240, 232, 0.03);
          border: 1px solid rgba(245, 240, 232, 0.06);
          padding: 36px;
          cursor: pointer;
          transition: background 0.3s, border-color 0.3s;
          overflow: hidden;
          min-height: 240px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .trip-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 3px;
          height: 0;
          background: #e8c547;
          transition: height 0.3s ease;
        }

        .trip-card:hover {
          background: rgba(245, 240, 232, 0.05);
          border-color: rgba(245, 240, 232, 0.12);
        }

        .trip-card:hover::before { height: 100%; }

        .trip-destination {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #e8c547;
          margin-bottom: 12px;
        }

        .trip-title {
          font-size: 26px;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
          flex: 1;
        }

        .trip-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .trip-date {
          font-family: "'Fraunces', serif";
          font-size: 13px;
          font-weight: 300;
          font-style: italic;
          color: rgba(245, 240, 232, 0.5);
        }

        .trip-duration {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(245, 240, 232, 0.3);
          border: 1px solid rgba(245, 240, 232, 0.12);
          padding: 3px 10px;
          border-radius: 2px;
        }

        .trip-delete {
          position: absolute;
          top: 16px; right: 16px;
          background: none;
          border: 1px solid rgba(245, 240, 232, 0.1);
          color: rgba(245, 240, 232, 0.3);
          width: 28px; height: 28px;
          border-radius: 2px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s, color 0.2s, border-color 0.2s;
        }

        .trip-card:hover .trip-delete { opacity: 1; }
        .trip-delete:hover { color: #ff6b6b; border-color: rgba(255, 107, 107, 0.3); }

        .empty-state {
          grid-column: 1 / -1;
          padding: 80px 40px;
          text-align: center;
          border: 1px dashed rgba(245, 240, 232, 0.1);
        }

        .empty-state p {
          font-family: "'Fraunces', serif";
          font-size: 18px;
          font-weight: 300;
          font-style: italic;
          color: rgba(245, 240, 232, 0.3);
          margin-bottom: 24px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(8px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal {
          background: #111;
          border: 1px solid rgba(245, 240, 232, 0.1);
          padding: 48px;
          width: 100%;
          max-width: 480px;
        }

        .modal-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }

        .modal-subtitle {
          font-family: "'Fraunces', serif";
          font-size: 14px;
          font-weight: 300;
          font-style: italic;
          color: rgba(245, 240, 232, 0.4);
          margin-bottom: 36px;
        }

        .field {
          margin-bottom: 20px;
        }

        .field label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(245, 240, 232, 0.4);
          margin-bottom: 8px;
        }

        .field input {
          width: 100%;
          background: rgba(245, 240, 232, 0.04);
          border: 1px solid rgba(245, 240, 232, 0.1);
          color: #f5f0e8;
          font-family: "'Syne', sans-serif";
          font-size: 15px;
          font-weight: 600;
          padding: 14px 16px;
          outline: none;
          transition: border-color 0.2s;
          border-radius: 2px;
        }

        .field input:focus { border-color: rgba(232, 197, 71, 0.5); }
        .field input::placeholder { color: rgba(245, 240, 232, 0.2); font-weight: 400; }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
        }

        .btn-primary {
          flex: 1;
          background: #e8c547;
          color: #0a0a0a;
          border: none;
          padding: 16px;
          font-family: "'Syne', sans-serif";
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          transition: background 0.2s;
        }

        .btn-primary:hover { background: #f0d060; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-ghost {
          background: none;
          border: 1px solid rgba(245, 240, 232, 0.12);
          color: rgba(245, 240, 232, 0.5);
          padding: 16px 24px;
          font-family: "'Syne', sans-serif";
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          transition: border-color 0.2s, color 0.2s;
        }

        .btn-ghost:hover { border-color: rgba(245, 240, 232, 0.3); color: #f5f0e8; }
      `}</style>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-logo">wander<span>plan</span></div>
        <div className="nav-links">
          <a>Viaggi</a>
          <a>Packing</a>
          <a>Budget</a>
        </div>
      </nav>

      {/* Hero */}
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-eyebrow">il tuo pianificatore di viaggi</div>
        <h1 className="hero-title">
          Dove vuoi<br />
          andare <span className="accent">dopo?</span>
        </h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Destinazione..."
            value={destination}
            onChange={e => setDestination(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="search-btn" onClick={handleSearch}>
            Nuovo viaggio
          </button>
        </div>
      </div>

      {/* Trips */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">I tuoi viaggi</span>
          {trips.length > 0 && (
            <span className="trip-count">{trips.length} {trips.length === 1 ? 'viaggio' : 'viaggi'}</span>
          )}
        </div>

        {loading ? (
          <div style={{ color: 'rgba(245,240,232,0.3)', fontStyle: 'italic', fontFamily: 'Fraunces, serif' }}>
            Caricamento...
          </div>
        ) : (
          <div className="trips-grid">
            {trips.length === 0 ? (
              <div className="empty-state">
                <p>Nessun viaggio ancora. Dove vuoi andare?</p>
                <button className="search-btn" onClick={() => setShowModal(true)}>
                  Crea il primo viaggio
                </button>
              </div>
            ) : (
              trips.map(trip => (
                <div
                  key={trip.id}
                  className="trip-card"
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  <button
                    className="trip-delete"
                    onClick={e => handleDelete(e, trip.id)}
                    title="Elimina viaggio"
                  >
                    ×
                  </button>
                  <div>
                    {trip.destination && (
                      <div className="trip-destination">{trip.destination}</div>
                    )}
                    <div className="trip-title">{trip.title}</div>
                  </div>
                  <div className="trip-meta">
                    {trip.start_date && (
                      <span className="trip-date">{formatDate(trip.start_date)}</span>
                    )}
                    {getDuration(trip.start_date, trip.end_date) && (
                      <span className="trip-duration">{getDuration(trip.start_date, trip.end_date)}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Nuovo viaggio</div>
            <div className="modal-subtitle">ogni grande avventura inizia con un nome</div>

            <div className="field">
              <label>Nome del viaggio *</label>
              <input
                type="text"
                placeholder="es. Perù 2025"
                value={form.title ?? ''}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="field">
              <label>Destinazione</label>
              <input
                type="text"
                placeholder="es. Peru"
                value={form.destination ?? destination}
                onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
              />
            </div>

            <div className="field">
              <label>Data di partenza</label>
              <input
                type="date"
                value={form.start_date ?? ''}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              />
            </div>

            <div className="field">
              <label>Data di ritorno</label>
              <input
                type="date"
                value={form.end_date ?? ''}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>
                Annulla
              </button>
              <button
                className="btn-primary"
                onClick={handleCreate}
                disabled={!form.title?.trim()}
              >
                Crea viaggio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}