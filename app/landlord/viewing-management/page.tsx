"use client"

import { supabase } from "@/lib/supabase"
// 🌟 仅新增 useCallback 避免 React 警告
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { 
  Check, 
  X, 
  Clock, 
  User, 
  Phone, 
  CalendarDays, 
  MessageCircle, 
  ArrowLeft,
  Loader2,
  Home,
  RefreshCcw,
  Trash2
} from "lucide-react"
import Link from "next/link"

export default function ViewingManagementPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({})
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)

  // 🌟 将你原来的 fetchRequests 包裹在 useCallback 中，这是标准做法，内部逻辑完全不变
  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('viewing_requests')
        .select(`
          *,
          properties (
            name
          )
        `)
        .eq('landlord_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (err: any) {
      toast({ title: "Fetch Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, toast])

  // 1. 初始化与监听
  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user, fetchRequests])

  // 🌟 仅新增这一段：让页面自动刷新长出新数据
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase.channel('page-viewings').on('postgres_changes', { 
      event: 'INSERT', schema: 'public', table: 'viewing_requests', filter: `landlord_id=eq.${user.id}` 
    }, () => {
      fetchRequests() // 监听到新订单，静默调用你写的抓取函数
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id, fetchRequests])


  // 3. 处理同意/拒绝 (🌟 这里做了核心优化，实现秒级反馈)
  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setIsActionLoading(id)
    try {
      const { error } = await supabase
        .from('viewing_requests')
        .update({ 
          status: status, 
          landlord_comment: replyText[id] || "" 
        })
        .eq('id', id)

      if (error) {
        console.error("Supabase Update Error:", error);
        throw error;
      }

      // 🌟 成功弹窗提示
      toast({ 
        title: status === 'approved' ? "Request Approved!" : "Request Rejected",
        description: "The tenant will see your response in their dashboard." 
      })
      
      // 🌟 核心优化：直接更新本地的 requests 数组，不用等待 fetchRequests()，实现卡片状态“秒变”
      setRequests(prev => prev.map(r => 
        r.id === id ? { ...r, status: status, landlord_comment: replyText[id] || "" } : r
      ))

    } catch (err: any) {
      console.error("Action Failed:", err);
      // 🌟 强化报错反馈：告诉你要去检查 SQL 权限
      toast({ 
        title: "Action Failed", 
        description: err.message || "Failed. Please ensure you added the UPDATE policy in SQL.", 
        variant: "destructive" 
      })
    } finally {
      setIsActionLoading(null)
    }
  }

  // 4. 删除预约记录 (针对已完成或已拒绝的)
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return
    
    setIsActionLoading(id)
    try {
      const { error } = await supabase
        .from('viewing_requests')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast({ title: "Deleted", description: "Record removed." })
      setRequests(prev => prev.filter(r => r.id !== id))
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsActionLoading(null)
    }
  }

  return (
    <div 
      className="min-h-screen pb-20 font-sans bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('/fangdong.jpg')" }}
    >
      <div className="min-h-screen backdrop-blur-[2px] bg-slate-900/40 p-4 sm:p-6">
        
        <main className="max-w-4xl mx-auto space-y-6">
          
          {/* 顶部导航 */}
          <header className="flex items-center justify-between bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center gap-4">
              <Link href="/listings">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Viewing Requests</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Property Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-slate-200"
                onClick={fetchRequests}
                disabled={isLoading}
              >
                <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Badge className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm">
                {requests.filter(r => r.status === 'pending').length} New
              </Badge>
            </div>
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-white opacity-80" />
              <p className="text-white/60 font-medium animate-pulse">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-md border-none shadow-2xl p-16 text-center rounded-3xl">
              <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarDays className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">Inbox Empty</h2>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">No one has requested a viewing yet. New requests will appear here instantly.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <Card key={req.id} className="bg-white/95 backdrop-blur-md border-none shadow-xl rounded-3xl overflow-hidden transition-all hover:shadow-2xl border-l-8 border-l-slate-900">
                  {/* 卡片头部 */}
                  <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-sm tracking-tight truncate max-w-[250px]">
                        {req.properties?.name || "Deleted Property"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`font-black text-[10px] uppercase px-2.5 py-1 rounded-md shadow-sm ${
                        req.status === 'approved' ? 'bg-green-500 text-white' : 
                        req.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white animate-pulse'
                      }`}>
                        {req.status}
                      </Badge>
                      {req.status !== 'pending' && (
                        <button 
                          onClick={() => handleDelete(req.id)}
                          className="text-white/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* 租客详情 */}
                      <div className="space-y-4 md:col-span-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-start gap-3">
                          <User className="w-4 h-4 text-slate-400 mt-1" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Tenant Name</p>
                            <p className="text-sm font-black text-slate-700">{req.tenant_name}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="w-4 h-4 text-slate-400 mt-1" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Contact Number</p>
                            <p className="text-sm font-black text-slate-700">{req.tenant_phone}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CalendarDays className="w-4 h-4 text-blue-500 mt-1" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Viewing Date</p>
                            <p className="text-sm font-black text-blue-600">{req.viewing_date}</p>
                          </div>
                        </div>
                      </div>

                      {/* 租客留言 */}
                      <div className="md:col-span-2 flex flex-col">
                        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 relative flex-grow">
                          <MessageCircle className="absolute right-5 top-5 text-blue-100 w-12 h-12" />
                          <p className="text-[10px] font-bold text-blue-400 uppercase mb-3 flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                            Tenant's Inquiry
                          </p>
                          <p className="text-sm text-slate-600 italic leading-relaxed relative z-10 font-medium">
                            "{req.tenant_message || "No specific message left by the tenant."}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 房东操作/回复区 */}
                    <div className="mt-6 pt-6 border-t border-dashed border-slate-200">
                      {req.status === 'pending' ? (
                        <div className="space-y-4">
                          <div className="group">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Your Response</label>
                            <Input 
                              placeholder="e.g. 'I will be there at 3pm' or 'Sorry, the unit was just taken'" 
                              className="bg-white border-slate-200 h-14 rounded-2xl px-5 text-sm focus:ring-2 focus:ring-slate-900 transition-all shadow-sm"
                              value={replyText[req.id] || ""}
                              onChange={(e) => setReplyText({ ...replyText, [req.id]: e.target.value })}
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button 
                              className="flex-1 bg-slate-900 hover:bg-black h-12 rounded-2xl font-bold text-white shadow-lg active:scale-[0.98] transition-all"
                              onClick={() => handleAction(req.id, 'approved')}
                              disabled={isActionLoading === req.id}
                            >
                              {isActionLoading === req.id ? <Loader2 className="animate-spin" /> : <><Check className="mr-2 w-5 h-5" /> Approve Viewing</>}
                            </Button>
                            <Button 
                              variant="outline"
                              className="flex-1 border-red-100 text-red-500 hover:bg-red-50 h-12 rounded-2xl font-bold active:scale-[0.98] transition-all"
                              onClick={() => handleAction(req.id, 'rejected')}
                              disabled={isActionLoading === req.id}
                            >
                              <X className="mr-2 w-5 h-5" /> Decline
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4 bg-slate-100/50 p-5 rounded-2xl border border-slate-200">
                          <div className={`p-2.5 rounded-xl shadow-sm ${req.status === 'approved' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {req.status === 'approved' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status: {req.status}</p>
                            <p className="text-sm font-bold text-slate-700">
                              {req.landlord_comment || "No comment was left for this response."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}