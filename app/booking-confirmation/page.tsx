"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function BookingConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card")

  const propertyId = searchParams.get("propertyId")
  const totalAmount = searchParams.get("totalAmount")
  const fromDate = searchParams.get("from")
  const toDate = searchParams.get("to")

  const handlePayNow = () => {
    // 🌟 将所有参数带到支付表单页
    router.push(
      `/payment?propertyId=${propertyId}&totalAmount=${totalAmount}&from=${fromDate || ""}&to=${toDate || ""}&method=${paymentMethod}`
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-12">
      <Card className="max-w-md mx-auto shadow-lg border-none rounded-2xl">
        <CardHeader className="bg-blue-600 text-white rounded-t-2xl">
          <Button variant="ghost" className="text-white w-fit -ml-4 hover:bg-blue-700" onClick={() => router.back()}>← Back</Button>
          <CardTitle className="text-2xl mt-2">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 text-black">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="font-bold">Property ID: {propertyId}</p>
            {fromDate && toDate && (
              <p className="text-sm text-gray-600 mt-1">
                {new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border">
            <span className="font-semibold text-gray-500">Total Amount:</span>
            <span className="font-black text-2xl text-blue-600">RM {totalAmount}</span>
          </div>
          <div>
            <Label className="text-base font-bold mb-3 block">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
              <div className="flex items-center space-x-3 border p-3 rounded-xl bg-white hover:border-blue-500">
                <RadioGroupItem value="credit_card" id="credit_card" />
                <Label htmlFor="credit_card" className="font-bold cursor-pointer w-full text-black">Credit Card / FPX</Label>
              </div>
              <div className="flex items-center space-x-3 border p-3 rounded-xl bg-white hover:border-blue-500">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="font-bold cursor-pointer w-full text-black">PayPal</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4 pb-6 px-6">
          <Button variant="outline" className="w-1/3 rounded-xl h-12 font-bold" onClick={() => router.back()}>Back</Button>
          <Button className="w-2/3 rounded-xl h-12 font-bold bg-blue-600 hover:bg-blue-700" onClick={handlePayNow}>Pay Now</Button>
        </CardFooter>
      </Card>
    </div>
  )
}