"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Lock, CheckCircle2, Eye, EyeOff, Mail, ShieldCheck, AlertCircle } from "lucide-react"

export default function SignupPage() {
  const [step, setStep] = useState(0) 
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("") 
  const [otpToken, setOtpToken] = useState("") 
  const [role, setRole] = useState<"Tenant" | "Landlord">("Tenant")
  const [loading, setLoading] = useState(false)
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { signup, verifyOTP } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // 密码校验逻辑
  const isPasswordStrong = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{8,}$/.test(password);
  const isMatching = password === confirmPassword && confirmPassword !== "";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPasswordStrong) {
      toast({ 
        title: "Validation Failed", 
        description: "Please make sure your password meets all requirements.", 
        variant: "destructive" 
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({ 
        title: "Mismatch", 
        description: "Passwords do not match.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true)
    const success = await signup(identifier, password, role)
    setLoading(false)

    if (success) {
      setStep(1)
      toast({ title: "OTP Sent!", description: "Please check your email." })
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // 逻辑：判断是否为 USM 学生邮箱
    let email = identifier.includes('@') ? identifier : `${identifier}@student.usm.my`
    
    const success = await verifyOTP(email, otpToken)
    setLoading(false)

    // 🌟 核心修复：验证成功后自动跳转到登录页
    if (success) {
      toast({
        title: "Success",
        description: "Your account is verified. Redirecting to login...",
      })
      router.push("/") 
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative" style={{ backgroundImage: "url('/login.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <h1 className="text-4xl font-bold text-white mb-6 drop-shadow-md">UniRent</h1>

        <Card className="w-full shadow-2xl border-none rounded-md overflow-hidden animate-in fade-in slide-in-from-bottom-2 text-black bg-white">
          <CardHeader className="space-y-1 text-center pb-4 pt-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {step === 0 ? "Sign Up" : "Verify Email"}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              {step === 0 ? "Join UniRent with your email or USM details" : "Enter the code sent to your email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            {step === 0 ? (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Email or Student ID</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input placeholder="e.g. 212345 or user@gmail.com" className="pl-10 h-10 border-gray-200 text-black" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className={`pl-10 pr-10 h-10 text-black ${password !== "" && !isPasswordStrong ? "border-red-500 focus-visible:ring-red-500" : "border-gray-200"}`} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password !== "" && !isPasswordStrong && (
                    <div className="flex items-center gap-1 text-red-500 text-[10px] font-medium mt-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Requirements not met.</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Confirm Password</Label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" className={`pl-10 pr-10 h-10 text-black ${confirmPassword !== "" && !isMatching ? "border-red-500 focus-visible:ring-red-500" : "border-gray-200"}`} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <button type="button" className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword !== "" && !isMatching && (
                    <div className="flex items-center gap-1 text-red-500 text-[10px] font-medium mt-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Passwords do not match.</span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 border border-gray-100 p-3 rounded-md text-[11px] text-gray-500">
                  <p className="font-semibold text-gray-700 mb-1.5">Password must contain:</p>
                  <ul className="grid grid-cols-2 gap-y-1">
                    <li className={`flex items-center gap-1.5 ${password.length >= 8 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-green-600' : 'bg-gray-300'}`} />
                      8+ characters
                    </li>
                    <li className={`flex items-center gap-1.5 ${/[A-Z]/.test(password) ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-600' : 'bg-gray-300'}`} />
                      Capital letter
                    </li>
                    <li className={`flex items-center gap-1.5 ${/\d/.test(password) ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${/\d/.test(password) ? 'bg-green-600' : 'bg-gray-300'}`} />
                      One number
                    </li>
                    <li className={`flex items-center gap-1.5 ${/[!@#$%^&*]/.test(password) ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*]/.test(password) ? 'bg-green-600' : 'bg-gray-300'}`} />
                      Special char
                    </li>
                  </ul>
                </div>

                <div className="space-y-2 pt-1">
                  <Label className="text-sm font-medium text-gray-700">I am a...</Label>
                  <RadioGroup value={role} onValueChange={(value: "Tenant" | "Landlord") => setRole(value)} className="flex gap-4">
                    <div className="flex items-center space-x-2 bg-white border p-2.5 rounded-md flex-1 cursor-pointer border-gray-200">
                      <RadioGroupItem value="Tenant" id="tenant" />
                      <Label htmlFor="tenant" className="cursor-pointer text-sm font-medium text-gray-900">Tenant</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-white border p-2.5 rounded-md flex-1 cursor-pointer border-gray-200">
                      <RadioGroupItem value="Landlord" id="landlord" />
                      <Label htmlFor="landlord" className="cursor-pointer text-sm font-medium text-gray-900">Landlord</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button type="submit" className="w-full bg-[#18181b] hover:bg-black text-white h-10 text-sm font-medium rounded-md mt-4 shadow-md transition-all active:scale-[0.98]" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6 py-4">
                <div className="text-center space-y-2">
                  <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="text-blue-600 w-6 h-6" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Verify email for: <br/>
                    <span className="font-semibold text-black">{identifier.includes('@') ? identifier : `${identifier}@student.usm.my`}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Input type="text" maxLength={8} placeholder="00000000" className="text-center text-2xl tracking-[0.2em] font-bold h-14 border-gray-300 focus:border-blue-600 text-black" value={otpToken} onChange={(e) => setOtpToken(e.target.value)} required />
                </div>

                <div className="space-y-3">
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-bold rounded-md" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Account"}
                  </Button>
                  <button type="button" className="text-xs text-gray-500 w-full hover:underline font-medium" onClick={() => setStep(0)}>
                    ← Back to edit details
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-500">Already have an account? </span>
              <Link href="/" className="text-blue-600 font-semibold hover:underline">Log In</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}