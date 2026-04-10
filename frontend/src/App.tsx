// frontend/src/App.tsx
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TripDetailPage from './pages/TripDetailPage'
import TripDayPage from './pages/TripDayPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/trips/:tripId" element={<TripDetailPage />} />
      <Route path="/trips/:tripId/days/:dayId" element={<TripDayPage />} />
    </Routes>
  )
}
