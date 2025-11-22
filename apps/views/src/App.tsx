import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/home'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="/:pageUrl" element={<Home />} />
    </Routes>
  )
}

export default App
