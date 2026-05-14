"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useBooking } from "../contexts/BookingContext" // 👈 引入订单管理逻辑
import { useProperty } from "../contexts/PropertyContext" // 👈 引入房源数据逻辑
import { useAuth } from "../contexts/AuthContext" // 👈 引入用户信息逻辑

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  // 从全局上下文拿到的方法和数据
  const { addBooking } = useBooking()
  const { properties } = useProperty()
  const { user } = useAuth()

  const [isProcessing, setIsProcessing] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)

  // 获取 URL 传来的预订参数
  const propertyId = Number(searchParams.get("propertyId"))
  const totalAmount = Number(searchParams.get("totalAmount"))
  const fromDate = searchParams.get("from")
  const toDate = searchParams.get("to")
  const paymentMethod = searchParams.get("method")

  // 找到对应的真实房源信息
  const property = properties.find(p => p.id === propertyId)

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // 1. 模拟支付处理延迟
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // 2. 👈 核心：支付成功后，将订单存入 BookingContext
    if (property && user) {
        addBooking({
            id: Math.random().toString(36).substr(2, 9).toUpperCase(),
            propertyId: property.id,
            propertyName: property.name,
            propertyImage: property.image,
            totalAmount: totalAmount,
            startDate: fromDate!,
            endDate: toDate!,
            status: "Upcoming",
            tenantName: user.username
        })
    }

    setIsProcessing(false)
    setShowReceipt(true)
    toast({
      title: "Payment Successful",
      description: "Your booking has been confirmed and added to your history.",
    })
  }

  // 支付成功后的收据 UI
  const Receipt = () => (
    <Card className="mt-4 max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-green-600">Payment Receipt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><strong>Property:</strong> {property?.name}</p>
        <p><strong>Dates:</strong> {new Date(fromDate!).toLocaleDateString()} - {new Date(toDate!).toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> ${totalAmount}</p>
        <p><strong>Method:</strong> {paymentMethod === 'credit_card' ? 'Credit Card' : 'PayPal'}</p>
        <p><strong>Transaction ID:</strong> {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => router.push("/booking-history")}>
          View My Bookings
        </Button>
      </CardFooter>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-20">
      <header className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>← Back</Button>
        <h1 className="text-2xl font-bold text-center text-blue-800">Payment</h1>
      </header>

      {!showReceipt ? (
        <div className="max-w-md mx-auto space-y-4">
          {/* 顶部的预订摘要 */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">You are paying for:</p>
              <h3 className="font-bold text-lg">{property?.name}</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">${totalAmount}</p>
            </CardContent>
          </Card>

          {/* 恢复你原有的支付表单 */}
          <Card>
            <CardHeader>
              <CardTitle>Enter Payment Details</CardTitle>
            </CardHeader>
            <form onSubmit={handlePayment}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card_number">Card Number</Label>
                  <Input id="card_number" placeholder="1234 5678 9012 3456" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name on Card</Label>
                  <Input id="name" placeholder="Full Name" required />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12" type="submit" disabled={isProcessing}>
                  {isProcessing ? "Processing Payment..." : `Pay $${totalAmount}`}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      ) : (
        <Receipt />
      )}
    </div>
  )
}