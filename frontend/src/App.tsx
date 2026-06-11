// frontend/src/App.tsx
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import HomePage from './pages/HomePage'
import TripDetailPage from './pages/TripDetailPage'
import TripDayPage from './pages/TripDayPage'

export default function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            background: 'var(--surface-white)',
            color: 'var(--charcoal)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-float)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/trips/:tripId" element={<TripDetailPage />} />
        <Route path="/trips/:tripId/days/:date" element={<TripDayPage />} />
      </Routes>
    </>
  )
}