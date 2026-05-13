"use client"
import { supabase } from "@/lib/supabase" // 🌟 确保路径指向你的 supabase.ts 文件
import { useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import type { DateRange } from "react-day-picker"
import { addDays, differenceInDays } from "date-fns" // 🌟 引入了 differenceInDays
import { Star, UserCircle, Info } from "lucide-react"
import { useProperty } from "../../contexts/PropertyContext"
import { useAuth } from "../../contexts/AuthContext"

export default function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const propertyId = Number(resolvedParams.id)
  
  const router = useRouter()
  const { toast } = useToast()
  const { properties, updateProperty } = useProperty()
  const { user } = useAuth()
  
  const realProperty = properties.find((p) => p.id === propertyId)

  // 默认给个 120 天（一学期）的范围
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 120),
  })

  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState("")

  if (!realProperty) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Property Not Found</h2>
        <Button onClick={() => router.push("/listings")}>Back to Home</Button>
      </div>
    )
  }

  // 1. 强制检查是否为数组
  const currentReviews = Array.isArray(realProperty?.reviews) ? realProperty.reviews : [];

  // 2. 计算平均分
  const avgRating = currentReviews.length > 0 
    ? currentReviews.reduce((acc: number, rev: any) => acc + (Number(rev.rating) || 0), 0) / currentReviews.length 
    : 0;

  const displayProperty = {
    ...realProperty,
    description: "This property is exclusively for student accommodation. All contracts are based on a semester-wise or yearly basis to ensure a stable environment for your studies.",
    maxOccupancy: realProperty.bedrooms * 2,
    images: [
      { url: realProperty.image || "/placeholder.svg", room: "Main View" },
      { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=2074&q=80", room: "Kitchen" },
      { url: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=2071&q=80", room: "Bedroom" },
    ]
  }

  // 🌟 核心逻辑：处理预订及 120 天校验
  // 🌟 修改为 async 异步函数
  const handleBooking = async () => {
    // 0. 安全检查：必须登录才能预订
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to book a property.", variant: "destructive" });
      return;
    }

    if (dateRange?.from && dateRange?.to) {
      const totalDays = Math.abs(differenceInDays(dateRange.to, dateRange.from)) + 1;
      const MIN_RENTAL_DAYS = 120; 

      // 1. 业务逻辑校验
      if (totalDays < MIN_RENTAL_DAYS) {
        toast({
          title: "Booking Duration Too Short",
          description: `This property requires a minimum stay of 120 days. You've selected ${totalDays} days.`,
          variant: "destructive",
        });
        return;
      }

      const totalAmount = Math.round(displayProperty.price * (totalDays / 30));

      // 2. 🌟 核心：将数据写入 Supabase 的 bookings 表
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            property_id: propertyId,
            tenant_id: user.id, // 使用 AuthContext 中的用户 ID
            start_date: dateRange.from.toISOString(),
            end_date: dateRange.to.toISOString(),
            total_price: totalAmount,
            status: 'pending'
          }
        ]);

      if (error) {
        toast({ title: "Booking Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Request Sent!", description: "Your booking request has been sent to the landlord." });
        
        // 3. 跳转到确认页面（如果你需要展示账单详情）
        router.push(
          `/booking-confirmation?propertyId=${propertyId}&totalAmount=${totalAmount}&from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`,
        );
      }
    } else {
      toast({ title: "Selection Incomplete", description: "Please select dates.", variant: "destructive" });
    }
  }

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    const review = {
      id: Date.now(),
      user: user?.username || "Anonymous",
      rating: newRating,
      comment: newComment,
      date: new Date().toISOString().split('T')[0]
    }
    updateProperty({ ...realProperty, reviews: [...currentReviews, review] })
    setNewComment(""); setNewRating(5);
    toast({ title: "Review Posted!" })
  }

  // 计算当前选中的天数（用于 UI 实时显示）
  const selectedDays = dateRange?.from && dateRange?.to 
    ? Math.abs(differenceInDays(dateRange.to, dateRange.from)) + 1 
    : 0;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <Button variant="ghost" onClick={() => router.back()}>← Back</Button>
        <h1 className="text-2xl font-bold text-blue-800">UniRent</h1>
      </header>
      
      <main className="p-4 max-w-3xl mx-auto">
        <Carousel className="w-full mb-4 shadow-lg rounded-xl overflow-hidden">
          <CarouselContent>
            {displayProperty.images.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative h-64 md:h-96">
                  <img src={image.url} alt={image.room} className="w-full h-full object-cover" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>

        <Card className="border-none shadow-md">
          <CardContent className="p-5 md:p-8">
            <h2 className="text-3xl font-bold mb-3">{displayProperty.name}</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {displayProperty.facilities.map((f, i) => (
                <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">{f}</span>
              ))}
            </div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-2xl font-bold text-blue-700">${displayProperty.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="ml-1 text-sm font-bold">{avgRating.toFixed(1)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-md border border-red-100 uppercase">Min 1 Semester</p>
              </div>
            </div>

            <p className="text-gray-600 mb-8 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-400 italic">"{displayProperty.description}"</p>

            <hr className="mb-8 border-gray-100" />

            <h3 className="text-xl font-bold mb-2">Booking Calendar</h3>
            <div className="flex items-center gap-2 mb-4 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
              <Info className="h-4 w-4" />
              <span>Rental Rule: Minimum 1 Semester (120 days) required.</span>
            </div>

            <div className="flex flex-col items-center mb-6 bg-white p-2 rounded-xl border border-gray-200 shadow-inner">
               <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={1} />
               {/* 实时天数显示 */}
               {selectedDays > 0 && (
                 <p className={`mt-2 text-sm font-bold ${selectedDays < 120 ? "text-red-500" : "text-green-600"}`}>
                   Current selection: {selectedDays} days {selectedDays < 120 && "(Below minimum)"}
                 </p>
               )}
            </div>

            <div className="space-y-3">
              <Button className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg" onClick={handleBooking}>
                Book for Semester
              </Button>
              <Link href={`/messages/${propertyId}`}>
                <Button variant="outline" className="w-full h-12">Contact Landlord</Button>
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t">
              <h3 className="text-2xl font-bold mb-6">Guest Reviews</h3>
              <div className="space-y-4 mb-8">
                {currentReviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-lg border bg-white shadow-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold flex items-center gap-2"><UserCircle className="h-5 w-5 text-gray-400"/>{rev.user}</span>
                      <div className="flex text-yellow-400"><Star className="h-3 w-3 fill-current"/>{rev.rating}</div>
                    </div>
                    <p className="text-sm text-gray-600">{rev.comment}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-dashed">
                <h4 className="font-bold mb-4">Write a review</h4>
                {user ? (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div className="flex gap-1 mb-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} onClick={() => setNewRating(s)} className={`h-6 w-6 cursor-pointer ${s <= newRating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                      ))}
                    </div>
                    <Textarea placeholder="Share your experience..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                    <Button type="submit">Post Review</Button>
                  </form>
                ) : (
                   <p className="text-sm text-gray-500">Please login to leave a review.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}