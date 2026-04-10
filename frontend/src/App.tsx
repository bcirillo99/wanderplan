// frontend/src/App.tsx
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.tsx'
import TripPage from './pages/TripPage.tsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/trips/:tripId" element={<TripPage />} />
    </Routes>
  )
}

export default App