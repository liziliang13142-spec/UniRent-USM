"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea" 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useProperty } from "../../../contexts/PropertyContext"
import { Upload, X, Settings } from "lucide-react" // 引入了 Settings 图标作为装饰

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { properties, updateProperty } = useProperty()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const propertyId = Number(params.id)

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    base64Image: "",
    facilities: "",
    distanceToUSM: "",
    bedrooms: "",
    bathrooms: "",
    size: "",
    description: "", 
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)

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
        description: existingProperty.description || "", 
      })
      setPreviewImage(existingProperty.image)
    }
  }, [propertyId, properties])

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

    updateProperty({
      ...existingProperty, 
      name: formData.name,
      price: Number(formData.price),
      image: formData.base64Image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=2070&q=80",
      facilities: formData.facilities.split(",").map((f) => f.trim()),
      distanceToUSM: Number(formData.distanceToUSM),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      size: formData.size,
      description: formData.description, 
    })

    toast({
      title: "Updated Successfully!",
      description: "Your property changes have been saved.",
    })
    
    router.push("/landlord/properties")
  }

  return (
    // 🌟 1. 去掉写死的 bg-gray-100，让房东背景图透出来
    <div className="min-h-screen p-4 pb-24 font-sans">
      
      {/* 🌟 2. 统一头部样式：加上半透明背景、毛玻璃和圆角 */}
      <header className="mb-6 bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl max-w-lg mx-auto border border-white/20 relative flex items-center justify-center">
        <Button variant="ghost" onClick={() => router.back()} className="absolute left-4 text-slate-500 hover:bg-white/50">
          ← Back
        </Button>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Edit Property</h1>
        </div>
      </header>
      
      {/* 🌟 3. 统一卡片样式：bg-white/90 半透明、毛玻璃特效、更大的圆角 */}
      <Card className="max-w-lg mx-auto shadow-2xl border-none bg-white/90 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
        <CardContent className="pt-8 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 🌟 4. 统一所有输入框样式：使用 bg-white/60，聚焦时变白 */}
            <div className="space-y-2 text-left">
              <Label htmlFor="name" className="text-xs font-black uppercase text-slate-700 ml-1">Property Name</Label>
              <Input id="name" name="name" required value={formData.name} onChange={handleChange} className="h-12 rounded-2xl bg-white/60 border-slate-200 focus:bg-white transition-all text-black" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-xs font-black uppercase text-slate-700 ml-1">Rent (RM/mo)</Label>
                <Input id="price" name="price" type="number" required value={formData.price} onChange={handleChange} className="h-12 rounded-2xl bg-white/60 border-slate-200 focus:bg-white transition-all text-black" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distanceToUSM" className="text-xs font-black uppercase text-slate-700 ml-1">Dist. to USM (km)</Label>
                <Input id="distanceToUSM" name="distanceToUSM" type="number" step="0.1" required value={formData.distanceToUSM} onChange={handleChange} className="h-12 rounded-2xl bg-white/60 border-slate-200 focus:bg-white transition-all text-black" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="bedrooms" className="text-xs font-black uppercase text-slate-700 ml-1">Bedrooms</Label>
                <Input id="bedrooms" name="bedrooms" type="number" required value={formData.bedrooms} onChange={handleChange} className="h-12 rounded-2xl bg-white/60 border-slate-200 focus:bg-white transition-all text-black" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms" className="text-xs font-black uppercase text-slate-700 ml-1">Bathrooms</Label>
                <Input id="bathrooms" name="bathrooms" type="number" required value={formData.bathrooms} onChange={handleChange} className="h-12 rounded-2xl bg-white/60 border-slate-200 focus:bg-white transition-all text-black" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size" className="text-xs font-black uppercase text-slate-700 ml-1">Size</Label>
                <Input id="size" name="size" required value={formData.size} onChange={handleChange} className="h-12 rounded-2xl bg-white/60 border-slate-200 focus:bg-white transition-all text-black" />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <Label htmlFor="facilities" className="text-xs font-black uppercase text-slate-700 ml-1">Facilities (comma separated)</Label>
              <Input id="facilities" name="facilities" required value={formData.facilities} onChange={handleChange} className="h-12 rounded-2xl bg-white/60 border-slate-200 focus:bg-white transition-all text-black" />
            </div>

            <div className="space-y-2 text-left">
              <Label htmlFor="description" className="text-xs font-black uppercase text-slate-700 ml-1">Detailed Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Describe nearby amenities, house rules or room options..." 
                value={formData.description} 
                onChange={handleChange} 
                className="min-h-[120px] rounded-2xl bg-white/60 border-slate-200 focus:bg-white transition-all resize-none text-black p-4 leading-relaxed"
              />
            </div>

            <div className="space-y-2 text-left">
              <Label className="text-xs font-black uppercase text-slate-700 ml-1">Property Image</Label>
              <div className="flex flex-col gap-4">
                  {previewImage ? (
                      <div className="relative w-full h-52 border-4 border-white rounded-[2rem] overflow-hidden shadow-lg">
                          <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                          <Button type="button" variant="destructive" size="icon" className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-md" onClick={handleRemoveImage}>
                              <X className="h-4 w-4" />
                          </Button>
                      </div>
                  ) : (
                      <div className="w-full h-32 border-2 border-dashed border-slate-200 bg-white/40 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all shadow-inner group" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="h-8 w-8 text-slate-300 group-hover:text-emerald-500 mb-2 transition-colors" />
                          <span className="text-xs font-bold text-slate-400">Click to upload new image</span>
                      </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6 bg-slate-900 hover:bg-black text-white font-black h-16 rounded-2xl text-lg shadow-2xl transition-all active:scale-95">
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}