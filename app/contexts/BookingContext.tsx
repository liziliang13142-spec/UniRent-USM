"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"

// 定义单条订购记录的数据结构
export type Booking = {
  id: string
  propertyId: number
  propertyName: string
  propertyImage: string
  totalAmount: number
  startDate: string
  endDate: string
  status: "Upcoming" | "Completed" | "Cancelled"
  tenantName: string
}

// 定义 Context 的类型，包含数据列表、添加方法和删除方法
type BookingContextType = {
  bookings: Booking[]
  addBooking: (booking: Booking) => void
  deleteBooking: (id: string) => void // 👈 1. 新增删除方法的定义
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export const useBooking = () => {
  const context = useContext(BookingContext)
  if (!context) throw new Error("useBooking must be used within a BookingProvider")
  return context
}

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([])

  // 页面加载时从浏览器本地存储 (localStorage) 读取已保存的订单
  useEffect(() => {
    const saved = localStorage.getItem("bookings")
    if (saved) {
      try {
        setBookings(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse bookings", e)
      }
    }
  }, [])

  // 添加订单的方法
  const addBooking = (newBooking: Booking) => {
    setBookings((prev) => {
      const updated = [newBooking, ...prev]
      localStorage.setItem("bookings", JSON.stringify(updated))
      return updated
    })
  }

  // 👇 2. 实现具体的删除逻辑：过滤掉要删除的 id，并更新本地存储
  const deleteBooking = (id: string) => {
    setBookings((prev) => {
      const updated = prev.filter((booking) => booking.id !== id)
      localStorage.setItem("bookings", JSON.stringify(updated))
      return updated
    })
  }

  return (
    // 👇 3. 将所有数据和方法暴露给全站使用
    <BookingContext.Provider value={{ bookings, addBooking, deleteBooking }}>
      {children}
    </BookingContext.Provider>
  )
}