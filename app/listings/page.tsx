"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card" 
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Heart, MapPin, BedDouble, Bath, Search, Maximize, Star } from "lucide-react" 
import { useProperty } from "../contexts/PropertyContext"
import { useAuth } from "../contexts/AuthContext"

export default function PropertyListingsPage() {
  const { properties, favorites, toggleFavorite } = useProperty();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [distanceFilter, setDistanceFilter] = useState("all"); 

  // 🌟 核心判断：当前登录的是不是房东
  const isLandlord = user?.role?.toLowerCase() === "landlord";

  // 🌟 核心逻辑：这里保留了你所有的过滤功能，一个字母都没改
  const filteredProperties = properties.filter((prop) => {
    let matchesPrice = true;
    if (priceFilter === "0-500") matchesPrice = prop.price <= 500;
    else if (priceFilter === "500-1000") matchesPrice = prop.price > 500 && prop.price <= 1000;
    else if (priceFilter === "1000-2000") matchesPrice = prop.price > 1000 && prop.price <= 2000;
    else if (priceFilter === "2000+") matchesPrice = prop.price > 2000;

    let matchesDistance = true;
    if (distanceFilter !== "all") {
      matchesDistance = prop.distanceToUSM <= parseFloat(distanceFilter);
    }

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (prop.name || "").toLowerCase().includes(searchLower) || 
      (prop.facilities || []).some(f => f.toLowerCase().includes(searchLower));
      
    return matchesPrice && matchesDistance && matchesSearch;
  });

  return (
    // 🌟 第一层：动态背景图片容器 (根据角色切换图片)
    <div 
      className="min-h-screen pb-24 font-sans bg-cover bg-center bg-fixed bg-no-repeat transition-all duration-500"
      style={{ backgroundImage: `url(${isLandlord ? '/fangdong.jpg' : '/zuhu.jpg'})` }} 
    >
      {/* 🌟 第二层：动态蒙层 (房东用深色透明，租户用蓝色透明) */}
      <div className={`min-h-screen backdrop-blur-[2px] transition-colors duration-500 ${isLandlord ? 'bg-slate-900/30' : 'bg-blue-50/40'}`}>
        
        {/* 🎨 动态顶部导航 (房东用深色背景，租户用蓝色背景) */}
        <header className={`${isLandlord ? 'bg-slate-900' : 'bg-blue-600'} text-white shadow-md sticky top-0 z-40 transition-colors duration-500`}>
          <div className="max-w-7xl mx-auto p-4 flex justify-between items-center gap-6">
            <div className="flex items-center gap-3 shrink-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xl shadow-sm ${isLandlord ? 'bg-emerald-500 text-white' : 'bg-white text-blue-600'}`}>U</div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">UniRent</h1>
                {isLandlord && (
                  <span className="bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest leading-none">
                    Market Mode
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className={`hidden sm:block text-sm font-medium ${isLandlord ? 'text-slate-300' : 'text-blue-100'}`}>
                Hi, <span className="text-white font-bold">{user?.username || 'User'}</span>
              </div>
              <div className={`w-9 h-9 rounded-full border-2 shadow-sm flex items-center justify-center text-white font-bold transition-colors ${isLandlord ? 'bg-slate-800 border-slate-700' : 'bg-blue-500 border-blue-400'}`}>
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto p-4 sm:p-6 mt-2">
          
          {/* 📐 标题与筛选操作区 (边框颜色动态化) */}
          <div className={`flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4 bg-white/95 p-6 rounded-2xl shadow-sm border backdrop-blur-md transition-colors ${isLandlord ? 'border-slate-200' : 'border-blue-100'}`}>
            <div>
              <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLandlord ? 'text-slate-800' : 'text-gray-900'}`}>
                {isLandlord ? 'Market Explorer 🔍' : 'Available Stays ✨'}
              </h2>
              <p className="text-gray-500 text-sm mt-1 font-medium">
                {isLandlord ? 'Explore current housing trends across the campus.' : `Found ${filteredProperties.length} matches for your campus life.`}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
               <div className="relative w-full sm:w-[250px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input 
                    type="text" 
                    placeholder={isLandlord ? "Search market data..." : "Search properties..."}
                    className={`w-full pl-9 h-10 bg-gray-50 border-gray-200 rounded-xl text-sm transition-all ${isLandlord ? 'focus-visible:ring-emerald-500' : 'focus-visible:ring-blue-500'}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>

               <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-white border-gray-200 h-10 font-medium rounded-xl shadow-sm">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Price</SelectItem>
                    <SelectItem value="0-500">Under RM 500</SelectItem>
                    <SelectItem value="500-1000">RM 500 - 1000</SelectItem>
                    <SelectItem value="1000-2000">RM 1000 - 2000</SelectItem>
                    <SelectItem value="2000+">Above RM 2000</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] bg-white border-gray-200 h-10 font-medium rounded-xl shadow-sm">
                    <SelectValue placeholder="Distance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Distance</SelectItem>
                    <SelectItem value="1">Within 1 km</SelectItem>
                    <SelectItem value="3">Within 3 km</SelectItem>
                    <SelectItem value="5">Within 5 km</SelectItem>
                    <SelectItem value="10">Within 10 km</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>

          {/* 🌟 房源卡片列表 (卡片装饰和按钮颜色动态化) */}
          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProperties.map((property) => (
                <Card key={property.id} className={`border shadow-sm hover:shadow-xl overflow-hidden bg-white rounded-2xl flex flex-col transition-all group ring-1 ${isLandlord ? 'border-slate-200 ring-slate-900/5' : 'border-gray-100 ring-blue-500/5'}`}>
                  <CardContent className="p-0 relative flex-grow">
                    
                    {/* 动态价格标签 */}
                    <div className={`absolute top-3 left-3 text-white text-[11px] font-black px-2.5 py-1 rounded-md shadow-sm z-10 border ${isLandlord ? 'bg-slate-900 border-slate-700' : 'bg-blue-600 border-blue-500'}`}>
                      RM {property.price} <span className={`text-[10px] font-medium ${isLandlord ? 'text-slate-400' : 'text-blue-100'}`}>/ mo</span>
                    </div>
                    
                    {/* 只有租户显示收藏按钮 */}
                    {!isLandlord && (
                      <button 
                        className="absolute top-3 right-3 p-2 bg-white/50 backdrop-blur-md hover:bg-white rounded-full text-gray-500 transition-colors z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(property.id);
                        }}
                      >
                        <Heart className={`w-4 h-4 ${favorites.includes(property.id) ? "fill-red-500 text-red-500" : ""}`} />
                      </button>
                    )}
                    
                    <div className="w-full aspect-[4/3] bg-gray-100 cursor-pointer overflow-hidden">
                      <Link href={`/property/${property.id}`}>
                        <img
                          src={property.image || "/placeholder.svg"}
                          alt={property.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                      </Link>
                    </div>
                    
                    <div className="p-4 flex-grow flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <Link href={`/property/${property.id}`}>
                          <h3 className={`font-bold text-lg line-clamp-1 transition-colors ${isLandlord ? 'group-hover:text-emerald-600' : 'group-hover:text-blue-600'}`}>{property.name}</h3>
                        </Link>
                        <div className="flex items-center gap-1 text-sm font-bold text-gray-700 shrink-0 mt-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 4.8
                        </div>
                      </div>
                      
                      <p className="text-gray-500 text-xs flex items-center gap-1 mt-1 mb-4">
                        <MapPin className={`w-3.5 h-3.5 ${isLandlord ? 'text-emerald-500' : 'text-blue-500'}`} /> {property.distanceToUSM}km from campus
                      </p>
                      
                      <div className="grid grid-cols-3 gap-2 mt-auto">
                        <div className="bg-gray-50 p-2 rounded-xl text-center border border-gray-100">
                          <BedDouble className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                          <span className="text-[10px] font-bold text-gray-600">{property.bedrooms} Bed</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-xl text-center border border-gray-100">
                          <Bath className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                          <span className="text-[10px] font-bold text-gray-600">{property.bathrooms} Bath</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-xl text-center border border-gray-100">
                          <Maximize className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                          <span className="text-[10px] font-bold text-gray-600 truncate block">{property.size}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="bg-gray-50 p-3 border-t border-gray-100 mt-auto">
                    <Link href={`/property/${property.id}`} className="w-full">
                      <Button className={`w-full text-white font-bold h-10 rounded-xl shadow-sm transition-all active:scale-95 ${isLandlord ? 'bg-slate-800 hover:bg-slate-900' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {isLandlord ? 'Market Analysis' : 'View Details'}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm mt-8">
              <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No properties found</h2>
              <p className="text-gray-500 text-sm">Adjust your filters to see more results.</p>
              <Button variant="outline" className={`mt-6 font-bold rounded-xl ${isLandlord ? 'border-slate-300 text-slate-700' : 'border-blue-200 text-blue-600'}`} onClick={() => {setSearchTerm(""); setPriceFilter("all"); setDistanceFilter("all")}}>
                Clear Filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}