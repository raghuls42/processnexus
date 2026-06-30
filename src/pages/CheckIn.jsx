import { useState, useEffect } from 'react'
import { createJob, getAllJobs, getNotificationTemplates, logNotification, generateBundleId } from '../firebase/services'
import { APPLIANCE_TYPES, BRAND_NAMES, WARRANTY_STATUS, TECHNICIAN_NAMES, STAFF_NAMES } from '../constants'
import { ShieldCheck, ShieldOff, Sparkles, ExternalLink, Mail, Plus, Trash2, Box } from 'lucide-react'
import { ServiceTimePredictor } from '../utils/mlModel'

function WhatsAppIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export default function CheckIn() {
  const [customerData, setCustomerData] = useState({
    customer_name: '',
    contact_number: '',
    customer_email: '',
    checkin_staff: '',
  })

  const [items, setItems] = useState([
    {
      product_category: '',
      brand: '',
      custom_brand: '',
      model_name: '',
      fault_description: '',
      warranty_status: 'Out of Warranty',
      assigned_technician: '',
    }
  ])

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

  const handleCustomerChange = (e) => {
    const { name, value } = e.target
    setCustomerData(prev => ({ ...prev, [name]: value }))
  }

  const handleItemChange = (index, name, value) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [name]: value }
      }
      return item
    }))
  }

  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        product_category: '',
        brand: '',
        custom_brand: '',
        model_name: '',
        fault_description: '',
        warranty_status: 'Out of Warranty',
        assigned_technician: '',
      }
    ])
  }

  const removeItem = (index) => {
    if (items.length <= 1) return
    setItems(prev => prev.filter((_, idx) => idx !== index))
  }

  const validateForm = () => {
    if (!customerData.customer_name.trim()) return 'Customer name required'
    if (!customerData.contact_number.trim()) return 'Contact number required'
    if (customerData.contact_number.length < 10) return 'Valid phone number required'
    if (!customerData.checkin_staff) return 'Staff name required'

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const label = items.length > 1 ? `Product #${i + 1}: ` : ''
      if (!item.product_category) return `${label}Appliance type required`
      if (!item.brand) return `${label}Brand required`
      if (item.brand === 'Other' && !item.custom_brand.trim()) return `${label}Enter custom brand name`
      if (!item.fault_description.trim()) return `${label}Fault description required`
      if (!item.assigned_technician) return `${label}Technician required`
    }
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

    try {
      const isBundle = items.length > 1
      const bundleId = isBundle ? await generateBundleId() : null

      const createdJobs = []
      
      for (const item of items) {
        const finalBrand = item.brand === 'Other' ? item.custom_brand.trim() : item.brand
        const jobData = {
          customer_name: customerData.customer_name,
          contact_number: customerData.contact_number,
          customer_email: customerData.customer_email,
          checkin_staff: customerData.checkin_staff,
          product_category: item.product_category,
          brand: finalBrand,
          model_name: item.model_name,
          fault_description: item.fault_description,
          warranty_status: item.warranty_status,
          assigned_technician: item.assigned_technician,
          is_bundle: isBundle,
          bundle_id: bundleId,
        }

        const result = await createJob(jobData)
        if (result.success) {
          createdJobs.push({
            jobId: result.jobId,
            docId: result.docId,
            brand: finalBrand,
            model_name: item.model_name,
            product_category: item.product_category,
            fault_description: item.fault_description,
            assigned_technician: item.assigned_technician,
          })
        } else {
          throw new Error(result.error || 'Failed to create job')
        }
      }

      // Build consolidated notification message
      let waIntakeMsg = ''
      let emailSubject = ''
      let emailBody = ''

      if (isBundle) {
        waIntakeMsg = `Hello ${customerData.customer_name}! We have received your Bundle Service request (Bundle ID: ${bundleId}) with ${createdJobs.length} appliances:\n`
        createdJobs.forEach((job, idx) => {
          waIntakeMsg += `${idx + 1}. ${job.brand} ${job.model_name || ''} (${job.product_category}) - Job ID: ${job.jobId}\n`
        })
        waIntakeMsg += `We will notify you once they are serviced. Thank you!`

        emailSubject = `Service Bundle Confirmed - ${bundleId}`
        emailBody = `Dear ${customerData.customer_name},\n\nThank you for visiting us. We have successfully registered your service bundle.\n\nBundle ID: ${bundleId}\nTotal Appliances: ${createdJobs.length}\n\n`
        createdJobs.forEach((job, idx) => {
          emailBody += `Appliance #${idx + 1}:\n- Type: ${job.product_category}\n- Brand/Model: ${job.brand} ${job.model_name || ''}\n- Job ID: ${job.jobId}\n- Assigned Tech: ${job.assigned_technician}\n- Fault: ${job.fault_description}\n\n`
        })
        emailBody += `We will contact you once the repairs are completed. Please carry this Bundle ID when you come to collect your appliances.\n\nThank you!`
      } else {
        const job = createdJobs[0]
        waIntakeMsg = `Hello ${customerData.customer_name}! We have received your ${job.brand}${job.model_name ? ' ' + job.model_name : ''} for service. Your Job ID is: ${job.jobId}. Assigned Technician: ${job.assigned_technician}. We will notify you once it is ready. Thank you!`
        
        emailSubject = `Service Job Confirmed - ${job.jobId}`
        emailBody = `Dear ${customerData.customer_name},\n\nThank you for visiting us. We have received your ${job.brand}${job.model_name ? ' ' + job.model_name : ''} for repair service.\n\nJob ID: ${job.jobId}\nAssigned Technician: ${job.assigned_technician}\n\nWe will contact you once the repair is completed. Please carry this Job ID when you come to collect your appliance.\n\nThank you!`

        // Interpolate templates if available
        try {
          const templates = await getNotificationTemplates()
          const interpolate = (templateStr) => {
            if (!templateStr) return ''
            return templateStr
              .replace(/\{customer_name\}/g, customerData.customer_name)
              .replace(/\{job_id\}/g, job.jobId)
              .replace(/\{brand\}/g, job.brand)
              .replace(/\{model_name\}/g, job.model_name || 'N/A')
              .replace(/\{fault_description\}/g, job.fault_description)
              .replace(/\{assigned_technician\}/g, job.assigned_technician)
          }
          if (templates.intake_sms) waIntakeMsg = interpolate(templates.intake_sms)
        } catch (e) {
          console.error(e)
        }
      }

      // Log notifications for all created jobs
      for (const job of createdJobs) {
        try {
          await logNotification(job.jobId, job.docId, {
            customer_name: customerData.customer_name,
            contact_number: customerData.contact_number,
            channel: 'WhatsApp',
            type: 'Intake',
            message: waIntakeMsg
          })

          if (customerData.customer_email.trim()) {
            await logNotification(job.jobId, job.docId, {
              customer_name: customerData.customer_name,
              contact_number: customerData.customer_email,
              channel: 'Email',
              type: 'Intake',
              message: emailBody
            })
          }
        } catch (err) {
          console.error('Error logging intake notification:', err)
        }
      }

      setLastCreatedJob({
        jobId: isBundle ? bundleId : createdJobs[0].jobId,
        isBundle,
        customer_name: customerData.customer_name,
        contact_number: customerData.contact_number,
        customer_email: customerData.customer_email.trim(),
        waMessage: waIntakeMsg,
        emailSubject,
        emailBody,
      })

      setMessage({ 
        type: 'success', 
        text: isBundle 
          ? `Bundle ${bundleId} created with ${createdJobs.length} jobs! Notify customer below.` 
          : `Job ${createdJobs[0].jobId} created! Notify customer below.` 
      })

      // Reset form
      setCustomerData({
        customer_name: '',
        contact_number: '',
        customer_email: '',
        checkin_staff: '',
      })
      setItems([
        {
          product_category: '',
          brand: '',
          custom_brand: '',
          model_name: '',
          fault_description: '',
          warranty_status: 'Out of Warranty',
          assigned_technician: '',
        }
      ])

      // Re-train predictor
      try {
        const allJobs = await getAllJobs()
        const ml = new ServiceTimePredictor()
        ml.train(allJobs)
        setPredictor(ml)
      } catch (err) {
        console.error(err)
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-1 tracking-tight">Check In</h1>
        <p className="text-slate-500 mb-8">Register appliances for service (Supports Bundled intake for multiple items)</p>

        {message && (
          <div className={`mb-4 p-4 rounded-xl border font-medium ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' 
              : 'bg-red-50 text-red-700 border-red-200 shadow-sm'
          }`}>
            {message.text}
          </div>
        )}

        {/* Notification Quick Send after job creation */}
        {lastCreatedJob && (
          <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 shadow-lg animate-scale-in">
            {/* Card Header */}
            <div className="px-5 py-3.5 flex items-center gap-2 bg-slate-800">
              <span className="text-white font-bold text-sm">📬 Notify Customer — {lastCreatedJob.isBundle ? `Bundle ${lastCreatedJob.jobId}` : `Job ${lastCreatedJob.jobId}`}</span>
              <span className="ml-auto text-[10px] text-white/50 font-medium">FREE • No API needed</span>
            </div>

            <div className="bg-white p-5 space-y-4">
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
                    className="w-full py-2 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 cursor-pointer"
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
                  <div className="p-3 bg-indigo-50 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed border-b border-indigo-100 max-h-32 overflow-y-auto">
                    {lastCreatedJob.emailBody}
                  </div>
                  <div className="p-2 bg-white">
                    <button
                      type="button"
                      onClick={() => {
                        const mailto = `mailto:${lastCreatedJob.customer_email}?subject=${encodeURIComponent(lastCreatedJob.emailSubject)}&body=${encodeURIComponent(lastCreatedJob.emailBody)}`
                        window.open(mailto, '_blank')
                      }}
                      className="w-full py-2 rounded-lg font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
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
                className="w-full py-2 rounded-lg text-xs text-slate-500 border border-slate-200 hover:bg-slate-50 font-semibold transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer & Staff Details Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-bold">1</span>
              Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={customerData.customer_name}
                  onChange={handleCustomerChange}
                  placeholder="e.g., Ravi Kumar"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  name="contact_number"
                  value={customerData.contact_number}
                  onChange={handleCustomerChange}
                  placeholder="e.g., 9876543210"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                />
              </div>

              {/* Customer Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Customer Email <span className="text-xs text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    name="customer_email"
                    value={customerData.customer_email}
                    onChange={handleCustomerChange}
                    placeholder="e.g., ravi@gmail.com"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Check In Staff */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Check In Staff *
                </label>
                <select
                  name="checkin_staff"
                  value={customerData.checkin_staff}
                  onChange={handleCustomerChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                >
                  <option value="">Select staff...</option>
                  {STAFF_NAMES.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Appliance / Items Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-bold">2</span>
                Appliance Details
                {items.length > 1 && (
                  <span className="text-xs font-semibold bg-gradient-to-r from-teal-500 to-indigo-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Box className="w-3 h-3" /> Bundle Service Active
                  </span>
                )}
              </h2>

              <button
                type="button"
                onClick={addItem}
                className="bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-teal-200/50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Appliance
              </button>
            </div>

            {items.map((item, index) => {
              const isUnderWarranty = item.warranty_status === 'Under Warranty'
              return (
                <div key={index} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm relative group/card hover:border-slate-300 transition-all">
                  {/* Item Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                      <Box className="w-4 h-4 text-teal-600" />
                      Appliance #{index + 1} {items.length > 1 && `(Bundle Item)`}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Appliance Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Appliance Type *
                      </label>
                      <select
                        value={item.product_category}
                        onChange={(e) => handleItemChange(index, 'product_category', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                      >
                        <option value="">Select appliance...</option>
                        {APPLIANCE_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Brand - Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Brand *
                      </label>
                      <select
                        value={item.brand}
                        onChange={(e) => handleItemChange(index, 'brand', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                      >
                        <option value="">Select brand...</option>
                        {BRAND_NAMES.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Brand - shown when "Other" is selected */}
                    {item.brand === 'Other' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Custom Brand Name *
                        </label>
                        <input
                          type="text"
                          value={item.custom_brand}
                          onChange={(e) => handleItemChange(index, 'custom_brand', e.target.value)}
                          placeholder="Enter brand name..."
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                        />
                      </div>
                    )}

                    {/* Model Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Model Name
                      </label>
                      <input
                        type="text"
                        value={item.model_name}
                        onChange={(e) => handleItemChange(index, 'model_name', e.target.value)}
                        placeholder="e.g., Blue Leaf"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                      />
                    </div>

                    {/* Assigned Technician */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Assigned Technician *
                      </label>
                      <select
                        value={item.assigned_technician}
                        onChange={(e) => handleItemChange(index, 'assigned_technician', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                      >
                        <option value="">Select technician...</option>
                        {TECHNICIAN_NAMES.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Fault Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Fault Description *
                      </label>
                      <textarea
                        value={item.fault_description}
                        onChange={(e) => handleItemChange(index, 'fault_description', e.target.value)}
                        placeholder="Describe the issue (e.g., motor sparking, not heating up)..."
                        rows="3"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Real-time ML Prediction Card */}
                  {item.product_category && item.fault_description.trim() && (
                    <div className="bg-teal-50/60 border border-teal-500/20 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
                      <div className="space-y-1">
                        <span className="text-[10px] text-teal-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse text-teal-600" />
                          AI Service Time Prediction
                        </span>
                        <span className="text-lg font-bold text-slate-800 block">
                          {predictor ? predictor.predict(item.product_category, item.fault_description, '') : 'Calculating...'}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          {predictor?.isTrained 
                            ? `Based on ML model trained on ${predictor.trainingSize} past job(s)` 
                            : 'Based on industry standard heuristic estimates'}
                        </span>
                      </div>
                      <div className="bg-teal-600/10 text-teal-700 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0">
                        ⚡ Live ML
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
                          onClick={() => handleItemChange(index, 'warranty_status', status)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 text-xs font-bold transition-all cursor-pointer ${
                            item.warranty_status === status
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
                </div>
              )
            })}
          </div>

          {/* Submit Section */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99] text-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Processing intake...' : items.length > 1 ? `Create Bundle Service (${items.length} Jobs)` : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}