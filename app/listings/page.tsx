"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Heart, MapPin, Bed, Bath, Maximize, Search } from "lucide-react" 
import { useProperty } from "../contexts/PropertyContext"

export default function PropertyListingsPage() {
  const { properties, favorites, toggleFavorite } = useProperty()

  const [priceRange, setPriceRange] = useState([0, 5000])
  const [searchTerm, setSearchTerm] = useState("")
  // 👇 1. 新增：距离筛选状态 (默认显示 0-10km)
  const [distanceRange, setDistanceRange] = useState([10]) 

  const filteredProperties = properties.filter((prop) => {
    // 价格过滤
    const matchesPrice = prop.price >= priceRange[0] && prop.price <= priceRange[1];
    
    // 👇 2. 新增：距离过滤逻辑
    const matchesDistance = prop.distanceToUSM <= distanceRange[0];

    // 搜索词过滤
    const safeName = prop.name || "";
    const safeFacilities = prop.facilities || [];
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      safeName.toLowerCase().includes(searchLower) || 
      safeFacilities.some(f => f.toLowerCase().includes(searchLower));
      
    return matchesPrice && matchesDistance && matchesSearch;
  })

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-800">UniRent</h1>
      </header>
      
      <main className="p-4">
        {/* 搜索与筛选区域 */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <div className="relative mb-5">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search by property name or facilities..." 
              className="w-full pl-10 border-gray-300" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 价格筛选 */}
            <div className="px-1">
              <label className="text-sm font-semibold block mb-3 text-gray-700 flex justify-between">
                <span>Price Range</span>
                <span className="text-blue-600">${priceRange[0]} - ${priceRange[1]}</span>
              </label>
              <Slider 
                defaultValue={[0, 5000]} 
                max={5000} 
                step={50} 
                value={priceRange}
                onValueChange={setPriceRange} 
              />
            </div>

            {/* 👇 3. 新增：距离筛选 UI */}
            <div className="px-1">
              <label className="text-sm font-semibold block mb-3 text-gray-700 flex justify-between">
                <span>Max Distance to USM</span>
                <span className="text-green-600">{distanceRange[0]} km</span>
              </label>
              <Slider 
                defaultValue={[10]} 
                max={20} 
                step={0.5} 
                value={distanceRange}
                onValueChange={setDistanceRange} 
              />
            </div>
          </div>
        </div>

        {/* 房源列表区域 */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200">
                <CardContent className="p-0 relative">
                  <img
                    src={property.image || "/placeholder.svg"}
                    alt={property.name}
                    className="w-full h-52 object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 px-3 py-1.5 rounded-md font-bold text-blue-800 shadow-md">
                    ${property.price}/mo
                  </div>
                  <div className="p-5">
                    <h2 className="text-lg font-bold mb-1 truncate text-gray-800">{property.name}</h2>
                    <p className="text-sm text-gray-500 mb-4 truncate">
                      {property.facilities.join(" • ")}
                    </p>
                    
                    <div className="flex items-center text-sm text-gray-700 gap-4 mb-3 bg-gray-50 p-2 rounded-md">
                      <span className="flex items-center gap-1.5 font-medium"><Bed className="w-4 h-4 text-blue-500"/> {property.bedrooms}</span>
                      <span className="flex items-center gap-1.5 font-medium"><Bath className="w-4 h-4 text-blue-500"/> {property.bathrooms}</span>
                      <span className="flex items-center gap-1.5 font-medium"><Maximize className="w-4 h-4 text-blue-500"/> {property.size}</span>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1.5 font-medium">
                      {/* 这里会根据距离显示颜色，越近越绿 */}
                      <MapPin className={`w-4 h-4 ${property.distanceToUSM < 2 ? 'text-green-500' : 'text-red-500'}`} /> 
                      {property.distanceToUSM} km from USM
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between bg-white border-t p-4">
                  <Link href={`/property/${property.id}`} className="w-full mr-3">
                    <Button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-none shadow-none">View Details</Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`shrink-0 border-gray-200 ${favorites.includes(property.id) ? 'bg-red-50 border-red-100' : 'hover:bg-gray-50'}`}
                    onClick={(e) => {
                      e.preventDefault()
                      toggleFavorite(property.id)
                    }}
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${favorites.includes(property.id) ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                    />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-xl font-semibold text-gray-700">No properties found in this range.</p>
            <Button variant="outline" className="mt-4" onClick={() => {setSearchTerm(""); setPriceRange([0, 5000]); setDistanceRange([10])}}>
              Reset All Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}