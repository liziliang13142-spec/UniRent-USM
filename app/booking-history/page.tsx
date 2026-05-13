"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useBooking } from "../contexts/BookingContext"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { Trash2 } from "lucide-react" // 引入垃圾桶图标

export default function BookingHistoryPage() {
  const { bookings, deleteBooking } = useBooking() // 👈 拿到删除方法
  const { user } = useAuth()
  const { toast } = useToast()

  // 仅显示当前用户的订单
  const myBookings = bookings.filter(b => b.tenantName === user?.username)

  // 处理删除点击
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this booking record? This action cannot be undone.")) {
      deleteBooking(id)
      toast({
        title: "Record Deleted",
        description: "The booking history has been removed.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10 text-center">
        <h1 className="text-xl font-bold text-blue-800">Booking History</h1>
      </header>
      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {myBookings.length > 0 ? (
          myBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-4 flex items-center gap-4">
                <img 
                  src={booking.propertyImage || "/placeholder.svg"} 
                  className="w-20 h-20 object-cover rounded-md" 
                  alt="" 
                />
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900">{booking.propertyName}</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-2">Total: ${booking.totalAmount}</p>
                </div>
                
                {/* 👇 右侧操作区域：Details + Delete */}
                <div className="flex flex-col gap-2">
                  <Link href={`/property/${booking.propertyId}`}>
                      <Button variant="ghost" size="sm" className="text-blue-600 w-full justify-start px-2">
                        Details
                      </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full justify-start px-2"
                    onClick={() => handleDelete(booking.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p>No bookings found.</p>
            <Link href="/listings"><Button variant="link">Browse Properties</Button></Link>
          </div>
        )}
      </main>
    </div>
  )
}