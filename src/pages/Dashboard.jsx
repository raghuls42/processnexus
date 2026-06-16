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
  Cpu
} from 'lucide-react'

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

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
    
    // Convert to sorted array
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
          </>
        )}

      </div>
    </div>
  )
}