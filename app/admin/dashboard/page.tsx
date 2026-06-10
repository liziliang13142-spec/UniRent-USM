"use client"

import { supabase } from "@/lib/supabase"
import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/app/contexts/AuthContext"
import { 
  Home, Building2, Users, CalendarCheck, 
  LogOut, Trash2, Search, Activity, 
  FileText, ChevronDown, RefreshCw, AlertCircle, Eye, User, Briefcase,
  ArrowUpDown, ArrowUp, ArrowDown, DollarSign, MousePointerClick,
  Ban, AlertTriangle, CheckCircle 
} from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { toast } = useToast()

  // =========================================================
  // 状态管理 (State Management)
  // =========================================================
  const [activeMenu, setActiveMenu] = useState("dashboard")
  const [subTab, setSubTab] = useState("Tenant") 
  
  const [properties, setProperties] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [viewings, setViewings] = useState<any[]>([]) 
  const [profiles, setProfiles] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [priceSortOrder, setPriceSortOrder] = useState<'asc' | 'desc' | null>(null)

  // =========================================================
  // 1. 安全权限检查
  // =========================================================
  useEffect(() => {
    if (user && user.role.toLowerCase() !== 'admin') {
      router.push('/login')
    }
  }, [user, router])

  // =========================================================
  // 2. 数据获取逻辑 (上帝视角)
  // =========================================================
  const fetchAdminData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const { data: propsData, error: propsError } = await supabase.from('properties').select('*')
      const { data: bookingsData, error: bookingsError } = await supabase.from('bookings').select('*')
      const { data: viewingsData, error: viewingsError } = await supabase.from('viewing_requests').select('*')
      const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*')

      if (propsError) console.error("Properties Error:", propsError.message)
      if (bookingsError) console.error("Bookings Error:", bookingsError.message)
      if (viewingsError) console.error("Viewings Error:", viewingsError.message)
      if (profilesError) console.error("Profiles Error:", profilesError.message)

      setProperties(propsData || [])
      setBookings(bookingsData || [])
      setViewings(viewingsData || [])
      setProfiles(profilesData || [])

    } catch (error: any) {
      toast({ title: "Data Sync Failed", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    if (user) fetchAdminData()
  }, [user, fetchAdminData])

  // =========================================================
  // 3. 辅助函数 & 衍生数据 & KPI 计算
  // =========================================================
  const getPropertyName = (id: any) => {
    const prop = properties.find(p => p.id === id || p.id === Number(id))
    return prop ? prop.name : "Property #" + id
  }

  const handleLogout = async () => {
    if (logout) await logout()
    router.push('/login')
  }

  const filteredUsers = profiles.filter(p => p.role?.toLowerCase() === subTab.toLowerCase())

  const sortedProperties = useMemo(() => {
    if (!priceSortOrder) return properties; 
    return [...properties].sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      if (priceSortOrder === 'asc') return priceA - priceB; 
      else return priceB - priceA; 
    });
  }, [properties, priceSortOrder]);

  const togglePriceSort = () => {
    if (priceSortOrder === null) setPriceSortOrder('desc'); 
    else if (priceSortOrder === 'desc') setPriceSortOrder('asc'); 
    else setPriceSortOrder(null); 
  }

  const forceDeleteProperty = async (id: number, name: string) => {
    if (!window.confirm(`CRITICAL: Permanently delete "${name}"?`)) return
    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Removed", description: "Listing has been deleted." })
      setProperties(prev => prev.filter(p => p.id !== id))
    }
  }

  const handleWarnUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Issue an official system warning to ${userEmail}?`)) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          { 
            user_id: userId, 
            message: "⚠️ System Warning: Your recent activities have been flagged by the Admin. Please adhere to the platform's guidelines to avoid account suspension." 
          }
        ]).select();

      if (error) {
        alert(`Supabase Error: ${error.message}\nCode: ${error.code}`);
        return;
      }

      alert(`Success! Notification inserted into Database for ${userEmail}.`);
      fetchAdminData(); 
    } catch (err: any) {
      alert(`Frontend JavaScript Error: ${err.message}`);
    }
  }

  const handleToggleSuspend = async (userId: string, currentStatus: string, userEmail: string) => {
    const isSuspended = currentStatus === 'suspended';
    const newStatus = isSuspended ? 'active' : 'suspended';
    const actionText = isSuspended ? 'reactivate' : 'suspend';

    if (!window.confirm(`Are you sure you want to ${actionText} the account for ${userEmail}?`)) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId)
        .select();

      if (error) {
        alert(`Supabase Suspend Error:\n${error.message}\nCode: ${error.code}`);
        return;
      }

      // 🌟 核心改进：通过数据受影响长度，精准捕捉“静默拦截”
      if (!data || data.length === 0) {
        alert(`❌ BLOCK FAILURE: \nDatabase accepted the query but altered 0 rows.\nThis means Supabase RLS policies are still blocking updates on 'profiles' table! Please disable RLS in SQL Editor.`);
        return;
      }

      alert(`Successfully changed ${userEmail} status to: ${newStatus}`);

      // 同步更新本地状态，立马看到页面变化
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, status: newStatus } : p));
    } catch (error: any) {
      alert(`Frontend Runtime Exception:\n${error.message}`);
    }
  }

  const kpiData = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
    const globalViews = properties.reduce((sum, p) => sum + (Number(p.views) || 0), 0);
    const totalLandlords = profiles.filter(p => p.role?.toLowerCase() === 'landlord').length;

    return { totalRevenue, globalViews, totalLandlords };
  }, [bookings, properties, profiles]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-blue-600 font-sans font-bold">
      <RefreshCw className="w-10 h-10 animate-spin mb-4" />
      <p className="tracking-widest uppercase opacity-50 text-xs">Synchronizing Nexus Core...</p>
    </div>
  )

  // =========================================================
  // UI 渲染：各个模块渲染
  // =========================================================
  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <div className="space-y-8 animate-in fade-in duration-700">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight text-left">Global Analytics</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={<DollarSign className="w-7 h-7"/>} label="Total Revenue (RM)" value={`RM ${kpiData.totalRevenue.toLocaleString()}`} color="text-amber-500" />
              <StatCard icon={<Building2 className="w-7 h-7"/>} label="Total Listings" value={properties.length} color="text-blue-600" />
              <StatCard icon={<FileText className="w-7 h-7"/>} label="Total Bookings" value={bookings.length} color="text-emerald-600" />
              <StatCard icon={<Eye className="w-7 h-7"/>} label="Global Page Views" value={kpiData.globalViews.toLocaleString()} color="text-purple-500" />
              
              <StatCard icon={<CalendarCheck className="w-7 h-7"/>} label="Viewing Requests" value={viewings.length} color="text-pink-500" />
              <StatCard icon={<Briefcase className="w-7 h-7"/>} label="Active Landlords" value={kpiData.totalLandlords} color="text-indigo-500" />
              <StatCard icon={<Users className="w-7 h-7"/>} label="Registered Users" value={profiles.length} color="text-orange-500" />
              <StatCard icon={<Activity className="w-7 h-7"/>} label="Server Status" value="ONLINE" color="text-teal-500" />
            </div>
          </div>
        )

      case "properties":
        return (
          <div className="space-y-6 animate-in fade-in duration-500 text-left">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Property Management</h2>
              <Button onClick={fetchAdminData} disabled={isRefreshing} variant="outline" className="rounded-xl">
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-black uppercase tracking-widest select-none">
                  <tr>
                    <th className="px-8 py-5">Property Info</th>
                    <th 
                      className="px-8 py-5 cursor-pointer hover:bg-slate-100 transition-colors group"
                      onClick={togglePriceSort}
                    >
                      <div className="flex items-center gap-1.5 w-fit">
                        Monthly Price
                        <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
                          {priceSortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : 
                           priceSortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-blue-600" /> : 
                           <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />}
                        </span>
                      </div>
                    </th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sortedProperties.map((prop) => (
                    <tr key={prop.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5 flex items-center gap-4">
                        <img src={prop.image || "/placeholder.svg"} className="w-14 h-14 rounded-xl object-cover border" alt={prop.name} />
                        <span className="font-bold text-slate-800 text-sm">{prop.name}</span>
                      </td>
                      <td className="px-8 py-5 font-black text-blue-600 uppercase">RM {prop.price}</td>
                      <td className="px-8 py-5 text-right">
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => forceDeleteProperty(prop.id, prop.name)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case "users": 
        return (
          <div className="space-y-6 animate-in fade-in duration-500 text-left">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Member Registry</h2>
              <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
                <button onClick={() => setSubTab("Tenant")} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${subTab === "Tenant" ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>TENANTS</button>
                <button onClick={() => setSubTab("Landlord")} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${subTab === "Landlord" ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>LANDLORDS</button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Register Email</th>
                    <th className="px-8 py-5">Username</th>
                    <th className="px-8 py-5">Join Date</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={4} className="py-20 text-center text-slate-300 italic">No {subTab.toLowerCase()} records found.</td></tr>
                  ) : filteredUsers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      
                      <td className="px-8 py-5 flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                           <span className={`font-bold ${p.status === 'suspended' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                             {p.email}
                           </span>
                           {p.status === 'suspended' && (
                             <span className="bg-red-100 text-red-600 border border-red-200 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                               Suspended
                             </span>
                           )}
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono tracking-tighter">UID: {p.id.substring(0,8)}</span>
                      </td>
                      
                      <td className="px-8 py-5 text-sm font-medium text-slate-600">{p.username || 'N/A'}</td>
                      
                      <td className="px-8 py-5 text-sm text-slate-500">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 font-bold text-xs rounded-lg transition-all"
                            onClick={() => handleWarnUser(p.id, p.email)}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Warn
                          </Button>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`h-8 font-bold text-xs rounded-lg transition-all ${
                              p.status === 'suspended' 
                                ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700' 
                                : 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
                            }`}
                            onClick={() => handleToggleSuspend(p.id, p.status, p.email)}
                          >
                            {p.status === 'suspended' ? (
                              <><CheckCircle className="w-3.5 h-3.5 mr-1" /> Unban</>
                            ) : (
                              <><Ban className="w-3.5 h-3.5 mr-1" /> Suspend</>
                            )}
                          </Button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case "viewings":
        return (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 text-left">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Viewing Appointments</h2>
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Property</th>
                    <th className="px-8 py-5">Student</th>
                    <th className="px-8 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {viewings.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-800">{getPropertyName(v.property_id)}</td>
                      <td className="px-8 py-5 text-slate-500 italic">{v.student_name || 'Guest'}</td>
                      <td className="px-8 py-5 text-right uppercase">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black ${
                          v.status?.toLowerCase() === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                          v.status?.toLowerCase() === 'approved' ? 'bg-green-50 text-green-600 border border-green-200' :
                          'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case "transactions":
        return (
          <div className="space-y-6 animate-in fade-in duration-500 text-left">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Transaction Ledger</h2>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Order ID</th>
                    <th className="px-8 py-5">Property</th>
                    <th className="px-8 py-5">Stay Period</th>
                    <th className="px-8 py-5">Booking Date</th>
                    <th className="px-8 py-5 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-8 py-5 text-xs font-mono text-slate-500">#ORD-{String(b.id).padStart(5, '0')}</td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-800">{getPropertyName(b.property_id)}</td>
                      
                      <td className="px-8 py-5">
                        <span className="text-xs font-bold text-slate-700">{b.start_date || 'N/A'}</span>
                        <span className="text-[10px] text-slate-400 mx-2 italic">to</span>
                        <span className="text-xs font-bold text-slate-700">{b.end_date || 'N/A'}</span>
                      </td>

                      <td className="px-8 py-5 text-xs font-medium text-slate-500">
                        {b.created_at ? new Date(b.created_at).toLocaleString('en-US', {
                           year: 'numeric',
                           month: 'short',
                           day: 'numeric',
                           hour: '2-digit',
                           minute: '2-digit',
                           hour12: true
                        }) : 'N/A'}
                      </td>

                      <td className="px-8 py-5 text-right font-black text-emerald-600 uppercase">RM {b.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex font-sans z-[100] relative">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-2xl z-20">
        <div className="h-24 flex items-center px-10 border-b border-slate-50">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl mr-4 shadow-lg shadow-blue-200">U</div>
          <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase">UniNexus <span className="block text-[8px] text-blue-600 uppercase tracking-widest">Root Console</span></span>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <MenuButton active={activeMenu === "dashboard"} onClick={() => setActiveMenu("dashboard")} icon={<Home className="w-5 h-5"/>} label="Core Overview" />
          <div className="pt-8 pb-4 text-left">
            <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 opacity-50">Operations</p>
            <MenuButton active={activeMenu === "properties"} onClick={() => setActiveMenu("properties")} icon={<Building2 className="w-5 h-5"/>} label="Listing Control" />
            <MenuButton active={activeMenu === "viewings"} onClick={() => setActiveMenu("viewings")} icon={<Eye className="w-5 h-5"/>} label="Viewing Requests" />
            <MenuButton active={activeMenu === "transactions"} onClick={() => setActiveMenu("transactions")} icon={<CalendarCheck className="w-5 h-5"/>} label="Booking History" />
          </div>
          <div className="pt-4 text-left">
            <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 opacity-50">Master Config</p>
            <MenuButton active={activeMenu === "users"} onClick={() => setActiveMenu("users")} icon={<Users className="w-5 h-5"/>} label="Member Registry" />
          </div>
        </nav>
        <div className="p-6 border-t border-slate-50">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-black text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><LogOut className="w-5 h-5" /> Sign Out</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 flex justify-between items-center px-12 sticky top-0 z-10">
          <div className="flex flex-col text-left"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-50">Secure Environment</span><span className="text-sm font-black text-blue-600 uppercase tracking-tighter">{activeMenu} Portal</span></div>
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-inner">
             <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-xl">AD</div>
             <div className="flex flex-col items-start leading-none"><span className="text-xs font-black text-slate-800 uppercase">Super Root</span><span className="text-[8px] font-bold text-emerald-500 uppercase mt-1 tracking-widest">Authorized</span></div>
             <ChevronDown className="w-4 h-4 text-slate-300 ml-2" />
          </div>
        </header>
        <main className="p-12 overflow-y-auto bg-slate-50/50">{renderContent()}</main>
      </div>
    </div>
  )
}

function MenuButton({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all transform active:scale-95 ${active ? 'bg-blue-600 text-white shadow-2xl shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}>
      {icon}{label}
    </button>
  )
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <Card className="border-none shadow-xl bg-white hover:scale-105 transition-transform">
      <CardContent className="p-8 flex items-center gap-6">
        <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center ${color} shadow-inner`}>{icon}</div>
        <div className="text-left"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">{label}</p><p className="text-2xl font-black text-slate-900 leading-none">{value}</p></div>
      </CardContent>
    </Card>
  )
}