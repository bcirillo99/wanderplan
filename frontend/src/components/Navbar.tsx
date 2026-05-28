// frontend/src/components/Navbar.tsx
import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="nav" role="navigation" aria-label="Main navigation">
      <Link to="/" className="nav__logo">
        Wanderplan
      </Link>
    </nav>
  )
}
