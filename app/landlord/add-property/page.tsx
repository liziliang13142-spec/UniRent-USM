"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useProperty } from "../../contexts/PropertyContext"
import { useAuth } from "../../contexts/AuthContext"
import { Upload, X } from "lucide-react"

export default function AddPropertyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { addProperty } = useProperty()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 表单状态
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    base64Image: "", 
    facilities: "",
    distanceToUSM: "",
    bedrooms: "",
    bathrooms: "",
    size: "",
  })

  // 预览图片的 URL
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // 处理本地图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
        toast({
            title: "Invalid File",
            description: "Please upload an image file (e.g., .jpg, .png).",
            variant: "destructive",
        })
        return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setPreviewImage(base64String)
      setFormData({ ...formData, base64Image: base64String })
    }
    reader.readAsDataURL(file)
  }

  // 移除已选图片
  const handleRemoveImage = () => {
      setPreviewImage(null)
      setFormData({ ...formData, base64Image: "" })
      if (fileInputRef.current) {
          fileInputRef.current.value = ""
      }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    addProperty({
      name: formData.name,
      price: Number(formData.price) || 0,
      image: formData.base64Image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=2070&q=80",
      facilities: formData.facilities.split(",").map((f) => f.trim()).filter(f => f !== ""), 
      distanceToUSM: parseFloat(formData.distanceToUSM) || 0, 
      bedrooms: Number(formData.bedrooms) || 1,
      bathrooms: Number(formData.bathrooms) || 1,
      size: formData.size,
      landlordId: user?.username,
      reviews: [] 
    })

    toast({
      title: "Success!",
      description: "Property listed! Redirecting to check the listing...",
    })
    
    router.push("/listings")
  }

  return (
    // 🌟 1. 砸掉白墙：去掉 bg-gray-100，让房东背景图完美显露
    <div className="min-h-screen p-4 pb-24">
      
      {/* 🌟 2. 标题区也加上毛玻璃特效 */}
      <header className="mb-6 bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm max-w-md mx-auto">
        <h1 className="text-2xl font-black text-center text-slate-800 tracking-tight">Post a New Property</h1>
      </header>
      
      {/* 🌟 3. 卡片毛玻璃化：添加 bg-white/90 backdrop-blur-md */}
      <Card className="max-w-md mx-auto shadow-2xl border-none bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-6">
          <CardTitle className="text-xl font-bold">Property Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 🌟 4. 输入框半透明化：bg-white/60 focus:bg-white */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-bold">Property Name</Label>
              <Input className="bg-white/60 border-slate-200 focus:bg-white transition-colors" id="name" name="name" placeholder="e.g. Cozy Studio near USM" required value={formData.name} onChange={handleChange} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-slate-700 font-bold">Monthly Rent (RM)</Label>
                <Input className="bg-white/60 border-slate-200 focus:bg-white transition-colors" id="price" name="price" type="number" placeholder="800" required value={formData.price} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distanceToUSM" className="text-slate-700 font-bold">Distance to USM (km)</Label>
                <Input className="bg-white/60 border-slate-200 focus:bg-white transition-colors" id="distanceToUSM" name="distanceToUSM" type="number" step="0.1" placeholder="2.5" required value={formData.distanceToUSM} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms" className="text-slate-700 font-bold">Bedrooms</Label>
                <Input className="bg-white/60 border-slate-200 focus:bg-white transition-colors" id="bedrooms" name="bedrooms" type="number" placeholder="1" required value={formData.bedrooms} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms" className="text-slate-700 font-bold">Bathrooms</Label>
                <Input className="bg-white/60 border-slate-200 focus:bg-white transition-colors" id="bathrooms" name="bathrooms" type="number" placeholder="1" required value={formData.bathrooms} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size" className="text-slate-700 font-bold">Size</Label>
                <Input className="bg-white/60 border-slate-200 focus:bg-white transition-colors" id="size" name="size" placeholder="30 sqm" required value={formData.size} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilities" className="text-slate-700 font-bold">Facilities (comma separated)</Label>
              <Input className="bg-white/60 border-slate-200 focus:bg-white transition-colors" id="facilities" name="facilities" placeholder="Wi-Fi, Gym, AC" required value={formData.facilities} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-bold">Property Image</Label>
              <div className="flex flex-col gap-4">
                  {previewImage ? (
                      <div className="relative w-full h-48 border rounded-xl overflow-hidden shadow-sm">
                          <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                          <Button 
                              type="button" 
                              variant="destructive" 
                              size="icon" 
                              className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                              onClick={handleRemoveImage}
                          >
                              <X className="h-4 w-4" />
                          </Button>
                      </div>
                  ) : (
                      <div 
                          className="w-full h-32 border-2 border-dashed border-slate-300 bg-white/40 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/80 transition-colors shadow-sm"
                          onClick={() => fileInputRef.current?.click()}
                      >
                          <Upload className="h-8 w-8 text-slate-400 mb-2" />
                          <span className="text-sm font-bold text-slate-500">Click to upload image</span>
                      </div>
                  )}
                  <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                  />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6 bg-slate-800 hover:bg-slate-900 text-white font-bold h-12 rounded-xl text-lg shadow-md transition-transform active:scale-95">List Property</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}