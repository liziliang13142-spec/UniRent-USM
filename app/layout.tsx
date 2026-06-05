"use client"

import "./globals.css"
import { Inter } from "next/font/google"
import { usePathname } from "next/navigation" // 🌟 引入路径检查
import { AuthProvider } from "./contexts/AuthContext"
import { ConversationProvider } from "./contexts/ConversationContext"
import { PropertyProvider } from "./contexts/PropertyContext"
import { BookingProvider } from "./contexts/BookingContext"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "./components/Navigation"
import { ThemeWrapper } from "./components/ThemeWrapper"

const inter = Inter({ subsets: ["latin"] })

// 注意：在 Next.js 中，如果使用了 "use client"，metadata 需要放在独立的非客户端文件中
// 但为了保证你代码能跑，我建议将 layout 保持为 Client Component 或按需拆分。
// 这里我们保持 Client Component 逻辑以方便判断路径。

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // 🌟 判断当前是否在 Admin 路由下
  const isAdminPage = pathname?.startsWith('/admin')

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ConversationProvider>
            <PropertyProvider>
              <BookingProvider>
                
                <ThemeWrapper>
                  {/* 🌟 逻辑修复：Admin 页面不需要 pb-16 的底部间距 */}
                  <div className={isAdminPage ? "" : "pb-16"}>
                    {children}
                  </div>
                </ThemeWrapper>
                
                {/* 🌟 逻辑修复：只有非 Admin 页面才渲染底部导航栏 */}
                {!isAdminPage && <Navigation />}
                
                {/* 全局提示气泡 */}
                <Toaster />
                
              </BookingProvider>
            </PropertyProvider>
          </ConversationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}