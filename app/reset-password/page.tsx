"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff } from "lucide-react"

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const router = useRouter()
  const { changePassword } = useAuth()
  const { toast } = useToast()

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{8,}$/
    if (!regex.test(password)) {
      setPasswordError("Password must contain at least one capital letter, one special character, one number, and be 8+ characters long.")
      return false
    }
    setPasswordError(null)
    return true
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" })
      return
    }
    if (!validatePassword(newPassword)) return

    // 👇 关键修改：只传一个参数，接收布尔值结果
   const success = await changePassword("", newPassword)

    if (success) {
      toast({
        title: "Password Reset Successful",
        description: "You can now log in with your new password.",
      })
      router.push("/login")
    } else {
      toast({
        title: "Password Reset Failed",
        description: "An error occurred. Please try again later.",
        variant: "destructive",
      })
    }
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-800">Reset Password</h1>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
          <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  )
}