"use client"
import { supabase } from "@/lib/supabase"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useProperty } from "../contexts/PropertyContext"
import { CheckCircle2, Loader2 } from "lucide-react"

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { properties } = useProperty()

  const [isProcessing, setIsProcessing] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)

  const propertyId = searchParams.get("propertyId")
  const totalAmount = searchParams.get("totalAmount")
  const paymentMethod = searchParams.get("method")

  const property = properties.find(p => String(p.id) === propertyId)

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // 1. 模拟银行处理时间
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // 2. 🌟 核心：更新 Supabase 状态
      const pId = isNaN(Number(propertyId)) ? propertyId : Number(propertyId)
      const { data: latestBooking, error: findError } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', pId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (findError || !latestBooking) throw new Error("Order not found.")

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' }) // 🌟 变更为已确认，从此锁定日期！
        .eq('id', latestBooking.id)

      if (updateError) throw updateError

      setShowReceipt(true)
      toast({ title: "Payment Success!", description: "Room reserved." })
      
    } catch (err: any) {
      alert(`Payment Failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const Receipt = () => (
    <Card className="mt-4 max-w-md mx-auto text-center py-6 shadow-2xl rounded-3xl border-none">
      <CardHeader>
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-2" />
        <CardTitle className="text-2xl font-black">Payment Receipt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-left bg-gray-50 p-6 mx-6 rounded-2xl mb-6 text-black">
        <p className="flex justify-between"><strong>Property:</strong> <span>{property?.name || propertyId}</span></p>
        <p className="flex justify-between"><strong>Total:</strong> <span className="font-bold text-blue-600">RM {totalAmount}</span></p>
        <p className="flex justify-between text-xs"><strong>Method:</strong> <span className="uppercase">{paymentMethod}</span></p>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-blue-600 h-12 font-bold" onClick={() => router.push("/booking-history")}>View My History</Button>
      </CardFooter>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 pt-10 text-black">
      {!showReceipt ? (
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-blue-600 text-white">
              <CardTitle>Enter Payment Details</CardTitle>
            </CardHeader>
            <form onSubmit={handlePayment}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="card_number" className="font-bold">Card Number</Label>
                  <Input id="card_number" placeholder="1234 5678 9012 3456" className="h-12" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="font-bold">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" className="h-12" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="font-bold">CVV</Label>
                    <Input id="cvv" placeholder="123" className="h-12" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-bold">Name on Card</Label>
                  <Input id="name" placeholder="Full Name" className="h-12" required />
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-xl text-lg font-black" type="submit" disabled={isProcessing}>
                  {isProcessing ? <><Loader2 className="animate-spin mr-2"/>Processing...</> : `Pay RM ${totalAmount}`}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      ) : ( <Receipt /> )}
    </div>
  )
}