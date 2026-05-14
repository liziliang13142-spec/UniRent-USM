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
    router.push(
      `/payment?propertyId=${propertyId}&totalAmount=${totalAmount}&from=${fromDate}&to=${toDate}&method=${paymentMethod}`,
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="mb-6">
        <Link href={`/property/${propertyId}`}>
          <Button variant="ghost">← Back</Button>
        </Link>
        <h1 className="text-2xl font-bold text-center text-blue-800">Booking Confirmation</h1>
      </header>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold">Property ID: {propertyId}</p>
            <p className="text-sm text-gray-600">
              {new Date(fromDate!).toLocaleDateString()} - {new Date(toDate!).toLocaleDateString()}
            </p>
          </div>
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-bold">${totalAmount}</span>
          </div>
          <div>
            <Label className="text-base mb-2 block">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit_card" id="credit_card" />
                <Label htmlFor="credit_card">Credit Card</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal">PayPal</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button onClick={handlePayNow}>Pay Now</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

