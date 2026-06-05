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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { DateRange } from "react-day-picker"
import { addDays, differenceInDays, differenceInMonths, addMonths, format } from "date-fns" 
import { Star, UserCircle, MapPin, Loader2, Phone, User, MessageSquare, CalendarDays, Info, AlignLeft, BedDouble, Bath, Maximize, Sparkles, CheckCircle2, Settings, ShieldCheck } from "lucide-react"
import { useProperty } from "../../contexts/PropertyContext"
import { useAuth } from "../../contexts/AuthContext"

export default function PropertyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { properties, addReview } = useProperty();
  const { user } = useAuth();
  
  const [bookingType, setBookingType] = useState("semester"); 
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isChecking, setIsChecking] = useState(false); 
  const [disabledDates, setDisabledDates] = useState<{from: Date, to: Date}[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const [isViewingModalOpen, setIsViewingModalOpen] = useState(false);
  const [isSubmittingViewing, setIsSubmittingViewing] = useState(false);
  const [viewingForm, setViewingForm] = useState({
    name: "",
    phone: "",
    date: "",
    message: ""
  });

  const [modalError, setModalError] = useState<string | null>(null);
  const [dbReviews, setDbReviews] = useState<any[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [userViewingRequest, setUserViewingRequest] = useState<any>(null);

  const propertyIdStr = params?.id ? String(params.id) : "";
  const realProperty = properties.find((p) => String(p.id) === propertyIdStr);

  // 判断是否是房东本人
  const isOwner = user && realProperty && (user.id === realProperty.landlordId || user.username === realProperty.landlordId);

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
        }
      };
      fetchUserRequest();
    }
  }, [user, realProperty?.id]);

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

  const { total, days, explanation } = getPriceDetails();

  const handleContactLandlord = () => {
    if (!user) {
      toast({ title: "Login Required", variant: "destructive" });
      return;
    }
    if (!realProperty) return;
    router.push(`/messages?partnerId=${realProperty.landlordId}&propertyId=${realProperty.id}&propertyName=${encodeURIComponent(realProperty.name)}`);
  };

  const handleRequestViewing = async () => {
    setModalError(null); 
    
    if (!user) { 
      setModalError("Login Required. Please log in first.");
      return; 
    }
    if (!viewingForm.name || !viewingForm.phone || !viewingForm.date) {
      setModalError("Please complete all fields (Name, Phone, and Proposed Date).");
      return;
    }

    const landlordId = realProperty?.landlordId;
    const tenantId = user.id;

    setIsSubmittingViewing(true);
    try {
      const { data, error } = await supabase.from('viewing_requests').insert([{
        property_id: Number(realProperty?.id),
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
      console.error(err);
      setModalError(err.message || "Database Error. Please check Supabase RLS.");
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
      const endDate = dateRange.to?.toISOString().split('T')[0]; 
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

  return (
    <div className="min-h-screen pb-12 text-black bg-gray-50/30">
      <header className="bg-white/80 backdrop-blur-md border-b p-4 flex items-center justify-between sticky top-0 z-50">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-600">← Back</Button>
        <h1 className="text-lg font-bold text-blue-900 tracking-tight">UniRent Detail</h1>
        <div className="w-10"></div>
      </header>
      
      <main className="p-4 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        
        {/* 左侧详情区 */}
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

          <Card className="border-none shadow-sm rounded-[2rem] bg-white/95 overflow-hidden">
            <CardContent className="p-6 md:p-10">
              
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{realProperty.name}</h2>
                <Badge className="bg-yellow-100 text-yellow-700 border-none flex items-center gap-1 px-3 py-1.5 text-sm shrink-0 shadow-sm">
                  <Star className="h-4 w-4 fill-yellow-700" /> {averageRating}
                </Badge>
              </div>
              
              <div className="flex items-center text-slate-500 text-sm mb-8 font-medium">
                <MapPin className="h-4 w-4 mr-1 text-red-500" /> 
                {realProperty.distanceToUSM}km to USM Campus • {(realProperty as any).area || "Penang"}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="bg-slate-50/80 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                  <BedDouble className="w-7 h-7 text-blue-500 mb-2" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bedroom</span>
                  <span className="text-base font-black text-slate-800">{realProperty.bedrooms} Bed</span>
                </div>
                <div className="bg-slate-50/80 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                  <Bath className="w-7 h-7 text-blue-500 mb-2" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bathroom</span>
                  <span className="text-base font-black text-slate-800">{realProperty.bathrooms} Bath</span>
                </div>
                <div className="bg-slate-50/80 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                  <Maximize className="w-7 h-7 text-blue-500 mb-2" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Size</span>
                  <span className="text-base font-black text-slate-800">{realProperty.size || "N/A"}</span>
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                  <AlignLeft className="w-5 h-5 text-blue-600" /> About this Property
                </h3>
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 relative">
                  <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap relative z-10">
                    {realProperty.description || "Verified student accommodation tailored for the USM community. Clean, secure, and ready to move in. Contact the landlord to arrange a viewing and request more details."}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Premium Amenities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {realProperty.facilities && realProperty.facilities.length > 0 ? (
                    realProperty.facilities.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-emerald-200 transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span className="text-sm font-bold text-slate-700 truncate">{f}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic col-span-full">No specific amenities listed.</p>
                  )}
                </div>
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
                 isOwner ? (
                    <p className="text-center text-sm text-slate-400 font-bold italic py-4">As the property owner, you cannot review your own listing.</p>
                 ) : (
                   <form onSubmit={handleSubmitReview} className="space-y-4">
                     <div className="flex justify-center gap-1.5">{[1,2,3,4,5].map(s => (<Star key={s} onClick={() => setNewRating(s)} className={`h-6 w-6 cursor-pointer transition-all ${s <= newRating ? "text-yellow-400 fill-current scale-110" : "text-gray-200"}`} />))}</div>
                     <Textarea placeholder="How was the environment and stay?" className="rounded-xl mt-4" value={newComment} onChange={e => setNewComment(e.target.value)} />
                     <Button type="submit" className="w-full bg-gray-800 hover:bg-black mt-2 rounded-xl h-11 font-bold">Post Feedback</Button>
                   </form>
                 )
               ) : ( <p className="text-center text-sm text-gray-400 italic">Please login to write a review.</p> )}
            </div>
          </div>
        </div>

        {/* 右侧浮动操作区 */}
        <div className="lg:col-span-1">
          {isOwner ? (
            <Card className="sticky top-24 border-none shadow-xl rounded-2xl bg-white overflow-hidden">
              <div className="p-6 border-b bg-emerald-600 text-white text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Owner Access
                </p>
                <p className="text-3xl font-black text-white tracking-tight">Your Property</p>
              </div>
              
              <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl mb-2 text-center animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs font-bold text-emerald-800 leading-relaxed">
                    You are currently viewing your own listing. Booking and messaging functions are disabled for the owner.
                  </p>
                </div>
                
                <Button 
                  onClick={() => router.push(`/landlord/edit-property/${realProperty.id}`)} 
                  className="w-full h-14 text-base font-black bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-200 transition-all flex gap-2 active:scale-95"
                >
                  <Settings className="w-5 h-5" /> Edit Property Details
                </Button>
                
                {/* 🌟 这里的 "View Analytics & KPIs" 按钮已经被去掉了 */}
                
              </CardContent>
            </Card>
          ) : (
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

                  <Dialog open={isViewingModalOpen} onOpenChange={(open) => { setIsViewingModalOpen(open); if(!open) setModalError(null); }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-14 text-lg font-bold border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        {userViewingRequest ? "Reschedule Viewing" : "Schedule Viewing"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-3xl max-w-sm bg-white/95 backdrop-blur-md border-none shadow-2xl z-[100]">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-black text-blue-900 flex items-center gap-2">
                          <CalendarDays className="h-6 w-6 text-blue-600" /> Schedule Viewing
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="relative"><User className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-100" placeholder="Full Name" value={viewingForm.name} onChange={e => setViewingForm({...viewingForm, name: e.target.value})} /></div>
                        <div className="relative"><Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-100" placeholder="Phone (e.g. 012...)" value={viewingForm.phone} onChange={e => setViewingForm({...viewingForm, phone: e.target.value})} /></div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Proposed Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal bg-gray-50 h-11 border-gray-100 rounded-xl ${!viewingForm.date && "text-gray-400"}`}
                              >
                                <CalendarDays className="mr-2 h-4 w-4 text-blue-600" />
                                {viewingForm.date ? format(new Date(viewingForm.date), "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-[110]" align="start">
                              <Calendar
                                mode="single"
                                selected={viewingForm.date ? new Date(viewingForm.date) : undefined}
                                onSelect={(date) => setViewingForm({ ...viewingForm, date: date ? format(date, "yyyy-MM-dd") : "" })}
                                initialFocus
                                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="relative"><MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Textarea className="pl-10 rounded-xl min-h-[100px] bg-gray-50 border-gray-100" placeholder="Ask specific questions..." value={viewingForm.message} onChange={e => setViewingForm({...viewingForm, message: e.target.value})} /></div>
                        
                        {modalError && (
                          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl leading-tight">
                            ⚠️ {modalError}
                          </div>
                        )}

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
          )}
        </div>
      </main>
    </div>
  );
}