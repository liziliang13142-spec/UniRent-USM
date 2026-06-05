"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea" // 🌟 引入 Textarea 适配房屋描述
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useProperty } from "../../../contexts/PropertyContext"
import { Upload, X } from "lucide-react"

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { properties, updateProperty } = useProperty()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 获取当前 URL 上的 id
  const propertyId = Number(params.id)

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
    description: "", // 🌟 新增：绑定详细描述字段
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // 👇 当页面加载时，去 context 里找到这套房源，把数据回填到表单里
  useEffect(() => {
    const existingProperty = properties.find((p) => p.id === propertyId)
    if (existingProperty) {
      setFormData({
        name: existingProperty.name,
        price: existingProperty.price.toString(),
        base64Image: existingProperty.image,
        facilities: existingProperty.facilities.join(", "),
        distanceToUSM: existingProperty.distanceToUSM.toString(),
        bedrooms: existingProperty.bedrooms ? existingProperty.bedrooms.toString() : "1",
        bathrooms: existingProperty.bathrooms ? existingProperty.bathrooms.toString() : "1",
        size: existingProperty.size || "",
        description: existingProperty.description || "", // 🌟 新增：回填云端的房屋描述
      })
      setPreviewImage(existingProperty.image)
    }
  }, [propertyId, properties])

  // 🌟 支持 Input 和 Textarea 的通用 handleChange
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
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

  const handleRemoveImage = () => {
    setPreviewImage(null)
    setFormData({ ...formData, base64Image: "" })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const existingProperty = properties.find((p) => p.id === propertyId)
    if (!existingProperty) return

    // 🌟 触发全面更新操作，将所有修改过的字段一并打包同步至云端数据库
    updateProperty({
      ...existingProperty, // 保留原有的 id, landlordId 和 views
      name: formData.name,
      price: Number(formData.price),
      image: formData.base64Image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=2070&q=80",
      facilities: formData.facilities.split(",").map((f) => f.trim()),
      distanceToUSM: Number(formData.distanceToUSM),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      size: formData.size,
      description: formData.description, // 🌟 新增：将修改后的描述同步回数据库
    })

    toast({
      title: "Updated Successfully!",
      description: "Your property changes have been saved.",
    })
    
    router.push("/landlord/properties")
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-24 font-sans">
      <header className="mb-6 flex items-center max-w-md mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">← Back</Button>
        <h1 className="text-2xl font-black text-slate-800">Edit Property</h1>
      </header>
      
      <Card className="max-w-md mx-auto border-none shadow-xl rounded-[2rem] bg-white">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="name" className="text-xs font-black uppercase text-slate-400 ml-1">Property Name</Label>
              <Input id="name" name="name" required value={formData.name} onChange={handleChange} className="h-12 rounded-xl bg-slate-50 border-none text-black" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-xs font-black uppercase text-slate-400 ml-1">Monthly Rent ($)</Label>
                <Input id="price" name="price" type="number" required value={formData.price} onChange={handleChange} className="h-12 rounded-xl bg-slate-50 border-none text-black" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distanceToUSM" className="text-xs font-black uppercase text-slate-400 ml-1">Distance to USM (km)</Label>
                <Input id="distanceToUSM" name="distanceToUSM" type="number" step="0.1" required value={formData.distanceToUSM} onChange={handleChange} className="h-12 rounded-xl bg-slate-50 border-none text-black" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="bedrooms" className="text-xs font-black uppercase text-slate-400 ml-1">Bedrooms</Label>
                <Input id="bedrooms" name="bedrooms" type="number" required value={formData.bedrooms} onChange={handleChange} className="h-12 rounded-xl bg-slate-50 border-none text-black" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms" className="text-xs font-black uppercase text-slate-400 ml-1">Bathrooms</Label>
                <Input id="bathrooms" name="bathrooms" type="number" required value={formData.bathrooms} onChange={handleChange} className="h-12 rounded-xl bg-slate-50 border-none text-black" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size" className="text-xs font-black uppercase text-slate-400 ml-1">Size</Label>
                <Input id="size" name="size" required value={formData.size} onChange={handleChange} className="h-12 rounded-xl bg-slate-50 border-none text-black" />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <Label htmlFor="facilities" className="text-xs font-black uppercase text-slate-400 ml-1">Facilities (comma separated)</Label>
              <Input id="facilities" name="facilities" required value={formData.facilities} onChange={handleChange} className="h-12 rounded-xl bg-slate-50 border-none text-black" />
            </div>

            {/* 🌟 核心增补：为房东提供详细描述和设施详情的文本编辑域 */}
            <div className="space-y-2 text-left">
              <Label htmlFor="description" className="text-xs font-black uppercase text-slate-400 ml-1">Detailed Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Describe nearby amenities, house rules or room options..." 
                value={formData.description} 
                onChange={handleChange} 
                className="min-h-[120px] rounded-xl bg-slate-50 border-none resize-none text-black p-4 leading-relaxed"
              />
            </div>

            <div className="space-y-2 text-left">
              <Label className="text-xs font-black uppercase text-slate-400 ml-1">Property Image</Label>
              <div className="flex flex-col gap-4">
                  {previewImage ? (
                      <div className="relative w-full h-48 border rounded-[2rem] overflow-hidden shadow-sm">
                          <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                          <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={handleRemoveImage}>
                              <X className="h-4 w-4" />
                          </Button>
                      </div>
                  ) : (
                      <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Click to upload new image</span>
                      </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6 h-14 rounded-2xl font-black bg-slate-900 hover:bg-black text-white shadow-xl text-lg transition-all active:scale-[0.98]">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}