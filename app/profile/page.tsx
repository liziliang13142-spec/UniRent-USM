"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "../contexts/AuthContext"
import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, Loader2, UserCircle, MapPin, Phone, Hash } from "lucide-react" 
import { supabase } from "@/lib/supabase"

export default function UserProfilePage() {
  const { user, logout, changePassword } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  
  // 🌟 状态初始化
  const [userDetails, setUserDetails] = useState({
    username: "",
    email: "",
    phone: "",      // 对应数据库字段 phone
    address: "",    // 对应数据库字段 address
    matricNo: "",   // 对应数据库字段 matric_no
  })

  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // 🌟 1. 获取个人档案逻辑
  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setIsFetching(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('username, email, phone, address, matric_no')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setUserDetails({
        username: data.username || "",
        email: data.email || user.email || "",
        phone: data.phone || "",
        address: data.address || "",
        matricNo: data.matric_no || "",
      });
    } else {
      // 如果查询失败，至少保留 Auth 里的基本信息
      setUserDetails(prev => ({ 
        ...prev, 
        username: user.username || "User", 
        email: user.email || "" 
      }));
    }
    setIsFetching(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // 🌟 2. 提交修改逻辑 (UPSERT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return;
    
    setLoading(true)
    
    // 关键点：字段名必须与数据库 profiles 表完全一致
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: userDetails.username,
        phone: userDetails.phone,        // 数据库列名是 phone
        address: userDetails.address,
        matric_no: userDetails.matricNo, // 数据库列名是 matric_no
      }, { onConflict: 'id' }); 

    setLoading(false)

    if (error) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      })
      setIsEditing(false)
      fetchProfile(); 
    }
  }

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{8,}$/
    if (!regex.test(password)) {
      setPasswordError("8+ chars, 1 Capital, 1 Number, 1 Special Char.");
      return false
    }
    setPasswordError(null)
    return true
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePassword(newPassword)) return;
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Mismatch", description: "Passwords don't match", variant: "destructive" });
      return;
    }
    const success = await changePassword(oldPassword, newPassword)
    if (success) {
      toast({ title: "Updated", description: "Password changed successfully" });
      setOldPassword(""); setNewPassword(""); setConfirmNewPassword("");
    } else {
      toast({ title: "Failed", description: "Check your old password", variant: "destructive" });
    }
  }

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-10">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 flex justify-between items-center sticky top-0 z-10 border-b border-blue-100/50">
        <Link href="/listings"><Button variant="ghost">← Dashboard</Button></Link>
        <h1 className="text-xl font-black text-blue-800 tracking-tighter">UniRent</h1>
      </header>

      <main className="p-4 max-w-md mx-auto mt-6">
        <Card className="shadow-2xl border-none bg-white/90 backdrop-blur-md overflow-hidden rounded-3xl">
          {/* 装饰条 */}
          <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-400 w-full" />
          
          <CardHeader className="text-center -mt-12">
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="w-24 h-24 border-4 border-white shadow-xl bg-white">
                <AvatarFallback className="bg-blue-50 text-blue-600 font-black text-2xl">
                  {userDetails.username?.slice(0, 2).toUpperCase() || "ME"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl font-black text-slate-800">{userDetails.username}</CardTitle>
                <p className="text-sm text-slate-400 font-bold">{userDetails.email}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Username</label>
                    <Input className="bg-slate-50 border-none rounded-xl h-11 focus:ring-2 focus:ring-blue-500" value={userDetails.username} onChange={(e) => setUserDetails({ ...userDetails, username: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Matric Number</label>
                    <Input className="bg-slate-50 border-none rounded-xl h-11 focus:ring-2 focus:ring-blue-500" value={userDetails.matricNo} onChange={(e) => setUserDetails({ ...userDetails, matricNo: e.target.value })} placeholder="e.g. 15xxxx" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Phone</label>
                    <Input className="bg-slate-50 border-none rounded-xl h-11 focus:ring-2 focus:ring-blue-500" type="tel" value={userDetails.phone} onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Address</label>
                    <Input className="bg-slate-50 border-none rounded-xl h-11 focus:ring-2 focus:ring-blue-500" value={userDetails.address} onChange={(e) => setUserDetails({ ...userDetails, address: e.target.value })} />
                  </div>
                </div>
                
                <div className="pt-4 flex flex-col gap-2">
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-2xl font-black shadow-lg shadow-blue-200" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                  <Button variant="ghost" className="w-full text-slate-400 font-bold" onClick={() => setIsEditing(false)}>Discard</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-5 animate-in fade-in">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm"><Hash className="w-5 h-5 text-blue-600"/></div>
                    <div className="text-left">
                      <p className="text-[9px] uppercase font-black text-blue-400 tracking-widest">Matric Number</p>
                      <p className="text-sm font-bold text-slate-700">{userDetails.matricNo || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm"><Phone className="w-5 h-5 text-slate-600"/></div>
                    <div className="text-left">
                      <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Phone</p>
                      <p className="text-sm font-bold text-slate-700">{userDetails.phone || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm"><MapPin className="w-5 h-5 text-slate-600"/></div>
                    <div className="text-left">
                      <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Location</p>
                      <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{userDetails.address || "Add address"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 space-y-3">
                  <Button className="w-full bg-slate-900 hover:bg-black rounded-2xl h-12 font-black shadow-xl" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl h-12 font-bold bg-white/50">Security & Privacy</Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-3xl max-w-[95vw] md:max-w-md border-none shadow-2xl">
                      <DialogHeader><DialogTitle className="text-center text-xl font-black text-slate-800">Reset Credentials</DialogTitle></DialogHeader>
                      <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
                        <Input type="password" placeholder="Current Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className="h-12 rounded-xl bg-slate-50 border-none" />
                        <Input type="password" placeholder="New Password" value={newPassword} onChange={(e) => {setNewPassword(e.target.value); validatePassword(e.target.value);}} required className="h-12 rounded-xl bg-slate-50 border-none" />
                        {passwordError && <p className="text-red-500 text-[10px] font-black px-1 uppercase tracking-tighter">{passwordError}</p>}
                        <Input type="password" placeholder="Confirm New Password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required className="h-12 rounded-xl bg-slate-50 border-none" />
                        <Button type="submit" className="w-full bg-blue-600 text-white rounded-2xl h-12 mt-2 font-black shadow-lg shadow-blue-100">Update Securely</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="ghost" className="w-full text-red-400 font-bold hover:text-red-600 hover:bg-red-50/50" onClick={handleLogout}>Terminate Session</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}