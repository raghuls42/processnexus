import { useState } from 'react'

export default function CheckOut() {
  const [searchPhone, setSearchPhone] = useState('')
  const [message, setMessage] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchPhone.trim()) {
      setMessage({ type: 'success', text: 'Job search feature coming soon' })
    } else {
      setMessage({ type: 'error', text: 'Enter phone number' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Check Out</h1>
        <p className="text-slate-500 mb-8">Complete job and record payment</p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSearch} className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Find Job</h2>
          <div className="flex gap-3">
            <input
              type="tel"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Enter phone number"
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-2 rounded-lg"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}