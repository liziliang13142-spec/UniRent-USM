"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Heart, MapPin, Bed, Bath, Maximize } from "lucide-react"
import { useProperty } from "../contexts/PropertyContext" // 👈 引入全局状态

export default function FavoritePropertiesPage() {
  const { properties, favorites, toggleFavorite } = useProperty()

  // 仅仅筛选出 ID 在收藏列表里的房源
  const favoritePropertiesList = properties.filter((prop) => favorites.includes(prop.id))

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-blue-800">My Favorites</h1>
      </header>
      
      <main className="p-4">
        {favoritePropertiesList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {favoritePropertiesList.map((property) => (
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
                    <p className="text-sm text-gray-500 mb-4 truncate" title={property.facilities.join(" • ")}>
                      {property.facilities.join(" • ")}
                    </p>
                    <div className="flex items-center text-sm text-gray-700 gap-4 mb-3 bg-gray-50 p-2 rounded-md">
                      <span className="flex items-center gap-1.5 font-medium"><Bed className="w-4 h-4 text-blue-500"/> {property.bedrooms}</span>
                      <span className="flex items-center gap-1.5 font-medium"><Bath className="w-4 h-4 text-blue-500"/> {property.bathrooms}</span>
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
                    className="shrink-0 border-gray-200 bg-red-50 border-red-100"
                    onClick={() => toggleFavorite(property.id)} // 在这里点爱心可以取消收藏
                  >
                    <Heart className="h-5 w-5 fill-red-500 text-red-500 transition-colors" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <Heart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-xl font-semibold text-gray-700">No favorites yet.</p>
            <p className="text-gray-500 mt-2 mb-6">Browse properties and click the heart icon to save them here!</p>
            <Link href="/listings">
              <Button>Browse Properties</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}