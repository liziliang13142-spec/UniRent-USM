"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

// 1. 定义用户数据结构
type User = {
  id: string
  email: string
  username: string
  role: "Tenant" | "Landlord" | "Admin"
  is_usm_student: boolean
}

// 2. 定义功能接口
type AuthContextType = {
  user: User | null;
  login: (identifier: string, password: string) => Promise<User['role'] | false>;
  signup: (identifier: string, password: string, role: string) => Promise<boolean>;
  verifyOTP: (email: string, token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 3. 初始化：检查当前登录状态
  useEffect(() => {
    const initAuth = async () => {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      
      if (supabaseUser) {
        // 🌟 核心修复 1: 强行从数据库 profiles 表里拉取最新用户名
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', supabaseUser.id)
          .single()

        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email!,
          // 优先使用数据库里的名字，如果没有再用缓存，最后 fallback 到 User
          username: profile?.username || supabaseUser.user_metadata?.username || "User",
          role: supabaseUser.user_metadata?.role,
          is_usm_student: supabaseUser.user_metadata?.is_usm_student || false,
        })
      }
      setLoading(false)
    }

    initAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        router.push("/")
      } else if (event === 'SIGNED_IN' && session?.user) {
        // 🌟 核心修复 2: 登录事件触发时，也强行拉取数据库名字
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single()

        setUser({
          id: session.user.id,
          email: session.user.email!,
          username: profile?.username || session.user.user_metadata?.username || "User",
          role: session.user.user_metadata?.role,
          is_usm_student: session.user.user_metadata?.is_usm_student || false,
        })
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  // 4. 注册逻辑
  const signup = async (identifier: string, password: string, role: string): Promise<boolean> => {
    let email: string;
    let username: string;
    let isStudent = false;

    if (!identifier.includes('@')) {
      email = `${identifier.trim()}@student.usm.my`;
      username = identifier.trim();
      isStudent = true; 
    } else {
      email = identifier.trim();
      username = identifier.split('@')[0];
      isStudent = email.toLowerCase().endsWith('@student.usm.my');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          username, 
          role,
          is_usm_student: isStudent 
        },
      }
    })

    if (error) {
      alert("Signup Error: " + error.message)
      return false
    }
    return !!data.user
  }

  // 5. 验证 6 位 OTP
  const verifyOTP = async (email: string, token: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup' 
    })

    if (error) {
      alert("Verification failed: " + error.message)
      return false
    }

    if (data.user) {
      alert("Success! Your account is verified.")
      return true
    }
    return false
  }

  // 6. 登录逻辑
  const login = async (identifier: string, password: string): Promise<User['role'] | false> => {
    try {
      let email = identifier.includes('@') ? identifier : `${identifier}@student.usm.my`
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // 🌟 核心修复 3: 手动调用 login 时，也拉取最新的名字
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.user.id)
          .single()

        const userRole = data.user.user_metadata?.role || "Tenant"
        setUser({
          id: data.user.id,
          email: data.user.email!,
          username: profile?.username || data.user.user_metadata?.username || "User",
          role: userRole,
          is_usm_student: data.user.user_metadata?.is_usm_student || false
        })
        
        return userRole 
      }
      return false
    } catch (error: any) {
      console.error("Login Error:", error)
      return false
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
  }

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (user?.email) {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });
      if (reauthError) return false;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return !error
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, verifyOTP, logout, changePassword }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}