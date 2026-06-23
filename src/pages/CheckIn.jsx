import { useState, useEffect } from 'react'
import { createJob, getAllJobs, getNotificationTemplates, logNotification } from '../firebase/services'
import { APPLIANCE_TYPES, BRAND_NAMES, WARRANTY_STATUS, TECHNICIAN_NAMES, STAFF_NAMES } from '../constants'
import { ShieldCheck, ShieldOff, Sparkles, ExternalLink, Mail } from 'lucide-react'
import { ServiceTimePredictor } from '../utils/mlModel'

function WhatsAppIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export default function CheckIn() {
  const [formData, setFormData] = useState({
    customer_name: '',
    contact_number: '',
    customer_email: '',
    product_category: '',
    brand: '',
    custom_brand: '',
    model_name: '',
    fault_description: '',
    warranty_status: 'Out of Warranty',
    assigned_technician: '',
    checkin_staff: '',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [predictor, setPredictor] = useState(null)
  const [lastCreatedJob, setLastCreatedJob] = useState(null) // for WhatsApp button

  useEffect(() => {
    async function initPredictor() {
      try {
        const allJobs = await getAllJobs()
        const ml = new ServiceTimePredictor()
        ml.train(allJobs)
        setPredictor(ml)
      } catch (err) {
        console.error('Error training predictor on CheckIn load:', err)
      }
    }
    initPredictor()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.customer_name.trim()) return 'Customer name required'
    if (!formData.contact_number.trim()) return 'Contact number required'
    if (formData.contact_number.length < 10) return 'Valid phone number required'
    if (!formData.product_category) return 'Appliance type required'
    if (!formData.brand) return 'Brand required'
    if (formData.brand === 'Other' && !formData.custom_brand.trim()) return 'Enter custom brand name'
    if (!formData.fault_description.trim()) return 'Fault description required'
    if (!formData.assigned_technician) return 'Technician required'
    if (!formData.checkin_staff) return 'Staff name required'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const error = validateForm()
    if (error) {
      setMessage({ type: 'error', text: error })
      return
    }

    setLoading(true)
    setMessage(null)

    const jobData = {
      ...formData,
      brand: formData.brand === 'Other' ? formData.custom_brand.trim() : formData.brand,
    }
    delete jobData.custom_brand

    const result = await createJob(jobData)
    
    if (result.success) {
      // Build notification messages
      let waIntakeMsg = `Hello ${formData.customer_name}! We have received your ${jobData.brand}${formData.model_name ? ' ' + formData.model_name : ''} for service. Your Job ID is: ${result.jobId}. Assigned Technician: ${formData.assigned_technician}. We will notify you once it is ready. Thank you!`

      const emailSubject = `Service Job Confirmed - ${result.jobId}`
      const emailBody = `Dear ${formData.customer_name},\n\nThank you for visiting us. We have received your ${jobData.brand}${formData.model_name ? ' ' + formData.model_name : ''} for repair service.\n\nJob ID: ${result.jobId}\nAssigned Technician: ${formData.assigned_technician}\n\nWe will contact you once the repair is completed. Please carry this Job ID when you come to collect your appliance.\n\nThank you!`

      try {
        const templates = await getNotificationTemplates()
        const interpolate = (templateStr) => {
          if (!templateStr) return ''
          return templateStr
            .replace(/\{customer_name\}/g, formData.customer_name)
            .replace(/\{job_id\}/g, result.jobId)
            .replace(/\{brand\}/g, jobData.brand)
            .replace(/\{model_name\}/g, formData.model_name || 'N/A')
            .replace(/\{fault_description\}/g, formData.fault_description)
            .replace(/\{assigned_technician\}/g, formData.assigned_technician)
        }
        if (templates.intake_sms) waIntakeMsg = interpolate(templates.intake_sms)

        await logNotification(result.jobId, result.docId, {
          customer_name: formData.customer_name,
          contact_number: formData.contact_number,
          channel: 'WhatsApp',
          type: 'Intake',
          message: waIntakeMsg
        })

        if (formData.customer_email.trim()) {
          await logNotification(result.jobId, result.docId, {
            customer_name: formData.customer_name,
            contact_number: formData.customer_email,
            channel: 'Email',
            type: 'Intake',
            message: emailBody
          })
        }
      } catch (err) {
        console.error('Error logging intake notification:', err)
      }

      setLastCreatedJob({
        jobId: result.jobId,
        docId: result.docId,
        customer_name: formData.customer_name,
        contact_number: formData.contact_number,
        customer_email: formData.customer_email.trim(),
        brand: jobData.brand,
        model_name: formData.model_name,
        assigned_technician: formData.assigned_technician,
        waMessage: waIntakeMsg,
        emailSubject,
        emailBody,
      })

      setMessage({ 
        type: 'success', 
        text: `Job ${result.jobId} created! Notify customer below.` 
      })

      setFormData({
        customer_name: '',
        contact_number: '',
        customer_email: '',
        product_category: '',
        brand: '',
        custom_brand: '',
        model_name: '',
        fault_description: '',
        warranty_status: 'Out of Warranty',
        assigned_technician: '',
        checkin_staff: '',
      })

      // Re-train predictor with the new job data
      try {
        const allJobs = await getAllJobs()
        const ml = new ServiceTimePredictor()
        ml.train(allJobs)
        setPredictor(ml)
      } catch (err) {
        console.error(err)
      }
    } else {
      setMessage({ type: 'error', text: `Error: ${result.error}` })
    }

    setLoading(false)
  }

  const isUnderWarranty = formData.warranty_status === 'Under Warranty'

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Check In</h1>
        <p className="text-slate-500 mb-8">Register a new appliance for service</p>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Notification Quick Send after job creation */}
        {lastCreatedJob && (
          <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 shadow-md">
            {/* Card Header */}
            <div className="px-4 py-3 flex items-center gap-2 bg-slate-800">
              <span className="text-white font-bold text-sm">📬 Notify Customer — Job {lastCreatedJob.jobId}</span>
              <span className="ml-auto text-[10px] text-white/50 font-medium">FREE • No API needed</span>
            </div>

            <div className="bg-white p-4 space-y-4">
              {/* Customer info */}
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="font-bold text-slate-800">{lastCreatedJob.customer_name}</span>
                <span className="text-slate-400">•</span>
                <span className="font-mono">{lastCreatedJob.contact_number}</span>
                {lastCreatedJob.customer_email && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="text-indigo-600 font-medium">{lastCreatedJob.customer_email}</span>
                  </>
                )}
              </div>

              {/* WhatsApp section */}
              <div className="rounded-xl overflow-hidden border border-green-200">
                <div className="px-3 py-2 flex items-center gap-2" style={{ background: '#075e54' }}>
                  <WhatsAppIcon className="w-4 h-4 text-white" />
                  <span className="text-white font-semibold text-xs">WhatsApp Message</span>
                </div>
                <div className="p-3" style={{ background: '#ece5dd' }}>
                  <div className="ml-auto max-w-[92%] rounded-tl-xl rounded-bl-xl rounded-br-xl p-2.5 text-[12px] leading-relaxed whitespace-pre-wrap" style={{ background: '#dcf8c6' }}>
                    {lastCreatedJob.waMessage}
                  </div>
                </div>
                <div className="p-2 bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      let phone = lastCreatedJob.contact_number.replace(/\D/g, '')
                      if (phone.length === 10) phone = '91' + phone
                      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lastCreatedJob.waMessage)}`, '_blank')
                    }}
                    className="w-full py-2 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                    style={{ background: '#25d366' }}
                  >
                    <WhatsAppIcon className="w-4 h-4 text-white" />
                    Open WhatsApp & Send
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </button>
                </div>
              </div>

              {/* Email section — only if email was provided */}
              {lastCreatedJob.customer_email ? (
                <div className="rounded-xl overflow-hidden border border-indigo-200">
                  <div className="px-3 py-2 flex items-center gap-2 bg-indigo-700">
                    <Mail className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-xs">Email to {lastCreatedJob.customer_email}</span>
                  </div>
                  <div className="p-3 bg-indigo-50 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed border-b border-indigo-100 max-h-28 overflow-y-auto">
                    {lastCreatedJob.emailBody}
                  </div>
                  <div className="p-2 bg-white">
                    <button
                      type="button"
                      onClick={() => {
                        const mailto = `mailto:${lastCreatedJob.customer_email}?subject=${encodeURIComponent(lastCreatedJob.emailSubject)}&body=${encodeURIComponent(lastCreatedJob.emailBody)}`
                        window.open(mailto, '_blank')
                      }}
                      className="w-full py-2 rounded-lg font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Mail className="w-4 h-4" />
                      Open Email Client & Send
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  <Mail className="w-3.5 h-3.5" />
                  No email provided — only WhatsApp available for this customer.
                </div>
              )}

              <button
                type="button"
                onClick={() => setLastCreatedJob(null)}
                className="w-full py-2 rounded-lg text-xs text-slate-500 border border-slate-200 hover:bg-slate-50 font-semibold transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-8 space-y-6">
          
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Customer Name *
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              placeholder="e.g., Ravi Kumar"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contact Number *
            </label>
            <input
              type="tel"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleChange}
              placeholder="e.g., 9876543210"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Customer Email — Optional */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Customer Email
              <span className="ml-2 text-xs font-normal text-slate-400">(optional — used for email notification)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                placeholder="e.g., ravi@gmail.com"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            {formData.customer_email && (
              <p className="mt-1 text-[11px] text-indigo-600 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Email notification will be available after job creation
              </p>
            )}
          </div>

          {/* Appliance Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Appliance Type *
            </label>
            <select
              name="product_category"
              value={formData.product_category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select appliance...</option>
              {APPLIANCE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Brand - Dropdown */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Brand *
            </label>
            <select
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select brand...</option>
              {BRAND_NAMES.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Custom Brand - shown when "Other" is selected */}
          {formData.brand === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Custom Brand Name *
              </label>
              <input
                type="text"
                name="custom_brand"
                value={formData.custom_brand}
                onChange={handleChange}
                placeholder="Enter brand name..."
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {/* Model Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Model Name
            </label>
            <input
              type="text"
              name="model_name"
              value={formData.model_name}
              onChange={handleChange}
              placeholder="e.g., Blue Leaf"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Fault Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fault Description *
            </label>
            <textarea
              name="fault_description"
              value={formData.fault_description}
              onChange={handleChange}
              placeholder="Describe the issue (e.g., motor sparking, not heating up, water leakage)..."
              rows="3"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Real-time ML Prediction Card */}
          {formData.product_category && formData.fault_description.trim() && (
            <div className="bg-teal-50/60 border-2 border-teal-500/20 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
              <div className="space-y-1">
                <span className="text-[10px] text-teal-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse text-teal-600" />
                  AI Service Time Prediction
                </span>
                <span className="text-xl font-bold text-slate-800 block">
                  {predictor ? predictor.predict(formData.product_category, formData.fault_description, '') : 'Calculating...'}
                </span>
                <span className="text-xs text-slate-400 block">
                  {predictor?.isTrained 
                    ? `Based on ML model trained on ${predictor.trainingSize} past job(s)` 
                    : 'Based on industry standard heuristic estimates'}
                </span>
              </div>
              <div className="bg-teal-600/10 text-teal-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0">
                <span>⚡ Live ML</span>
              </div>
            </div>
          )}

          {/* Warranty Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Warranty Status *
            </label>
            <div className="flex gap-3">
              {WARRANTY_STATUS.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, warranty_status: status }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                    formData.warranty_status === status
                      ? status === 'Under Warranty'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-slate-500 bg-slate-50 text-slate-700 shadow-sm'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {status === 'Under Warranty' 
                    ? <ShieldCheck className="w-4 h-4" /> 
                    : <ShieldOff className="w-4 h-4" />
                  }
                  {status}
                </button>
              ))}
            </div>
            {isUnderWarranty && (
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                This job will be tracked under warranty coverage
              </p>
            )}
          </div>

          {/* Assigned Technician */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assigned Technician *
            </label>
            <select
              name="assigned_technician"
              value={formData.assigned_technician}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select technician...</option>
              {TECHNICIAN_NAMES.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Check In Staff */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Check In Staff *
            </label>
            <select
              name="checkin_staff"
              value={formData.checkin_staff}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select staff...</option>
              {STAFF_NAMES.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer"
            >
              {loading ? 'Creating job...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}