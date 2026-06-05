"use client"

import { useAuth } from "../contexts/AuthContext"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 🌟 核心防错点：无论是在服务器端（未挂载），还是在登录/注册页，
  // 我们都强制返回一个带有 className="min-h-screen" 的外层 div，保持结构 100% 一致
  if (!mounted || pathname === "/" || pathname === "/signup") {
    return <div className="min-h-screen bg-gray-50/50">{children}</div>
  }

  // 只有在客户端完全准备好，且不是登录页时，才展示背景图
  const isLandlord = auth?.user?.role?.toLowerCase() === "landlord"
  const bgImage = isLandlord ? "/fangdong.jpg" : "/zuhu.jpg"
  const overlayColor = isLandlord ? "bg-slate-900/20" : "bg-blue-50/40"

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat transition-all duration-700"
      style={{ backgroundImage: `url('${bgImage}')` }}
    >
      <div className={`min-h-screen ${overlayColor} backdrop-blur-[1px]`}>
        {children}
      </div>
    </div>
  )
}