"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, User, Building, PlusCircle, Heart, Globe, Calendar } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export function Navigation() {
  const pathname = usePathname()
  const { user } = useAuth()

  // 1. 租客菜单 (保持 5 个按钮平衡)
  const tenantNavItems = [
    { href: "/listings", label: "Home", icon: Home },
    { href: "/favorite-properties", label: "Favorites", icon: Heart },
    { href: "/messages", label: "Chat", icon: MessageSquare },
    { href: "/booking-history", label: "Bookings", icon: Calendar },
    { href: "/profile", label: "Me", icon: User },
  ]

  // 2. 🌟 房东菜单 (按照你的要求重新排列为 5 个按钮)
  const landlordNavItems = [
    { href: "/listings", label: "Market", icon: Globe },             // 👈 第 1 个：全站总列表
    { href: "/landlord/properties", label: "My Props", icon: Building }, // 👈 第 2 个：我的房源
    { href: "/landlord/add-property", label: "Add", icon: PlusCircle },  // 👈 第 3 个：添加
    { href: "/messages", label: "Chat", icon: MessageSquare },          // 👈 第 4 个：消息
    { href: "/profile", label: "Me", icon: User },                      // 👈 第 5 个：个人
  ]

  const isLandlord = user?.role?.toLowerCase() === "landlord"
  const navItems = isLandlord ? landlordNavItems : tenantNavItems

  // 登录页、注册页隐藏
  if (pathname === "/" || pathname === "/signup") return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          // 精准匹配高亮逻辑
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
          
          // 🌟 房东用绿色，租客用蓝色
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
                {/* 消息红点占位 (如果是消息图标且有新消息可以显示) */}
                {label === "Chat" && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
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