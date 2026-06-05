"use client"

import { supabase } from "@/lib/supabase"
import { useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useProperty } from "../contexts/PropertyContext"
import { useAuth } from "../contexts/AuthContext"
import { CheckCircle2, Loader2, Printer, Download, QrCode, ShieldCheck } from "lucide-react"

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { properties } = useProperty()
  const { user } = useAuth()

  const [isProcessing, setIsProcessing] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [transactionId, setTransactionId] = useState("")

  const propertyId = searchParams.get("propertyId")
  const totalAmount = searchParams.get("totalAmount")
  const paymentMethod = searchParams.get("method")

  const property = properties.find(p => String(p.id) === propertyId)

  // 🌟 生成模拟交易 ID
  const generateTxId = () => "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase()

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const txId = generateTxId()
      const pId = isNaN(Number(propertyId)) ? propertyId : Number(propertyId)

      // 🌟 更新数据库：确认订单
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
        .update({ 
          status: 'confirmed',
        })
        .eq('id', latestBooking.id)

      if (updateError) throw updateError

      setTransactionId(txId)
      setShowReceipt(true)
      toast({ title: "Payment Successful!", description: "Your receipt has been generated." })
      
    } catch (err: any) {
      alert(`Payment Failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // 🌟 打印功能
  const handlePrint = () => {
    window.print()
  }

  // 🌟 正式收据组件
  const Receipt = () => (
    <div className="max-w-xl mx-auto py-10 px-4">
      <Card className="bg-white text-black shadow-2xl rounded-none border-t-8 border-t-blue-600 relative overflow-hidden print:shadow-none print:border-t-0">
        <div className="absolute -right-4 top-10 opacity-10 -rotate-12 pointer-events-none">
          <CheckCircle2 className="w-64 h-64 text-green-600" />
        </div>

        <CardHeader className="text-center border-b border-dashed pb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl">U</div>
          </div>
          <CardTitle className="text-2xl font-black tracking-tighter uppercase">Official Receipt</CardTitle>
          <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1">UniRent Housing Solutions</p>
        </CardHeader>

        <CardContent className="pt-8 space-y-6">
          <div className="flex justify-between items-start text-sm">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Issued To</p>
              <p className="font-black">{user?.username || "Valued Tenant"}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 font-bold uppercase text-[10px]">Date & Time</p>
              <p className="font-bold text-xs">{new Date().toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between pb-2 border-b border-gray-200">
              <span className="text-xs text-gray-500 font-bold">Transaction Reference</span>
              <span className="text-xs font-mono font-black">{transactionId}</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-black text-slate-800">{property?.name}</p>
                <p className="text-[10px] text-gray-400 font-bold italic">Accommodation Booking Fee</p>
              </div>
              <p className="font-black text-lg">RM {totalAmount}</p>
            </div>
          </div>

          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
                <QrCode className="w-12 h-12 text-slate-300" />
                <div className="text-[9px] text-gray-400 leading-tight">
                    Scan to verify<br/>authenticity
                </div>
            </div>
            <div className="text-right">
                <p className="text-xs font-bold text-blue-600 uppercase">Status: PAID</p>
                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-500 font-bold">
                    <ShieldCheck className="w-3 h-3" /> Secure Transaction
                </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pb-8 border-t border-dashed mt-4 pt-6 bg-slate-50/50 print:hidden">
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1 rounded-xl font-bold gap-2" onClick={handlePrint}>
                <Printer className="w-4 h-4" /> Print PDF
            </Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl font-black" onClick={() => router.push("/booking-history")}>
                Done
            </Button>
          </div>
          <p className="text-[9px] text-gray-400 text-center font-medium uppercase">Thank you for choosing UniRent. Keep this receipt for your records.</p>
        </CardFooter>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 pt-10 text-black">
      {!showReceipt ? (
        <div className="max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 mb-4 justify-center">
             <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
             <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Secure Checkout</p>
             <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
          </div>

          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white p-8 text-center">
              <CardTitle className="text-2xl font-black">Payment Details</CardTitle>
              <p className="text-xs text-slate-400 font-bold mt-1 opacity-80 uppercase tracking-widest">Payable: RM {totalAmount}</p>
            </CardHeader>
            <form onSubmit={handlePayment}>
              <CardContent className="space-y-5 p-8">
                <div className="space-y-2">
                  <Label htmlFor="card_number" className="font-black text-xs uppercase text-slate-400 ml-1">Card Number</Label>
                  <Input id="card_number" placeholder="xxxx xxxx xxxx xxxx" className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner text-lg font-mono" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="font-black text-xs uppercase text-slate-400 ml-1">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="font-black text-xs uppercase text-slate-400 ml-1">CVV</Label>
                    <Input id="cvv" type="password" placeholder="***" className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-black text-xs uppercase text-slate-400 ml-1">Cardholder Name</Label>
                  <Input id="name" placeholder="Full Name" className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" required />
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-2xl text-xl font-black shadow-xl shadow-blue-200 transition-all active:scale-95" type="submit" disabled={isProcessing}>
                  {isProcessing ? <><Loader2 className="animate-spin mr-2 h-6 w-6"/>Processing...</> : `Confirm Payment`}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          {/* 🌟 终极修复：使用全球开发者专用的 Iconify API，绝对不会被拦截，且自带高清颜色 */}
          <div className="flex items-center justify-center gap-6 mt-6">
             <img 
               src="https://api.iconify.design/logos:visa.svg" 
               className="h-5 object-contain opacity-80 hover:opacity-100 transition-opacity" 
               alt="Visa" 
             />
             <img 
               src="https://api.iconify.design/logos:mastercard.svg" 
               className="h-7 object-contain opacity-80 hover:opacity-100 transition-opacity" 
               alt="Mastercard" 
             />
          </div>

        </div>
      ) : ( <Receipt /> )}
    </div>
  )
}