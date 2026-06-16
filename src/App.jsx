import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from "./components/layout/Navbar";
import CheckIn from './pages/CheckIn'
import Update from './pages/Update'
import CheckOut from './pages/CheckOut'
import History from './pages/History'
import Dashboard from './pages/Dashboard'

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm max-w-md">
        <h1 className="text-4xl font-bold text-teal-600">ProcessNexus</h1>
        <p className="text-slate-500 mt-3 text-lg">Smart Workflow Management</p>
        <p className="text-slate-400 mt-6 text-sm">Select an option from the menu to begin</p>
      </div>
    </div>
  )
}

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
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}