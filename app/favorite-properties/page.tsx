"use client"

import { useProperty } from "@/app/contexts/PropertyContext" // 🌟 使用 @ 绝对路径
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Bed, Bath, Maximize } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function FavoritePropertiesPage() {
  const context = useProperty()
  const properties = context?.properties || []
  const favorites = context?.favorites || []
  const toggleFavorite = context?.toggleFavorite || (() => {})

  const favoriteProperties = properties.filter((p) => favorites.includes(p.id))

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 sticky top-0 z-10 border-b border-white/50">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight text-center">My Favorites</h1>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {favoriteProperties.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-md border-none shadow-xl p-10 text-center rounded-2xl">
            <p className="text-slate-500 font-medium">You haven't favorited any properties yet.</p>
            <Link href="/listings">
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-md">
                Browse Properties
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {favoriteProperties.map((property) => (
              <Card key={property.id} className="overflow-hidden border-none shadow-xl bg-white/90 backdrop-blur-md rounded-2xl group transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-48 w-full">
                  <img
                    src={property.image || "/placeholder.svg"}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/50 backdrop-blur-md hover:bg-white text-red-500 rounded-full shadow-sm"
                    onClick={() => toggleFavorite(property.id)}
                  >
                    <Heart className="h-5 w-5 fill-current" />
                  </Button>
                </div>
                <CardHeader className="p-4 pb-0">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold text-slate-800 truncate">{property.name}</CardTitle>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold">
                      RM {property.price}/mo
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 flex items-center mt-1 font-medium">
                    <MapPin className="h-3 w-3 mr-1" /> {property.distanceToUSM}km to USM
                  </p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex justify-between text-slate-600 text-sm font-semibold">
                    <span className="flex items-center"><Bed className="h-4 w-4 mr-1" /> {property.bedrooms}</span>
                    <span className="flex items-center"><Bath className="h-4 w-4 mr-1" /> {property.bathrooms}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Link href={`/property/${property.id}`} className="w-full">
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 font-bold rounded-xl shadow-md">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}