"use client"
import { supabase } from "@/lib/supabase"
import React, { useState } from "react"
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

  if (!realProperty) return <div className="p-10 text-center">Loading...</div>;

  const currentReviews = Array.isArray(realProperty?.reviews) ? realProperty.reviews : [];
  const avgRating = currentReviews.length > 0 
    ? currentReviews.reduce((acc: number, rev: any) => acc + (Number(rev.rating) || 0), 0) / currentReviews.length 
    : 0;

  // 🌟 严格的最小天数规则
  const getMinDays = () => {
    if (bookingType === "day") return 1;
    if (bookingType === "month") return 30;
    return 120;
  };

  const getPriceDetails = () => {
    if (!dateRange?.from || !dateRange?.to) return { total: 0, days: 0, m: 0, d: 0, rate: 0, unit: "" };
    const days = Math.abs(differenceInDays(dateRange.to, dateRange.from)) + 1;
    const baseM = realProperty.price;
    const fullMonths = differenceInMonths(dateRange.to, dateRange.from);
    const extraDays = Math.abs(differenceInDays(dateRange.to, addMonths(dateRange.from, fullMonths)));
    
    let rate = baseM;
    let unit = "month";
    let total = 0;

    if (bookingType === "day") {
      rate = Math.round(baseM / 25);
      unit = "day";
      total = rate * days;
    } else {
      rate = bookingType === "semester" ? Math.round(baseM * 0.9) : baseM;
      total = Math.round((fullMonths * rate) + (extraDays * (rate / 30)));
    }
    return { total, days, m: fullMonths, d: extraDays, rate, unit };
  };

  const { total, days, m, d, rate, unit } = getPriceDetails();

  const handleBooking = async () => {
    if (!user) {
      alert("Please login first!");
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
      alert("Please select dates!");
      return;
    }

    // 🌟 修复一：重新加入严格的天数校验拦截
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

      const { data: conflicts, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', pId)
        .neq('status', 'cancelled')
        .lt('start_date', endDate) 
        .gt('end_date', startDate);

      if (checkError) throw new Error(`Database Check Failed: ${checkError.message}`);

      if (conflicts && conflicts.length > 0) {
        alert("This house is already booked for these dates!");
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

      if (insertError) throw new Error(`Insert Failed: ${insertError.message}`);

      router.push(`/booking-confirmation?propertyId=${realProperty.id}&totalAmount=${total}`);

    } catch (err: any) {
      alert(`Booking Error: ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 text-black">
      <header className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-50">
        <Button variant="ghost" onClick={() => router.back()}>← Back</Button>
        <h1 className="text-lg font-bold">UniRent Detail</h1>
        <div className="w-10"></div>
      </header>
      
      <main className="p-4 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video rounded-2xl overflow-hidden border">
             <img src={realProperty.image} className="w-full h-full object-cover" alt="" />
          </div>
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">{realProperty.name}</h2>
            <div className="p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500 italic">
              "{(realProperty as any).description || "Verified student accommodation."}"
            </div>
          </Card>

          <div className="space-y-4">
             <h3 className="font-bold">Reviews</h3>
             {currentReviews.map((rev: any) => (
               <div key={rev.id} className="p-4 border rounded-xl bg-white">
                 <div className="flex justify-between font-bold text-sm">
                   <span>{rev.user}</span>
                   <span className="text-yellow-500">★ {rev.rating}</span>
                 </div>
                 <p className="text-sm text-gray-600 mt-1">{rev.comment}</p>
               </div>
             ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 p-6 space-y-6 shadow-xl">
            <div className="text-center pb-4 border-b">
              <p className="text-3xl font-black text-blue-600">RM {realProperty.price}</p>
              <p className="text-xs text-gray-400">per month</p>
            </div>

            <Tabs value={bookingType} onValueChange={setBookingType}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="semester">Sem</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="border rounded-xl p-2 bg-gray-50 flex justify-center mt-4">
              <Calendar mode="range" selected={dateRange} onSelect={setDateRange} />
            </div>

            {days > 0 && (
              <div className="p-4 bg-gray-900 text-white rounded-xl flex justify-between items-center mt-4">
                <span className="text-xs">Total Bill ({days}d):</span>
                <span className="text-xl font-bold">RM {total}</span>
              </div>
            )}

            <Button 
              className="w-full h-14 bg-blue-600 text-lg font-bold mt-4" 
              onClick={handleBooking}
              disabled={isChecking}
            >
              {isChecking ? <Loader2 className="animate-spin mr-2" /> : "Book Now"}
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}