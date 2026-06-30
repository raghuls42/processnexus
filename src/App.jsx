import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Navbar from "./components/layout/Navbar"
import CheckIn from "./pages/CheckIn"
import Update from "./pages/Update"
import CheckOut from "./pages/CheckOut"
import History from "./pages/History"
import Dashboard from "./pages/Dashboard"
import Notifications from "./pages/Notifications"
import Home from "./pages/Home"

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/update" element={<Update />} />
        <Route path="/checkout" element={<CheckOut />} />
        <Route path="/history" element={<History />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <SpeedInsights />
    </Router>
  )
}