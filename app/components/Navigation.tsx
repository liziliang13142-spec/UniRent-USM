"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, Calendar, User, Building, PlusCircle, Heart } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export function Navigation() {
  const pathname = usePathname()
  const { user } = useAuth()

  // 1. 租客菜单配置
  const tenantNavItems = [
    { href: "/listings", label: "Home", icon: Home },
    { href: "/favorite-properties", label: "Favorites", icon: Heart },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/booking-history", label: "Bookings", icon: Calendar },
    { href: "/profile", label: "Profile", icon: User },
  ]

  // 2. 房东菜单配置 (找回你的 "My Properties" 和 "Add" 按钮)
  const landlordNavItems = [
    { href: "/landlord/properties", label: "My Properties", icon: Building },
    { href: "/landlord/add-property", label: "Add", icon: PlusCircle },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/profile", label: "Profile", icon: User },
  ]

  // 🔍 调试信息：在浏览器控制台 (F12) 查看身份
  console.log("=== Navigation 身份检查 ===");
  console.log("当前用户对象:", user);
  console.log("当前用户角色:", user?.role);

  // 🌟 强力识别逻辑：全部转为小写对比，杜绝大小写 Bug
  const isLandlord = user?.role?.toLowerCase() === "landlord";
  
  // 根据身份选择显示的菜单
  const navItems = isLandlord ? landlordNavItems : tenantNavItems;

  // 注册页和登录页不显示底部导航
  if (pathname === "/" || pathname === "/signup") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around px-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          // 判断当前是否处于该页面路径
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

          return (
            <Link 
              key={href} 
              href={href} 
              className="flex flex-col items-center py-2 flex-1 transition-colors"
            >
              <Icon 
                className={`h-6 w-6 ${isActive ? "text-blue-600" : "text-gray-400"}`} 
              />
              <span 
                className={`text-[10px] mt-1 font-medium ${isActive ? "text-blue-600" : "text-gray-400"}`}
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