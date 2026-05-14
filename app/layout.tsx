import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "./contexts/AuthContext"
import { ConversationProvider } from "./contexts/ConversationContext"
import { PropertyProvider } from "./contexts/PropertyContext"
import { BookingProvider } from "./contexts/BookingContext"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "./components/Navigation"
// 🌟 检查这里：必须带花括号，路径必须正确
import { ThemeWrapper } from "./components/ThemeWrapper" 

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UniRent",
  description: "Find your perfect student accommodation",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ConversationProvider>
            <PropertyProvider>
              <BookingProvider>
                
                {/* 🌟 ThemeWrapper 必须在 AuthProvider 里面 */}
                <ThemeWrapper>
                  <div className="pb-16">
                    {children}
                  </div>
                </ThemeWrapper>
                
                <Navigation />
                <Toaster />
              </BookingProvider>
            </PropertyProvider>
          </ConversationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}