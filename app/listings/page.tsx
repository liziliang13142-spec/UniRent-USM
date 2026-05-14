"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select" // 🌟 重新引入下拉菜单组件
import { Heart, MapPin, Bed, Bath, Maximize, Search, Filter } from "lucide-react" 
import { useProperty } from "../contexts/PropertyContext"

export default function PropertyListingsPage() {
  const { properties, favorites, toggleFavorite } = useProperty();

  // 1. 🌟 筛选状态：使用字符串格式，适配下拉列表
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [distanceFilter, setDistanceFilter] = useState("all"); 

  // 2. 🌟 核心过滤逻辑
  const filteredProperties = properties.filter((prop) => {
    // 价格过滤
    let matchesPrice = true;
    if (priceFilter === "0-500") matchesPrice = prop.price <= 500;
    else if (priceFilter === "500-1000") matchesPrice = prop.price > 500 && prop.price <= 1000;
    else if (priceFilter === "1000-2000") matchesPrice = prop.price > 1000 && prop.price <= 2000;
    else if (priceFilter === "2000+") matchesPrice = prop.price > 2000;

    // 距离过滤
    let matchesDistance = true;
    if (distanceFilter !== "all") {
      matchesDistance = prop.distanceToUSM <= parseFloat(distanceFilter);
    }

    // 搜索词过滤
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (prop.name || "").toLowerCase().includes(searchLower) || 
      (prop.facilities || []).some(f => f.toLowerCase().includes(searchLower));
      
    return matchesPrice && matchesDistance && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部标题栏 */}
      <header className="bg-white border-b p-4 sticky top-0 z-20 flex justify-between items-center shadow-sm px-6">
        <h1 className="text-2xl font-black text-blue-800 tracking-tight">UniRent</h1>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-bold">
          {filteredProperties.length} Properties Found
        </Badge>
      </header>
      
      <main className="max-w-6xl mx-auto p-4 lg:p-6">
        
        {/* 🌟 整合后的高级筛选工具栏 (使用 Select) */}
        <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search by area, property name or facilities..." 
              className="w-full pl-10 h-11 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 价格下拉筛选 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-blue-500" /> Monthly Rent (RM)
              </label>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-full h-11 border-gray-200 rounded-xl bg-gray-50/50">
                  <SelectValue placeholder="Any Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Price</SelectItem>
                  <SelectItem value="0-500">Under RM 500</SelectItem>
                  <SelectItem value="500-1000">RM 500 - RM 1000</SelectItem>
                  <SelectItem value="1000-2000">RM 1000 - RM 2000</SelectItem>
                  <SelectItem value="2000+">Above RM 2000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 距离下拉筛选 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-green-500" /> Max Distance to Campus
              </label>
              <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                <SelectTrigger className="w-full h-11 border-gray-200 rounded-xl bg-gray-50/50">
                  <SelectValue placeholder="Any Distance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Distance</SelectItem>
                  <SelectItem value="1">Within 1 km (Walking)</SelectItem>
                  <SelectItem value="3">Within 3 km</SelectItem>
                  <SelectItem value="5">Within 5 km</SelectItem>
                  <SelectItem value="10">Within 10 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 🌟 房源卡片网格 */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="group overflow-hidden hover:shadow-xl transition-all duration-500 border-gray-100 rounded-2xl bg-white flex flex-col">
                <CardContent className="p-0 relative">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img 
                      src={property.image || "/placeholder.svg"} 
                      alt={property.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                  
                  {/* 🌟 价格标签优化: RM 和 / month */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl font-black text-blue-800 shadow-lg border border-white/20">
                    RM {property.price} / month
                  </div>

                  <div className="p-5 flex-1">
                    <h2 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-blue-700 transition-colors line-clamp-1">
                      {property.name}
                    </h2>
                    
                    <div className="flex items-center text-xs text-gray-400 mb-4 font-medium italic">
                      {(property.facilities || []).slice(0, 3).join(" • ")}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-gray-50 p-2 rounded-lg text-center">
                        <Bed className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                        <span className="text-[10px] font-bold text-gray-600">{property.bedrooms} Bed</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg text-center">
                        <Bath className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                        <span className="text-[10px] font-bold text-gray-600">{property.bathrooms} Bath</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg text-center">
                        <Maximize className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                        <span className="text-[10px] font-bold text-gray-600">{property.size}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                      <MapPin className={`w-3.5 h-3.5 ${property.distanceToUSM < 2 ? 'text-green-500' : 'text-orange-400'}`} /> 
                      {property.distanceToUSM} km from Campus
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between bg-white border-t p-4 gap-3 mt-auto">
                  <Link href={`/property/${property.id}`} className="flex-1">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 transition-all active:scale-95">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`rounded-xl border-gray-100 shrink-0 transition-all ${favorites.includes(property.id) ? 'bg-red-50 border-red-100' : 'hover:bg-gray-50'}`}
                    onClick={() => toggleFavorite(property.id)}
                  >
                    <Heart className={`h-5 w-5 ${favorites.includes(property.id) ? "fill-red-500 text-red-500" : "text-gray-300"}`} />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
            <Search className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <p className="text-xl font-bold text-gray-400">No matching properties.</p>
            <Button variant="link" className="mt-2 text-blue-600" onClick={() => {setSearchTerm(""); setPriceFilter("all"); setDistanceFilter("all")}}>
              Clear all filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}