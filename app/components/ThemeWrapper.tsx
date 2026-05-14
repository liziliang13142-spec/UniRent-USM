"use client"

import { useAuth } from "../contexts/AuthContext"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react" // 🌟 引入了 useEffect 和 useState

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  // 🌟 保护机制 1：安全获取 auth，防止 auth 为 null 时直接解构崩溃
  const auth = useAuth()
  const user = auth?.user 

  const pathname = usePathname()
  
  // 🌟 保护机制 2：增加一个“是否已经挂载到客户端”的状态
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 🌟 保护机制 3：如果页面还没准备好，先渲染一个干净的背景，防止服务端和客户端打架
  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 transition-colors duration-300">{children}</div>
  }

  // 1. 获取路径，判断是否为登录/注册页
  const isAuthPage = pathname === "/" || pathname === "/signup"
  if (isAuthPage) {
    return <>{children}</>
  }

  // 2. 判断角色：只有当 user 存在且 role 为 landlord 时才切换房东背景
  const isLandlord = user?.role?.toLowerCase() === "landlord"
  const bgImage = isLandlord ? "/fangdong.jpg" : "/zuhu.jpg"
  
  // 3. 设置蒙层颜色
  const overlayColor = isLandlord ? "bg-slate-900/20" : "bg-blue-50/40"

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat transition-all duration-700"
      style={{ backgroundImage: `url('${bgImage}')` }}
    >
      {/* 蒙层 + 内容 */}
      <div className={`min-h-screen ${overlayColor} backdrop-blur-[1px]`}>
        {children}
      </div>
    </div>
  )
}