import { useState, useEffect } from 'react'
import { getAllJobs } from '../firebase/services'
import { 
  IndianRupee, 
  TrendingUp, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle,
  User,
  ArrowUpRight,
  Cpu,
  Brain,
  Activity,
  Sliders
} from 'lucide-react'
import { ServiceTimePredictor } from '../utils/mlModel'
import { APPLIANCE_TYPES } from '../constants'

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [predictor, setPredictor] = useState(null)
  
  const [sandboxData, setSandboxData] = useState({
    category: 'Mixer',
    fault: 'motor sparking and burnt smell',
    spares: 'motor winding, carbon brush replacement'
  })

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const allJobs = await getAllJobs()
        setJobs(allJobs)
      } catch (error) {
        console.error('Failed to load dashboard statistics:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    async function initPredictor() {
      try {
        const ml = new ServiceTimePredictor()
        ml.train(jobs)
        setPredictor(ml)
      } catch (err) {
        console.error('Error training predictor on Dashboard load:', err)
      }
    }
    if (jobs.length > 0) {
      initPredictor()
    }
  }, [jobs])

  // Aggregation Calculations
  const activeJobs = jobs.filter(j => j.status === 'Received' || j.status === 'In Service')
  const notifiedJobs = jobs.filter(j => j.status === 'Notified' || j.status === 'Ready')
  const completedJobs = jobs.filter(j => j.status === 'Completed')
  
  const totalEarnings = completedJobs.reduce((sum, j) => sum + (parseFloat(j.amount_paid) || 0), 0)

  // Technician Workloads (Active jobs assigned to technicians)
  const getTechWorkloads = () => {
    const workloads = {}
    jobs.forEach(j => {
      if (j.status !== 'Completed' && j.assigned_technician) {
        workloads[j.assigned_technician] = (workloads[j.assigned_technician] || 0) + 1
      }
    })
    
    return Object.entries(workloads)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }

  // Category Distribution
  const getCategoryStats = () => {
    const stats = {}
    jobs.forEach(j => {
      if (j.product_category) {
        stats[j.product_category] = (stats[j.product_category] || 0) + 1
      }
    })
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Show top 5
  }

  // Recent jobs (max 5)
  const recentJobs = [...jobs]
    .sort((a, b) => {
      const dateA = a.checkin_date?.toDate ? a.checkin_date.toDate() : new Date(a.checkin_date || 0)
      const dateB = b.checkin_date?.toDate ? b.checkin_date.toDate() : new Date(b.checkin_date || 0)
      return dateB - dateA
    })
    .slice(0, 5)

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const diffMs = new Date() - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const techWorkloads = getTechWorkloads()
  const categoryStats = getCategoryStats()

  // Maximum active jobs for progress bar scale
  const maxTechLoad = techWorkloads.length > 0 ? Math.max(...techWorkloads.map(t => t.count)) : 1

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Live Operations</h1>
          <p className="text-slate-500 mt-1">Real-time status overview of repairs, technician loads, and revenue logs</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-teal-600/30 border-t-teal-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm">Aggregating live operation metrics...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Active Queue */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03] text-blue-900 group-hover:scale-110 transition-transform duration-300">
                  <Wrench className="w-24 h-24" />
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block tracking-wider">Active Queue</span>
                  <span className="text-2xl font-bold text-slate-800 block mt-1">{activeJobs.length}</span>
                  <span className="text-xs text-blue-600 mt-1 block font-medium">In Diagnostics / Repair</span>
                </div>
              </div>

              {/* Card 2: Awaiting Pickup */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03] text-indigo-900 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-24 h-24" />
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block tracking-wider">Awaiting Pickup</span>
                  <span className="text-2xl font-bold text-slate-800 block mt-1">{notifiedJobs.length}</span>
                  <span className="text-xs text-indigo-600 mt-1 block font-medium">Customers Notified</span>
                </div>
              </div>

              {/* Card 3: Closed Jobs */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03] text-green-900 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="w-24 h-24" />
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block tracking-wider">Closed Jobs</span>
                  <span className="text-2xl font-bold text-slate-800 block mt-1">{completedJobs.length}</span>
                  <span className="text-xs text-green-600 mt-1 block font-medium">Checked Out / Completed</span>
                </div>
              </div>

              {/* Card 4: Total Revenue */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03] text-teal-900 group-hover:scale-110 transition-transform duration-300">
                  <IndianRupee className="w-24 h-24" />
                </div>
                <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block tracking-wider">Total Revenue</span>
                  <span className="text-2xl font-bold text-slate-800 block mt-1">₹{totalEarnings.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-teal-600 mt-1 block font-medium flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Fully Audited Payments
                  </span>
                </div>
              </div>

            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Recent Registrations & Activities */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Recent Intake</h2>
                    <p className="text-xs text-slate-500">Latest appliances checked-in for service</p>
                  </div>
                  <a href="/history" className="text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-0.5">
                    View All <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                {recentJobs.length === 0 ? (
                  <p className="text-slate-400 text-sm py-6 text-center">No service jobs registered yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentJobs.map((job) => (
                      <div key={job.id} className="py-3.5 flex items-center justify-between group first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-800">{job.job_id}</span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">{formatTimeAgo(job.checkin_date)}</span>
                            </div>
                            <h4 className="font-medium text-slate-700 text-sm mt-0.5">
                              {job.brand} {job.model_name || ''}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" /> {job.customer_name} ({job.product_category})
                            </p>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          job.status === 'Completed' ? 'bg-green-50 text-green-700' :
                          job.status === 'Notified' ? 'bg-indigo-50 text-indigo-700' :
                          job.status === 'In Service' ? 'bg-amber-50 text-amber-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Workload & Analytics */}
              <div className="space-y-6">
                
                {/* Technician Workload */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Technician Load</h2>
                    <p className="text-xs text-slate-500 font-medium">Active jobs currently allocated</p>
                  </div>
                  
                  {techWorkloads.length === 0 ? (
                    <p className="text-slate-400 text-sm py-4 text-center">No active repair tasks assigned.</p>
                  ) : (
                    <div className="space-y-4">
                      {techWorkloads.map(({ name, count }) => {
                        const percent = Math.min((count / maxTechLoad) * 100, 100)
                        return (
                          <div key={name} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-700">{name}</span>
                              <span className="font-bold text-slate-800">{count} {count === 1 ? 'job' : 'jobs'}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-teal-500 rounded-full transition-all duration-500" 
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Popular Appliance Categories */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Appliance Intake</h2>
                    <p className="text-xs text-slate-500 font-medium">Top appliance categories registered</p>
                  </div>

                  {categoryStats.length === 0 ? (
                    <p className="text-slate-400 text-sm py-4 text-center">No category data collected.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {categoryStats.map(({ name, count }) => (
                        <div key={name} className="flex justify-between items-center text-sm py-1 border-b border-slate-50 last:border-0">
                          <span className="text-slate-600 font-medium">{name}</span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md text-xs font-bold text-slate-700">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* AI Service Time Predictor ML Dashboard */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    AI Service Time Predictor
                    <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Machine Learning
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">Live regressions trained on historical repairs, helping optimize workflows</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Model Stats & Category Averages */}
                <div className="space-y-4 lg:col-span-1 border-r border-slate-100 pr-0 lg:pr-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-teal-600" />
                    Model Statistics
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Training Status</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        predictor?.isTrained ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {predictor?.isTrained ? 'Trained ML Mode' : 'Heuristic Mode'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Historical Samples</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">
                        {predictor?.trainingSize || 0} job(s)
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        Mean Absolute Error
                        <span className="text-[10px] text-slate-400 cursor-help" title="Average difference between predicted and actual repair times">❓</span>
                      </span>
                      <span className="text-sm font-bold text-slate-800 font-mono">
                        {predictor?.meanAbsoluteError !== null && predictor?.meanAbsoluteError !== undefined
                          ? `${predictor.meanAbsoluteError.toFixed(1)} hrs`
                          : '—'
                        }
                      </span>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Learned Base Hours list */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Estimated Repair Durations
                    </span>
                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                      {predictor && Object.entries(predictor.baseHours).map(([cat, hours]) => (
                        <div key={cat} className="flex justify-between items-center text-xs pt-1.5 first:pt-0">
                          <span className="text-slate-600 font-medium">{cat}</span>
                          <span className="font-bold text-slate-800">{hours.toFixed(1)} hrs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Sandbox Form & Live Predictor Output */}
                <div className="lg:col-span-2 space-y-5">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-teal-600" />
                    Interactive Sandbox Calculator
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      {/* Appliance Select */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Appliance Category</label>
                        <select
                          value={sandboxData.category}
                          onChange={(e) => setSandboxData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        >
                          {APPLIANCE_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Fault input */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Reported Fault</label>
                        <textarea
                          value={sandboxData.fault}
                          onChange={(e) => setSandboxData(prev => ({ ...prev, fault: e.target.value }))}
                          placeholder="e.g. power switch not working, sparks inside motor"
                          rows="2"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-sans"
                        />
                      </div>

                      {/* Spares input */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Spare Parts Required</label>
                        <textarea
                          value={sandboxData.spares}
                          onChange={(e) => setSandboxData(prev => ({ ...prev, spares: e.target.value }))}
                          placeholder="e.g. switch replacement, carbon brush replacement"
                          rows="2"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-sans"
                        />
                      </div>
                    </div>

                    {/* Result Output Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white flex flex-col justify-between shadow-sm relative overflow-hidden">
                      {/* background pattern */}
                      <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-[0.05] text-white pointer-events-none">
                        <Brain className="w-40 h-40" />
                      </div>

                      <div className="space-y-1 z-10">
                        <span className="text-[9px] text-teal-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                          <Sparkles className="w-3 h-3 animate-pulse" />
                          AI Output Estimate
                        </span>
                        <h4 className="text-2xl font-black tracking-tight text-white mt-2 font-sans">
                          {predictor ? predictor.predict(sandboxData.category, sandboxData.fault, sandboxData.spares) : 'Calculating...'}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Predicted duration based on statistical keyword correlations and category history.
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/10 mt-4 z-10 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Regression Math</span>
                        <span className="text-teal-300 font-semibold">Ready</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}