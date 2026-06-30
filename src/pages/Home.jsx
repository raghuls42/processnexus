import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllJobs } from '../firebase/services'
import { 
  ArrowRight, 
  PlusCircle, 
  Wrench, 
  CreditCard, 
  History, 
  BarChart3, 
  Sparkles, 
  Box, 
  Bell, 
  Activity,
  Layers,
  CheckCircle2
} from 'lucide-react'

export default function Home() {
  const [stats, setStats] = useState({
    active: 0,
    ready: 0,
    completed: 0,
    bundles: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const jobs = await getAllJobs()
        const active = jobs.filter(j => j.status === 'Received' || j.status === 'In Service').length
        const ready = jobs.filter(j => j.status === 'Notified' || j.status === 'Ready').length
        const completed = jobs.filter(j => j.status === 'Completed').length
        
        // Count unique bundle IDs
        const bundleIds = new Set()
        jobs.forEach(j => {
          if (j.bundle_id) {
            bundleIds.add(j.bundle_id)
          }
        })
        
        setStats({
          active,
          ready,
          completed,
          bundles: bundleIds.size
        })
      } catch (err) {
        console.error('Failed to load stats on home page:', err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans pb-12">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white py-16 px-6 border-b border-slate-800 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl translate-y-12 -translate-x-12 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold border border-teal-500/20 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Service Workflow Engine Active
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Transform Your Appliance <br />
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              Repair & Service Operations
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed">
            ProcessNexus orchestrates appliance check-ins, real-time ML-powered repair duration forecasting, automated bundle services, and customer intimations in one seamless workspace.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 w-full -mt-8 relative z-20 space-y-8">
        {/* Live Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:shadow-md transition-all duration-300">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Queue</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-800">
                {loading ? '...' : stats.active}
              </span>
              <span className="text-xs text-indigo-500 font-semibold flex items-center gap-0.5">
                <Activity className="w-3 h-3 animate-pulse" /> Live
              </span>
            </div>
            <span className="text-xs text-slate-400 block">In service or received</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:shadow-md transition-all duration-300">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ready for Pick Up</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-800">
                {loading ? '...' : stats.ready}
              </span>
              <span className="text-xs text-teal-600 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            </div>
            <span className="text-xs text-slate-400 block">Customer notified</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:shadow-md transition-all duration-300">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completed Service</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-800">
                {loading ? '...' : stats.completed}
              </span>
              <span className="text-xs text-slate-400 font-semibold">Archived</span>
            </div>
            <span className="text-xs text-slate-400 block">Collected & paid</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:shadow-md transition-all duration-300">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Service Bundles</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-800">
                {loading ? '...' : stats.bundles}
              </span>
              <span className="text-xs text-indigo-500 font-semibold flex items-center gap-0.5">
                <Layers className="w-3 h-3" /> Multi-Appliance
              </span>
            </div>
            <span className="text-xs text-slate-400 block">Unique bundles checked in</span>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Launch Workflow Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Check In Action Card */}
            <Link to="/checkin" className="group text-left bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-1">
                  Check In Appliance
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Register single or multiple appliances under a single bundle. Configure customer details, assigned technicians, and warranty status.
                </p>
              </div>
              <span className="text-teal-600 font-bold text-xs flex items-center gap-1 mt-auto">
                Intake Workspace <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* Update Action Card */}
            <Link to="/update" className="group text-left bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-1">
                  Update Service status
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Log spares used, enter service costs, adjust operation stages, and instantly dispatch SMS/Email alerts to the customer.
                </p>
              </div>
              <span className="text-indigo-600 font-bold text-xs flex items-center gap-1 mt-auto">
                Update Workspace <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* Check Out Action Card */}
            <Link to="/checkout" className="group text-left bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-1">
                  Check Out & Bill
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Search active jobs by phone, review service costs, auto-apply 15% bundle discounts, process payment, and dispatch receipts.
                </p>
              </div>
              <span className="text-emerald-600 font-bold text-xs flex items-center gap-1 mt-auto">
                Checkout Portal <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>

        {/* Feature Superpowers Row */}
        <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-800 text-white grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden shadow-inner">
          <div className="space-y-2">
            <span className="text-teal-400 text-xs font-bold uppercase tracking-wider block">Superpower #1</span>
            <h4 className="font-bold text-sm flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-teal-400" /> AI Forecast Engine</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ProcessNexus automatically trains a regression model on past repairs to predict repair duration for incoming jobs instantly during intake.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider block">Superpower #2</span>
            <h4 className="font-bold text-sm flex items-center gap-1.5"><Box className="w-4 h-4 text-indigo-400" /> Bundle Discount</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Registering more than one product automatically triggers a bundle workflow, providing custom invoicing and a 15% checkout discount incentive.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider block">Superpower #3</span>
            <h4 className="font-bold text-sm flex items-center gap-1.5"><Bell className="w-4 h-4 text-emerald-400" /> Zero-Cost Alerts</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Generate notifications at intake, update, and checkout, allowing staff to dispatch WhatsApp and Email notifications to customers for free.
            </p>
          </div>
        </div>

        {/* Extra Navigation Shortcuts */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-slate-200 text-xs">
          <Link to="/dashboard" className="text-slate-500 hover:text-teal-600 font-semibold flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Operations Dashboard
          </Link>
          <span className="text-slate-300">•</span>
          <Link to="/history" className="text-slate-500 hover:text-teal-600 font-semibold flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Search Service History
          </Link>
        </div>
      </div>
    </div>
  )
}
