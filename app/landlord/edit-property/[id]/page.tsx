"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
        bedrooms: existingProperty.bedrooms.toString(),
        bathrooms: existingProperty.bathrooms.toString(),
        size: existingProperty.size,
      })
      setPreviewImage(existingProperty.image)
    }
  }, [propertyId, properties])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // 触发更新操作
    updateProperty({
      ...existingProperty, // 保留原有的 id 和 landlordId
      name: formData.name,
      price: Number(formData.price),
      image: formData.base64Image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=2070&q=80",
      facilities: formData.facilities.split(",").map((f) => f.trim()),
      distanceToUSM: Number(formData.distanceToUSM),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      size: formData.size,
    })

    toast({
      title: "Updated Successfully!",
      description: "Your property changes have been saved.",
    })
    
    router.push("/landlord/properties")
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-24">
      <header className="mb-6 flex items-center">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">← Back</Button>
        <h1 className="text-2xl font-bold text-blue-800">Edit Property</h1>
      </header>
      
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Property Name</Label>
              <Input id="name" name="name" required value={formData.name} onChange={handleChange} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Monthly Rent ($)</Label>
                <Input id="price" name="price" type="number" required value={formData.price} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distanceToUSM">Distance to USM (km)</Label>
                <Input id="distanceToUSM" name="distanceToUSM" type="number" step="0.1" required value={formData.distanceToUSM} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" name="bedrooms" type="number" required value={formData.bedrooms} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input id="bathrooms" name="bathrooms" type="number" required value={formData.bathrooms} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input id="size" name="size" required value={formData.size} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilities">Facilities (comma separated)</Label>
              <Input id="facilities" name="facilities" required value={formData.facilities} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Property Image</Label>
              <div className="flex flex-col gap-4">
                  {previewImage ? (
                      <div className="relative w-full h-48 border rounded-md overflow-hidden">
                          <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                          <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={handleRemoveImage}>
                              <X className="h-4 w-4" />
                          </Button>
                      </div>
                  ) : (
                      <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Click to upload new image</span>
                      </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}