import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { name: 'Check In', path: '/checkin', icon: '📥' },
    { name: 'Update', path: '/update', icon: '🔧' },
    { name: 'Check Out', path: '/checkout', icon: '💳' },
    { name: 'History', path: '/history', icon: '📜' },
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-gradient-to-r from-teal-600 to-teal-700 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-teal-600 font-bold text-lg">P</span>
            </div>
            <span className="font-bold text-lg text-white hidden sm:inline">ProcessNexus</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  isActive(link.path)
                    ? 'bg-white text-teal-600 shadow-md scale-105'
                    : 'bg-teal-500 text-white hover:bg-teal-600 hover:shadow-md'
                }`}
              >
                <span>{link.icon}</span>
                {link.name}
              </Link>
            ))}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-teal-500 text-white transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-teal-500 py-4 pb-6">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    isActive(link.path)
                      ? 'bg-white text-teal-600'
                      : 'bg-teal-500 text-white hover:bg-teal-600'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}