"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useProperty } from "../../contexts/PropertyContext"
import { useAuth } from "../../contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { 
  Building2, Plus, Edit, Trash2, MapPin, 
  BedDouble, Bath, Maximize, BarChart3, 
  CalendarCheck, DollarSign, Eye, LayoutDashboard,
  TrendingUp, Users, ExternalLink
} from "lucide-react"

export default function MyPropertiesPage() {
  const { properties, deleteProperty } = useProperty()
  const { user } = useAuth()
  const { toast } = useToast() 

  const myProperties = properties.filter((prop) => 
    prop.landlordId === user?.id || prop.landlordId === user?.username
  )

  const stats = {
    total: myProperties.length,
    views: myProperties.reduce((sum, p) => sum + (Number(p.views) || 0), 0),
    income: myProperties.reduce((sum, p) => sum + (Number(p.price) || 0), 0)
  }

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to PERMANENTLY delete this property?")) {
      deleteProperty(id)
      toast({ title: "Deleted", description: "Property removed from cloud.", variant: "destructive" })
    }
  }

  return (
    <div 
      className="min-h-screen pb-24 font-sans text-slate-900 bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('/fangdong.jpg')" }}
    >
      <div className="min-h-screen bg-slate-900/40 backdrop-blur-[2px]">
        
        <header className="bg-slate-900/90 text-white shadow-xl sticky top-0 z-50 border-b border-slate-700 backdrop-blur-md">
          <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20">U</div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-none">UniRent</h1>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Management Pro</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/landlord/viewing-management">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-10 rounded-xl shadow-lg flex items-center gap-2 px-4 transition-all active:scale-95 border-none">
                  <CalendarCheck className="w-4 h-4" />
                  <span className="hidden md:inline text-xs">Manage Viewings</span>
                </Button>
              </Link>

              <div className="h-8 w-[1px] bg-slate-700 hidden sm:block"></div>

              <div className="flex items-center gap-3 hidden sm:flex">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Authorized</p>
                  <p className="text-sm font-black text-white">{user?.username || 'Landlord'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold">
                   {user?.username?.charAt(0).toUpperCase() || 'L'}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto p-6 mt-4 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400"><Building2 /></div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase">Total Assets</p>
                <p className="text-xl font-black text-white">{stats.total} Units</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400"><Eye /></div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase">Market Exposure</p>
                <p className="text-xl font-black text-white">{stats.views} Views</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400"><DollarSign /></div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase">Monthly Revenue</p>
                <p className="text-xl font-black text-white">RM {stats.income}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/95 p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 backdrop-blur-md">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <LayoutDashboard className="text-emerald-500" /> My Real Estate Portfolio
              </h2>
              <p className="text-slate-500 text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Tracking performance and assets in real-time.
              </p>
            </div>
            
            <div className="flex flex-row gap-4">
              <Link href="/landlord/market-analysis" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white bg-white font-black h-14 px-8 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 group">
                  <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                  <span>Market Analysis</span>
                </Button>
              </Link>

              <Link href="/landlord/add-property" className="flex-1 sm:flex-none">
                <Button className="w-full bg-slate-900 hover:bg-black text-white font-black h-14 px-8 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 group border-none">
                  <Plus className="w-6 h-6 text-emerald-400 group-hover:rotate-90 transition-transform" /> 
                  <span>Add Property</span>
                </Button>
              </Link>
            </div>
          </div>

          {myProperties.length === 0 ? (
            <div className="text-center py-32 bg-white/60 rounded-[3rem] border-4 border-dashed border-slate-300 shadow-inner backdrop-blur-sm">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Building2 className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">No Active Listings</h2>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto font-medium">Your portfolio is empty. Click "Add Property" to start your landlord journey.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {myProperties.map((property) => (
                <Card key={property.id} className="group border-none shadow-xl overflow-hidden bg-white rounded-[2.5rem] flex flex-col transition-all hover:shadow-2xl hover:-translate-y-2 backdrop-blur-sm relative">
                  
                  <div className="absolute top-5 left-5 z-20">
                     <Badge className="bg-emerald-500/90 backdrop-blur-md text-white font-black px-3 py-1 rounded-xl shadow-lg border-none text-[10px] uppercase tracking-widest">
                       Active Listing
                     </Badge>
                  </div>

                  <CardContent className="p-0 relative flex-grow">
                    <div className="w-full h-56 overflow-hidden">
                      <img 
                        src={property.image || "/placeholder.svg"} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                        alt={property.name}
                      />
                    </div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-black text-slate-900 text-xl leading-tight line-clamp-1">{property.name}</h3>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-emerald-50 text-emerald-700 font-black text-sm px-3 py-1 rounded-full">RM {property.price}</div>
                        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Eye className="w-3 h-3 mr-1" /> {property.views || 0}
                        </div>
                      </div>

                      <p className="text-slate-400 text-xs font-bold flex items-center gap-1 mb-6">
                        <MapPin className="w-4 h-4 text-red-500" /> {property.distanceToUSM}km to USM Campus
                      </p>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <FacilityItem icon={<BedDouble className="w-4 h-4" />} label={`${property.bedrooms} Bed`} />
                        <FacilityItem icon={<Bath className="w-4 h-4" />} label={`${property.bathrooms} Bath`} />
                        <FacilityItem icon={<Maximize className="w-4 h-4" />} label={property.size} />
                      </div>
                    </div>
                  </CardContent>
                  
                  {/* 🌟 核心修改：在底部加入直达详情页的 View 按钮，均分三个按钮空间 */}
                  <CardFooter className="bg-slate-50/80 p-4 flex gap-2 border-t border-slate-100 backdrop-blur-sm">
                    <Link href={`/property/${property.id}`} className="flex-1">
                      <Button variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-black text-[10px] h-11 rounded-2xl bg-white transition-all uppercase tracking-widest px-0">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                    </Link>
                    <Link href={`/landlord/edit-property/${property.id}`} className="flex-1">
                      <Button variant="outline" className="w-full border-slate-200 font-black text-[10px] h-11 rounded-2xl bg-white hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest px-0">
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-red-100 text-red-500 hover:bg-red-500 hover:text-white font-black text-[10px] h-11 rounded-2xl bg-white transition-all uppercase tracking-widest px-0" 
                      onClick={() => handleDelete(property.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Del
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

function FacilityItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="bg-white p-3 rounded-2xl text-center border border-slate-100 shadow-sm">
      <div className="flex justify-center text-slate-300 mb-1">{icon}</div>
      <span className="text-[9px] font-black text-slate-800 block truncate uppercase tracking-tighter">{label}</span>
    </div>
  )
}

function Badge({ children, className }: any) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</span>
}