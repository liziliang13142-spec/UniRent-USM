"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, User, Building, PlusCircle, Heart, Globe, Calendar } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
// 🌟 新增：引入 useState, useEffect 和 Supabase 以及 Toast 提醒组件
import React, { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export function Navigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { toast } = useToast()

  // 🌟 新增：维护全局未读私信的实时数量状态
  const [unreadCount, setUnreadCount] = useState<number>(0)

  // 1. 租客菜单 (保持 5 个按钮平衡)
  const tenantNavItems = [
    { href: "/listings", label: "Home", icon: Home },
    { href: "/favorite-properties", label: "Favorites", icon: Heart },
    { href: "/messages", label: "Chat", icon: MessageSquare },
    { href: "/booking-history", label: "Bookings", icon: Calendar },
    { href: "/profile", label: "Me", icon: User },
  ]

  // 2. 房东菜单 (按照你的要求重新排列为 5 个按钮)
  const landlordNavItems = [
    { href: "/listings", label: "Market", icon: Globe },             
    { href: "/landlord/properties", label: "My Props", icon: Building }, 
    { href: "/landlord/add-property", label: "Add", icon: PlusCircle },  
    { href: "/messages", label: "Chat", icon: MessageSquare },          
    { href: "/profile", label: "Me", icon: User },                      
  ]

  const isLandlord = user?.role?.toLowerCase() === "landlord"
  const navItems = isLandlord ? landlordNavItems : tenantNavItems

  // 🌟 函数：实时查询当前登录用户的未读消息总数
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      if (!error && count !== null) {
        setUnreadCount(count)
      }
    } catch (err) {
      console.error("Fetch unread count failed:", err)
    }
  }, [user?.id])

  // 🌟 核心：建立 Supabase 全局双向实时通信管道（WebSocket 监听）
  useEffect(() => {
    if (!user?.id) return

    // 1. 首次加载时更新一次未读小红点数据
    fetchUnreadCount()

    // 2. 开启私信（Messages）实时双向监听
    const messagesChannel = supabase
      .channel('global-messages-relay')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          // 情况 A: 收到新消息 (当前用户是接收者)
          if (payload.new && (payload.new as any).receiver_id === user.id) {
            fetchUnreadCount() // 实时刷新小红点数量
            
            // 如果是在线状态实时收到的一条新数据，弹出顶部横幅广播通知
            if (payload.eventType === 'INSERT') {
              toast({
                title: "✉️ New Chat Message",
                description: (payload.new as any).content || "You received a new message.",
                className: "bg-white/95 border-l-4 border-l-blue-600 font-sans font-bold shadow-xl rounded-2xl"
              })
            }
          }
          // 情况 B: 对方阅读了消息，或者自己阅读了，状态改变
          if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            fetchUnreadCount()
          }
        }
      )
      .subscribe()

    // 3. 开启预定看房（Viewing Requests）实时双向流监听
    const viewingsChannel = supabase
      .channel('global-viewings-relay')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'viewing_requests' },
        (payload) => {
          const viewingData = payload.new as any
          if (!viewingData) return

          // 房东视角：监听到有新预约创建，且对应的房东 ID 是自己
          if (isLandlord && viewingData.landlord_id === user.id && payload.eventType === 'INSERT') {
            toast({
              title: "📅 New Viewing Inquiry!",
              description: `Tenant "${viewingData.tenant_name}" requested a viewing. Check viewing manager!`,
              className: "bg-white/95 border-l-4 border-l-emerald-600 font-sans font-bold shadow-xl rounded-2xl"
            })
          }

          // 租户视角：房东在后台点击了同意/拒绝 (UPDATE 操作)，且对应的租户 ID 是自己
          if (!isLandlord && viewingData.tenant_id === user.id && payload.eventType === 'UPDATE') {
            const statusUpper = viewingData.status?.toUpperCase() || "UPDATED"
            toast({
              title: `📅 Viewing Request ${statusUpper}!`,
              description: viewingData.landlord_comment 
                ? `Landlord reply: "${viewingData.landlord_comment}"` 
                : `Your viewing schedule has been ${viewingData.status}.`,
              className: `bg-white/95 font-sans font-bold shadow-xl rounded-2xl border-l-4 ${
                viewingData.status === 'approved' ? 'border-l-green-500' : 'border-l-red-500'
              }`
            })
          }
        }
      )
      .subscribe()

    // 组件卸载时断开 WebSocket 通道，防止内存泄漏
    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(viewingsChannel)
    }
  }, [user?.id, isLandlord, fetchUnreadCount, toast])

  // 登录页、注册页隐藏
  if (pathname === "/" || pathname === "/signup") return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          // 精准匹配高亮逻辑
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
          
          // 房东用绿色，租客用蓝色
          const activeColor = isLandlord ? "text-emerald-600" : "text-blue-600"
          const inactiveColor = "text-gray-400"

          return (
            <Link 
              key={href} 
              href={href} 
              className="flex flex-col items-center py-3 flex-1 transition-all active:scale-90"
            >
              <div className="relative">
                <Icon 
                  className={`h-6 w-6 transition-colors duration-300 ${isActive ? activeColor : inactiveColor}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                {/* 🌟 核心改进：Chat 图标上不再是死红点，而是有未读信息时展示真实的未读数字气泡 */}
                {label === "Chat" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span 
                className={`text-[10px] mt-1.5 font-bold tracking-tight transition-colors duration-300 ${isActive ? activeColor : inactiveColor}`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}