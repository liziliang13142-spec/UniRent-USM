"use client"

import Link from "next/link"
import React, { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useProperty } from "../../contexts/PropertyContext"
import { useAuth } from "../../contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Building2, Plus, Edit, Trash2, MapPin, 
  BedDouble, Bath, Maximize, BarChart3, 
  CalendarCheck, DollarSign, Eye, LayoutDashboard,
  TrendingUp, Users, ExternalLink, Bell, RefreshCw, Ban
} from "lucide-react"

export default function MyPropertiesPage() {
  const { properties, deleteProperty } = useProperty()
  const { user } = useAuth()
  const { toast } = useToast() 

  const [notifications, setNotifications] = useState<any[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const prevUnreadCount = useRef(0)

  // 🌟 核心新增：当前房东的实时封禁状态
  const [accountStatus, setAccountStatus] = useState("active")

  const myProperties = properties.filter((prop) => 
    prop.landlordId === user?.id || prop.landlordId === user?.username
  )

  const stats = {
    total: myProperties.length,
    views: myProperties.reduce((sum, p) => sum + (Number(p.views) || 0), 0),
    income: myProperties.reduce((sum, p) => sum + (Number(p.price) || 0), 0)
  }

  // 🌟 核心改进：同时拉取最新的“消息通知”以及“账号封禁状态”
  const fetchNotifications = useCallback(async (showToast = false) => {
    if (!user?.id || String(user.id).length < 10) return;

    setIsFetching(true);
    try {
      // 1. 检查自己的 profiles 状态
      const { data: profileData } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single();
      
      if (profileData?.status) {
        setAccountStatus(profileData.status);
      }

      // 2. 检查通知
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Fetch error:", error.message);
        return;
      }

      if (data) {
        const currentUnread = data.filter(n => !n.is_read).length;
        
        if (showToast && currentUnread > prevUnreadCount.current) {
          toast({
            title: "System Alert",
            description: "You have received a new administration warning notice.",
            variant: "destructive"
          });
        }
        
        prevUnreadCount.current = currentUnread;
        setNotifications(data);
      }
    } catch (err) {
      console.error("Runtime error:", err);
    } finally {
      setIsFetching(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    fetchNotifications();

    // 🌟 为了答辩时演示“即时封禁”，我们加一个 3 秒的安全检测轮询
    const intervalId = setInterval(() => fetchNotifications(false), 3000);
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  // 标记通知为已读
  const markAsRead = async (id: number) => {
    if (!id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    prevUnreadCount.current = Math.max(0, prevUnreadCount.current - 1);
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to PERMANENTLY delete this property?")) {
      deleteProperty(id)
      toast({ title: "Deleted", description: "Property removed from cloud.", variant: "destructive" })
    }
  }

  // 🌟 终极物理拦截：一旦管理员判定为 suspended，房东的大盘页面直接物理锁死，无法看到任何内容！
  if (accountStatus === "suspended") {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans p-6">
        <div className="bg-red-950/20 border border-red-500/40 p-12 rounded-[2.5rem] max-w-lg text-center shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 animate-pulse">
            <Ban className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-red-500">CONSOLE LOCKDOWN</h1>
          <p className="text-slate-400 text-sm mt-4 font-bold leading-relaxed">
            Your UniRent Landlord Console has been <span className="text-red-400">Permanently Suspended</span> by the Super Root Administration due to housing asymmetric policy violations.
          </p>
          <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 font-mono">
            <span>TERMINAL STATUS: LOCKED</span>
            <span>UID: {user?.id?.substring(0,8)}...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-24 font-sans text-slate-900 bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('/fangdong.jpg')" }}
    >
      <div className="min-h-screen bg-slate-900/40 backdrop-blur-[2px]">
        
        <header className="bg-slate-900/90 text-white shadow-xl sticky top-0 z-50 border-b border-slate-700 backdrop-blur-md">
          <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20">U</div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-none">UniRent</h1>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Management Pro</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => fetchNotifications(true)}
                disabled={isFetching}
                className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl px-3 h-10 flex items-center gap-2"
                title="Sync Data"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
                <span className="hidden md:inline text-xs font-bold">Sync</span>
              </Button>

              <Link href="/landlord/viewing-management">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-10 rounded-xl shadow-lg flex items-center gap-2 px-4 transition-all active:scale-95 border-none">
                  <CalendarCheck className="w-4 h-4" />
                  <span className="hidden md:inline text-xs">Manage Viewings</span>
                </Button>
              </Link>

              <Popover onOpenChange={(open) => { if (open) fetchNotifications(false); }}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 p-0 rounded-xl hover:bg-slate-800 transition-colors border-none bg-transparent">
                    <Bell className="w-5 h-5 text-slate-300" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-white border-none shadow-2xl rounded-2xl mr-4 mt-2 overflow-hidden z-[110]">
                  <div className="bg-slate-900 p-4 border-b border-slate-800">
                    <h3 className="font-black text-white flex items-center justify-between">
                      Notifications
                      {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                    </h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto bg-slate-50 p-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-sm font-bold">No notifications yet.</div>
                    ) : (
                      notifications.map((n, index) => (
                        <div 
                          key={n.id || `fallback-key-${index}`} 
                          className={`p-3 mb-2 rounded-xl border text-sm transition-all cursor-pointer ${
                            n.is_read ? 'bg-white border-slate-100 text-slate-500 opacity-60' : 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm'
                          }`}
                          onClick={() => markAsRead(n.id)}
                        >
                          <div className="flex items-start gap-2">
                            {!n.is_read && <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></div>}
                            <p className="font-medium leading-snug">{n.message}</p>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-2 ml-4 font-mono">
                            {n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="h-8 w-[1px] bg-slate-700 hidden sm:block"></div>

              <div className="flex items-center gap-3 hidden sm:flex">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Authorized</p>
                  <p className="text-sm font-black text-white">{user?.username || 'Landlord'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold">
                   {user?.username?.charAt(0).toUpperCase() || 'L'}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto p-6 mt-4 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400"><Building2 /></div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase">Total Assets</p>
                <p className="text-xl font-black text-white">{stats.total} Units</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400"><Eye /></div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase">Market Exposure</p>
                <p className="text-xl font-black text-white">{stats.views} Views</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400"><DollarSign /></div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase">Monthly Revenue</p>
                <p className="text-xl font-black text-white">RM {stats.income}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/95 p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 backdrop-blur-md">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <LayoutDashboard className="text-emerald-500" /> My Real Estate Portfolio
              </h2>
              <p className="text-slate-500 text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Tracking performance and assets in real-time.
              </p>
            </div>
            
            <div className="flex flex-row gap-4">
              <Link href="/landlord/market-analysis" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white bg-white font-black h-14 px-8 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 group">
                  <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                  <span>Market Analysis</span>
                </Button>
              </Link>

              <Link href="/landlord/add-property" className="flex-1 sm:flex-none">
                <Button className="w-full bg-slate-900 hover:bg-black text-white font-black h-14 px-8 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 group border-none">
                  <Plus className="w-6 h-6 text-emerald-400 group-hover:rotate-90 transition-transform" /> 
                  <span>Add Property</span>
                </Button>
              </Link>
            </div>
          </div>

          {myProperties.length === 0 ? (
            <div className="text-center py-32 bg-white/60 rounded-[3rem] border-4 border-dashed border-slate-300 shadow-inner backdrop-blur-sm">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Building2 className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">No Active Listings</h2>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto font-medium">Your portfolio is empty. Click "Add Property" to start your landlord journey.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {myProperties.map((property) => (
                <Card key={property.id} className="group border-none shadow-xl overflow-hidden bg-white rounded-[2.5rem] flex flex-col transition-all hover:shadow-2xl hover:-translate-y-2 backdrop-blur-sm relative">
                  
                  <div className="absolute top-5 left-5 z-20">
                     <Badge className="bg-emerald-500/90 backdrop-blur-md text-white font-black px-3 py-1 rounded-xl shadow-lg border-none text-[10px] uppercase tracking-widest">
                       Active Listing
                     </Badge>
                  </div>

                  <CardContent className="p-0 relative flex-grow">
                    <div className="w-full h-56 overflow-hidden">
                      <img 
                        src={property.image || "/placeholder.svg"} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                        alt={property.name}
                      />
                    </div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-black text-slate-900 text-xl leading-tight line-clamp-1">{property.name}</h3>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-emerald-50 text-emerald-700 font-black text-sm px-3 py-1 rounded-full">RM {property.price}</div>
                        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Eye className="w-3 h-3 mr-1" /> {property.views || 0}
                        </div>
                      </div>

                      <p className="text-slate-400 text-xs font-bold flex items-center gap-1 mb-6">
                        <MapPin className="w-4 h-4 text-red-500" /> {property.distanceToUSM}km to USM Campus
                      </p>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <FacilityItem icon={<BedDouble className="w-4 h-4" />} label={`${property.bedrooms} Bed`} />
                        <FacilityItem icon={<Bath className="w-4 h-4" />} label={`${property.bathrooms} Bath`} />
                        <FacilityItem icon={<Maximize className="w-4 h-4" />} label={property.size} />
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="bg-slate-50/80 p-4 flex gap-2 border-t border-slate-100 backdrop-blur-sm">
                    <Link href={`/property/${property.id}`} className="flex-1">
                      <Button variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-black text-[10px] h-11 rounded-2xl bg-white transition-all uppercase tracking-widest px-0">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                    </Link>
                    <Link href={`/landlord/edit-property/${property.id}`} className="flex-1">
                      <Button variant="outline" className="w-full border-slate-200 font-black text-[10px] h-11 rounded-2xl bg-white hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest px-0">
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-red-100 text-red-500 hover:bg-red-500 hover:text-white font-black text-[10px] h-11 rounded-2xl bg-white transition-all uppercase tracking-widest px-0" 
                      onClick={() => handleDelete(property.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Del
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function FacilityItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="bg-white p-3 rounded-2xl text-center border border-slate-100 shadow-sm">
      <div className="flex justify-center text-slate-300 mb-1">{icon}</div>
      <span className="text-[9px] font-black text-slate-800 block truncate uppercase tracking-tighter">{label}</span>
    </div>
  )
}

function Badge({ children, className }: any) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</span>
}