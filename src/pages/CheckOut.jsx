import { useState, useEffect } from 'react'
import { 
  getJobsByPhone, 
  checkoutJob, 
  getAllJobs, 
  getNotificationTemplates, 
  logNotification 
} from '../firebase/services'
import { PAYMENT_METHODS } from '../constants'
import {
  Search,
  User,
  Phone,
  Wrench,
  IndianRupee,
  CheckCircle2,
  Calendar,
  CreditCard,
  Tag,
  AlertTriangle,
  Sparkles,
  Clock,
  X,
  Mail,
  ExternalLink,
  Box
} from 'lucide-react'
import { ServiceTimePredictor } from '../utils/mlModel'

// WhatsApp icon SVG
function WhatsAppIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export default function CheckOut() {
  const [searchPhone, setSearchPhone] = useState('')
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [selectedBundleJobs, setSelectedBundleJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [predictor, setPredictor] = useState(null)
  const [whatsappSent, setWhatsappSent] = useState(false)

  // Receipt / Notification Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [receiptData, setReceiptData] = useState({
    whatsappMessage: '',
    emailSubject: '',
    emailBody: '',
    sendWhatsapp: true,
    sendEmail: false,
    customerEmail: ''
  })

  const [paymentData, setPaymentData] = useState({
    payment_method: '',
    amount_paid: '',
  })

  useEffect(() => {
    async function initPredictor() {
      try {
        const allJobs = await getAllJobs()
        const ml = new ServiceTimePredictor()
        ml.train(allJobs)
        setPredictor(ml)
      } catch (err) {
        console.error('Error training predictor on CheckOut load:', err)
      }
    }
    initPredictor()
  }, [])

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const getActualDuration = (checkin, checkout) => {
    if (!checkin) return 'N/A'
    const start = checkin.toDate ? checkin.toDate() : new Date(checkin)
    const end = checkout ? (checkout.toDate ? checkout.toDate() : new Date(checkout)) : new Date()
    const diffHours = (end - start) / (1000 * 60 * 60)
    if (diffHours < 1) return `${Math.round(diffHours * 60)} minutes`
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
    setSelectedBundleJobs([])
    setPaymentData({ payment_method: '', amount_paid: '' })

    const results = await getJobsByPhone(searchPhone.trim())
    const readyJobs = results.filter(j => j.status === 'Notified' || j.status === 'Ready')

    if (results.length === 0) {
      setMessage({ type: 'error', text: 'No jobs found for this phone number.' })
    } else if (readyJobs.length === 0) {
      setMessage({
        type: 'warn',
        text: `Found ${results.length} job(s) for this number, but none are ready for checkout yet.`
      })
    } else {
      setJobs(readyJobs)
    }
    setLoading(false)
  }

  const handleSelectJob = (job) => {
    setSelectedJob(job)
    setWhatsappSent(false)
    if (job.bundle_id) {
      // Find all ready jobs in the same bundle
      const bundleJobs = jobs.filter(j => j.bundle_id === job.bundle_id)
      setSelectedBundleJobs(bundleJobs)
      
      const totalOriginalCost = bundleJobs.reduce((sum, j) => sum + (j.service_cost || 0), 0)
      const discount = Math.round(totalOriginalCost * 0.15)
      const finalCost = totalOriginalCost - discount

      setPaymentData({
        payment_method: '',
        amount_paid: finalCost > 0 ? String(finalCost) : '',
      })
    } else {
      setSelectedBundleJobs([])
      setPaymentData({
        payment_method: '',
        amount_paid: job.service_cost > 0 ? String(job.service_cost) : '',
      })
    }
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

    try {
      const templates = await getNotificationTemplates()
      
      const isBundle = selectedBundleJobs.length > 1
      let waMsg = ''
      let emailSubject = ''
      let emailBody = ''

      if (isBundle) {
        // Multi-appliance bundle checkout receipt
        const totalPaid = parseFloat(paymentData.amount_paid)
        const totalOriginal = selectedBundleJobs.reduce((sum, j) => sum + (j.service_cost || 0), 0)
        const discountAmount = totalOriginal - totalPaid

        waMsg = `Hello ${selectedJob.customer_name}! Your Bundle Service (Bundle ID: ${selectedJob.bundle_id}) containing ${selectedBundleJobs.length} appliances has been successfully completed and collected.\n`
        selectedBundleJobs.forEach((job, idx) => {
          waMsg += `${idx + 1}. ${job.brand} ${job.model_name || ''} - Job: ${job.job_id}\n`
        })
        waMsg += `Total Original Cost: ₹${totalOriginal}\n`
        if (discountAmount > 0) {
          waMsg += `Bundle Discount Applied: ₹${discountAmount} (15% Off)\n`
        }
        waMsg += `Amount Paid: ₹${totalPaid} (${paymentData.payment_method}). Thank you for choosing us! 🙏`

        emailSubject = `Service Bundle Completed - Receipt for Bundle ${selectedJob.bundle_id}`
        emailBody = `Dear ${selectedJob.customer_name},\n\nThank you for collecting your service bundle (Bundle ID: ${selectedJob.bundle_id}).\n\n--- SERVICE RECEIPT ---\n`
        selectedBundleJobs.forEach((job, idx) => {
          emailBody += `Appliance #${idx + 1}:\n- ${job.brand} ${job.model_name || ''} (${job.product_category})\n- Job ID: ${job.job_id}\n- Service Cost: ₹${job.service_cost}\n- Spares: ${job.spare_replaced || 'None'}\n\n`
        })
        emailBody += `-----------------------\nTotal Original Cost: ₹${totalOriginal}\n`
        if (discountAmount > 0) {
          emailBody += `Bundle Discount Applied: ₹${discountAmount} (15% Off)\n`
        }
        emailBody += `Total Amount Paid  : ₹${totalPaid}\nPayment Mode       : ${paymentData.payment_method}\n-----------------------\n\nWe hope your appliances are working perfectly. Please feel free to contact us if you need any further assistance.\n\nThank you!`
      } else {
        const interpolate = (templateStr) => {
          if (!templateStr) return ''
          return templateStr
            .replace(/\{customer_name\}/g, selectedJob.customer_name)
            .replace(/\{job_id\}/g, selectedJob.job_id)
            .replace(/\{brand\}/g, selectedJob.brand)
            .replace(/\{model_name\}/g, selectedJob.model_name || 'N/A')
            .replace(/\{amount_paid\}/g, paymentData.amount_paid)
            .replace(/\{payment_method\}/g, paymentData.payment_method)
        }

        const defaultWaMsg = `Hello ${selectedJob.customer_name}! Your ${selectedJob.brand}${selectedJob.model_name ? ' ' + selectedJob.model_name : ''} has been successfully serviced and collected. Job ID: ${selectedJob.job_id}. Amount paid: ₹${paymentData.amount_paid} (${paymentData.payment_method}). Thank you for choosing us! 🙏`
        waMsg = templates.closed_sms ? interpolate(templates.closed_sms) : defaultWaMsg

        emailSubject = `Service Completed - Receipt for Job ${selectedJob.job_id}`
        emailBody = `Dear ${selectedJob.customer_name},\n\nThank you for collecting your ${selectedJob.brand}${selectedJob.model_name ? ' ' + selectedJob.model_name : ''}.\n\n--- SERVICE RECEIPT ---\nJob ID       : ${selectedJob.job_id}\nAppliance    : ${selectedJob.brand} ${selectedJob.model_name || ''} (${selectedJob.product_category})\nParts Used   : ${selectedJob.spare_replaced || 'None'}\nAmount Paid  : ₹${paymentData.amount_paid}\nPayment Mode : ${paymentData.payment_method}\nService Date : ${formatDate(selectedJob.checkin_date)}\n-----------------------\n\nWe hope your appliance is working perfectly. Please feel free to contact us if you need any further assistance.\n\nThank you!`
      }

      setReceiptData({
        whatsappMessage: waMsg,
        emailSubject,
        emailBody,
        sendWhatsapp: true,
        sendEmail: false,
        customerEmail: selectedJob.customer_email || ''
      })
      setWhatsappSent(false)
      setShowReceiptModal(true)
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Error building receipt. Please try again.' })
    }
    setSubmitting(false)
  }

  // Opens WhatsApp with pre-filled receipt message (FREE)
  const handleSendWhatsApp = () => {
    let phone = selectedJob.contact_number.replace(/\D/g, '')
    if (phone.length === 10) phone = '91' + phone
    const encoded = encodeURIComponent(receiptData.whatsappMessage)
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank')
    setWhatsappSent(true)

    // Log to Firestore
    if (selectedBundleJobs.length > 1) {
      selectedBundleJobs.forEach(job => {
        logNotification(job.job_id, job.id, {
          customer_name: job.customer_name,
          contact_number: job.contact_number,
          channel: 'WhatsApp',
          type: 'Closed',
          message: receiptData.whatsappMessage
        }).catch(console.error)
      })
    } else {
      logNotification(selectedJob.job_id, selectedJob.id, {
        customer_name: selectedJob.customer_name,
        contact_number: selectedJob.contact_number,
        channel: 'WhatsApp',
        type: 'Closed',
        message: receiptData.whatsappMessage
      }).catch(console.error)
    }
  }

  // Opens email client with pre-filled receipt (FREE via mailto)
  const handleSendEmail = () => {
    const email = receiptData.customerEmail.trim()
    if (!email) return
    const mailto = `mailto:${email}?subject=${encodeURIComponent(receiptData.emailSubject)}&body=${encodeURIComponent(receiptData.emailBody)}`
    window.open(mailto, '_blank')

    if (selectedBundleJobs.length > 1) {
      selectedBundleJobs.forEach(job => {
        logNotification(job.job_id, job.id, {
          customer_name: job.customer_name,
          contact_number: email,
          channel: 'Email',
          type: 'Closed',
          message: receiptData.emailBody
        }).catch(console.error)
      })
    } else {
      logNotification(selectedJob.job_id, selectedJob.id, {
        customer_name: selectedJob.customer_name,
        contact_number: email,
        channel: 'Email',
        type: 'Closed',
        message: receiptData.emailBody
      }).catch(console.error)
    }
  }

  const handleConfirmCheckout = async () => {
    setSubmitting(true)
    try {
      const isBundle = selectedBundleJobs.length > 1
      
      if (isBundle) {
        // We checkout all ready jobs in the bundle
        const totalPaid = parseFloat(paymentData.amount_paid)
        const totalOriginal = selectedBundleJobs.reduce((sum, j) => sum + (j.service_cost || 0), 0)
        
        for (const job of selectedBundleJobs) {
          // split the paid amount proportionally based on individual original costs
          const proportion = totalOriginal > 0 ? (job.service_cost || 0) / totalOriginal : (1 / selectedBundleJobs.length)
          const sharePaid = Math.round(totalPaid * proportion * 100) / 100
          
          await checkoutJob(job.id, {
            payment_method: paymentData.payment_method,
            amount_paid: sharePaid
          })
        }
        
        setMessage({
          type: 'success',
          text: `✓ Bundle ${selectedJob.bundle_id} closed! Payment of ₹${paymentData.amount_paid} recorded for ${selectedBundleJobs.length} jobs.`
        })
      } else {
        const result = await checkoutJob(selectedJob.id, paymentData)
        if (result.success) {
          setMessage({
            type: 'success',
            text: `✓ Job ${selectedJob.job_id} closed! Payment of ₹${paymentData.amount_paid} recorded.`
          })
        } else {
          throw new Error(result.error || 'Checkout failed')
        }
      }
      
      setShowReceiptModal(false)
      setSelectedJob(null)
      setSelectedBundleJobs([])
      setJobs([])
      setSearchPhone('')
      setPaymentData({ payment_method: '', amount_paid: '' })

      try {
        const allJobs = await getAllJobs()
        const ml = new ServiceTimePredictor()
        ml.train(allJobs)
        setPredictor(ml)
      } catch (err) {
        console.error(err)
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Error confirming checkout.' })
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Check Out</h1>
          <p className="text-slate-500 mt-1">Search by phone, review service, record payment, and send receipt to customer</p>
        </div>

        {/* Alert Banner */}
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
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
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
                      {job.is_bundle && (
                        <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Box className="w-3 h-3 text-teal-600" /> Bundle: {job.bundle_id}
                        </span>
                      )}
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

            {/* Customer & Service Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
              {selectedBundleJobs.length > 1 ? (
                // Bundle Card Header
                <div className="bg-gradient-to-r from-teal-900 to-indigo-950 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-teal-300 bg-white/10 px-2.5 py-0.5 rounded font-extrabold flex items-center gap-1.5 w-fit">
                        <Box className="w-3.5 h-3.5" /> Bundle: {selectedJob.bundle_id}
                      </span>
                      <h3 className="text-lg font-bold mt-2">Bundle Service Checkout</h3>
                      <p className="text-slate-400 text-sm">Customer: {selectedJob.customer_name} • {selectedBundleJobs.length} Appliance(s) Ready</p>
                    </div>
                    <div className="text-right bg-teal-500/10 px-3 py-1.5 rounded-lg border border-teal-500/30">
                      <span className="text-xs text-teal-300 block font-semibold">Deal Applied</span>
                      <span className="text-sm font-bold text-teal-200">15% Bundle Discount</span>
                    </div>
                  </div>
                </div>
              ) : (
                // Single Job Card Header
                <div className="bg-slate-900 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm text-teal-300 bg-white/10 px-2.5 py-0.5 rounded font-bold">{selectedJob.job_id}</span>
                      <h3 className="text-lg font-bold mt-2">{selectedJob.brand} {selectedJob.model_name || ''}</h3>
                      <p className="text-slate-400 text-sm">{selectedJob.product_category} • {selectedJob.warranty_status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Status</p>
                      <span className="text-sm font-bold text-teal-300">{selectedJob.status}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 space-y-6 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Info */}
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
                      {selectedJob.customer_email && (
                        <div className="flex items-center gap-2.5 text-indigo-600">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{selectedJob.customer_email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-xs">Checked In: {formatDate(selectedJob.checkin_date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  {selectedBundleJobs.length > 1 ? (
                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pricing Breakdown</h4>
                      <div className="space-y-2">
                        {selectedBundleJobs.map(job => (
                          <div key={job.id} className="flex justify-between text-xs text-slate-600">
                            <span>{job.brand} ({job.product_category})</span>
                            <span className="font-mono font-medium">₹{job.service_cost || 0}</span>
                          </div>
                        ))}
                        <div className="border-t border-slate-200/60 pt-2 flex justify-between font-medium text-slate-700">
                          <span>Original Total</span>
                          <span className="font-mono">₹{selectedBundleJobs.reduce((sum, j) => sum + (j.service_cost || 0), 0)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600 font-semibold text-xs">
                          <span>Bundle Discount (15%)</span>
                          <span className="font-mono">-₹{Math.round(selectedBundleJobs.reduce((sum, j) => sum + (j.service_cost || 0), 0) * 0.15)}</span>
                        </div>
                        <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-slate-800 text-sm">
                          <span>Final Amount Due</span>
                          <span className="font-mono text-teal-600">
                            ₹{selectedBundleJobs.reduce((sum, j) => sum + (j.service_cost || 0), 0) - Math.round(selectedBundleJobs.reduce((sum, j) => sum + (j.service_cost || 0), 0) * 0.15)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Single Job Repair Info */
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Summary</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5 text-slate-700">
                          <Wrench className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-slate-400 mb-0.5">Spares Replaced</p>
                            <p className="font-medium text-slate-800 whitespace-pre-wrap bg-slate-50 border border-slate-100 p-2 rounded-lg">
                              {selectedJob.spare_replaced || 'None'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <IndianRupee className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-400 mb-0.5">Service Cost Quoted</p>
                            <p className="text-xl font-bold text-teal-600">₹{selectedJob.service_cost || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bundle Appliance Details or Single Job details */}
                {selectedBundleJobs.length > 1 ? (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Appliances Included</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedBundleJobs.map((job, idx) => (
                        <div key={job.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700">#{idx + 1} {job.brand} {job.model_name || ''}</span>
                            <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full font-bold">{job.job_id}</span>
                          </div>
                          <p className="text-xs text-slate-500"><strong>Fault:</strong> {job.fault_description}</p>
                          <p className="text-xs text-slate-500"><strong>Spares Used:</strong> {job.spare_replaced || 'None'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Fault Description */}
                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Customer Reported Fault
                      </h4>
                      <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                        {selectedJob.fault_description || 'No fault description provided.'}
                      </p>
                    </div>

                    {/* ML vs Actual Duration */}
                    <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-teal-50/50 border border-teal-100/50 p-4 rounded-xl space-y-1">
                        <span className="text-[10px] text-teal-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                          AI Predicted Duration
                        </span>
                        <p className="text-base font-bold text-slate-800">
                          {predictor ? predictor.predict(selectedJob.product_category, selectedJob.fault_description, selectedJob.spare_replaced) : 'Calculating...'}
                        </p>
                        <span className="text-[10px] text-slate-400 block">Estimated duration using ML model</span>
                      </div>
                      <div className="bg-indigo-50/50 border border-indigo-100/50 p-4 rounded-xl space-y-1">
                        <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          Actual Elapsed Duration
                        </span>
                        <p className="text-base font-bold text-slate-800">
                          {getActualDuration(selectedJob.checkin_date, null)}
                        </p>
                        <span className="text-[10px] text-slate-400 block">Time elapsed since check-in</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>


            {/* Payment Form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-600" />
                Record Payment & Complete
              </h2>
              <form onSubmit={handleCheckout} className="space-y-5">
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
                        className={`py-3 px-4 rounded-lg border-2 text-sm font-semibold transition-all cursor-pointer ${
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  📲 Confirm Payment & Send Receipt to Customer
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ─── RECEIPT + NOTIFICATION MODAL ─── */}
      {showReceiptModal && selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center shrink-0">
              <div>
                <span className="font-bold text-sm block">📬 Send Receipt to Customer</span>
                <span className="text-[11px] text-white/60">Job {selectedJob.job_id} • FREE — No API needed</span>
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-sm text-slate-700">

              {/* Customer info bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {selectedJob.customer_name?.[0]?.toUpperCase() || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm">{selectedJob.customer_name}</div>
                  <div className="text-xs text-slate-500">{selectedJob.contact_number}{selectedJob.customer_email ? ` • ${selectedJob.customer_email}` : ''}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400">Amount Paid</div>
                  <div className="font-bold text-teal-600">₹{paymentData.amount_paid}</div>
                </div>
              </div>

              {/* ── WhatsApp Receipt ── */}
              <div className="rounded-xl overflow-hidden border border-green-200">
                <div className="px-3 py-2.5 flex items-center gap-2" style={{ background: '#075e54' }}>
                  <WhatsAppIcon className="w-4 h-4 text-white" />
                  <span className="text-white font-semibold text-xs">WhatsApp Receipt</span>
                  <span className="ml-auto text-[10px] text-white/50">Free</span>
                </div>
                {/* Chat bubble preview */}
                <div className="p-3" style={{ background: '#ece5dd' }}>
                  <div className="ml-auto max-w-[92%] rounded-tl-xl rounded-bl-xl rounded-br-xl p-2.5 text-[12px] leading-relaxed whitespace-pre-wrap" style={{ background: '#dcf8c6' }}>
                    {receiptData.whatsappMessage}
                  </div>
                </div>
                {/* Editable */}
                <div className="px-3 pt-2 pb-1 bg-white">
                  <p className="text-[10px] text-slate-400 mb-1">Edit message if needed:</p>
                  <textarea
                    value={receiptData.whatsappMessage}
                    onChange={(e) => setReceiptData(prev => ({ ...prev, whatsappMessage: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-sans"
                  />
                </div>
                <div className="p-2 bg-white">
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="w-full py-2.5 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                    style={{ background: '#25d366' }}
                  >
                    <WhatsAppIcon className="w-4 h-4 text-white" />
                    {whatsappSent ? '✓ WhatsApp Opened — Click Send there!' : 'Open WhatsApp & Send Receipt'}
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </button>
                  {whatsappSent && (
                    <p className="text-[11px] text-center text-green-600 font-semibold mt-1.5">
                      ✅ Click "Send" inside WhatsApp to deliver the receipt
                    </p>
                  )}
                </div>
              </div>

              {/* ── Email Receipt ── */}
              <div className="rounded-xl overflow-hidden border border-indigo-200">
                <div className="px-3 py-2.5 flex items-center gap-2 bg-indigo-700">
                  <Mail className="w-4 h-4 text-white" />
                  <span className="text-white font-semibold text-xs">Email Receipt</span>
                  <span className="ml-auto text-[10px] text-white/50">Free via email client</span>
                </div>
                <div className="p-3 bg-indigo-50 space-y-2">
                  <div>
                    <p className="text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Customer Email</p>
                    <input
                      type="email"
                      value={receiptData.customerEmail}
                      onChange={(e) => setReceiptData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      placeholder="Enter customer email (if available)"
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Email Body Preview</p>
                    <div className="bg-white border border-indigo-100 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-28 overflow-y-auto">
                      {receiptData.emailBody}
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-white">
                  {receiptData.customerEmail.trim() ? (
                    <button
                      type="button"
                      onClick={handleSendEmail}
                      className="w-full py-2.5 rounded-lg font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Mail className="w-4 h-4" />
                      Open Email Client & Send Receipt
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </button>
                  ) : (
                    <div className="text-[11px] text-center text-slate-400 py-1">
                      Enter email above to enable email receipt
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckout}
                disabled={submitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? 'Closing job...' : 'Confirm & Close Job'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}