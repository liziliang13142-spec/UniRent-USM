"use client"

import { supabase } from "@/lib/supabase"
import React, { useState, useEffect, useCallback } from "react"
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
// 🌟 新增：引入 Popover 用于装载英文日历
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { DateRange } from "react-day-picker"
// 🌟 新增：引入 format 用于格式化英文日期显示
import { addDays, differenceInDays, differenceInMonths, addMonths, format } from "date-fns" 
import { Star, UserCircle, MapPin, Clock, Tag, Calculator, Loader2, Phone, User, MessageSquare, CalendarDays, Info } from "lucide-react"
import { useProperty } from "../../contexts/PropertyContext"
import { useAuth } from "../../contexts/AuthContext"

export default function PropertyDetailsPage() {
  // ==========================================
  // 1. Hooks & States
  // ==========================================
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { properties, updateProperty, addReview } = useProperty();
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

  // 存储从 reviews 表中获取的真实评论
  const [dbReviews, setDbReviews] = useState<any[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);

  // 存储当前租户对该房源的“预约看房记录”
  const [userViewingRequest, setUserViewingRequest] = useState<any>(null);

  // 数据查找
  const propertyIdStr = params?.id ? String(params.id) : "";
  const realProperty = properties.find((p) => String(p.id) === propertyIdStr);

  // ==========================================
  // 2. Effects & Data Fetching
  // ==========================================

  const fetchReviews = useCallback(async () => {
    if (!propertyIdStr) return;
    setIsReviewsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('property_id', Number(propertyIdStr))
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDbReviews(data || []);
    } catch (err: any) {
      console.error("Fetch reviews error:", err.message);
    } finally {
      setIsReviewsLoading(false);
    }
  }, [propertyIdStr]);

  useEffect(() => {
    setIsMounted(true);
    setDateRange({ from: new Date(), to: addDays(new Date(), 120) });
    
    if (realProperty) {
      fetchReviews();
    }

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
  }, [realProperty?.id, fetchReviews]);

  useEffect(() => {
    if (user && realProperty) {
      const fetchUserRequest = async () => {
        try {
          const { data, error } = await supabase
            .from('viewing_requests')
            .select('*')
            .eq('property_id', realProperty.id)
            .eq('tenant_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (data && !error) {
            setUserViewingRequest(data);
          }
        } catch (err) {
          // 静默处理
        }
      };
      fetchUserRequest();
    }
  }, [user, realProperty?.id]);

  // ==========================================
  // 3. Logic Functions
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
  // 4. Action Handlers
  // ==========================================

  const handleContactLandlord = () => {
    if (!user) {
      toast({ title: "Login Required", variant: "destructive" });
      return;
    }
    if (!realProperty) return;
    
    router.push(`/messages?partnerId=${realProperty.landlordId}&propertyId=${realProperty.id}&propertyName=${encodeURIComponent(realProperty.name)}`);
  };

  const handleRequestViewing = async () => {
    if (!user) { toast({ title: "Login Required", variant: "destructive" }); return; }
    if (!viewingForm.name || !viewingForm.phone || !viewingForm.date) {
      toast({ title: "Fill Required Fields", description: "Name, Phone and Date are necessary.", variant: "destructive" });
      return;
    }

    const landlordId = realProperty?.landlordId;
    const tenantId = user.id;

    setIsSubmittingViewing(true);
    try {
      const { data, error } = await supabase.from('viewing_requests').insert([{
        property_id: realProperty?.id,
        tenant_id: tenantId, 
        landlord_id: landlordId, 
        tenant_name: viewingForm.name,
        tenant_phone: viewingForm.phone,
        viewing_date: viewingForm.date,
        tenant_message: viewingForm.message,
        status: 'pending'
      }]).select().single();

      if (error) throw error;

      toast({ title: "Request Sent!", description: "The landlord will be notified." });
      setIsViewingModalOpen(false);
      setViewingForm({ name: "", phone: "", date: "", message: "" });
      if (data) setUserViewingRequest(data);
    } catch (err: any) {
      toast({ title: "Submit Failed", description: err.message || "Database Error", variant: "destructive" });
    } finally {
      setIsSubmittingViewing(false);
    }
  };

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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !realProperty || !user) return;
    
    try {
      await addReview({
        propertyId: realProperty.id,
        userName: user.username || "Student User",
        rating: newRating,
        comment: newComment
      });

      setNewComment("");
      setNewRating(5);
      fetchReviews();
    } catch (err: any) {
      console.error("Submit review error:", err.message);
    }
  };

  if (!isMounted || !realProperty) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500 bg-gray-50"><Loader2 className="animate-spin mr-2" /> Loading Property Details...</div>;
  }

  const averageRating = dbReviews.length > 0
    ? (dbReviews.reduce((sum, rev) => sum + (Number(rev.rating) || 0), 0) / dbReviews.length).toFixed(1)
    : "0.0";

  // ==========================================
  // 5. Render UI
  // ==========================================
  return (
    <div className="min-h-screen pb-12 text-black bg-gray-50/30">
      <header className="bg-white/80 backdrop-blur-md border-b p-4 flex items-center justify-between sticky top-0 z-50">
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

          <Card className="border-none shadow-sm rounded-2xl bg-white/95">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">{realProperty.name}</h2>
                <Badge className="bg-yellow-100 text-yellow-700 border-none flex gap-1">
                  <Star className="h-3 w-3 fill-yellow-700" /> {averageRating}
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
            <h3 className="text-lg font-bold px-1 text-gray-800">Student Reviews ({dbReviews.length})</h3>
            <div className="grid gap-4">
              {isReviewsLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-400"><Loader2 className="animate-spin h-5 w-5 mr-2" /> Loading reviews...</div>
              ) : dbReviews.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed italic">No reviews yet. Be the first to share!</div>
              ) : (
                dbReviews.map((rev: any) => (
                  <div key={rev.id} className="p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm flex items-center gap-2">
                        <UserCircle className="h-5 w-5 text-gray-400"/> {rev.user_name}
                      </span>
                      <div className="flex text-yellow-500 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < rev.rating ? "fill-current" : "text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{rev.comment}</p>
                    <p className="text-[10px] text-gray-300 mt-2">{new Date(rev.created_at).toLocaleDateString()}</p>
                  </div>
                ))
              )}
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

        <div className="lg:col-span-1">
          <Card className="sticky top-24 border shadow-xl rounded-2xl bg-white overflow-hidden">
            <div className="p-6 border-b bg-blue-600 text-white text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Standard Rate</p>
              <p className="text-4xl font-black text-white">RM {realProperty.price}<span className="text-sm font-normal opacity-70 ml-1"> / mo</span></p>
            </div>
            
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <Tabs value={bookingType} onValueChange={setBookingType} className="w-full">
                  <TabsList className="grid grid-cols-3 bg-gray-100 rounded-xl h-11 p-1">
                    <TabsTrigger value="day" className="font-bold text-xs rounded-lg">Daily</TabsTrigger>
                    <TabsTrigger value="month" className="font-bold text-xs rounded-lg">Monthly</TabsTrigger>
                    <TabsTrigger value="semester" className="font-bold text-xs rounded-lg">Semester</TabsTrigger>
                  </TabsList>
                  {explanation && (
                    <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2 mt-3 animate-in fade-in slide-in-from-top-1">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-blue-700 font-bold leading-tight">{explanation}</p>
                    </div>
                  )}
                </Tabs>
              </div>

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
                {userViewingRequest && (
                  <div className={`p-4 rounded-xl border flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 shadow-sm ${
                    userViewingRequest.status === 'approved' ? 'bg-green-50 border-green-200' : 
                    userViewingRequest.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Viewing Status</span>
                      <Badge className={userViewingRequest.status === 'approved' ? 'bg-green-500' : userViewingRequest.status === 'rejected' ? 'bg-red-500' : 'bg-orange-500 animate-pulse'}>
                        {userViewingRequest.status}
                      </Badge>
                    </div>
                    {userViewingRequest.status !== 'pending' && (
                      <div className="bg-white/60 p-2 rounded-lg border border-white/50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Landlord Reply:</p>
                        <p className="text-xs font-bold text-gray-700 leading-snug">{userViewingRequest.landlord_comment || "No comment provided."}</p>
                      </div>
                    )}
                  </div>
                )}

                <Button className="w-full h-14 text-lg font-black bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg active:scale-95 transition-all" onClick={handleBooking} disabled={isChecking}>
                  {isChecking ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Processing...</> : "Book Now"}
                </Button>

                <Dialog open={isViewingModalOpen} onOpenChange={setIsViewingModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-14 text-lg font-bold border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      {userViewingRequest ? "Reschedule Viewing" : "Schedule Viewing"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl max-w-sm bg-white/95 backdrop-blur-md border-none shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-blue-900 flex items-center gap-2">
                        <CalendarDays className="h-6 w-6 text-blue-600" /> Schedule Viewing
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="relative"><User className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-100" placeholder="Full Name" value={viewingForm.name} onChange={e => setViewingForm({...viewingForm, name: e.target.value})} /></div>
                      <div className="relative"><Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-100" placeholder="Phone (e.g. 012...)" value={viewingForm.phone} onChange={e => setViewingForm({...viewingForm, phone: e.target.value})} /></div>
                      
                      {/* 🌟 修改核心：将 type="date" 换成了 Shadcn 的 Popover 英文日历 */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Proposed Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`w-full justify-start text-left font-normal bg-gray-50 h-11 border-gray-100 rounded-xl ${!viewingForm.date && "text-gray-400"}`}
                            >
                              <CalendarDays className="mr-2 h-4 w-4 text-blue-600" />
                              {viewingForm.date ? format(new Date(viewingForm.date), "MMM do, yyyy") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-[100]" align="start">
                            <Calendar
                              mode="single"
                              selected={viewingForm.date ? new Date(viewingForm.date) : undefined}
                              onSelect={(date) => setViewingForm({ ...viewingForm, date: date ? format(date, "yyyy-MM-dd") : "" })}
                              initialFocus
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // 禁止选择过去的日期
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="relative"><MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Textarea className="pl-10 rounded-xl min-h-[100px] bg-gray-50 border-gray-100" placeholder="Ask specific questions..." value={viewingForm.message} onChange={e => setViewingForm({...viewingForm, message: e.target.value})} /></div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-bold shadow-lg mt-2 transition-all active:scale-95" onClick={handleRequestViewing} disabled={isSubmittingViewing}>
                        {isSubmittingViewing ? <Loader2 className="animate-spin h-5 w-5" /> : "Send Request"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  className="w-full h-14 text-lg font-bold border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all flex items-center justify-center gap-2"
                  onClick={handleContactLandlord}
                >
                  <MessageSquare className="w-5 h-5" /> Contact Landlord
                </Button>

              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}