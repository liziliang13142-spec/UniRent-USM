"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase" // 🌟 确保路径正确
import { UserCircle, ArrowLeft, Loader2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // 1. 🌟 核心函数：检查用户名是否存在于 profiles 表中
  const checkUsername = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles') // 对应你之前建立的 profiles 表
        .select('username')
        .eq('username', name)
        .maybeSingle(); // 使用 maybeSingle 防止找不到数据时抛出错误

      if (error) throw error;
      return !!data; // 找到数据返回 true，否则 false
    } catch (err) {
      console.error("Database check error:", err);
      return false;
    }
  }

  // 2. 提交处理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      toast({ title: "Input Required", description: "Please enter your username.", variant: "destructive" });
      return;
    }

    setIsLoading(true)

    // 🌟 调用检查函数，解决 "is not a function" 报错
    const userExists = await checkUsername(username)

    setIsLoading(false)

    if (userExists) {
      toast({
        title: "User Verified",
        description: "Moving to the next step...",
      })
      // 成功后跳转到验证页面
      router.push(`/verify-phone?username=${encodeURIComponent(username)}`)
    } else {
      toast({
        title: "User Not Found",
        description: "The username you entered does not exist in our campus records.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-none rounded-2xl overflow-hidden">
        {/* 顶部装饰蓝条 */}
        <div className="h-2 bg-blue-600 w-full" />
        
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="text-sm font-medium text-gray-500">Back to Login</span>
          </div>
          <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your username to verify your account and reset your password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <UserCircle className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Enter your USM Username"
                className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-200 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 italic">
              * Verification will be sent to your registered phone number.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}