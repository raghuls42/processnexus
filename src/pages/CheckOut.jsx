import { useState } from 'react'
import { getJobsByPhone, checkoutJob } from '../firebase/services'
import { PAYMENT_METHODS } from '../constants'
import {
  Search,
  User,
  Phone,
  Cpu,
  Wrench,
  IndianRupee,
  CheckCircle2,
  Calendar,
  CreditCard,
  Tag,
  AlertTriangle,
  Sparkles
} from 'lucide-react'

export default function CheckOut() {
  const [searchPhone, setSearchPhone] = useState('')
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  const [paymentData, setPaymentData] = useState({
    payment_method: '',
    amount_paid: '',
  })

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchPhone.trim()) {
      setMessage({ type: 'error', text: 'Please enter a phone number to search.' })
      return
    }

    setLoading(true)
    setMessage(null)
    setJobs([])
    setSelectedJob(null)
    setPaymentData({ payment_method: '', amount_paid: '' })

    const results = await getJobsByPhone(searchPhone.trim())

    // Only show jobs that are ready to be checked out (service done)
    const readyJobs = results.filter(j =>
      j.status === 'Notified' || j.status === 'Ready'
    )

    if (results.length === 0) {
      setMessage({ type: 'error', text: 'No jobs found for this phone number.' })
    } else if (readyJobs.length === 0) {
      setMessage({
        type: 'warn',
        text: `Found ${results.length} job(s) for this number, but none are ready for checkout yet. Service may still be in progress.`
      })
    } else {
      setJobs(readyJobs)
    }
    setLoading(false)
  }

  const handleSelectJob = (job) => {
    setSelectedJob(job)
    setPaymentData({
      payment_method: '',
      amount_paid: job.service_cost > 0 ? String(job.service_cost) : '',
    })
    setMessage(null)
  }

  const handlePaymentChange = (e) => {
    const { name, value } = e.target
    setPaymentData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (!selectedJob) return

    if (!paymentData.payment_method) {
      setMessage({ type: 'error', text: 'Please select a payment method.' })
      return
    }
    if (!paymentData.amount_paid || parseFloat(paymentData.amount_paid) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid payment amount.' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    const result = await checkoutJob(selectedJob.id, paymentData)

    if (result.success) {
      setMessage({
        type: 'success',
        text: `✓ Job ${selectedJob.job_id} checked out successfully! Payment of ₹${paymentData.amount_paid} recorded.`
      })
      // Reset everything
      setSelectedJob(null)
      setJobs([])
      setSearchPhone('')
      setPaymentData({ payment_method: '', amount_paid: '' })
    } else {
      setMessage({ type: 'error', text: `Checkout failed: ${result.error}` })
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Check Out</h1>
          <p className="text-slate-500 mt-1">Search by phone number, review service details, and record payment</p>
        </div>

        {/* Alert / Feedback Banner */}
        {message && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : message.type === 'warn'
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> : <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Search Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-teal-600" />
            Find Customer
          </h2>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>
        </div>

        {/* Job Selection List */}
        {jobs.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Jobs Ready for Checkout
              <span className="ml-1 text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{jobs.length}</span>
            </h2>
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => handleSelectJob(job)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedJob?.id === job.id
                    ? 'border-teal-500 bg-teal-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-800">{job.job_id}</span>
                      <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-semibold">{job.status}</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {job.brand} {job.model_name} — <span className="text-slate-500">{job.product_category}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Service Cost</p>
                    <p className="font-bold text-slate-800 text-base">
                      {job.service_cost > 0 ? `₹${job.service_cost}` : '—'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Service Details + Payment Form */}
        {selectedJob && (
          <div className="space-y-6">

            {/* Customer & Service Details Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="bg-slate-900 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm text-teal-300 bg-white/10 px-2.5 py-0.5 rounded font-bold">{selectedJob.job_id}</span>
                    <h3 className="text-lg font-bold mt-2">{selectedJob.brand} {selectedJob.model_name || ''}</h3>
                    <p className="text-slate-400 text-sm">{selectedJob.product_category} • {selectedJob.warranty_status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Status</p>
                    <span className="text-sm font-bold text-indigo-300">{selectedJob.status}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">

                {/* Left: Customer Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 text-slate-700">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-800">{selectedJob.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{selectedJob.contact_number}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-xs">Checked In: {formatDate(selectedJob.checkin_date)}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <Tag className="w-4 h-4 text-slate-400" />
                      <span>Technician: <span className="font-medium text-slate-800">{selectedJob.assigned_technician}</span></span>
                    </div>
                  </div>
                </div>

                {/* Right: Repair Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Summary</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5 text-slate-700">
                      <Wrench className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Spares Replaced</p>
                        <p className="font-medium text-slate-800 whitespace-pre-wrap">
                          {selectedJob.spare_replaced || 'None'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <IndianRupee className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Service Cost Quoted</p>
                        <p className="text-xl font-bold text-teal-600">
                          ₹{selectedJob.service_cost || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Payment Form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-600" />
                Record Payment & Complete
              </h2>
              <form onSubmit={handleCheckout} className="space-y-5">

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentData(prev => ({ ...prev, payment_method: method }))}
                        className={`py-3 px-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                          paymentData.payment_method === method
                            ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Amount Paid (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                    <input
                      type="number"
                      name="amount_paid"
                      value={paymentData.amount_paid}
                      onChange={handlePaymentChange}
                      placeholder={selectedJob.service_cost > 0 ? String(selectedJob.service_cost) : '0'}
                      min="0"
                      className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-mono text-lg"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing Checkout…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm Payment & Close Job
                    </>
                  )}
                </button>

              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}