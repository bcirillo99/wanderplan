// frontend/src/components/Navbar.tsx
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <nav className={`nav ${isHome ? 'nav--transparent' : 'nav--solid'}`}>
      <Link to="/" className="nav__logo">
        Wander<em style={{ fontStyle: 'italic', fontWeight: 400 }}>plan</em>
      </Link>
      <div style={{ display: 'flex', gap: 24 }}>
        <Link to="/" className="nav__link">My Trips</Link>
      </div>
    </nav>
  )
}
