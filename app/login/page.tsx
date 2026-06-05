"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, Loader2, ShieldAlert, User } from "lucide-react"

import { useAuth } from "../contexts/AuthContext"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [isAdminMode, setIsAdminMode] = useState(false)

  const { login, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const finalRole = await login(username, password)

      setIsLoading(false)

      if (finalRole) {
        // 管理员模式判断
        if (isAdminMode) {
          if (finalRole.toLowerCase() === "admin") {
            toast({ title: "Admin Access Granted", description: "Welcome to Nexus Console." })
            router.push("/admin/dashboard")
          } else {
            await logout() 
            toast({ title: "Access Denied", description: "This portal is for Administrators only.", variant: "destructive" })
          }
        } 
        // 普通模式判断
        else {
          if (finalRole.toLowerCase() === "admin") {
             toast({ title: "Welcome Administrator" })
             router.push("/admin/dashboard") 
          } else if (finalRole.toLowerCase() === "landlord") {
             toast({ title: "Welcome back, Landlord!" })
             router.push("/landlord/properties")
          } else {
             toast({ title: "Login Successful" })
             router.push("/listings")
          }
        }
      } else {
        // 🌟 核心优化：这里就是你要的输错账号密码时的弹出提示
       toast({ 
  title: "Login Failed", 
  description: "Incorrect email/username or password. Please try again.", 
  variant: "destructive" 
})
      }

    } catch (error: any) {
      toast({
        title: "系统错误 (System Error)",
        description: "服务器无响应，请稍后再试。",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  const toggleMode = () => {
    setIsAdminMode(!isAdminMode)
    setUsername("")
    setPassword("")
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 font-sans transition-colors duration-500 ${isAdminMode ? 'bg-slate-950' : 'bg-gradient-to-b from-blue-100 to-blue-200'}`}>
      
      <h1 className={`text-4xl font-black mb-8 tracking-tighter transition-colors duration-500 ${isAdminMode ? 'text-emerald-500' : 'text-blue-900'}`}>
        UniRent {isAdminMode && <span className="text-xl text-slate-500 ml-2 font-mono uppercase tracking-widest">Nexus</span>}
      </h1>
      
      <div className={`w-full max-w-md rounded-2xl shadow-2xl p-8 border transition-all duration-500 ${isAdminMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white/50'}`}>
        
        <div className="flex flex-col items-center mb-6">
          {isAdminMode ? (
            <ShieldAlert className="w-12 h-12 text-emerald-500 mb-2 animate-pulse" />
          ) : null}
          <h2 className={`text-2xl font-black text-center ${isAdminMode ? 'text-white' : 'text-slate-800'}`}>
            {isAdminMode ? 'System Administration' : 'Welcome Back'}
          </h2>
          <p className={`text-xs font-bold mt-1 uppercase tracking-widest ${isAdminMode ? 'text-slate-500' : 'hidden'}`}>
            Authorized Personnel Only
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${isAdminMode ? 'text-emerald-500' : 'text-slate-500'}`}>
              {isAdminMode ? 'Admin ID' : 'Email or Username'}
            </label>
            <Input
              type="text"
              placeholder={isAdminMode ? "Enter admin email" : "e.g. user@student.usm.my"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full h-12 rounded-xl transition-colors ${isAdminMode ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 focus:border-emerald-500' : 'bg-slate-50 border-slate-200'}`}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${isAdminMode ? 'text-emerald-500' : 'text-slate-500'}`}>
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full h-12 rounded-xl pr-10 transition-colors ${isAdminMode ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 focus:border-emerald-500' : 'bg-slate-50 border-slate-200'}`}
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
              >
                {showPassword ? <EyeOff className={`h-5 w-5 ${isAdminMode ? 'text-slate-600' : 'text-slate-400'}`} /> : <Eye className={`h-5 w-5 ${isAdminMode ? 'text-slate-600' : 'text-slate-400'}`} />}
              </button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className={`w-full h-12 rounded-xl text-md font-bold shadow-lg transition-all active:scale-95 mt-2 ${isAdminMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`} 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isAdminMode ? "Authenticate Admin" : "Secure Login")}
          </Button>
        </form>
        
        {!isAdminMode && (
          <div className="mt-6 text-center space-y-2">
            <Link href="/forgot-password" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">
              Forgot Password?
            </Link>
            <div className="w-full h-[1px] bg-slate-100 my-4"></div>
            <p className="text-xs font-bold text-slate-500">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 transition-colors">
                Sign up now
              </Link>
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <button 
          onClick={toggleMode}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition-all ${isAdminMode ? 'text-slate-400 hover:bg-slate-900 hover:text-white' : 'text-blue-800/60 hover:bg-white/50 hover:text-blue-900'}`}
        >
          {isAdminMode ? (
            <><User className="w-4 h-4" /> Return to Standard Login</>
          ) : (
            <><ShieldAlert className="w-4 h-4" /> Administrator Access</>
          )}
        </button>
      </div>

    </div>
  )
}