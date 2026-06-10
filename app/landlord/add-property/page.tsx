"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useProperty } from "../../contexts/PropertyContext"
import { useAuth } from "../../contexts/AuthContext"
import { 
  Upload, X, Wifi, Wind, Car, Waves, Maximize, 
  Home, CheckCircle2, Loader2, MapPin 
} from "lucide-react"

// 🌟 标准化选项，确保与租户筛选功能完美对齐
const AREA_OPTIONS = ["Sungai Dua", "Minden", "Bukit Jambul", "Gelugor", "Bayan Lepas"]
const FACILITY_OPTIONS = [
  { id: "Wifi", label: "Wifi", icon: <Wifi className="w-4 h-4" /> },
  { id: "Aircon", label: "AC", icon: <Wind className="w-4 h-4" /> },
  { id: "Parking", label: "Parking", icon: <Car className="w-4 h-4" /> },
  { id: "Swimming Pool", label: "Pool", icon: <Waves className="w-4 h-4" /> },
  { id: "Gym", label: "Gym", icon: <Maximize className="w-4 h-4" /> },
]

export default function AddPropertyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { addProperty } = useProperty()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // 表单状态
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    base64Image: "", 
    distanceToUSM: "",
    bedrooms: "1",
    bathrooms: "1",
    size: "",
    area: "",
    description: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // 🌟 处理本地图片上传并转为 Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File", description: "Please upload an image.", variant: "destructive" })
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

  const toggleFacility = (id: string) => {
    setSelectedFacilities(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.base64Image) {
      toast({ title: "Photo Required", description: "Please upload a property image.", variant: "destructive" })
      return
    }
    if (!formData.area) {
      toast({ title: "Area Required", description: "Please select the location area.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      await addProperty({
        name: formData.name,
        price: Number(formData.price) || 0,
        image: formData.base64Image,
        facilities: selectedFacilities, // 🌟 发送数组
        distanceToUSM: parseFloat(formData.distanceToUSM) || 0, 
        bedrooms: Number(formData.bedrooms) || 1,
        bathrooms: Number(formData.bathrooms) || 1,
        size: formData.size,
        landlordId: user?.id || user?.username,
        // @ts-ignore (为了兼容你可能尚未更新的类型)
        area: formData.area,
        description: formData.description
      })

      toast({ title: "Success!", description: "Your property is now live!" })
      router.push("/landlord/properties")
    } catch (err) {
      toast({ title: "Error", description: "Failed to list property.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    // 🌟 1. 砸掉白墙：保留透明背景，露出房东背景图
    <div className="min-h-screen p-4 pb-24 font-sans">
      
      {/* 🌟 2. 标题区：毛玻璃特效 */}
      <header className="mb-6 bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl max-w-lg mx-auto border border-white/20">
        <div className="flex items-center gap-3 justify-center">
          <Home className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Post Property</h1>
        </div>
      </header>
      
      {/* 🌟 3. 卡片毛玻璃化 */}
      <Card className="max-w-lg mx-auto shadow-2xl border-none bg-white/90 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-7">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Property Details
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 物业名称 */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-black text-xs uppercase ml-1">Property Name</Label>
              <Input 
                className="bg-white/60 border-slate-200 focus:bg-white h-12 rounded-2xl transition-all" 
                id="name" name="name" placeholder="e.g. Minden Heights Studio" required 
                value={formData.name} onChange={handleChange} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-slate-700 font-black text-xs uppercase ml-1">Rent (RM/mo)</Label>
                <Input className="bg-white/60 border-slate-200 h-12 rounded-2xl" id="price" name="price" type="number" required value={formData.price} onChange={handleChange} />
              </div>
              {/* 🌟 区域下拉框：确保租户能按区域搜到 */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-black text-xs uppercase ml-1">Location Area</Label>
                <Select onValueChange={(v) => setFormData({...formData, area: v})} required>
                  <SelectTrigger className="bg-white/60 border-slate-200 h-12 rounded-2xl font-bold">
                    <SelectValue placeholder="Select Area" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREA_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label className="text-slate-700 font-black text-xs uppercase ml-1">Dist. to USM (km)</Label>
                <Input className="bg-white/60 border-slate-200 h-12 rounded-2xl" name="distanceToUSM" type="number" step="0.1" required value={formData.distanceToUSM} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-black text-xs uppercase ml-1">Size (e.g. 500sqft)</Label>
                <Input className="bg-white/60 border-slate-200 h-12 rounded-2xl" name="size" required value={formData.size} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-black text-xs uppercase ml-1">Bedrooms</Label>
                <Input className="bg-white/60 border-slate-200 h-12 rounded-2xl" name="bedrooms" type="number" required value={formData.bedrooms} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-black text-xs uppercase ml-1">Bathrooms</Label>
                <Input className="bg-white/60 border-slate-200 h-12 rounded-2xl" name="bathrooms" type="number" required value={formData.bathrooms} onChange={handleChange} />
              </div>
            </div>

            {/* 🌟 设施勾选：不再输入文字，直接点图标 */}
            <div className="space-y-3">
              <Label className="text-slate-700 font-black text-xs uppercase ml-1">Facilities</Label>
              <div className="grid grid-cols-3 gap-2">
                {FACILITY_OPTIONS.map((f) => (
                  <div 
                    key={f.id}
                    onClick={() => toggleFacility(f.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedFacilities.includes(f.id) 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-inner' 
                      : 'border-slate-100 bg-white/40 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {f.icon}
                    <span className="text-[10px] font-bold mt-1 uppercase">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 图片上传 */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-black text-xs uppercase ml-1">Property Image</Label>
              <div className="flex flex-col gap-4">
                  {previewImage ? (
                      <div className="relative w-full h-52 border-4 border-white rounded-[2rem] overflow-hidden shadow-lg">
                          <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                          <Button 
                            type="button" variant="destructive" size="icon" 
                            className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-md"
                            onClick={handleRemoveImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                      </div>
                  ) : (
                      <div 
                          className="w-full h-32 border-2 border-dashed border-slate-200 bg-white/40 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all shadow-inner group"
                          onClick={() => fileInputRef.current?.click()}
                      >
                          <Upload className="h-8 w-8 text-slate-300 group-hover:text-emerald-500 mb-2 transition-colors" />
                          <span className="text-xs font-bold text-slate-400">Upload Local Photo</span>
                      </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              </div>
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-black text-xs uppercase ml-1">Description</Label>
              <Textarea 
                className="bg-white/60 border-slate-200 focus:bg-white rounded-2xl min-h-[100px]" 
                name="description" placeholder="Nearby amenities, house rules..." 
                value={formData.description} onChange={handleChange} 
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 bg-slate-900 hover:bg-black text-white font-black h-16 rounded-2xl text-lg shadow-2xl transition-all active:scale-95"
            >
              {loading ? <><Loader2 className="animate-spin mr-2" /> Listing...</> : "🚀 List Property Now"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}