import { useState } from 'react'
import { getJobsByPhone, updateJob } from '../firebase/services'
import { STAFF_NAMES } from '../constants'

export default function Update() {
  const [searchPhone, setSearchPhone] = useState('')
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  
  const [formData, setFormData] = useState({
    spare_replaced: '',
    service_cost: '',
    customer_intimated: false,
    intimation_staff: '',
  })

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchPhone.trim()) {
      setMessage({ type: 'error', text: 'Enter phone number' })
      return
    }

    setLoading(true)
    const results = await getJobsByPhone(searchPhone)
    
    if (results.length === 0) {
      setMessage({ type: 'error', text: 'No jobs found' })
      setJobs([])
    } else {
      setJobs(results)
    }
    setLoading(false)
  }

  const handleSelectJob = (job) => {
    setSelectedJob(job)
    setFormData({
      spare_replaced: job.spare_replaced || '',
      service_cost: job.service_cost || '',
      customer_intimated: job.customer_intimated || false,
      intimation_staff: job.intimation_staff || '',
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedJob) return
    if (!formData.spare_replaced.trim()) {
      setMessage({ type: 'error', text: 'Enter spare parts' })
      return
    }
    if (!formData.service_cost) {
      setMessage({ type: 'error', text: 'Enter service cost' })
      return
    }

    setLoading(true)
    const result = await updateJob(selectedJob.id, {
      spare_replaced: formData.spare_replaced,
      service_cost: parseFloat(formData.service_cost),
      customer_intimated: formData.customer_intimated,
      intimation_staff: formData.intimation_staff,
    })
    
    if (result.success) {
      setMessage({ type: 'success', text: `Job ${selectedJob.job_id} updated!` })
      setSelectedJob(null)
      setFormData({ spare_replaced: '', service_cost: '', customer_intimated: false, intimation_staff: '' })
      setJobs([])
      setSearchPhone('')
    } else {
      setMessage({ type: 'error', text: result.error })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Update Service</h1>
        <p className="text-slate-500 mb-8">Update job status, parts, and cost</p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <input type="tel" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} placeholder="Enter phone number" className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium px-6 py-2 rounded-lg">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {jobs.length > 0 && (
            <div className="space-y-2">
              {jobs.map((job) => (
                <button key={job.id} onClick={() => handleSelectJob(job)} className={`w-full text-left p-4 rounded-lg border-2 ${selectedJob?.id === job.id ? 'border-teal-600 bg-teal-50' : 'border-slate-200'}`}>
                  <div className="font-semibold">{job.job_id}</div>
                  <div className="text-sm text-slate-600">{job.customer_name} • {job.product_category}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedJob && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
            <div className="bg-teal-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-teal-700">{selectedJob.job_id} • {selectedJob.customer_name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Spare Parts Replaced *</label>
              <textarea name="spare_replaced" value={formData.spare_replaced} onChange={handleChange} placeholder="e.g., Motor winding, Capacitor" rows="3" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Service Cost (₹) *</label>
              <input type="number" name="service_cost" value={formData.service_cost} onChange={handleChange} placeholder="e.g., 650" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>

            <div>
              <label className="flex items-center gap-3">
                <input type="checkbox" name="customer_intimated" checked={formData.customer_intimated} onChange={handleChange} className="w-4 h-4 accent-teal-600" />
                <span className="text-sm font-medium text-slate-700">Customer Notified?</span>
              </label>
            </div>

            {formData.customer_intimated && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Staff Who Intimated *</label>
                <select name="intimation_staff" value={formData.intimation_staff} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select staff...</option>
                  {STAFF_NAMES.map(name => (<option key={name} value={name}>{name}</option>))}
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg">
              {loading ? 'Updating...' : 'Update Job'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
