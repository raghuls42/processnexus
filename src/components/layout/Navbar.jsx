import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="bg-teal-600 text-white p-4 flex gap-4">
      <Link to="/" className="font-bold">ProcessNexus</Link>
      <Link to="/checkin" className={location.pathname === '/checkin' ? 'bg-white text-teal-600 px-3 py-1 rounded' : 'hover:bg-teal-700 px-3 py-1'}>Check In</Link>
      <Link to="/update" className={location.pathname === '/update' ? 'bg-white text-teal-600 px-3 py-1 rounded' : 'hover:bg-teal-700 px-3 py-1'}>Update</Link>
      <Link to="/checkout" className={location.pathname === '/checkout' ? 'bg-white text-teal-600 px-3 py-1 rounded' : 'hover:bg-teal-700 px-3 py-1'}>Check Out</Link>
      <Link to="/history" className={location.pathname === '/history' ? 'bg-white text-teal-600 px-3 py-1 rounded' : 'hover:bg-teal-700 px-3 py-1'}>History</Link>
      <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'bg-white text-teal-600 px-3 py-1 rounded' : 'hover:bg-teal-700 px-3 py-1'}>Dashboard</Link>
      <Link to="/notifications" className={location.pathname === '/notifications' ? 'bg-white text-teal-600 px-3 py-1 rounded' : 'hover:bg-teal-700 px-3 py-1'}>Notifications</Link>
    </nav>
  )
}