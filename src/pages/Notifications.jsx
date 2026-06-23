import { useState, useEffect } from 'react'
import { 
  getNotificationTemplates, 
  saveNotificationTemplates, 
  getGlobalNotificationLogs 
} from '../firebase/services'
import { 
  Mail, 
  MessageSquare, 
  History, 
  Sliders, 
  Save, 
  Info, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Eye, 
  User, 
  Phone,
  Calendar,
  AlertCircle
} from 'lucide-react'

const MOCK_PREVIEW_DATA = {
  customer_name: "Ravi Kumar",
  job_id: "SVC-2026-042",
  brand: "Prestige",
  model_name: "EcoGrind 500",
  fault_description: "motor sparking and loud noise",
  assigned_technician: "Kumar",
  spare_replaced: "armature winding, carbon brush",
  service_cost: "850",
  amount_paid: "850",
  payment_method: "UPI"
}

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('templates') // 'templates' | 'logs'
  const [templates, setTemplates] = useState({
    intake_sms: '',
    intake_email: '',
    ready_sms: '',
    ready_email: '',
    closed_sms: '',
    closed_email: '',
  })
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('ready_sms')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  
  // Log viewer modal state
  const [selectedLog, setSelectedLog] = useState(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const t = await getNotificationTemplates()
        setTemplates(t)
        
        const l = await getGlobalNotificationLogs()
        setLogs(l)
      } catch (err) {
        console.error('Failed to load notification settings:', err)
        setMessage({ type: 'error', text: 'Error loading settings from database' })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [activeTab])

  const handleSaveTemplates = async () => {
    setSaving(true)
    setMessage(null)
    const res = await saveNotificationTemplates(templates)
    if (res.success) {
      setMessage({ type: 'success', text: 'Notification templates successfully saved!' })
    } else {
      setMessage({ type: 'error', text: `Failed to save: ${res.error}` })
    }
    setSaving(false)
    setTimeout(() => setMessage(null), 5000)
  }

  const handleTemplateChange = (e) => {
    const { value } = e.target
    setTemplates(prev => ({
      ...prev,
      [selectedTemplateKey]: value
    }))
  }

  // Helper to substitute variables for live preview
  const interpolateTemplate = (templateStr) => {
    if (!templateStr) return ''
    let result = templateStr
    Object.entries(MOCK_PREVIEW_DATA).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      result = result.replace(regex, value)
    })
    return result
  }

  const getTemplateLabel = (key) => {
    switch (key) {
      case 'intake_sms': return 'Check-In Confirmation (SMS)'
      case 'intake_email': return 'Check-In Confirmation (Email)'
      case 'ready_sms': return 'Repair Ready Alert (SMS)'
      case 'ready_email': return 'Repair Ready Alert (Email)'
      case 'closed_sms': return 'Checkout Receipt Alert (SMS)'
      case 'closed_email': return 'Checkout Receipt Alert (Email)'
      default: return key
    }
  }

  const getAvailableTags = (key) => {
    const common = ['customer_name', 'job_id', 'brand', 'model_name']
    if (key.startsWith('intake')) {
      return [...common, 'fault_description', 'assigned_technician']
    }
    if (key.startsWith('ready')) {
      return [...common, 'spare_replaced', 'service_cost']
    }
    if (key.startsWith('closed')) {
      return [...common, 'amount_paid', 'payment_method']
    }
    return common
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const isEmail = selectedTemplateKey.endsWith('email')

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Notification Center</h1>
            <p className="text-slate-500 mt-1">Configure customer notification templates and review sent communication logs</p>
          </div>

          {/* Tab buttons */}
          <div className="flex bg-slate-200/80 p-1.5 rounded-xl border border-slate-350 self-start sm:self-center">
            <button 
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'templates' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Templates Editor
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'logs' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Dispatch History
              {logs.length > 0 && (
                <span className="ml-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                  {logs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {message && (
          <div className={`p-4 rounded-xl border text-sm font-medium flex items-center gap-2 animate-fade-in ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-teal-600/30 border-t-teal-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm">Loading notification center database...</p>
          </div>
        ) : activeTab === 'templates' ? (
          
          /* TEMPLATE EDITOR VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Template Selection & Instructions */}
            <div className="space-y-4 lg:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Template</h3>
                <div className="space-y-2">
                  {Object.keys(templates).map((key) => {
                    const active = selectedTemplateKey === key
                    const isSmsType = key.endsWith('sms')
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedTemplateKey(key)}
                        className={`w-full text-left p-3.5 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                          active 
                            ? 'border-teal-500 bg-teal-50/50 shadow-sm font-semibold text-teal-800' 
                            : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-xs">{getTemplateLabel(key)}</span>
                        {isSmsType ? (
                          <MessageSquare className={`w-4 h-4 shrink-0 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                        ) : (
                          <Mail className={`w-4 h-4 shrink-0 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dynamic tag guide */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-teal-600" />
                  Dynamic Tags
                </h3>
                <p className="text-xs text-slate-500">Insert these tags in your message template. They will be replaced automatically with real job values before dispatch.</p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {getAvailableTags(selectedTemplateKey).map(tag => (
                    <div 
                      key={tag} 
                      onClick={() => {
                        // Insert tag at cursor position or append to textarea
                        setTemplates(prev => ({
                          ...prev,
                          [selectedTemplateKey]: (prev[selectedTemplateKey] || '') + ` {${tag}}`
                        }))
                      }}
                      className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 rounded text-[10px] font-mono font-bold text-slate-700 text-center cursor-pointer transition-colors"
                      title="Click to insert tag"
                    >
                      {`{${tag}}`}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Editor Workspace & Real-time Previews */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Textarea Editor Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-base">
                    Editing: {getTemplateLabel(selectedTemplateKey)}
                  </h3>
                  <button
                    onClick={handleSaveTemplates}
                    disabled={saving}
                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Saving...' : 'Save Templates'}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Template Content</label>
                  <textarea
                    value={templates[selectedTemplateKey] || ''}
                    onChange={handleTemplateChange}
                    placeholder="Write your template message here..."
                    rows={isEmail ? "10" : "4"}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-sans text-sm shadow-inner bg-slate-50/30"
                  />
                </div>
              </div>

              {/* Dynamic Live Device Previews */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Live Dispatch Mock Preview (Ravi Kumar)
                </span>
                
                {isEmail ? (
                  /* MOCK EMAIL ENVELOPE PREVIEW */
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in font-sans">
                    <div className="bg-slate-900 px-5 py-3.5 text-white flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                      <span className="text-xs text-slate-400 font-mono ml-4">Mock Email Client Preview</span>
                    </div>
                    <div className="bg-slate-100 p-4 border-b border-slate-200 space-y-1.5 text-xs text-slate-600">
                      <div><span className="font-semibold text-slate-400">From:</span> service@processnexus.co</div>
                      <div><span className="font-semibold text-slate-400">To:</span> ravi.kumar@gmail.com</div>
                      <div><span className="font-semibold text-slate-400">Subject:</span> Service Alert: Job {MOCK_PREVIEW_DATA.job_id}</div>
                    </div>
                    <div className="p-6 whitespace-pre-wrap text-sm text-slate-800 min-h-[180px] leading-relaxed bg-white">
                      {interpolateTemplate(templates[selectedTemplateKey]) || (
                        <span className="text-slate-400 italic">No template text written. Type in the editor workspace above.</span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* MOCK IPHONE PHONE SMS PREVIEW */
                  <div className="max-w-md bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in font-sans">
                    <div className="bg-slate-900 px-5 py-3 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                        <span className="text-xs font-semibold text-slate-300">Customer Mobile</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Mock SMS Gateway</span>
                    </div>
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Today
                    </div>
                    <div className="p-4 bg-slate-50 min-h-[120px] flex items-end">
                      <div className="bg-teal-500 text-white rounded-2xl rounded-br-none px-4 py-2.5 text-xs max-w-[85%] ml-auto shadow-sm leading-relaxed whitespace-pre-wrap">
                        {interpolateTemplate(templates[selectedTemplateKey]) || (
                          <span className="text-teal-100 italic">No template text written.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : (
          
          /* GLOBAL DISPATCH LOGS VIEW */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Communication Dispatch History</h3>
              <p className="text-xs text-slate-500 mt-1">Audit log of all SMS/Email alerts sent to customers from this terminal</p>
            </div>

            {logs.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700">No Notifications Sent Yet</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">Notifications triggered during Check-in, Updates, or Checkout will log here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-55 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Job ID</th>
                      <th className="p-4">Channel</th>
                      <th className="p-4">Milestone</th>
                      <th className="p-4">Message Preview</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{log.customer_name}</div>
                          <div className="text-xs text-slate-500 font-mono">{log.contact_number}</div>
                        </td>
                        <td className="p-4 font-mono font-bold text-teal-700">
                          {log.job_id}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            log.channel === 'SMS' ? 'bg-blue-50 text-blue-700 border border-blue-150' : 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                          }`}>
                            {log.channel === 'SMS' ? <MessageSquare className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                            {log.channel}
                          </span>
                        </td>
                        <td className="p-4 font-medium">
                          {log.type}
                        </td>
                        <td className="p-4 text-slate-500 text-xs max-w-[200px] truncate" title={log.message}>
                          {log.message}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-2 py-1 rounded transition-colors text-xs font-semibold cursor-pointer"
                          >
                            <Eye className="w-4 h-4 inline" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* LOG VIEWER MODAL */}
        {selectedLog && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-300" />
                  <span className="font-bold text-sm">Dispatched Message Audit</span>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-full hover:bg-white/10 text-slate-350 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-4 text-sm">
                
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 border border-slate-150 rounded-xl text-xs text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Recipient</span>
                    <span className="font-bold text-slate-800 block mt-0.5">{selectedLog.customer_name}</span>
                    <span className="font-mono mt-0.5 block">{selectedLog.contact_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Job ID</span>
                    <span className="font-mono font-bold text-teal-600 block mt-0.5">{selectedLog.job_id}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Sent: {formatDate(selectedLog.timestamp)}</span>
                  </div>
                </div>

                {/* Message Box */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    {selectedLog.channel === 'SMS' ? <MessageSquare className="w-4 h-4 text-blue-500" /> : <Mail className="w-4 h-4 text-indigo-500" />}
                    Message Content ({selectedLog.channel})
                  </span>
                  
                  {selectedLog.channel === 'SMS' ? (
                    <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-xs font-sans whitespace-pre-wrap leading-relaxed">
                      {selectedLog.message}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs font-sans whitespace-pre-wrap leading-relaxed min-h-[140px]">
                      {selectedLog.message}
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
