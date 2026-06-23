import { useState, useEffect } from 'react'
import { getJobsByPhone, updateJob, getAllJobs } from '../firebase/services'
import { STAFF_NAMES } from '../constants'
import { 
  User, 
  Phone, 
  Calendar, 
  Tag, 
  ShieldCheck, 
  ShieldOff, 
  Sparkles, 
  Wrench, 
  IndianRupee, 
  AlertTriangle 
} from 'lucide-react'
import { ServiceTimePredictor } from '../utils/mlModel'

export default function Update() {
  const [searchPhone, setSearchPhone] = useState('')
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [predictor, setPredictor] = useState(null)
  
  const [formData, setFormData] = useState({
    spare_replaced: '',
    service_cost: '',
    customer_intimated: false,
    intimation_staff: '',
  })

  useEffect(() => {
    async function initPredictor() {
      try {
        const allJobs = await getAllJobs()
        const ml = new ServiceTimePredictor()
        ml.train(allJobs)
        setPredictor(ml)
      } catch (err) {
        console.error('Error training predictor on Update load:', err)
      }
    }
    initPredictor()
  }, [])

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchPhone.trim()) {
      setMessage({ type: 'error', text: 'Enter phone number' })
      return
    }

    setLoading(true)
    const results = await getJobsByPhone(searchPhone)
    
    // Only display jobs that are not completed yet
    const pendingJobs = results.filter(j => j.status !== 'Completed')

    if (results.length === 0) {
      setMessage({ type: 'error', text: 'No jobs found' })
      setJobs([])
    } else if (pendingJobs.length === 0) {
      setMessage({ type: 'warn', text: 'Found completed jobs, but no active jobs are pending update.' })
      setJobs([])
    } else {
      setJobs(pendingJobs)
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
      // If customer is notified, change status to Ready/Notified
      status: formData.customer_intimated ? 'Notified' : 'Ready'
    })
    
    if (result.success) {
      setMessage({ type: 'success', text: `Job ${selectedJob.job_id} updated!` })
      setSelectedJob(null)
      setFormData({ spare_replaced: '', service_cost: '', customer_intimated: false, intimation_staff: '' })
      setJobs([])
      setSearchPhone('')
      // Re-train predictor with the updated job data
      try {
        const allJobs = await getAllJobs()
        const ml = new ServiceTimePredictor()
        ml.train(allJobs)
        setPredictor(ml)
      } catch (err) {
        console.error(err)
      }
    } else {
      setMessage({ type: 'error', text: result.error })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Update Service</h1>
          <p className="text-slate-500 mt-1">Record spare parts replaced, finalize repair details, and notify customer</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl border text-sm font-medium ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : message.type === 'warn'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleSearch} className="flex gap-3 mb-6">
            <input 
              type="tel" 
              value={searchPhone} 
              onChange={(e) => setSearchPhone(e.target.value)} 
              placeholder="Enter phone number" 
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" 
            />
            <button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold px-6 py-2 rounded-lg transition-colors cursor-pointer">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {jobs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Active Job</h3>
              {jobs.map((job) => (
                <button 
                  key={job.id} 
                  type="button"
                  onClick={() => handleSelectJob(job)} 
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedJob?.id === job.id 
                      ? 'border-teal-600 bg-teal-50/50 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-mono text-sm font-bold text-slate-800">{job.job_id}</div>
                      <div className="text-sm text-slate-600 mt-1">{job.customer_name} • {job.brand} {job.model_name || ''}</div>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">{job.status}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedJob && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
            
            {/* Customer & Service Details Card */}
            <div className="bg-slate-900 rounded-xl text-white overflow-hidden shadow-sm">
              <div className="p-5 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-mono text-xs text-teal-300 bg-white/10 px-2.5 py-0.5 rounded font-bold">{selectedJob.job_id}</span>
                    <h3 className="text-lg font-bold mt-2">{selectedJob.brand} {selectedJob.model_name || ''}</h3>
                    <p className="text-slate-400 text-xs">{selectedJob.product_category} • {selectedJob.warranty_status}</p>
                  </div>
                  <span className="text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-full uppercase">
                    {selectedJob.status}
                  </span>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Customer Details */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Details</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-200">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">{selectedJob.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedJob.contact_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Intake Date: {formatDate(selectedJob.checkin_date)}</span>
                    </div>
                  </div>
                </div>
                {/* Service Details */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logistics</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-200">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Technician: <span className="font-semibold text-teal-300">{selectedJob.assigned_technician}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Check-in Staff: <span className="font-semibold text-slate-300">{selectedJob.checkin_staff || 'N/A'}</span></span>
                    </div>
                  </div>
                </div>
                {/* Fault Description - full width */}
                <div className="md:col-span-2 mt-2 pt-3 border-t border-white/10">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Customer Reported Fault
                  </h4>
                  <p className="mt-1.5 text-slate-200 bg-white/5 p-3 rounded-lg border border-white/5 whitespace-pre-wrap font-medium leading-relaxed text-[13px]">
                    {selectedJob.fault_description || 'No fault description provided.'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Spare Parts Replaced *</label>
              <textarea 
                name="spare_replaced" 
                value={formData.spare_replaced} 
                onChange={handleChange} 
                placeholder="e.g., Motor winding, Capacitor (as you type, repair time prediction updates)" 
                rows="3" 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" 
              />
            </div>

            {/* Real-time ML Prediction Card */}
            {selectedJob && (
              <div className="bg-teal-50/60 border-2 border-teal-500/20 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
                <div className="space-y-1">
                  <span className="text-[10px] text-teal-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-teal-600" />
                    AI Estimated Completion Time
                  </span>
                  <span className="text-xl font-bold text-slate-800 block">
                    {predictor ? predictor.predict(selectedJob.product_category, selectedJob.fault_description, formData.spare_replaced) : 'Calculating...'}
                  </span>
                  <span className="text-xs text-slate-400 block">
                    {predictor?.isTrained 
                      ? `Based on ML model trained on ${predictor.trainingSize} past job(s)` 
                      : 'Based on industry standard heuristic estimates'}
                  </span>
                </div>
                <div className="bg-teal-600/10 text-teal-700 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0">
                  ⚡ Live ML
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Service Cost (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                <input 
                  type="number" 
                  name="service_cost" 
                  value={formData.service_cost} 
                  onChange={handleChange} 
                  placeholder="e.g., 650" 
                  className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="customer_intimated" checked={formData.customer_intimated} onChange={handleChange} className="w-4 h-4 accent-teal-600" />
                <span className="text-sm font-medium text-slate-700">Customer Notified? (Status will be set to Ready/Notified)</span>
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

            <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer">
              {loading ? 'Updating...' : 'Update Job'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
