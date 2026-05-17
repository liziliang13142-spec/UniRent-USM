"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card" 
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Heart, 
  MapPin, 
  BedDouble, 
  Bath, 
  Search, 
  Maximize, 
  Star, 
  Eye, 
  CalendarCheck,
  Filter,
  Wifi,
  Wind, // AC
  Car,
  Waves // Pool
} from "lucide-react" 
import { useProperty } from "../contexts/PropertyContext"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "@/lib/supabase"

// 定义常用设施列表
const FACILITY_OPTIONS = [
  { id: "Wifi", label: "Wifi", icon: <Wifi className="w-3 h-3" /> },
  { id: "Aircon", label: "AC", icon: <Wind className="w-3 h-3" /> },
  { id: "Parking", label: "Parking", icon: <Car className="w-3 h-3" /> },
  { id: "Swimming Pool", label: "Pool", icon: <Waves className="w-3 h-3" /> },
  { id: "Gym", label: "Gym", icon: <Maximize className="w-3 h-3" /> },
]

// 定义热门区域列表
const AREA_OPTIONS = ["Sungai Dua", "Minden", "Bukit Jambul", "Gelugor", "Bayan Lepas"]

export default function PropertyListingsPage() {
  const { properties, favorites, toggleFavorite, updateProperty } = useProperty();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [distanceFilter, setDistanceFilter] = useState("all"); 
  const [areaFilter, setAreaFilter] = useState("all");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  const isLandlord = user?.role?.toLowerCase() === "landlord";

  // 访问量统计函数
  const handleIncrementViews = async (id: any) => {
    if (isLandlord) return;
    const numericId = Number(id);
    if (isNaN(numericId)) return;

    try {
      const { error } = await supabase.rpc('increment_views', { row_id: numericId });
      if (!error) {
        const currentProp = properties.find(p => p.id === id);
        if (currentProp && updateProperty) {
          updateProperty({ ...currentProp, views: (currentProp.views || 0) + 1 });
        }
      }
    } catch (err) {
      console.error("View tracking error:", err);
    }
  };

  // 🌟 增强版筛选逻辑
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      // 1. 价格过滤
      let matchesPrice = true;
      if (priceFilter === "0-500") matchesPrice = prop.price <= 500;
      else if (priceFilter === "500-1000") matchesPrice = prop.price > 500 && prop.price <= 1000;
      else if (priceFilter === "1000-2000") matchesPrice = prop.price > 1000 && prop.price <= 2000;
      else if (priceFilter === "2000+") matchesPrice = prop.price > 2000;

      // 2. 距离过滤
      const matchesDistance = distanceFilter === "all" || prop.distanceToUSM <= parseFloat(distanceFilter);

      // 3. 区域过滤 (假设数据中有 area 字段，没有则默认匹配)
      const matchesArea = areaFilter === "all" || (prop as any).area === areaFilter;

      // 4. 设施过滤 (多选逻辑：必须包含所有选中的设施)
      const matchesFacilities = selectedFacilities.length === 0 || 
        selectedFacilities.every(f => (prop.facilities || []).includes(f));

      // 5. 关键词搜索
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (prop.name || "").toLowerCase().includes(searchLower) || 
        (prop.facilities || []).some(f => f.toLowerCase().includes(searchLower)) ||
        ((prop as any).area || "").toLowerCase().includes(searchLower);
        
      return matchesPrice && matchesDistance && matchesArea && matchesFacilities && matchesSearch;
    });
  }, [properties, searchTerm, priceFilter, distanceFilter, areaFilter, selectedFacilities]);

  return (
    <div 
      className="min-h-screen pb-24 font-sans bg-cover bg-center bg-fixed bg-no-repeat transition-all duration-500"
      style={{ backgroundImage: `url(${isLandlord ? '/fangdong.jpg' : '/zuhu.jpg'})` }} 
    >
      <div className={`min-h-screen backdrop-blur-[2px] transition-colors duration-500 ${isLandlord ? 'bg-slate-900/30' : 'bg-blue-50/40'}`}>
        
        {/* 顶部导航 */}
        <header className={`${isLandlord ? 'bg-slate-900' : 'bg-blue-600'} text-white shadow-md sticky top-0 z-40`}>
          <div className="max-w-7xl mx-auto p-4 flex justify-between items-center gap-6">
            <div className="flex items-center gap-3 shrink-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xl ${isLandlord ? 'bg-emerald-500 text-white' : 'bg-white text-blue-600'}`}>U</div>
              <h1 className="text-xl font-black tracking-tight">UniRent</h1>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isLandlord && (
                <Link href="/landlord/viewing-management">
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-9 rounded-xl shadow-lg flex items-center gap-2 px-4 transition-all active:scale-95">
                    <CalendarCheck className="w-4 h-4" />
                    <span className="hidden md:inline text-xs">Manage Viewings</span>
                  </Button>
                </Link>
              )}
              <div className={`hidden sm:block text-sm font-medium ${isLandlord ? 'text-slate-300' : 'text-blue-100'}`}>
                Hi, <span className="text-white font-bold">{user?.username || 'User'}</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto p-4 sm:p-6 mt-2">
          
          {/* 🌟 核心优化：多功能搜索筛选区 */}
          <div className={`bg-white/95 p-6 rounded-3xl shadow-xl border backdrop-blur-md mb-8 ${isLandlord ? 'border-slate-200' : 'border-blue-100'}`}>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                {/* 搜索框 */}
                <div className="relative flex-grow w-full">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search by name, facilities, or neighborhood..." 
                    className="pl-10 h-12 bg-gray-50 border-none rounded-2xl focus-visible:ring-blue-500 shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                  {/* 区域筛选 */}
                  <Select value={areaFilter} onValueChange={setAreaFilter}>
                    <SelectTrigger className="w-[140px] h-12 rounded-2xl bg-white border-gray-100 shadow-sm font-bold">
                      <SelectValue placeholder="Area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {AREA_OPTIONS.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  {/* 价格筛选 */}
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger className="w-[140px] h-12 rounded-2xl bg-white border-gray-100 shadow-sm font-bold">
                      <SelectValue placeholder="Price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Price</SelectItem>
                      <SelectItem value="0-500">Under 500</SelectItem>
                      <SelectItem value="500-1000">500 - 1000</SelectItem>
                      <SelectItem value="1000-2000">1000 - 2000</SelectItem>
                      <SelectItem value="2000+">2000+</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* 距离筛选 */}
                  <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                    <SelectTrigger className="w-[140px] h-12 rounded-2xl bg-white border-gray-100 shadow-sm font-bold">
                      <SelectValue placeholder="Distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Dist.</SelectItem>
                      <SelectItem value="1">{"< 1 km"}</SelectItem>
                      <SelectItem value="3">{"< 3 km"}</SelectItem>
                      <SelectItem value="5">{"< 5 km"}</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* 🌟 设施更多筛选 (Popover) */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-12 rounded-2xl border-dashed border-2 border-gray-200 hover:bg-gray-50 font-bold px-4">
                        <Filter className="w-4 h-4 mr-2" />
                        Facilities {selectedFacilities.length > 0 && `(${selectedFacilities.length})`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-4 rounded-2xl shadow-2xl border-blue-50">
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Amenities</h4>
                        {FACILITY_OPTIONS.map((f) => (
                          <div key={f.id} className="flex items-center space-x-3">
                            <Checkbox 
                              id={f.id} 
                              checked={selectedFacilities.includes(f.id)}
                              onCheckedChange={(checked) => {
                                setSelectedFacilities(prev => 
                                  checked ? [...prev, f.id] : prev.filter(item => item !== f.id)
                                )
                              }}
                            />
                            <label htmlFor={f.id} className="text-sm font-bold text-gray-600 flex items-center gap-2 cursor-pointer">
                              {f.icon} {f.label}
                            </label>
                          </div>
                        ))}
                        {selectedFacilities.length > 0 && (
                          <Button 
                            variant="ghost" 
                            className="w-full text-[10px] font-black text-red-500 h-8 mt-2"
                            onClick={() => setSelectedFacilities([])}
                          >
                            Clear All
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          {/* 房源列表 */}
          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProperties.map((property) => (
                <Card key={property.id} className={`border shadow-sm hover:shadow-2xl overflow-hidden bg-white rounded-3xl flex flex-col transition-all group ${isLandlord ? 'border-slate-200' : 'border-blue-50'}`}>
                  <CardContent className="p-0 relative flex-grow">
                    <div className={`absolute top-4 left-4 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg z-10 ${isLandlord ? 'bg-slate-900/90' : 'bg-blue-600/90'} backdrop-blur-md`}>
                      RM {property.price}
                    </div>
                    
                    {!isLandlord && (
                      <button 
                        className="absolute top-4 right-4 p-2.5 bg-white/80 backdrop-blur-md hover:bg-white rounded-2xl text-gray-400 transition-all z-10 shadow-sm active:scale-90"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(property.id);
                        }}
                      >
                        <Heart className={`w-4 h-4 ${favorites.includes(property.id) ? "fill-red-500 text-red-500" : ""}`} />
                      </button>
                    )}
                    
                    <div className="w-full aspect-[4/3] cursor-pointer overflow-hidden">
                      <Link href={`/property/${property.id}`} onClick={() => handleIncrementViews(property.id)}>
                        <img
                          src={property.image || "/placeholder.svg"}
                          alt={property.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                        />
                      </Link>
                    </div>
                    
                    <div className="p-5 flex-grow flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <Link href={`/property/${property.id}`} onClick={() => handleIncrementViews(property.id)}>
                          <h3 className="font-black text-slate-800 text-lg leading-tight line-clamp-1">{property.name}</h3>
                        </Link>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                          <Eye className="w-3 h-3 mr-1" /> {property.views || 0}
                        </div>
                        <div className="flex items-center text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                          <Star className="w-3 h-3 mr-1 fill-amber-500" /> 4.8
                        </div>
                        {(property as any).area && (
                          <div className="flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            <MapPin className="w-3 h-3 mr-1" /> {(property as any).area}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-auto">
                        <FacilityBadge icon={<BedDouble className="w-3 h-3" />} label={`${property.bedrooms} Bed`} />
                        <FacilityBadge icon={<Bath className="w-3 h-3" />} label={`${property.bathrooms} Bath`} />
                        <FacilityBadge icon={<Maximize className="w-3 h-3" />} label={property.size} />
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-4 bg-slate-50/50 border-t border-slate-50">
                    <Link href={`/property/${property.id}`} className="w-full">
                      <Button 
                        className={`w-full text-white font-black h-12 rounded-2xl shadow-lg transition-all active:scale-95 ${isLandlord ? 'bg-slate-800 hover:bg-slate-900' : 'bg-blue-600 hover:bg-blue-700'}`}
                        onClick={() => handleIncrementViews(property.id)}
                      >
                        {isLandlord ? 'Performance Analysis' : 'View Details'}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[40px] border border-dashed border-gray-200 shadow-inner mt-8">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">No Matches Found</h2>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">We couldn't find any properties matching your current filters. Try broadening your search.</p>
              <Button 
                variant="link" 
                className="mt-4 font-black text-blue-600" 
                onClick={() => {setSearchTerm(""); setPriceFilter("all"); setDistanceFilter("all"); setAreaFilter("all"); setSelectedFacilities([])}}
              >
                Reset All Filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// 辅助组件：房源规格小标签
function FacilityBadge({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="bg-white p-2 rounded-2xl text-center border border-slate-100 shadow-sm">
      <div className="flex justify-center text-slate-400 mb-1">{icon}</div>
      <span className="text-[9px] font-black text-slate-600 block truncate uppercase">{label}</span>
    </div>
  )
}