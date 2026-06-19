import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LibraryPage from './pages/LibraryPage'
import PlayerPage from './pages/PlayerPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/library" replace />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/player/:id?" element={<PlayerPage />} />
      </Route>
    </Routes>
  )
}
