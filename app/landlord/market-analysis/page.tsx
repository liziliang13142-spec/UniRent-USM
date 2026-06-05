"use client"

import { supabase } from "@/lib/supabase"
import React, { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, DollarSign, Home, 
  Calendar, Loader2, Users, CheckCircle2, Circle, LayoutDashboard
} from "lucide-react"
import Link from "next/link"
import { differenceInDays, format, isValid } from "date-fns" // 🌟 引入 isValid 进行日期安全检查

export default function MarketAnalysisPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProperties: 0,
    rentedProperties: 0,
    vacantProperties: 0,
    totalViews: 0
  })
  const [rentedDetails, setRentedDetails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchAnalysisData()
  }, [user])

  const fetchAnalysisData = async () => {
    if (!user || !user.id) return
    setLoading(true)
    try {
      const safeUsername = user.username || "unknown";

      // 1. 获取该房东的所有房产
      const { data: props, error: propsError } = await supabase
        .from('properties')
        .select('id, name, views')
        .or(`landlord_id.eq.${user.id},landlord_id.eq.${safeUsername}`)

      if (propsError) throw propsError
      const propIds = props?.map(p => p.id) || []
      const viewsCount = props?.reduce((sum, p) => sum + (Number(p.views) || 0), 0) || 0

      if (propIds.length === 0) {
        setStats(prev => ({ ...prev, totalProperties: 0, vacantProperties: 0, totalViews: viewsCount }))
        setLoading(false)
        return
      }

      // 2. 获取订单明细 (包含关联房产名称)
      const { data: bookings, error: bookError } = await supabase
        .from('bookings')
        .select(`
          id,
          total_price,
          property_id,
          start_date,
          end_date,
          tenant_id,
          status,
          properties ( name )
        `)
        .in('property_id', propIds)
        .eq('status', 'confirmed')

      if (bookError) throw bookError

      // 3. 计算统计指标
      const revenue = bookings?.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0) || 0
      const rentedPropIds = new Set(bookings?.map(b => b.property_id))
      
      setStats({
        totalRevenue: revenue,
        totalProperties: propIds.length,
        rentedProperties: rentedPropIds.size,
        vacantProperties: propIds.length - rentedPropIds.size,
        totalViews: viewsCount
      })

      // 4. 🌟 安全处理明细数据 (防止 null 导致的崩溃)
      const details = bookings?.map(b => {
        const start = new Date(b.start_date)
        const end = new Date(b.end_date)
        
        // 检查日期是否有效
        const durationDays = (isValid(start) && isValid(end)) 
          ? differenceInDays(end, start) 
          : 0;

        // 处理关联查询可能返回对象或数组的情况
        const pName = Array.isArray(b.properties) 
          ? b.properties[0]?.name 
          : (b.properties as any)?.name;

        return {
          id: b.id,
          propertyName: pName || "Unknown Property",
          // 🛡️ 防止 tenant_id 为空时 substring 报错
          tenant: b.tenant_id ? `${b.tenant_id.substring(0, 8)}...` : "N/A",
          duration: `${durationDays} Days`,
          revenue: Number(b.total_price) || 0,
          dateRange: (isValid(start) && isValid(end)) 
            ? `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`
            : "Invalid Date"
        }
      }) || []
      
      setRentedDetails(details)

    } catch (err: any) {
      console.error("KPI Fetch Error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-2" />
      <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">Calculating KPIs...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
        
        {/* 顶部标题区 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/landlord/properties">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-blue-600" /> Market Analysis
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Intelligence Dashboard</p>
            </div>
          </div>
          <Button onClick={fetchAnalysisData} variant="outline" size="sm" className="rounded-xl font-bold text-[10px] bg-white">
            REFRESH DATA
          </Button>
        </div>

        {/* 🌟 核心 KPI 卡片区 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Earnings" value={`RM ${stats.totalRevenue}`} icon={<DollarSign />} color="text-emerald-600" bgColor="bg-emerald-50" />
          <StatCard title="My Listings" value={stats.totalProperties} icon={<Home />} color="text-blue-600" bgColor="bg-blue-50" />
          <StatCard title="Rented Units" value={stats.rentedProperties} icon={<CheckCircle2 />} color="text-purple-600" bgColor="bg-purple-50" />
          <StatCard title="Vacant Units" value={stats.vacantProperties} icon={<Circle />} color="text-orange-600" bgColor="bg-orange-50" />
        </div>

        {/* 🌟 已出租房产明细表 */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
          <div className="p-6 border-b bg-slate-900 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 italic">
              <Users className="w-4 h-4 text-blue-400" /> Rented Assets Details
            </h3>
            <Badge className="bg-blue-600 border-none font-bold">{rentedDetails.length} Active</Badge>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400">Property</th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-center">Duration</th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400">Tenant (UUID)</th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400">Timeframe</th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-right">Income</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rentedDetails.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic">No rental data available yet.</td>
                    </tr>
                  ) : (
                    rentedDetails.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 font-bold text-slate-800 text-sm">{item.propertyName}</td>
                        <td className="p-4 text-center">
                          <Badge className="bg-blue-100 text-blue-700 border-none font-bold text-[9px] px-2">{item.duration}</Badge>
                        </td>
                        <td className="p-4 text-[10px] font-mono text-slate-500">{item.tenant}</td>
                        <td className="p-4 text-[11px] font-medium text-slate-500">{item.dateRange}</td>
                        <td className="p-4 text-right font-black text-slate-900 text-sm">RM {item.revenue}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

// 内部小组件：统计卡片
function StatCard({ title, value, icon, color, bgColor }: any) {
  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-1">{title}</p>
          <p className="text-2xl font-black text-slate-900">{value}</p>
        </div>
        <div className={`p-3 rounded-2xl ${bgColor} ${color}`}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
      </CardContent>
    </Card>
  )
}