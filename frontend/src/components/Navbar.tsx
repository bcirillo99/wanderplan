// frontend/src/components/Navbar.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from './Modal'

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="About WanderPlan" onClose={onClose} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        <p style={{ fontSize: '0.95rem', color: 'var(--fog)', lineHeight: 1.65, margin: 0 }}>
          A trip organizer for people who love planning their own travels.
          No AI suggestions, no booking integrations — just your itinerary,
          organized exactly the way you want it.
        </p>

        <div>
          <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--charcoal)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            What you can do
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              'Plan your itinerary day by day',
              'Track flights, accommodations, and ground transport',
              'Search real flights via Google Flights',
              'Log every cost — full budget breakdown',
              'Manage your packing list',
              'Keep freeform notes',
              'Export your trip as PDF or Word document',
            ].map((item) => (
              <li key={item} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: '0.88rem', color: 'var(--charcoal)' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--coral)', flexShrink: 0, marginTop: 2, display: 'inline-block' }} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--charcoal)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Not there yet
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              'Accounts or multi-user — single user, local setup only',
              'Real booking — WanderPlan tracks, it doesn\'t book',
              'Mobile app — web only',
              'Notifications or reminders',
            ].map((item) => (
              <li key={item} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: '0.88rem', color: 'var(--fog)' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--border-strong)', flexShrink: 0, marginTop: 2, display: 'inline-block' }} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--charcoal)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Coming next
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              'Auth + hosted version — no setup required',
              'Collaboration — plan together with travel companions',
              'AI companion — opt-in assistance that knows your itinerary',
            ].map((item) => (
              <li key={item} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: '0.88rem', color: 'var(--fog)' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--fog)', flexShrink: 0, marginTop: 2, display: 'inline-block' }} />
                {item}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </Modal>
  )
}

export default function Navbar() {
  const [showAbout, setShowAbout] = useState(false)

  return (
    <>
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <Link to="/" className="nav__logo">
          Wanderplan
        </Link>
        <button
          onClick={() => setShowAbout(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.85rem', color: 'var(--fog)', padding: '4px 8px',
            borderRadius: 6,
          }}
        >
          About
        </button>
      </nav>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  )
}
