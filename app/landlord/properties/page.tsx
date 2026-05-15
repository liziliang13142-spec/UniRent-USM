"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useProperty } from "../../contexts/PropertyContext"
import { useAuth } from "../../contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { Building2, Plus, Edit, Trash2, MapPin, BedDouble, Bath, Maximize } from "lucide-react"

export default function MyPropertiesPage() {
  const { properties, deleteProperty } = useProperty()
  const { user } = useAuth()
  const { toast } = useToast() 

  // 🌟 只提取当前房东的房源
  const myProperties = properties.filter((prop) => prop.landlordId === user?.username)

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to PERMANENTLY delete this property?")) {
      deleteProperty(id)
      toast({
        title: "Deleted Successfully",
        description: "The property has been removed from your portfolio.",
        variant: "destructive"
      })
    }
  }

  return (
    // 🌟 修复后的最外层容器：属性全部写在尖括号内
    <div 
      className="min-h-screen pb-24 font-sans text-slate-900 bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('/fangdong.jpg')" }}
    >
      {/* 🌟 增加一层深色蒙层 (bg-slate-900/20)，让你的房东后台看起来更高级 */}
      <div className="min-h-screen bg-slate-900/20 backdrop-blur-[1px]">
        
        <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 border-b border-slate-700">
          <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight">UniRent</h1>
              <span className="bg-emerald-500 text-white text-[10px] px-2 py-1 rounded tracking-widest font-bold shadow-sm">
                LANDLORD PORTAL
              </span>
            </div>
            <div className="text-sm font-medium text-slate-300 hidden md:flex items-center gap-2">
              Welcome, <span className="text-white font-bold">{user?.username || 'Landlord'}</span>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto p-6 mt-4">
          
          {/* 📐 标题栏：白色背景盒子 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 bg-white/95 p-6 rounded-2xl shadow-sm border border-slate-200 backdrop-blur-md">
            <div>
              <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                My Portfolio
              </h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">Manage your listed properties and track assets.</p>
            </div>
            
            <Link href="/landlord/add-property" className="shrink-0">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-[44px] px-6 rounded-xl shadow-md flex items-center justify-center gap-2 w-full transition-transform active:scale-95">
                <Plus className="w-5 h-5" /> Add Property
              </Button>
            </Link>
          </div>

          {/* 🌟 房源卡片网格 */}
          {myProperties.length === 0 ? (
            <div className="text-center py-24 bg-white/80 rounded-2xl border border-dashed border-slate-300 shadow-sm backdrop-blur-md">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800">No properties to display</h2>
              <p className="text-slate-500 mt-2">You haven't listed any properties yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myProperties.map((property) => (
                <Card key={property.id} className="border border-slate-200 shadow-sm overflow-hidden bg-white/95 rounded-2xl flex flex-col transition-all hover:shadow-xl group backdrop-blur-sm">
                  <CardContent className="p-0 relative flex-grow">
                    <div className="absolute top-3 left-3 flex gap-2 z-10">
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-md uppercase tracking-tighter">
                        Active
                      </span>
                      <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded">
                        RM {property.price}
                      </span>
                    </div>
                    
                    <div className="w-full h-44 overflow-hidden">
                      <img 
                        src={property.image || "/placeholder.svg"} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 line-clamp-1">{property.name}</h3>
                      <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {property.distanceToUSM}km to USM
                      </p>
                      
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="bg-slate-50 p-1.5 rounded-lg text-center border border-slate-100">
                          <BedDouble className="w-3 h-3 mx-auto text-slate-400 mb-0.5" />
                          <span className="text-[10px] font-bold text-slate-700">{property.bedrooms} Bed</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg text-center border border-slate-100">
                          <Bath className="w-3 h-3 mx-auto text-slate-400 mb-0.5" />
                          <span className="text-[10px] font-bold text-slate-700">{property.bathrooms} Bath</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg text-center border border-slate-100">
                          <Maximize className="w-3 h-3 mx-auto text-slate-400 mb-0.5" />
                          <span className="text-[10px] font-bold text-slate-700 truncate block">{property.size}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="bg-slate-50/80 p-3 flex gap-2 border-t border-slate-200">
                    <Link href={`/landlord/edit-property/${property.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full border-slate-300 font-bold h-9 bg-white">
                        <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-bold h-9 bg-white" 
                      onClick={() => handleDelete(property.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}