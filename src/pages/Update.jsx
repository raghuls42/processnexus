import { useState } from 'react'
import { getJobsByPhone } from '../firebase/services'
import { updateJob } from '../firebase/services'
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
    setMessage(null)
    const results = await getJobsByPhone(searchPhone)
    
    if (results.length === 0) {
      setMessage({ type: 'error', text: 'No jobs found for this number' })
      setJobs([])
    } else {
      setJobs(results)
      setMessage(null)
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
    setMessage(null)
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
    
    if (!selectedJob) {
      setMessage({ type: 'error', text: 'Select a job first' })
      return
    }

    if (!formData.spare_replaced.trim()) {
      setMessage({ type: 'error', text: 'Enter spare parts replaced' })
      return
    }

    if (!formData.service_cost || formData.service_cost < 0) {
      setMessage({ type: 'error', text: 'Enter valid service cost' })
      return
    }

    if (formData.customer_intimated && !formData.intimation_staff) {
      setMessage({ type: 'error', text: 'Select staff who intimated customer' })
      return
    }

    setLoading(true)
    const result = await updateJob(selectedJob.id, formData)
    
    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `Job ${selectedJob.job_id} updated successfully!` 
      })
      setSelectedJob(null)
      setFormData({
        spare_replaced: '',
        service_cost: '',
        customer_intimated: false,
        intimation_staff: '',
      })
      setJobs([])
      setSearchPhone('')
    } else {
      setMessage({ type: 'error', text: `Error: ${result.error}` })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Update Service</h1>
        <p className="text-slate-500 mb-8">Update job status, parts, and cost</p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Find Job</h2>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="tel"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Enter customer phone number"
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Job Results */}
          {jobs.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-700 mb-3">Found {jobs.length} job(s):</h3>
              <div className="space-y-2">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedJob?.id === job.id
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-slate-200 hover:border-teal-400'
                    }`}
                  >
                    <div className="font-semibold text-slate-800">{job.job_id}</div>
                    <div className="text-sm text-slate-600">{job.customer_name} • {job.product_category}</div>
                    <div className="text-xs text-slate-500">Status: {job.status}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Update Form */}
        {selectedJob && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
              <p className="text-sm font-semibold text-teal-700">
                Selected: {selectedJob.job_id} • {selectedJob.customer_name}
              </p>
            </div>

            {/* Spare Parts */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Spare Parts Replaced *
              </label>
              <textarea
                name="spare_replaced"
                value={formData.spare_replaced}
                onChange={handleChange}
                placeholder="e.g., Motor winding, Capacitor"
                rows="3"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Service Cost */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Total Service Cost (₹) *
              </label>
              <input
                type="number"
                name="service_cost"
                value={formData.service_cost}
                onChange={handleChange}
                placeholder="e.g., 650"
                min="0"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Customer Intimation */}
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="customer_intimated"
                  checked={formData.customer_intimated}
                  onChange={handleChange}
                  className="w-4 h-4 accent-teal-600"
                />
                <span className="text-sm font-medium text-slate-700">Customer Notified?</span>
              </label>
            </div>

            {/* Intimation Staff */}
            {formData.customer_intimated && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Staff Who Intimated *
                </label>
                <select
                  name="intimation_staff"
                  value={formData.intimation_staff}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select staff...</option>
                  {STAFF_NAMES.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {loading ? 'Updating...' : 'Update Job'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}