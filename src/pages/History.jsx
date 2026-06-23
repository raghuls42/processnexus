import { useState, useEffect } from 'react'
import { getAllJobs } from '../firebase/services'
import { 
  Search, 
  Calendar, 
  User, 
  Phone, 
  Tag, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  X, 
  Cpu, 
  SlidersHorizontal,
  Wrench,
  Sparkles,
  CreditCard
} from 'lucide-react'
import { ServiceTimePredictor } from '../utils/mlModel'

export default function History() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedJob, setSelectedJob] = useState(null)
  const [predictor, setPredictor] = useState(null)

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true)
        const allJobs = await getAllJobs()
        setJobs(allJobs)
        
        const ml = new ServiceTimePredictor()
        ml.train(allJobs)
        setPredictor(ml)
      } catch (error) {
        console.error('Failed to load history:', error)
      } finally {
        setLoading(false)
      }
    }
    loadJobs()
  }, [])

  // Filter logic
  const filteredJobs = jobs.filter(job => {
    const matchesStatus = statusFilter === 'All' || job.status === statusFilter
    
    const query = searchQuery.trim().toLowerCase()
    if (!query) return matchesStatus

    const matchesQuery = 
      (job.job_id || '').toLowerCase().includes(query) ||
      (job.customer_name || '').toLowerCase().includes(query) ||
      (job.contact_number || '').toLowerCase().includes(query) ||
      (job.product_category || '').toLowerCase().includes(query) ||
      (job.brand || '').toLowerCase().includes(query) ||
      (job.model_name || '').toLowerCase().includes(query) ||
      (job.assigned_technician || '').toLowerCase().includes(query) ||
      (job.fault_description || '').toLowerCase().includes(query) // Allow searching by fault description

    return matchesStatus && matchesQuery
  })

  // Count helper for badge tabs
  const getCount = (status) => {
    if (status === 'All') return jobs.length
    return jobs.filter(j => j.status === status).length
  }

  // Format date safely helper
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    }
    return new Date(timestamp).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const getActualDuration = (checkin, checkout) => {
    if (!checkin) return 'N/A'
    const start = checkin.toDate ? checkin.toDate() : new Date(checkin)
    const end = checkout ? (checkout.toDate ? checkout.toDate() : new Date(checkout)) : new Date()
    const diffHours = (end - start) / (1000 * 60 * 60)
    
    if (diffHours < 1) {
      return `${Math.round(diffHours * 60)} minutes`
    }
    const wholeHours = Math.floor(diffHours)
    const mins = Math.round((diffHours - wholeHours) * 60)
    
    if (wholeHours >= 24) {
      const days = Math.floor(wholeHours / 24)
      const remainingHours = wholeHours % 24
      let res = `${days} day${days > 1 ? 's' : ''}`
      if (remainingHours > 0) res += ` ${remainingHours} hr${remainingHours > 1 ? 's' : ''}`
      return res
    }
    
    let res = `${wholeHours} hr${wholeHours > 1 ? 's' : ''}`
    if (mins > 0) res += ` ${mins} min${mins > 1 ? 's' : ''}`
    return res
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Received':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'In Service':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Notified':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'Ready':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'Completed':
        return 'bg-green-50 text-green-700 border-green-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Received':
        return <Clock className="w-4 h-4" />
      case 'In Service':
        return <Wrench className="w-4 h-4" />
      case 'Notified':
        return <Sparkles className="w-4 h-4" />
      case 'Ready':
        return <CheckCircle2 className="w-4 h-4" />
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const tabs = ['All', 'Received', 'In Service', 'Notified', 'Completed']

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Service Archives</h1>
            <p className="text-slate-500 mt-1">Search, filter, and audit all active and past service records</p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Job ID, customer name, phone, brand, category, fault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 md:w-auto self-start md:self-stretch justify-center">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {tabs.map((tab) => {
              const count = getCount(tab)
              const isActive = statusFilter === tab
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 border-teal-600 text-white shadow-sm shadow-teal-100'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-teal-700/50 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Archives Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-teal-600/30 border-t-teal-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm">Fetching service records...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">No Records Found</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">
              We couldn't find any service jobs matching your criteria. Try adjusting your search query or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div 
                key={job.id} 
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Decorative border highlight */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>

                <div className="space-y-4">
                  {/* Top line with ID & status */}
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-sm font-bold bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md border border-teal-100">
                      {job.job_id}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(job.status)}`}>
                      {getStatusIcon(job.status)}
                      {job.status}
                    </span>
                  </div>

                  {/* Appliance details */}
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg group-hover:text-teal-600 transition-colors">
                      {job.brand} {job.model_name || '(No Model Name)'}
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                      <Cpu className="w-3.5 h-3.5" /> {job.product_category} • {job.warranty_status}
                    </p>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Customer details & metadata */}
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{job.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{job.contact_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500">Checked In: {formatDate(job.checkin_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer with view button */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Service Cost</span>
                    <span className="text-base font-bold text-slate-800">
                      {job.service_cost > 0 ? `₹${job.service_cost}` : 'Pending Quote'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-lg transition-colors border border-teal-100/50 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Audit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Audit Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold bg-white/10 text-teal-300 px-3 py-0.5 rounded border border-white/10">
                      {selectedJob.job_id}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(selectedJob.status)}`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mt-2">{selectedJob.brand} {selectedJob.model_name || ''} ({selectedJob.product_category})</h2>
                </div>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
                
                {/* Customer Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Customer Details</span>
                    <p className="font-semibold text-slate-800 text-base mt-1">{selectedJob.customer_name}</p>
                    <p className="text-slate-600 flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedJob.contact_number}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Warranty Status</span>
                    <p className="font-semibold text-slate-800 text-base mt-1">{selectedJob.warranty_status}</p>
                  </div>
                  
                  {/* Fault Description block */}
                  <div className="md:col-span-2 border-t border-slate-200/60 pt-3">
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Customer Reported Fault</span>
                    <p className="font-medium text-slate-700 bg-white p-3 rounded-lg border border-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">
                      {selectedJob.fault_description || 'No fault description provided.'}
                    </p>
                  </div>
                </div>

                {/* Operations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Logistical Info */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Logistical Logs</h3>
                    <div>
                      <span className="text-xs text-slate-400 block">Check-in Staff</span>
                      <span className="font-medium text-slate-800">{selectedJob.checkin_staff || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Assigned Technician</span>
                      <span className="font-medium text-slate-800">{selectedJob.assigned_technician || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Date of Intake</span>
                      <span className="text-slate-800">{formatDate(selectedJob.checkin_date)}</span>
                    </div>
                  </div>

                  {/* Right Column: Repair Details */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Technical Logs</h3>
                    <div>
                      <span className="text-xs text-slate-400 block">Spares Replaced</span>
                      <p className="font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-150 mt-1 min-h-[50px] whitespace-pre-wrap">
                        {selectedJob.spare_replaced || 'No spares replaced yet'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Customer Intimated?</span>
                      <span className={`inline-flex items-center gap-1 mt-1 font-semibold ${selectedJob.customer_intimated ? 'text-green-600' : 'text-slate-400'}`}>
                        {selectedJob.customer_intimated ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" /> Yes {selectedJob.intimation_staff && `(by ${selectedJob.intimation_staff})`}
                          </>
                        ) : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comparative Service Duration Audit */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-600" /> Service Duration Audit
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold flex items-center gap-1 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" /> AI Predicted Duration
                      </span>
                      <span className="text-base font-bold text-slate-800">
                        {predictor ? predictor.predict(selectedJob.product_category, selectedJob.fault_description, selectedJob.spare_replaced) : 'Calculating...'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold flex items-center gap-1 mb-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" /> Actual Repair Duration
                      </span>
                      <span className="text-base font-bold text-slate-800">
                        {selectedJob.status === 'Completed'
                          ? getActualDuration(selectedJob.checkin_date, selectedJob.checkout_date)
                          : `${getActualDuration(selectedJob.checkin_date, null)} (In Progress)`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial/Checkout logs if completed */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-teal-600" /> Financial Audit
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-teal-50/50 p-4 rounded-xl border border-teal-100/50">
                    <div>
                      <span className="text-xs text-teal-600 block font-semibold">Service Fee</span>
                      <span className="text-lg font-bold text-slate-800">₹{selectedJob.service_cost || 0}</span>
                    </div>
                    <div>
                      <span className="text-xs text-teal-600 block font-semibold">Payment Status</span>
                      <span className={`font-bold ${selectedJob.status === 'Completed' ? 'text-green-600' : 'text-slate-500'}`}>
                        {selectedJob.status === 'Completed' ? 'Paid' : 'Pending Payment'}
                      </span>
                    </div>
                    {selectedJob.status === 'Completed' && (
                      <>
                        <div>
                          <span className="text-xs text-teal-600 block font-semibold">Method Used</span>
                          <span className="font-bold text-slate-800">{selectedJob.payment_method || 'N/A'}</span>
                        </div>
                        <div className="md:col-span-3 border-t border-teal-100/60 pt-3 mt-1">
                          <span className="text-xs text-teal-600 block font-semibold">Checkout Timestamp</span>
                          <span className="text-slate-800">{formatDate(selectedJob.checkout_date)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors text-sm cursor-pointer"
                >
                  Close Audit
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
