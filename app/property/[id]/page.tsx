"use client"
import { supabase } from "@/lib/supabase"
// 🌟 1. 引入了 useEffect
import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation" 
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs" 
import type { DateRange } from "react-day-picker"
import { addDays, differenceInDays, differenceInMonths, addMonths } from "date-fns" 
import { Star, UserCircle, MapPin, Clock, Tag, Calculator, Loader2 } from "lucide-react"
import { useProperty } from "../../contexts/PropertyContext"
import { useAuth } from "../../contexts/AuthContext"

export default function PropertyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyIdStr = params?.id ? String(params.id) : "";
  
  const { toast } = useToast();
  const { properties, updateProperty } = useProperty();
  const { user } = useAuth();
  
  const realProperty = properties.find((p) => String(p.id) === propertyIdStr);

  const [bookingType, setBookingType] = useState("semester"); 
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 120),
  });
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isChecking, setIsChecking] = useState(false); 
  
  // 🌟 2. 新增状态：用来存放所有需要变成灰色的“已预订日期范围”
  const [disabledDates, setDisabledDates] = useState<{from: Date, to: Date}[]>([]);

  // 🌟 3. 一进页面，就去自动拉取已经被定走的日期
  useEffect(() => {
    if (!realProperty) return;
    
    const fetchBookedDates = async () => {
      const pId = isNaN(Number(realProperty.id)) ? realProperty.id : Number(realProperty.id);
      
      const { data, error } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('property_id', pId)
        .eq('status', 'confirmed'); // 只有已付款的才会在日历上变灰

      if (!error && data) {
        // 将数据库里的字符串日期转换成日历组件能识别的 Date 对象
        const ranges = data.map(booking => ({
          from: new Date(booking.start_date),
          to: new Date(booking.end_date)
        }));
        setDisabledDates(ranges);
      }
    };

    fetchBookedDates();
  }, [realProperty?.id]);

  if (!realProperty) return <div className="p-10 text-center font-bold">Loading Property...</div>;

  const currentReviews = Array.isArray(realProperty?.reviews) ? realProperty.reviews : [];
  const avgRating = currentReviews.length > 0 
    ? currentReviews.reduce((acc: number, rev: any) => acc + (Number(rev.rating) || 0), 0) / currentReviews.length 
    : 0;

  const getMinDays = () => {
    if (bookingType === "day") return 1;
    if (bookingType === "month") return 30;
    return 120;
  };

  const getPriceDetails = () => {
    if (!dateRange?.from || !dateRange?.to) return { total: 0, days: 0, m: 0, d: 0, rate: 0, unit: "", explanation: "" };
    const totalDays = Math.abs(differenceInDays(dateRange.to, dateRange.from)) + 1;
    const baseM = realProperty.price;
    const fullMonths = differenceInMonths(dateRange.to, dateRange.from);
    const extraDays = Math.abs(differenceInDays(dateRange.to, addMonths(dateRange.from, fullMonths)));
    
    let rate = 0; let unit = "month"; let total = 0; let explanation = "";

    if (bookingType === "day") {
      rate = Math.round(baseM / 25);
      unit = "day";
      total = rate * totalDays;
      explanation = "Daily flexibility rate applied.";
    } else if (bookingType === "semester") {
      rate = Math.round(baseM * 0.9);
      total = Math.round((fullMonths * rate) + (extraDays * (rate / 30)));
      explanation = "10% Semester discount applied!";
    } else {
      rate = baseM;
      total = Math.round((fullMonths * rate) + (extraDays * (rate / 30)));
      explanation = "Standard monthly student rate.";
    }
    return { total, days: totalDays, m: fullMonths, d: extraDays, rate, unit, explanation };
  };

  const { total, days, m, d, rate, unit, explanation } = getPriceDetails();

  const handleBooking = async () => {
    if (!user) { alert("Please login first!"); return; }
    if (!dateRange?.from || !dateRange?.to) { alert("Please select dates!"); return; }

    const minRequiredDays = getMinDays();
    if (days < minRequiredDays) {
      alert(`The ${bookingType.toUpperCase()} plan requires a minimum of ${minRequiredDays} days. You only selected ${days} days.`);
      return;
    }

    setIsChecking(true);

    try {
      const startDate = dateRange.from.toISOString().split('T')[0];
      const endDate = dateRange.to.toISOString().split('T')[0];
      const pId = isNaN(Number(realProperty.id)) ? realProperty.id : Number(realProperty.id);

      // 作为最终屏障的冲突检查（防止有些高级用户绕过日历强行预订）
      const { data: conflicts, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', pId)
        .eq('status', 'confirmed') 
        .lt('start_date', endDate) 
        .gt('end_date', startDate);

      if (checkError) throw new Error(checkError.message);

      if (conflicts && conflicts.length > 0) {
        alert("This house is already booked and PAID for these dates! Please check the grayed-out dates on the calendar.");
        setIsChecking(false);
        return;
      }

      const insertData = {
        property_id: pId,
        tenant_id: user.id,
        start_date: startDate,
        end_date: endDate,
        total_price: total,
        status: 'pending',
        notes: `Plan: ${bookingType.toUpperCase()} (${m}m ${d}d)`,
        booking_type: bookingType
      };

      const { error: insertError } = await supabase.from('bookings').insert([insertData]);
      if (insertError) throw new Error(insertError.message);

      router.push(`/booking-confirmation?propertyId=${pId}&totalAmount=${total}&from=${startDate}&to=${endDate}`);

    } catch (err: any) {
      alert(`Booking Error: ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const review = {
      id: Date.now(),
      user: user?.username || "Student User",
      rating: newRating,
      comment: newComment,
      date: new Date().toISOString().split('T')[0]
    };
    updateProperty({ ...realProperty, reviews: [...currentReviews, review] });
    setNewComment(""); setNewRating(5);
    toast({ title: "Review Submitted!" });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 text-black">
      <header className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-50">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-600">← Back</Button>
        <h1 className="text-lg font-bold text-blue-900 tracking-tight">UniRent Detail</h1>
        <div className="w-10"></div>
      </header>
      
      <main className="p-4 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <Carousel className="w-full shadow-lg rounded-2xl overflow-hidden border bg-white">
            <CarouselContent>
                <CarouselItem>
                  <div className="aspect-video relative">
                    <img src={realProperty.image || "/placeholder.svg"} className="w-full h-full object-cover" alt="" />
                  </div>
                </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="left-4" /><CarouselNext className="right-4" />
          </Carousel>

          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">{realProperty.name}</h2>
                <Badge className="bg-yellow-100 text-yellow-700 border-none flex gap-1"><Star className="h-3 w-3 fill-yellow-700" /> {avgRating.toFixed(1)}</Badge>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {(realProperty.facilities || []).map((f, i) => (<Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700 border-none px-3 py-1 font-medium">{f}</Badge>))}
              </div>
              <div className="flex items-center text-gray-500 text-sm mb-6"><MapPin className="h-4 w-4 mr-1 text-red-500" /> Nearby USM Campus (approx. {realProperty.distanceToUSM}km)</div>
              
              <div className="p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500 mb-6 italic">
                "{(realProperty as any).description || "Verified student accommodation."}"
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-bold px-1 text-gray-800">Student Reviews ({currentReviews.length})</h3>
            <div className="grid gap-4">
              {currentReviews.map((rev: any) => (
                <div key={rev.id} className="p-4 rounded-xl border bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm flex items-center gap-2"><UserCircle className="h-5 w-5 text-gray-400"/> {rev.user}</span>
                    <div className="flex text-yellow-500 gap-0.5">{[...Array(5)].map((_, i) => (<Star key={i} className={`h-3 w-3 ${i < rev.rating ? "fill-current" : "text-gray-200"}`} />))}</div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-xl border border-dashed border-gray-300">
              <h4 className="font-bold mb-4 text-sm text-gray-700">Write a Review</h4>
              {user ? (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5].map(s => (<Star key={s} onClick={() => setNewRating(s)} className={`h-6 w-6 cursor-pointer transition-colors ${s <= newRating ? "text-yellow-400 fill-current" : "text-gray-200"}`} />))}
                  </div>
                  <Textarea placeholder="Share your experience..." className="rounded-xl border-gray-200 mt-4" value={newComment} onChange={e => setNewComment(e.target.value)} />
                  <Button type="submit" className="bg-gray-800 hover:bg-black mt-4">Post Feedback</Button>
                </form>
              ) : ( <p className="text-sm text-gray-400 italic">Please login to write a review.</p> )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 border shadow-xl rounded-2xl bg-white overflow-hidden">
            <div className="p-6 border-b bg-blue-600 text-white text-center">
              <p className="text-[10px] font-bold uppercase opacity-80 mb-1 tracking-widest">Base Rate</p>
              <p className="text-4xl font-black">RM {realProperty.price}<span className="text-sm font-normal opacity-70 ml-1"> / month</span></p>
            </div>
            
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Tabs value={bookingType} onValueChange={setBookingType} className="w-full">
                  <TabsList className="grid grid-cols-3 bg-gray-100 p-1 h-11 rounded-xl">
                    <TabsTrigger value="day" className="rounded-lg text-xs font-bold">Daily</TabsTrigger>
                    <TabsTrigger value="month" className="rounded-lg text-xs font-bold">Monthly</TabsTrigger>
                    <TabsTrigger value="semester" className="rounded-lg text-xs font-bold">Semest.</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-2">
                  <Tag className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-blue-800">Rate: RM {rate} / {unit}</p>
                    <p className="text-[10px] text-blue-600 leading-tight mt-1">{explanation}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Stay Period</label>
                  <Badge className="bg-gray-100 text-gray-600 border-none text-[9px]">MIN. {getMinDays()} DAYS</Badge>
                </div>
                <div className="border rounded-xl p-1 bg-gray-50 flex justify-center shadow-inner relative">
                  
                  {/* 🌟 4. 把灰色的日期范围传递给日历组件 */}
                  <Calendar 
                    mode="range" 
                    selected={dateRange} 
                    onSelect={setDateRange} 
                    numberOfMonths={1} 
                    className="scale-90"
                    disabled={[
                      { before: new Date() }, // 过去的时间不能选（不能时光倒流租房）
                      ...disabledDates        // 已经被付款定走的日期变灰不能选
                    ]}
                  />

                </div>
                {days > 0 && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 text-[11px] font-bold ${days < getMinDays() ? "bg-red-50 text-red-600 border-red-100 border" : "bg-green-50 text-green-700"}`}>
                    <Clock className="h-4 w-4" /><span>{days} days selected ({m}m {d}d)</span>
                  </div>
                )}
              </div>

              {days >= getMinDays() && (
                <div className="space-y-2 pt-2">
                  <div className="flex flex-col text-[11px] text-gray-500 space-y-1 bg-gray-50 p-2 rounded-lg border">
                    <div className="flex justify-between"><span>Full Months ({m}m):</span><span>RM {m * rate}</span></div>
                    {d > 0 && <div className="flex justify-between border-t pt-1 mt-1"><span>Extra Days ({d}d):</span><span>RM {Math.round(d * (rate / 30))}</span></div>}
                  </div>
                  <div className="p-4 bg-gray-900 rounded-xl flex justify-between items-center text-white shadow-xl">
                    <div className="flex items-center gap-2"><Calculator className="w-4 h-4 text-blue-400" /><span className="text-xs font-bold">Total Bill:</span></div>
                    <span className="text-xl font-black">RM {total}</span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-all active:scale-95 mt-4" 
                onClick={handleBooking}
                disabled={isChecking}
              >
                {isChecking ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</> : "Book Now"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}