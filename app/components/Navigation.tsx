"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, User, Building, PlusCircle, Heart, Globe, Calendar } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import React, { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export function Navigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { toast } = useToast()

  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [pendingViewings, setPendingViewings] = useState<number>(0)

  const tenantNavItems = [
    { href: "/listings", label: "Home", icon: Home },
    { href: "/favorite-properties", label: "Favorites", icon: Heart },
    { href: "/messages", label: "Chat", icon: MessageSquare },
    { href: "/booking-history", label: "Bookings", icon: Calendar },
    { href: "/profile", label: "Me", icon: User },
  ]

  const landlordNavItems = [
    { href: "/listings", label: "Market", icon: Globe },             
    { href: "/landlord/properties", label: "My Props", icon: Building }, 
    { href: "/landlord/add-property", label: "Add", icon: PlusCircle },  
    { href: "/messages", label: "Chat", icon: MessageSquare },          
    { href: "/profile", label: "Me", icon: User },                      
  ]

  const isLandlord = user?.role?.toLowerCase() === "landlord"
  const navItems = isLandlord ? landlordNavItems : tenantNavItems

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

  const fetchPendingViewings = useCallback(async () => {
    if (!user?.id || !isLandlord) return
    try {
      const { count, error } = await supabase
        .from('viewing_requests')
        .select('*', { count: 'exact', head: true })
        .eq('landlord_id', user.id)
        .eq('status', 'pending')

      if (!error && count !== null) {
        setPendingViewings(count)
      }
    } catch (err) {
      console.error("Fetch pending viewings count failed:", err)
    }
  }, [user?.id, isLandlord])

  useEffect(() => {
    if (!user?.id) return

    fetchUnreadCount()
    if (isLandlord) fetchPendingViewings()

    const messagesChannel = supabase
      .channel('global-messages-relay')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new && (payload.new as any).receiver_id === user.id) {
            fetchUnreadCount() 
            if (payload.eventType === 'INSERT') {
              toast({
                title: "✉️ New Chat Message",
                description: (payload.new as any).content || "You received a new message.",
                className: "bg-white/95 border-l-4 border-l-blue-600 font-sans font-bold shadow-xl rounded-2xl"
              })
            }
          }
          if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            fetchUnreadCount()
          }
        }
      )
      .subscribe()

    const viewingsChannel = supabase
      .channel('global-viewings-relay')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'viewing_requests', filter: `landlord_id=eq.${user.id}` },
        (payload) => {
          const viewingData = payload.new as any
          if (isLandlord && viewingData) {
            toast({
              title: "📅 New Viewing Inquiry!",
              description: `Tenant "${viewingData.tenant_name}" requested a viewing. Check viewing manager!`,
              className: "bg-white/95 border-l-4 border-l-emerald-600 font-sans font-bold shadow-xl rounded-2xl"
            })
            fetchPendingViewings()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'viewing_requests', filter: `tenant_id=eq.${user.id}` },
        (payload) => {
          const viewingData = payload.new as any
          if (!isLandlord && viewingData) {
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'viewing_requests' },
        () => {
          if (isLandlord) fetchPendingViewings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(viewingsChannel)
    }
  }, [user?.id, isLandlord, fetchUnreadCount, fetchPendingViewings, toast])

  if (pathname === "/" || pathname === "/signup") return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
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
                
                {label === "Chat" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}

                {label === "My Props" && pendingViewings > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                    {pendingViewings}
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