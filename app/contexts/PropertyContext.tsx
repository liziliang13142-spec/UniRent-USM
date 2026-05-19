"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./AuthContext" 
import { useToast } from "@/components/ui/use-toast"

export type Review = {
  id: string | number
  user: string
  rating: number
  comment: string
  date: string
}

export type Property = {
  id: number
  name: string
  price: number
  image: string
  facilities: string[]
  distanceToUSM: number
  bedrooms: number
  bathrooms: number
  size: string
  area?: string 
  description?: string
  landlordId?: string
  reviews?: Review[]
  views: number 
}

type PropertyContextType = {
  properties: Property[]
  addProperty: (property: Omit<Property, "id" | "views">) => Promise<void>
  deleteProperty: (id: number) => Promise<void>
  updateProperty: (property: Property) => Promise<void>
  addReview: (reviewData: { propertyId: number; userName: string; rating: number; comment: string }) => Promise<void>
  fetchProperties: () => Promise<void>
  favorites: number[] 
  toggleFavorite: (id: number) => Promise<void>
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined)

export const useProperty = () => {
  const context = useContext(PropertyContext)
  if (!context) throw new Error("useProperty must be used within a PropertyProvider")
  return context
}

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([])
  const [favorites, setFavorites] = useState<number[]>([])
  const { user } = useAuth()
  const { toast } = useToast()

  // 1. 从云端获取房源
  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error("Fetch error:", error.message)
    } else if (data) {
      const formatted = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        facilities: p.facilities || [],
        distanceToUSM: p.distance_to_usm,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        size: p.size,
        area: p.area, 
        description: p.description, 
        landlordId: p.landlord_id,
        reviews: p.reviews || [],
        views: p.views || 0 
      }))
      setProperties(formatted)
    }
  }

  // 2. 获取收藏
  const fetchUserFavorites = async () => {
    if (!user) {
      setFavorites([])
      return
    }
    const { data, error } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('user_id', user.id)
    if (data) {
      setFavorites(data.map((f: any) => f.property_id))
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    fetchUserFavorites()
  }, [user])

  // 3. 发布新房源
  const addProperty = async (newProperty: Omit<Property, "id" | "views">) => {
    const { error } = await supabase
      .from('properties')
      .insert([
        {
          name: newProperty.name,
          price: newProperty.price,
          image: newProperty.image,
          facilities: newProperty.facilities,
          distance_to_usm: newProperty.distanceToUSM,
          bedrooms: newProperty.bedrooms,
          bathrooms: newProperty.bathrooms,
          size: newProperty.size,
          area: (newProperty as any).area, 
          description: newProperty.description, 
          landlord_id: newProperty.landlordId,
          reviews: [],
          views: 0
        }
      ])

    if (error) {
      toast({ 
        title: "Error Saving", 
        description: error.message, 
        variant: "destructive" 
      })
    } else {
      toast({ title: "Success", description: "Property listed successfully!" })
      fetchProperties()
    }
  }

  // 4. 删除房源
  const deleteProperty = async (id: number) => {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
    if (error) {
      alert("Delete failed: " + error.message)
    } else {
      setProperties(prev => prev.filter(p => p.id !== id))
      toast({ title: "Deleted", description: "Property removed." })
    }
  }

  // 5. 更新房源 (🌟 核心修复：把所有字段都映射上传给数据库)
  const updateProperty = async (updatedProperty: Property) => {
    const { error } = await supabase
      .from('properties')
      .update({ 
        name: updatedProperty.name,
        price: updatedProperty.price,
        image: updatedProperty.image,
        facilities: updatedProperty.facilities,
        distance_to_usm: updatedProperty.distanceToUSM,
        bedrooms: updatedProperty.bedrooms,
        bathrooms: updatedProperty.bathrooms,
        size: updatedProperty.size,
        area: updatedProperty.area, 
        description: updatedProperty.description, 
        views: updatedProperty.views
      })
      .eq('id', updatedProperty.id)

    if (!error) {
      // 数据库更新成功后，同步更新本地前端状态
      setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p))
    } else {
      console.error("Update failed:", error.message)
      toast({ title: "Update Failed", description: error.message, variant: "destructive" })
    }
  }

  // 6. 向独立表提交评论
  const addReview = async (reviewData: { propertyId: number; userName: string; rating: number; comment: string }) => {
    const { error } = await supabase
      .from('reviews')
      .insert([
        {
          property_id: reviewData.propertyId,
          user_id: user?.id,
          user_name: reviewData.userName,
          rating: reviewData.rating,
          comment: reviewData.comment
        }
      ]);

    if (error) {
      toast({ title: "Error", description: "Failed to post review: " + error.message, variant: "destructive" });
    } else {
      toast({ title: "Review Posted!", description: "Your feedback is now visible to everyone." });
    }
  };

  // 7. 收藏逻辑
  const toggleFavorite = async (id: number) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to save favorites.", variant: "destructive" })
      return
    }
    const isFavorited = favorites.includes(id)
    if (isFavorited) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .match({ user_id: user.id, property_id: id })
      if (!error) {
        setFavorites(prev => prev.filter(f => f !== id))
        toast({ description: "Removed from favorites." })
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: user.id, property_id: id }])
      if (!error) {
        setFavorites(prev => [...prev, id])
        toast({ title: "Saved!", description: "Added to your favorites." })
      }
    }
  }

  return (
    <PropertyContext.Provider value={{ 
      properties, 
      addProperty, 
      deleteProperty, 
      updateProperty, 
      addReview, 
      fetchProperties, 
      favorites, 
      toggleFavorite 
    }}>
      {children}
    </PropertyContext.Provider>
  )
}