"use client"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useProperty } from "../contexts/PropertyContext"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, CreditCard, Clock, Loader2 } from "lucide-react"

export default function BookingHistoryPage() {
  const { user } = useAuth()
  const { properties } = useProperty()
  const { toast } = useToast()
  
  const [myBookings, setMyBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 1. 🌟 修复刷新重现：从 Supabase 实时获取数据
  useEffect(() => {
    if (user) {
      fetchBookings()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('tenant_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMyBookings(data || [])
    } catch (err: any) {
      toast({ title: "Fetch Error", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to PERMANENTLY delete this booking record?")) {
      try {
        // 直接在 Supabase 中删除该行
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', id)

        if (error) throw error; // 如果数据库报错，直接抛出
        
        // 只有数据库真正不报错了，才更新本地 UI
        setMyBookings(prev => prev.filter(b => b.id !== id));
        
        alert("Success! The booking has been deleted from the database.");
      } catch (err: any) {
        // 🌟 核心修改：如果删除失败，强行弹窗告诉你具体原因！
        alert(`Supabase Delete Failed: ${err.message || JSON.stringify(err)}`);
        console.error("Delete Error:", err);
      }
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10 text-center">
        <h1 className="text-xl font-bold text-blue-800 tracking-tight">Booking History</h1>
      </header>
      
      <main className="p-4 max-w-2xl mx-auto space-y-4 mt-4">
        {myBookings.length > 0 ? (
          myBookings.map((booking) => {
            const property = properties.find(p => String(p.id) === String(booking.property_id))
            
            return (
              <Card key={booking.id} className="overflow-hidden border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                  <img 
                    src={property?.image || "/placeholder.svg"} 
                    className="w-full md:w-28 h-32 md:h-28 object-cover rounded-xl border" 
                    alt="" 
                  />
                  <div className="flex-grow w-full">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
                        {property?.name || "Property Room"}
                      </h3>
                      <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${
                        booking.status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      {booking.start_date} to {booking.end_date}
                    </p>
                    
                    {booking.notes && (
                      <p className="text-[10px] text-blue-600 mt-1.5 font-bold bg-blue-50 w-fit px-2 py-0.5 rounded border border-blue-100">
                        {booking.notes}
                      </p>
                    )}

                    <p className="text-lg font-black text-gray-900 mt-2 tracking-tight">RM {booking.total_price}</p>
                  </div>
                  
                  <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
                    {booking.status === 'pending' && (
                      <Link href={`/booking-confirmation?propertyId=${booking.property_id}&totalAmount=${booking.total_price}`} className="w-full md:w-auto">
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-9">
                          <CreditCard className="h-4 w-4 mr-1.5" /> Pay Now
                        </Button>
                      </Link>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-500 border-red-100 hover:text-red-700 hover:bg-red-50 w-full md:w-auto font-bold h-9"
                      onClick={() => handleDelete(booking.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="font-medium">Your history is clear.</p>
            <Link href="/listings"><Button variant="link" className="text-blue-600 font-bold mt-2">Browse Properties</Button></Link>
          </div>
        )}
      </main>
    </div>
  )
}