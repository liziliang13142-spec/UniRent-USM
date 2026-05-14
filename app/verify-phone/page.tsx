"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

export default function VerifyPhonePage() {
  const [verificationCode, setVerificationCode] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const username = searchParams.get("username")
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would verify the code here
    // For this example, we'll assume all codes are valid
    toast({
      title: "Verification Successful",
      description: "You can now reset your password.",
    })
    router.push(`/reset-password?username=${encodeURIComponent(username || "")}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-800 mb-8">UniRent</h1>
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-center mb-6">Verify Phone Number</h2>
        <p className="text-center mb-4">
          We've sent a verification code to the phone number associated with your account.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full"
          />
          <Button type="submit" className="w-full">
            Verify
          </Button>
        </form>
      </div>
    </div>
  )
}

