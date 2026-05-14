"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "../contexts/AuthContext"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, Loader2, UserCircle, MapPin, Phone, Hash } from "lucide-react" // 🌟 增加图标让 UI 更专业
import { supabase } from "@/lib/supabase"

export default function UserProfilePage() {
  const { user, logout, changePassword } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  
  const [userDetails, setUserDetails] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    address: "",
    matricNo: "", 
  })

  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // 1. 获取最新资料
  const fetchProfile = async () => {
    if (!user) return;
    setIsFetching(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setUserDetails({
        username: data.username || user.username || "Student",
        email: user.email || "",
        phoneNumber: data.phone_number || "",
        address: data.address || "",
        matricNo: data.matric_no || "",
      });
    } else {
      setUserDetails(prev => ({ 
        ...prev, 
        username: user.username || "Student", 
        email: user.email || "" 
      }));
    }
    setIsFetching(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // 2. 🌟 提交到 Supabase (修正点：增加错误捕捉和反馈)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return;
    
    setLoading(true)
    
    // 关键：将本地驼峰命名映射到数据库下划线命名
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: userDetails.username,
        phone_number: userDetails.phoneNumber,
        address: userDetails.address,
        matric_no: userDetails.matricNo, // 对应 SQL 中的列
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' }); // 明确指定冲突处理

    setLoading(false)

    if (error) {
      console.error("Supabase Error:", error);
      toast({
        title: "Cloud Sync Failed",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Your profile has been saved to the cloud.",
      })
      setIsEditing(false)
      fetchProfile(); // 🌟 保存成功后立刻重新抓取，防止状态不一致
    }
  }

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{8,}$/
    if (!regex.test(password)) {
      setPasswordError("Requires: 8+ chars, 1 Capital, 1 Number, 1 Special Char.");
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
      toast({ title: "Failed", description: "Please check your old password", variant: "destructive" });
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10 border-b border-blue-100">
        <Link href="/listings"><Button variant="ghost">← Dashboard</Button></Link>
        <h1 className="text-xl font-black text-blue-800 tracking-tighter">UniRent</h1>
      </header>

      <main className="p-4 max-w-md mx-auto mt-6">
        <Card className="shadow-2xl border-none overflow-hidden rounded-2xl">
          {/* 顶部装饰条 */}
          <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-400 w-full" />
          
          <CardHeader className="text-center -mt-12">
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="w-24 h-24 border-4 border-white shadow-xl bg-white">
                <AvatarImage src="/classic-profile-icon.png" />
                <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-xl">
                  {userDetails.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">{userDetails.username}</CardTitle>
                <p className="text-sm text-gray-500 font-medium">{userDetails.email}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Username</label>
                    <Input className="bg-gray-50 border-gray-200 focus:bg-white" value={userDetails.username} onChange={(e) => setUserDetails({ ...userDetails, username: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">USM Matric No</label>
                    <Input className="bg-gray-50 border-gray-200 focus:bg-white" value={userDetails.matricNo} onChange={(e) => setUserDetails({ ...userDetails, matricNo: e.target.value })} placeholder="e.g. 21xxxx" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Phone Number</label>
                    <Input className="bg-gray-50 border-gray-200 focus:bg-white" type="tel" value={userDetails.phoneNumber} onChange={(e) => setUserDetails({ ...userDetails, phoneNumber: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Home Address</label>
                    <Input className="bg-gray-50 border-gray-200 focus:bg-white" value={userDetails.address} onChange={(e) => setUserDetails({ ...userDetails, address: e.target.value })} />
                  </div>
                </div>
                
                <div className="pt-4 flex flex-col gap-2">
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                  <Button variant="ghost" className="w-full text-gray-500" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-5 animate-in fade-in">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><Hash className="w-4 h-4 text-blue-600"/></div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Matric Number</p>
                      <p className="text-sm font-semibold text-gray-700">{userDetails.matricNo || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><Phone className="w-4 h-4 text-gray-600"/></div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Phone</p>
                      <p className="text-sm font-semibold text-gray-700">{userDetails.phoneNumber || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><MapPin className="w-4 h-4 text-gray-600"/></div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Location</p>
                      <p className="text-sm font-semibold text-gray-700 truncate max-w-[200px]">{userDetails.address || "Add address"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 space-y-2">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12 font-bold" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl h-12 font-semibold">Security Settings</Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl max-w-[90vw] md:max-w-md">
                      <DialogHeader><DialogTitle className="text-center text-xl">Reset Password</DialogTitle></DialogHeader>
                      <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
                        <Input type="password" placeholder="Current Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                        <Input type="password" placeholder="New Password" value={newPassword} onChange={(e) => {setNewPassword(e.target.value); validatePassword(e.target.value);}} required />
                        {passwordError && <p className="text-red-500 text-[10px] font-bold px-1">{passwordError}</p>}
                        <Input type="password" placeholder="Confirm New Password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
                        <Button type="submit" className="w-full bg-black text-white rounded-xl h-12 mt-2">Update Securely</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="ghost" className="w-full text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>Log Out</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}