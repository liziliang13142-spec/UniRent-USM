"use client"

import { supabase } from "@/lib/supabase"
import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation" 
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs" 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { DateRange } from "react-day-picker"
import { addDays, differenceInDays, differenceInMonths, addMonths } from "date-fns" 
import { Star, UserCircle, MapPin, Clock, Tag, Calculator, Loader2, Phone, User, MessageSquare, CalendarDays } from "lucide-react"
import { useProperty } from "../../contexts/PropertyContext"
import { useAuth } from "../../contexts/AuthContext"

export default function PropertyDetailsPage() {
  // ==========================================
  // 1. Hooks & States (保持在最顶部)
  // ==========================================
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { properties, updateProperty } = useProperty();
  const { user } = useAuth();
  
  const [bookingType, setBookingType] = useState("semester"); 
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isChecking, setIsChecking] = useState(false); 
  const [disabledDates, setDisabledDates] = useState<{from: Date, to: Date}[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // 预约看房相关状态
  const [isViewingModalOpen, setIsViewingModalOpen] = useState(false);
  const [isSubmittingViewing, setIsSubmittingViewing] = useState(false);
  const [viewingForm, setViewingForm] = useState({
    name: "",
    phone: "",
    date: "",
    message: ""
  });

  // 1. 数据查找
  const propertyIdStr = params?.id ? String(params.id) : "";
  const realProperty = properties.find((p) => String(p.id) === propertyIdStr);

  // ==========================================
  // 2. Effects
  // ==========================================
  useEffect(() => {
    setIsMounted(true);
    setDateRange({ from: new Date(), to: addDays(new Date(), 120) });

    if (!realProperty) return;
    
    const fetchBookedDates = async () => {
      const pId = isNaN(Number(realProperty.id)) ? realProperty.id : Number(realProperty.id);
      const { data, error } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('property_id', pId)
        .eq('status', 'confirmed'); 

      if (!error && data) {
        const ranges = data.map(booking => ({
          from: new Date(booking.start_date),
          to: new Date(booking.end_date)
        }));
        setDisabledDates(ranges);
      }
    };
    fetchBookedDates();
  }, [realProperty?.id]);

  // ==========================================
  // 3. Logic Functions (计算逻辑保持不变)
  // ==========================================
  
  const getMinDays = () => {
    if (bookingType === "day") return 1;
    if (bookingType === "month") return 30;
    return 120;
  };

  const getPriceDetails = () => {
    if (!dateRange?.from || !dateRange?.to || !realProperty) return { total: 0, days: 0, m: 0, d: 0, rate: 0, unit: "", explanation: "" };
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

  // ==========================================
  // 4. Action Handlers (重点修改点)
  // ==========================================

  // 🌟 核心：提交预约看房
  const handleRequestViewing = async () => {
    if (!user) { toast({ title: "Login Required", variant: "destructive" }); return; }
    if (!viewingForm.name || !viewingForm.phone || !viewingForm.date) {
      toast({ title: "Fill Required Fields", description: "Name, Phone and Date are necessary.", variant: "destructive" });
      return;
    }

    // 🛡️ 核心补丁：检查 landlordId 是否为有效的 UUID (防止 23503 错误)
    const landlordId = realProperty?.landlordId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(landlordId || "");

    if (!isUuid) {
      alert(`System Error: The landlord ID for this property is invalid (${landlordId}). Please contact support to update property data.`);
      return;
    }

    setIsSubmittingViewing(true);
    try {
      const { error } = await supabase.from('viewing_requests').insert([{
        property_id: realProperty?.id,
        tenant_id: user.id, // 当前登录租户
        landlord_id: landlordId, // 房东 UUID
        tenant_name: viewingForm.name,
        tenant_phone: viewingForm.phone,
        viewing_date: viewingForm.date,
        tenant_message: viewingForm.message,
        status: 'pending'
      }]);

      if (error) throw error;

      toast({ title: "Request Sent!", description: "The landlord will be notified." });
      setIsViewingModalOpen(false);
      setViewingForm({ name: "", phone: "", date: "", message: "" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmittingViewing(false);
    }
  };

  // 预订处理
  const handleBooking = async () => {
    if (!user || !dateRange?.from || !dateRange?.to || !realProperty) {
        if (!user) alert("Please login first!");
        return;
    }
    if (days < getMinDays()) {
      alert(`Min. stay for this plan is ${getMinDays()} days.`);
      return;
    }
    setIsChecking(true);
    try {
      const startDate = dateRange.from.toISOString().split('T')[0];
      const endDate = dateRange.to.toISOString().split('T')[0];
      const { error: insertError } = await supabase.from('bookings').insert([{
        property_id: realProperty.id, 
        tenant_id: user.id, 
        start_date: startDate, 
        end_date: endDate, 
        total_price: total, 
        status: 'pending', 
        notes: `Plan: ${bookingType.toUpperCase()}`, 
        booking_type: bookingType
      }]);
      if (insertError) throw insertError;
      router.push(`/booking-confirmation?propertyId=${realProperty.id}&totalAmount=${total}&from=${startDate}&to=${endDate}`);
    } catch (err: any) { 
      alert(`Booking error: ${err.message}`); 
    } finally { 
      setIsChecking(false); 
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !realProperty) return;
    const review = { id: Date.now(), user: user?.username || "Student User", rating: newRating, comment: newComment, date: new Date().toISOString().split('T')[0] };
    updateProperty({ ...realProperty, reviews: [...(realProperty.reviews || []), review] });
    setNewComment(""); setNewRating(5);
    toast({ title: "Review Submitted!" });
  };

  // 🛡️ 防崩溃：如果没有找到房子，安全返回 Loading
  if (!isMounted || !realProperty) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500 bg-gray-50"><Loader2 className="animate-spin mr-2" /> Loading Property Details...</div>;
  }

  const currentReviews = realProperty.reviews || [];

  // ==========================================
  // 5. Render (UI 渲染 - 保持你最满意的布局)
  // ==========================================
  return (
    <div className="min-h-screen pb-12 text-black bg-gray-50/30">
      <header className="bg-white/80 backdrop-blur-md border-b p-4 flex items-center justify-between sticky top-0 z-50">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-600">← Back</Button>
        <h1 className="text-lg font-bold text-blue-900 tracking-tight">UniRent Detail</h1>
        <div className="w-10"></div>
      </header>
      
      <main className="p-4 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* 左侧详情 */}
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

          <Card className="border-none shadow-sm rounded-2xl bg-white/95">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">{realProperty.name}</h2>
                <Badge className="bg-yellow-100 text-yellow-700 border-none flex gap-1">
                  <Star className="h-3 w-3 fill-yellow-700" /> 
                  {(currentReviews.length > 0 ? (currentReviews.reduce((a,b)=>a+b.rating,0)/currentReviews.length) : 0).toFixed(1)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {realProperty.facilities?.map((f, i) => (<Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700 border-none px-3 py-1 font-medium">{f}</Badge>))}
              </div>
              <div className="flex items-center text-gray-500 text-sm mb-6"><MapPin className="h-4 w-4 mr-1 text-red-500" /> Nearby USM Campus ({realProperty.distanceToUSM}km)</div>
              <div className="p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500 mb-6 italic text-blue-800">
                "{(realProperty as any).description || "Verified student accommodation for USM community."}"
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-bold px-1 text-gray-800">Student Reviews ({currentReviews.length})</h3>
            <div className="grid gap-4">
              {currentReviews.map((rev: any) => (
                <div key={rev.id} className="p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm flex items-center gap-2"><UserCircle className="h-5 w-5 text-gray-400"/> {rev.user}</span>
                    <div className="flex text-yellow-500 gap-0.5">{[...Array(5)].map((_, i) => (<Star key={i} className={`h-3 w-3 ${i < rev.rating ? "fill-current" : "text-gray-200"}`} />))}</div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-xl border border-dashed border-gray-300">
               <h4 className="font-bold mb-4 text-sm text-gray-700 text-center">Share your experience</h4>
               {user ? (
                 <form onSubmit={handleSubmitReview} className="space-y-4">
                   <div className="flex justify-center gap-1.5">{[1,2,3,4,5].map(s => (<Star key={s} onClick={() => setNewRating(s)} className={`h-6 w-6 cursor-pointer transition-all ${s <= newRating ? "text-yellow-400 fill-current scale-110" : "text-gray-200"}`} />))}</div>
                   <Textarea placeholder="How was the environment and stay?" className="rounded-xl mt-4" value={newComment} onChange={e => setNewComment(e.target.value)} />
                   <Button type="submit" className="w-full bg-gray-800 hover:bg-black mt-2 rounded-xl h-11 font-bold">Post Feedback</Button>
                 </form>
               ) : ( <p className="text-center text-sm text-gray-400 italic">Please login to write a review.</p> )}
            </div>
          </div>
        </div>

        {/* 右侧边栏 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border shadow-xl rounded-2xl bg-white overflow-hidden">
            <div className="p-6 border-b bg-blue-600 text-white text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Standard Rate</p>
              <p className="text-4xl font-black text-white">RM {realProperty.price}<span className="text-sm font-normal opacity-70 ml-1"> / mo</span></p>
            </div>
            
            <CardContent className="p-6 space-y-6">
              <Tabs value={bookingType} onValueChange={setBookingType} className="w-full">
                <TabsList className="grid grid-cols-3 bg-gray-100 rounded-xl h-11 p-1">
                  <TabsTrigger value="day" className="font-bold text-xs rounded-lg">Daily</TabsTrigger>
                  <TabsTrigger value="month" className="font-bold text-xs rounded-lg">Monthly</TabsTrigger>
                  <TabsTrigger value="semester" className="font-bold text-xs rounded-lg">Semester</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1 text-xs font-bold text-gray-500 uppercase">
                  <label>Stay Period</label>
                  <Badge variant="outline" className="text-[9px] border-gray-200">Min. {getMinDays()} days</Badge>
                </div>
                <div className="border rounded-xl p-1 bg-gray-50 flex justify-center shadow-inner">
                  <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={1} className="scale-90" disabled={[{ before: new Date() }, ...disabledDates]} />
                </div>
              </div>

              {days >= getMinDays() && (
                <div className="p-4 bg-gray-900 rounded-xl flex justify-between items-center text-white shadow-lg">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Total Bill</span>
                  <span className="text-xl font-black">RM {total}</span>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <Button className="w-full h-14 text-lg font-black bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg active:scale-95 transition-all" onClick={handleBooking} disabled={isChecking}>
                  {isChecking ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Processing...</> : "Book Now"}
                </Button>

                <Dialog open={isViewingModalOpen} onOpenChange={setIsViewingModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-14 text-lg font-bold border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      Schedule Viewing
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl max-w-sm bg-white/95 backdrop-blur-md border-none shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-blue-900 flex items-center gap-2">
                        <CalendarDays className="h-6 w-6 text-blue-600" /> Schedule Viewing
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-100" placeholder="Full Name" value={viewingForm.name} onChange={e => setViewingForm({...viewingForm, name: e.target.value})} />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-100" placeholder="Phone (e.g. 012...)" value={viewingForm.phone} onChange={e => setViewingForm({...viewingForm, phone: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Proposed Date</label>
                        <Input type="date" className="h-11 rounded-xl bg-gray-50 border-gray-100" value={viewingForm.date} onChange={e => setViewingForm({...viewingForm, date: e.target.value})} />
                      </div>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Textarea className="pl-10 rounded-xl min-h-[100px] bg-gray-50 border-gray-100" placeholder="Ask specific questions..." value={viewingForm.message} onChange={e => setViewingForm({...viewingForm, message: e.target.value})} />
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-bold shadow-lg mt-2 transition-all active:scale-95" onClick={handleRequestViewing} disabled={isSubmittingViewing}>
                        {isSubmittingViewing ? <Loader2 className="animate-spin h-5 w-5" /> : "Send Request"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}