import { useState, useEffect } from 'react'
import { 
  getJobsByPhone, 
  updateJob, 
  getAllJobs, 
  getActiveJobs,
  getNotificationTemplates, 
  logNotification 
} from '../firebase/services'
import { STAFF_NAMES } from '../constants'
import { 
  User, 
  Phone, 
  Calendar, 
  Tag, 
  Sparkles, 
  AlertTriangle,
  Mail,
  X,
  CheckCircle2,
  ExternalLink,
  Send,
  RefreshCw,
  Wrench,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { ServiceTimePredictor } from '../utils/mlModel'

// Free WhatsApp icon SVG
function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export default function Update() {
  const [searchPhone, setSearchPhone] = useState('')
  const [jobs, setJobs] = useState([])
  const [activeQueue, setActiveQueue] = useState([])
  const [queueLoading, setQueueLoading] = useState(true)
  const [showPhoneSearch, setShowPhoneSearch] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [predictor, setPredictor] = useState(null)
  const [whatsappSent, setWhatsappSent] = useState(false)
  
  // Notification dispatch modal states
  const [showDispatchModal, setShowDispatchModal] = useState(false)
  const [dispatchData, setDispatchData] = useState({
    whatsappMessage: '',
    emailMessage: '',
    sendWhatsapp: true,
    sendEmail: false
  })

  const [formData, setFormData] = useState({
    spare_replaced: '',
    service_cost: '',
    customer_intimated: false,
    intimation_staff: '',
  })

  useEffect(() => {
    async function init() {
      try {
        const allJobs = await getAllJobs()
        const ml = new ServiceTimePredictor()
        ml.train(allJobs)
        setPredictor(ml)
      } catch (err) {
        console.error('Error training predictor on Update load:', err)
      }
      loadActiveQueue()
    }
    init()
  }, [])

  const loadActiveQueue = async () => {
    setQueueLoading(true)
    try {
      const active = await getActiveJobs()
      setActiveQueue(active)
    } catch (err) {
      console.error('Error loading active queue:', err)
    }
    setQueueLoading(false)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const handleReset = () => {
    setSelectedJob(null)
    setFormData({ spare_replaced: '', service_cost: '', customer_intimated: false, intimation_staff: '' })
    setJobs([])
    setSearchPhone('')
    setWhatsappSent(false)
    loadActiveQueue()
    try {
      getAllJobs().then(allJobs => {
        const ml = new ServiceTimePredictor()
        ml.train(allJobs)
        setPredictor(ml)
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchPhone.trim()) {
      setMessage({ type: 'error', text: 'Enter phone number' })
      return
    }

    setLoading(true)
    const results = await getJobsByPhone(searchPhone)
    
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
    setWhatsappSent(false)
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

    if (formData.customer_intimated) {
      if (!formData.intimation_staff) {
        setMessage({ type: 'error', text: 'Select staff who intimated' })
        return
      }

      setLoading(true)
      try {
        const templates = await getNotificationTemplates()
        
        const interpolate = (templateStr) => {
          if (!templateStr) return ''
          return templateStr
            .replace(/\{customer_name\}/g, selectedJob.customer_name)
            .replace(/\{job_id\}/g, selectedJob.job_id)
            .replace(/\{brand\}/g, selectedJob.brand)
            .replace(/\{model_name\}/g, selectedJob.model_name || 'N/A')
            .replace(/\{spare_replaced\}/g, formData.spare_replaced)
            .replace(/\{service_cost\}/g, formData.service_cost)
        }

        // Build a good default WhatsApp message if no template exists
        const waTemplate = templates.ready_sms || 
          `Hello {customer_name}! Your {brand} ({model_name}) repair is ready for pickup. Job ID: {job_id}. Parts replaced: {spare_replaced}. Service cost: ₹{service_cost}. Please visit us to collect your appliance. Thank you!`
        
        const whatsappText = interpolate(waTemplate)
        const emailText = interpolate(templates.ready_email || '')

        setDispatchData({
          whatsappMessage: whatsappText,
          emailMessage: emailText,
          sendWhatsapp: true,
          sendEmail: false
        })
        setWhatsappSent(false)
        setShowDispatchModal(true)
      } catch (err) {
        console.error(err)
        setMessage({ type: 'error', text: 'Error fetching notification templates' })
      }
      setLoading(false)
    } else {
      setLoading(true)
      const result = await updateJob(selectedJob.id, {
        spare_replaced: formData.spare_replaced,
        service_cost: parseFloat(formData.service_cost),
        customer_intimated: false,
        intimation_staff: '',
        status: 'Ready'
      })
      
      if (result.success) {
        setMessage({ type: 'success', text: `Job ${selectedJob.job_id} updated and set to Ready!` })
        handleReset()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
      setLoading(false)
    }
  }

  // Opens WhatsApp Web / App with pre-filled message (FREE - no API needed)
  const handleSendWhatsApp = () => {
    if (!selectedJob || !dispatchData.whatsappMessage.trim()) return
    
    // Format phone: strip non-digits, add India country code if 10 digits
    let phone = selectedJob.contact_number.replace(/\D/g, '')
    if (phone.length === 10) {
      phone = '91' + phone
    }
    
    const encodedMsg = encodeURIComponent(dispatchData.whatsappMessage)
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank')
    setWhatsappSent(true)
  }

  const handleConfirmDispatch = async () => {
    setLoading(true)
    try {
      if (dispatchData.sendWhatsapp && dispatchData.whatsappMessage.trim()) {
        await logNotification(selectedJob.job_id, selectedJob.id, {
          customer_name: selectedJob.customer_name,
          contact_number: selectedJob.contact_number,
          channel: 'WhatsApp',
          type: 'Ready',
          message: dispatchData.whatsappMessage
        })
      }
      
      if (dispatchData.sendEmail && dispatchData.emailMessage.trim()) {
        await logNotification(selectedJob.job_id, selectedJob.id, {
          customer_name: selectedJob.customer_name,
          contact_number: selectedJob.contact_number,
          channel: 'Email',
          type: 'Ready',
          message: dispatchData.emailMessage
        })
      }
      
      const result = await updateJob(selectedJob.id, {
        spare_replaced: formData.spare_replaced,
        service_cost: parseFloat(formData.service_cost),
        customer_intimated: true,
        intimation_staff: formData.intimation_staff,
        status: 'Notified'
      })

      if (result.success) {
        setMessage({ type: 'success', text: `Job ${selectedJob.job_id} updated! Customer notified via WhatsApp.` })
        setShowDispatchModal(false)
        handleReset()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Error saving notification log' })
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

        {/* ── Active Repairs Queue ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-teal-600" />
              Active Repairs Queue
              {!queueLoading && (
                <span className="ml-1 text-xs font-medium bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                  {activeQueue.length}
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={loadActiveQueue}
              disabled={queueLoading}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${queueLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {queueLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : activeQueue.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active repairs at the moment</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeQueue.map((job) => {
                const statusColor = {
                  'Received':   'bg-blue-50 text-blue-700 border-blue-100',
                  'Diagnosed':  'bg-amber-50 text-amber-700 border-amber-100',
                  'In Service': 'bg-violet-50 text-violet-700 border-violet-100',
                }[job.status] || 'bg-slate-100 text-slate-600 border-slate-200'

                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => handleSelectJob(job)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedJob?.id === job.id
                        ? 'border-teal-600 bg-teal-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-slate-800">{job.job_id}</span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
                            {job.status}
                          </span>
                          {job.is_bundle && (
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                              Bundle
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1 truncate">
                          <span className="font-medium text-slate-800">{job.customer_name}</span>
                          {' · '}{job.brand} {job.model_name || ''}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{job.product_category} · Checked in: {formatDate(job.checkin_date)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-slate-400">Est. Cost</p>
                        <p className="font-bold text-slate-700 text-sm">
                          {job.service_cost > 0 ? `₹${job.service_cost}` : '—'}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Collapsible phone search */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowPhoneSearch(p => !p)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              Search by phone number
              {showPhoneSearch ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showPhoneSearch && (
              <form onSubmit={handleSearch} className="flex gap-3 mt-3">
                <input
                  type="tel"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
                <button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors cursor-pointer">
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>
            )}

            {/* Results from phone search */}
            {jobs.length > 0 && (
              <div className="space-y-2 mt-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Search Results</h3>
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => handleSelectJob(job)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedJob?.id === job.id
                        ? 'border-teal-600 bg-teal-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-mono text-sm font-bold text-slate-800">{job.job_id}</div>
                        <div className="text-sm text-slate-600 mt-1">{job.customer_name} · {job.brand} {job.model_name || ''}</div>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">{job.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
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
                      <span>Intake: {formatDate(selectedJob.checkin_date)}</span>
                    </div>
                  </div>
                </div>
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
                placeholder="e.g., Motor winding, Capacitor" 
                rows="3" 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-sans text-sm" 
              />
            </div>

            {/* Real-time ML Prediction Card */}
            {selectedJob && (
              <div className="bg-teal-50/60 border-2 border-teal-500/20 p-4 rounded-xl flex items-center justify-between shadow-sm">
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
                <span className="text-sm font-medium text-slate-700">Notify Customer via WhatsApp?</span>
              </label>
            </div>

            {formData.customer_intimated && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Staff Who Notified *</label>
                <select name="intimation_staff" value={formData.intimation_staff} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select staff...</option>
                  {STAFF_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer">
              {formData.customer_intimated ? '📲 Prepare WhatsApp Notification...' : 'Update Job'}
            </button>
          </form>
        )}
      </div>

      {/* WHATSAPP DISPATCH MODAL */}
      {showDispatchModal && selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 flex justify-between items-center" style={{ background: '#075e54' }}>
              <div className="flex items-center gap-2.5">
                <WhatsAppIcon className="w-5 h-5 text-white" />
                <div>
                  <span className="font-bold text-sm text-white block">Send WhatsApp Notification</span>
                  <span className="text-[11px] text-white/70">Free via WhatsApp Web — no API needed</span>
                </div>
              </div>
              <button 
                onClick={() => setShowDispatchModal(false)}
                className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-sm text-slate-700">

              {/* Customer info bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: '#25d366' }}>
                  {selectedJob.customer_name?.[0]?.toUpperCase() || 'C'}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{selectedJob.customer_name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedJob.contact_number}
                  </div>
                </div>
                <span className="ml-auto text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">WhatsApp</span>
              </div>

              {/* WhatsApp Message Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-slate-700">
                    <WhatsAppIcon className="w-4 h-4" style={{ color: '#25d366' }} />
                    Message Preview
                  </label>
                  <span className="text-[10px] text-slate-400">Edit before sending</span>
                </div>
                {/* WhatsApp-style chat bubble preview */}
                <div className="rounded-xl p-3 text-xs" style={{ background: '#ece5dd' }}>
                  <div className="ml-auto max-w-[85%] rounded-tl-xl rounded-bl-xl rounded-br-xl p-3 text-[13px] leading-relaxed whitespace-pre-wrap" style={{ background: '#dcf8c6' }}>
                    {dispatchData.whatsappMessage || '(no message)'}
                  </div>
                </div>
                <textarea
                  value={dispatchData.whatsappMessage}
                  onChange={(e) => setDispatchData(prev => ({ ...prev, whatsappMessage: e.target.value }))}
                  rows="4"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-sans"
                  placeholder="Type your WhatsApp message here..."
                />
              </div>

              {/* Send WhatsApp Button */}
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 transition-all hover:opacity-90 active:scale-95 shadow-md"
                style={{ background: '#25d366' }}
              >
                <WhatsAppIcon className="w-5 h-5 text-white" />
                {whatsappSent ? '✓ Opened WhatsApp — Click Send there!' : 'Open WhatsApp & Send Message'}
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </button>

              {whatsappSent && (
                <div className="text-xs text-center text-green-600 font-semibold bg-green-50 border border-green-200 rounded-lg py-2">
                  ✅ WhatsApp opened! Please click "Send" inside WhatsApp to deliver the message.
                </div>
              )}

              {/* Optional Email */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={dispatchData.sendEmail}
                    onChange={(e) => setDispatchData(prev => ({ ...prev, sendEmail: e.target.checked }))}
                    className="w-4 h-4 accent-teal-600"
                  />
                  <Mail className="w-4 h-4 text-indigo-500" />
                  Also log Email notification (optional)
                </label>
                {dispatchData.sendEmail && (
                  <textarea
                    value={dispatchData.emailMessage}
                    onChange={(e) => setDispatchData(prev => ({ ...prev, emailMessage: e.target.value }))}
                    rows="4"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-sans"
                    placeholder="Email message content..."
                  />
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={loading}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                {loading ? 'Saving...' : 'Confirm & Update Job Status'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
