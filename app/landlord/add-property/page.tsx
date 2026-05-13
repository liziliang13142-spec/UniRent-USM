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

    // 👇 核心修复：严格转换数据类型，确保租户页面筛选器能读懂
    addProperty({
      name: formData.name,
      price: Number(formData.price) || 0,
      image: formData.base64Image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=2070&q=80",
      facilities: formData.facilities.split(",").map((f) => f.trim()).filter(f => f !== ""), 
      distanceToUSM: parseFloat(formData.distanceToUSM) || 0, // 使用 parseFloat 支持公里数的小数点
      bedrooms: Number(formData.bedrooms) || 1,
      bathrooms: Number(formData.bathrooms) || 1,
      size: formData.size,
      landlordId: user?.username,
      reviews: [] // 初始化空评论，防止详情页报错
    })

    toast({
      title: "Success!",
      description: "Property listed! Redirecting to check the listing...",
    })
    
    // 提交后直接去租客首页检查同步情况
    router.push("/listings")
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-center text-blue-800">Post a New Property</h1>
      </header>
      
      <Card className="max-w-md mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Property Name</Label>
              <Input id="name" name="name" placeholder="e.g. Cozy Studio near USM" required value={formData.name} onChange={handleChange} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Monthly Rent ($)</Label>
                <Input id="price" name="price" type="number" placeholder="800" required value={formData.price} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distanceToUSM">Distance to USM (km)</Label>
                <Input id="distanceToUSM" name="distanceToUSM" type="number" step="0.1" placeholder="2.5" required value={formData.distanceToUSM} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" name="bedrooms" type="number" placeholder="1" required value={formData.bedrooms} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input id="bathrooms" name="bathrooms" type="number" placeholder="1" required value={formData.bathrooms} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input id="size" name="size" placeholder="30 sqm" required value={formData.size} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilities">Facilities (comma separated)</Label>
              <Input id="facilities" name="facilities" placeholder="Wi-Fi, Gym, AC" required value={formData.facilities} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Property Image</Label>
              <div className="flex flex-col gap-4">
                  {previewImage ? (
                      <div className="relative w-full h-48 border rounded-md overflow-hidden">
                          <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                          <Button 
                              type="button" 
                              variant="destructive" 
                              size="icon" 
                              className="absolute top-2 right-2 h-8 w-8 rounded-full"
                              onClick={handleRemoveImage}
                          >
                              <X className="h-4 w-4" />
                          </Button>
                      </div>
                  ) : (
                      <div 
                          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                      >
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Click to upload image</span>
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

            <Button type="submit" className="w-full mt-6 bg-blue-600 hover:bg-blue-700">List Property</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}