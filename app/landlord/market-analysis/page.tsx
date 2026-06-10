"use client"

import { supabase } from "@/lib/supabase"
import React, { useState, useEffect, useMemo } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, DollarSign, Home, 
  Loader2, Users, CheckCircle2, Circle, LayoutDashboard,
  ArrowDown, ArrowUp, CalendarClock, TrendingUp
} from "lucide-react"
import Link from "next/link"
import { differenceInDays, format, isValid } from "date-fns" 

// 🌟 新增引入图表组件
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

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
  
  // 排序状态
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  useEffect(() => {
    if (user) fetchAnalysisData()
  }, [user])

  const fetchAnalysisData = async () => {
    if (!user || !user.id) return
    setLoading(true)
    try {
      const safeUsername = user.username || "unknown";

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
          created_at, 
          properties ( name )
        `)
        .in('property_id', propIds)
        .eq('status', 'confirmed')

      if (bookError) throw bookError

      const revenue = bookings?.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0) || 0
      const rentedPropIds = new Set(bookings?.map(b => b.property_id))
      
      setStats({
        totalRevenue: revenue,
        totalProperties: propIds.length,
        rentedProperties: rentedPropIds.size,
        vacantProperties: propIds.length - rentedPropIds.size,
        totalViews: viewsCount
      })

      const details = bookings?.map(b => {
        const start = new Date(b.start_date)
        const end = new Date(b.end_date)
        const orderDate = new Date(b.created_at) 
        
        const durationDays = (isValid(start) && isValid(end)) ? differenceInDays(end, start) : 0;
        const pName = Array.isArray(b.properties) ? b.properties[0]?.name : (b.properties as any)?.name;

        return {
          id: b.id,
          propertyName: pName || "Unknown Property",
          tenant: b.tenant_id ? `${b.tenant_id.substring(0, 8)}...` : "N/A",
          duration: `${durationDays} Days`,
          revenue: Number(b.total_price) || 0,
          dateRange: (isValid(start) && isValid(end)) ? `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}` : "Invalid Date",
          formattedOrderDate: isValid(orderDate) ? format(orderDate, 'MMM dd, yyyy HH:mm') : "N/A",
          rawOrderTimestamp: isValid(orderDate) ? orderDate.getTime() : 0 
        }
      }) || []
      
      setRentedDetails(details)

    } catch (err: any) {
      console.error("KPI Fetch Error:", err)
    } finally {
      setLoading(false)
    }
  }

  // 表格排序逻辑
  const sortedDetails = useMemo(() => {
    return [...rentedDetails].sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.rawOrderTimestamp - a.rawOrderTimestamp 
      } else {
        return a.rawOrderTimestamp - b.rawOrderTimestamp 
      }
    })
  }, [rentedDetails, sortOrder])

  const toggleSort = () => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')

  // 🌟 核心图表逻辑：按月份聚合并计算总收入
  const chartData = useMemo(() => {
    const monthlyData: Record<string, number> = {}
    
    rentedDetails.forEach(item => {
      if (item.rawOrderTimestamp > 0) {
        // 格式化为 "Jan 2026", "Feb 2026" 这种格式作为 X 轴标签
        const monthKey = format(new Date(item.rawOrderTimestamp), 'MMM yyyy')
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + item.revenue
      }
    })

    // 转换成 Recharts 要求的数组格式，并按时间先后顺序排序
    return Object.entries(monthlyData)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }, [rentedDetails])

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-2" />
      <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">Calculating KPIs...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
        
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Earnings" value={`RM ${stats.totalRevenue}`} icon={<DollarSign />} color="text-emerald-600" bgColor="bg-emerald-50" />
          <StatCard title="My Listings" value={stats.totalProperties} icon={<Home />} color="text-blue-600" bgColor="bg-blue-50" />
          <StatCard title="Rented Units" value={stats.rentedProperties} icon={<CheckCircle2 />} color="text-purple-600" bgColor="bg-purple-50" />
          <StatCard title="Vacant Units" value={stats.vacantProperties} icon={<Circle />} color="text-orange-600" bgColor="bg-orange-50" />
        </div>

        {/* 🌟 建议 1: 新增的图表区域 */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-800">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Monthly Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full mt-2">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} 
                      dy={10}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      tickFormatter={(value) => `RM ${value}`} 
                    />
                    <RechartsTooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                      formatter={(value: any) => [`RM ${value}`, 'Revenue']}
                    />
                    {/* 优美的圆角渐变色蓝色柱子 */}
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300 font-bold italic border-2 border-dashed border-slate-100 rounded-2xl">
                  Not enough data to generate chart.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
          <div className="p-6 border-b bg-slate-900 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 italic">
              <Users className="w-4 h-4 text-blue-400" /> Booking History Details
            </h3>
            <Badge className="bg-blue-600 border-none font-bold">{rentedDetails.length} Active</Badge>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th 
                      className="p-4 text-[10px] font-black uppercase text-blue-600 cursor-pointer hover:bg-slate-200/50 transition-colors group select-none bg-blue-50/50"
                      onClick={toggleSort}
                    >
                      <div className="flex items-center gap-1">
                        Order Date <CalendarClock className="w-3 h-3 ml-1" />
                        <div className="text-blue-400 group-hover:text-blue-700 transition-colors">
                          {sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                        </div>
                      </div>
                    </th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400">Property</th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-center">Duration</th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400">Tenant (UUID)</th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400">Timeframe</th>
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-right">Income</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sortedDetails.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center text-slate-300 font-bold italic">No rental data available yet.</td>
                    </tr>
                  ) : (
                    sortedDetails.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 text-[11px] font-bold text-slate-700 bg-slate-50/20">{item.formattedOrderDate}</td>
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

function StatCard({ title, value, icon, color, bgColor }: any) {
  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-md transition-shadow">
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