import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "./contexts/AuthContext"
import { ConversationProvider } from "./contexts/ConversationContext" // 引入了你原有的聊天上下文
import { PropertyProvider } from "./contexts/PropertyContext" // 👈 这是我们刚加的
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "./components/Navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UniRent",
  description: "Find your perfect student accommodation",
  generator: 'v0.app'
}

// ... 其他 import
import { BookingProvider } from "./contexts/BookingContext"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ConversationProvider>
            <PropertyProvider>
              <BookingProvider> {/* 👈 加上这一行 */}
                <div className="pb-16">{children}</div>
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