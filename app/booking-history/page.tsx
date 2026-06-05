"use client"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useProperty } from "../contexts/PropertyContext"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, CreditCard, Clock, Loader2, Wallet } from "lucide-react"

export default function BookingHistoryPage() {
  const { user } = useAuth()
  const { properties } = useProperty()
  const { toast } = useToast()
  
  const [myBookings, setMyBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', id)

        if (error) throw error; 
        
        setMyBookings(prev => prev.filter(b => b.id !== id));
        alert("Success! The booking has been deleted.");
      } catch (err: any) {
        alert(`Delete Failed: ${err.message}`);
      }
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    // 🌟 1. 砸掉外层实心墙：去掉 bg-gray-50
    <div className="min-h-screen pb-20">
      
      {/* 🌟 2. 头部换成毛玻璃：bg-white/80 backdrop-blur-md */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 sticky top-0 z-10 text-center border-b border-white/50">
        <h1 className="text-xl font-black text-blue-800 tracking-tight">Booking History</h1>
      </header>
      
      <main className="p-4 max-w-2xl mx-auto space-y-4 mt-4">
        {myBookings.length > 0 ? (
          myBookings.map((booking) => {
            const property = properties.find(p => String(p.id) === String(booking.property_id))
            
            return (
              // 🌟 3. 卡片换成高级毛玻璃：bg-white/90 backdrop-blur-md
              <Card key={booking.id} className="overflow-hidden border-none shadow-xl bg-white/90 backdrop-blur-md rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="relative w-full md:w-28 h-32 md:h-28 flex-shrink-0">
                    <img 
                      src={property?.image || "/placeholder.svg"} 
                      className="w-full h-full object-cover rounded-xl border border-white shadow-sm" 
                      alt="" 
                    />
                  </div>
                  <div className="flex-grow w-full min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-black text-gray-900 text-lg line-clamp-1 tracking-tight">
                        {property?.name || "Property Room"}
                      </h3>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase shrink-0 shadow-sm ${
                        booking.status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                        booking.status === 'confirmed' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1 mt-2">
                      <p className="text-[11px] text-gray-500 flex items-center gap-1.5 font-bold">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        {booking.start_date} → {booking.end_date}
                      </p>
                      
                      <p className="text-[11px] text-gray-500 flex items-center gap-1.5 font-bold">
                        <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                        Total Bill: <span className="text-gray-900 font-black">RM {booking.total_price}</span>
                      </p>
                    </div>
                    
                    {booking.notes && (
                      <p className="text-[10px] text-blue-700 mt-2 font-bold bg-blue-100/50 w-fit px-2 py-1 rounded-lg border border-blue-200/50 backdrop-blur-sm">
                        {booking.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-none border-gray-100">
                    {booking.status === 'pending' && (
                      <Link href={`/booking-confirmation?propertyId=${booking.property_id}&totalAmount=${booking.total_price}`} className="flex-1 md:w-auto">
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 rounded-xl shadow-md">
                          <CreditCard className="h-4 w-4 mr-1.5" /> Pay
                        </Button>
                      </Link>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-white/50 border-red-100 text-red-500 hover:text-red-700 hover:bg-red-50 flex-1 md:w-auto font-bold h-10 rounded-xl"
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
          // 🌟 4. 空状态提示也做成半透明
          <div className="text-center py-20 bg-white/60 backdrop-blur-md rounded-3xl border-2 border-dashed border-white shadow-inner">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Clock className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-bold text-gray-400">Your history is clear.</p>
            <Link href="/listings">
              <Button variant="link" className="text-blue-600 font-black mt-2">Browse Properties</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}