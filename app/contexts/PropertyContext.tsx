"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./AuthContext" // 🌟 引入 AuthContext 获取用户信息
import { useToast } from "@/components/ui/use-toast"

export type Review = {
  id: number
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
  landlordId?: string
  reviews?: Review[]
}

type PropertyContextType = {
  properties: Property[]
  addProperty: (property: Omit<Property, "id">) => Promise<void>
  deleteProperty: (id: number) => Promise<void>
  updateProperty: (property: Property) => Promise<void>
  favorites: number[] 
  toggleFavorite: (id: number) => Promise<void> // 🌟 修改为异步函数
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
  const { user } = useAuth() // 🌟 获取当前用户
  const { toast } = useToast()

  // 1. 从云端获取所有房源
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
        landlordId: p.landlord_id,
        reviews: p.reviews || []
      }))
      setProperties(formatted)
    }
  }

  // 2. 🌟 新增：从云端获取该用户的收藏列表
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

  // 🌟 当用户登录状态改变时，重新拉取收藏数据
  useEffect(() => {
    fetchUserFavorites()
  }, [user])

  // 3. 将新房源同步到云端
  const addProperty = async (newProperty: Omit<Property, "id">) => {
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
          landlord_id: newProperty.landlordId,
          reviews: []
        }
      ])

    if (error) {
      alert("Error saving to cloud: " + error.message)
    } else {
      fetchProperties()
    }
  }

  // 4. 从云端删除
  const deleteProperty = async (id: number) => {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)

    if (error) {
      alert("Delete failed: " + error.message)
    } else {
      setProperties(prev => prev.filter(p => p.id !== id))
    }
  }

  // 5. 更新房源
  const updateProperty = async (updatedProperty: Property) => {
    const { error } = await supabase
      .from('properties')
      .update({ reviews: updatedProperty.reviews })
      .eq('id', updatedProperty.id)

    if (!error) {
      setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p))
    }
  }

  // 6. 🌟 修改后的 toggleFavorite：同步到 Supabase
  const toggleFavorite = async (id: number) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to save favorites.", variant: "destructive" })
      return
    }

    const isFavorited = favorites.includes(id)

    if (isFavorited) {
      // 取消收藏：从数据库删除
      const { error } = await supabase
        .from('favorites')
        .delete()
        .match({ user_id: user.id, property_id: id })

      if (!error) {
        setFavorites(prev => prev.filter(f => f !== id))
        toast({ description: "Removed from favorites." })
      }
    } else {
      // 添加收藏：存入数据库
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: user.id, property_id: id }])

      if (!error) {
        setFavorites(prev => [...prev, id])
        toast({ title: "Saved!", description: "Property added to your favorites." })
      } else if (error.code === '23505') {
        // 防止重复插入的错误处理
        setFavorites(prev => [...prev, id])
      }
    }
  }

  return (
    <PropertyContext.Provider value={{ properties, addProperty, deleteProperty, updateProperty, favorites, toggleFavorite }}>
      {children}
    </PropertyContext.Provider>
  )
}