// export default function CheckIn() {
//   return (
//     <div className="min-h-screen bg-slate-50 p-6">
//       <div className="max-w-4xl mx-auto">
//         <h1 className="text-3xl font-bold text-slate-800 mb-2">Check In</h1>
//         <p className="text-slate-500 mb-8">Register a new appliance for service</p>
//         <div className="bg-white rounded-lg border border-slate-200 p-8">
//           <p className="text-slate-400">Check In page</p>
//         </div>
//       </div>
//     </div>
//   )
// }


import { useState } from 'react'
import { createJob } from '../firebase/services'
import { APPLIANCE_TYPES, WARRANTY_STATUS, TECHNICIAN_NAMES, STAFF_NAMES } from '../constants'

export default function CheckIn() {
  const [formData, setFormData] = useState({
    customer_name: '',
    contact_number: '',
    product_category: '',
    brand: '',
    model_name: '',
    warranty_status: 'Out of Warranty',
    assigned_technician: '',
    checkin_staff: '',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.customer_name.trim()) return 'Customer name required'
    if (!formData.contact_number.trim()) return 'Contact number required'
    if (formData.contact_number.length < 10) return 'Valid phone number required'
    if (!formData.product_category) return 'Appliance type required'
    if (!formData.brand.trim()) return 'Brand required'
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

    const result = await createJob(formData)
    
    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `Job ${result.jobId} created successfully!` 
      })
      setFormData({
        customer_name: '',
        contact_number: '',
        product_category: '',
        brand: '',
        model_name: '',
        warranty_status: 'Out of Warranty',
        assigned_technician: '',
        checkin_staff: '',
      })
    } else {
      setMessage({ type: 'error', text: `Error: ${result.error}` })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Check In</h1>
        <p className="text-slate-500 mb-8">Register a new appliance for service</p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
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

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Brand *
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="e.g., Preethi"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

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

          {/* Warranty Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Warranty Status *
            </label>
            <select
              name="warranty_status"
              value={formData.warranty_status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {WARRANTY_STATUS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
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
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? 'Creating job...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}