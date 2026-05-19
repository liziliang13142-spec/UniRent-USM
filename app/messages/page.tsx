"use client"

import { supabase } from "@/lib/supabase"
import React, { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "../contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
// 🌟 引入了 X 图标用于关闭快捷卡片
import { Loader2, Send, UserCircle, Home, ArrowLeft, MessageCircle, X } from "lucide-react"

export default function MessagesPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // 从房源详情页带过来的参数
  const initialPartnerId = searchParams.get("partnerId")
  const initialPropertyId = searchParams.get("propertyId")
  const initialPropertyName = searchParams.get("propertyName")

  const [conversations, setConversations] = useState<any[]>([])
  const [selectedPartner, setSelectedPartner] = useState<string | null>(initialPartnerId)
  const [selectedPartnerName, setSelectedPartnerName] = useState<string>("Loading...")
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)

  // 🌟 新增状态：控制是否显示“淘宝式”快捷发送房源卡片
  const [showPropCard, setShowPropCard] = useState(false)

  // 1. 获取对话列表
  useEffect(() => {
    if (user) fetchConversations()
  }, [user])

  // 2. 选中人时，获取聊天记录并标记已读
  useEffect(() => {
    if (selectedPartner && user) {
      fetchMessages(selectedPartner)
      markAsRead(selectedPartner)
    }
  }, [selectedPartner, user])

  // 3. 选中人时，自动匹配或查询他的真实姓名/邮箱
  useEffect(() => {
    if (selectedPartner) {
      const existingChat = conversations.find(c => c.id === selectedPartner)
      if (existingChat && existingChat.name) {
        setSelectedPartnerName(existingChat.name)
      } else {
        const fetchPartnerName = async () => {
          const { data } = await supabase
            .from('profiles')
            .select('username, email')
            .eq('id', selectedPartner)
            .single()
          
          if (data) {
            setSelectedPartnerName(data.username || data.email || `User ${selectedPartner.substring(0, 4)}`)
          } else {
            setSelectedPartnerName(`User ${selectedPartner.substring(0, 4)}`)
          }
        }
        fetchPartnerName()
      }
    }
  }, [selectedPartner, conversations])

  // 4. 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 🌟 5. 如果是从房源详情页跳过来的，激活快捷发送卡片
  useEffect(() => {
    if (initialPropertyId && initialPartnerId) {
      setShowPropCard(true)
    }
  }, [initialPropertyId, initialPartnerId])

  // 获取消息列表并同时关联 profiles 获取名字
  const fetchConversations = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (data) {
      const partnersMap = new Map()
      data.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        const isUnread = msg.receiver_id === user.id && !msg.is_read

        if (!partnersMap.has(partnerId)) {
          partnersMap.set(partnerId, {
            id: partnerId,
            lastMsg: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unreadCount: isUnread ? 1 : 0,
            name: "" 
          })
        } else if (isUnread) {
          const existing = partnersMap.get(partnerId)
          partnersMap.set(partnerId, { ...existing, unreadCount: existing.unreadCount + 1 })
        }
      })

      const partnerIds = Array.from(partnersMap.keys())
      if (partnerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', partnerIds)

        if (profilesData) {
          profilesData.forEach(profile => {
            const partner = partnersMap.get(profile.id)
            if (partner) {
              partner.name = profile.username || profile.email || `User ${profile.id.substring(0, 4)}`
            }
          })
        }
      }
      setConversations(Array.from(partnersMap.values()))
    }
    setLoading(false)
  }

  const fetchMessages = async (partnerId: string) => {
    if (!user) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const markAsRead = async (partnerId: string) => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      setConversations(prev => prev.map(c => c.id === partnerId ? { ...c, unreadCount: 0 } : c))
    } catch (err) {
      console.error("Failed to update read status:", err)
    }
  }

  // 发送普通消息
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedPartner || !user) return

    const { error } = await supabase.from('messages').insert([{
      sender_id: user.id,
      receiver_id: selectedPartner,
      content: newMessage,
      property_id: initialPropertyId ? Number(initialPropertyId) : null,
      is_read: false
    }])

    if (!error) {
      setNewMessage("")
      fetchMessages(selectedPartner)
      fetchConversations()
    }
  }

  // 🌟 一键发送快捷卡片（淘宝逻辑）
  const handleSendPropCard = async () => {
    if (!selectedPartner || !user) return

    // 格式化卡片专属话术
    const cardContent = `🏠 Hello! I'm interested in your property: 【${initialPropertyName}】. Is it still available?`

    const { error } = await supabase.from('messages').insert([{
      sender_id: user.id,
      receiver_id: selectedPartner,
      content: cardContent,
      property_id: initialPropertyId ? Number(initialPropertyId) : null,
      is_read: false
    }])

    if (!error) {
      setShowPropCard(false) // 发送后隐藏卡片
      fetchMessages(selectedPartner)
      fetchConversations()
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
      <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Conversations...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* 左侧：对话列表 */}
      <div className={`w-full md:w-96 bg-white border-r border-slate-100 flex-col ${selectedPartner ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 border-b bg-slate-900 text-white">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <MessageCircle className="text-blue-400" /> Messages
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {initialPartnerId && !conversations.find(c => c.id === initialPartnerId) && (
            <div 
              onClick={() => setSelectedPartner(initialPartnerId)}
              className={`p-5 border-b cursor-pointer bg-blue-50/50 border-l-4 border-l-blue-500`}
            >
              <div className="flex justify-between items-start">
                <span className="font-black text-blue-600 text-sm">{selectedPartnerName}</span>
                <span className="text-[10px] font-bold text-blue-400">NOW</span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                <Home className="w-3 h-3"/> {initialPropertyName || "Checking Property"}
              </p>
            </div>
          )}

          {conversations.length === 0 && !initialPartnerId ? (
            <div className="p-20 text-center space-y-4">
              <UserCircle className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="text-slate-400 text-sm font-bold">No active chats.</p>
            </div>
          ) : (
            conversations.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => setSelectedPartner(chat.id)}
                className={`p-6 border-b cursor-pointer transition-all ${selectedPartner === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-slate-800 text-sm truncate max-w-[180px]">
                    {chat.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {chat.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                        {chat.unreadCount}
                      </span>
                    )}
                    <span className="text-[10px] font-black text-slate-400">{chat.time}</span>
                  </div>
                </div>
                <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'font-black text-slate-900' : 'text-slate-500'}`}>
                  {chat.lastMsg}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧：聊天主窗口 */}
      <div className={`flex-1 flex flex-col h-screen ${!selectedPartner ? 'hidden md:flex' : 'flex'}`}>
        {selectedPartner ? (
          <>
            <div className="p-5 border-b bg-white flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => { setSelectedPartner(null); fetchConversations(); }}>
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tighter truncate max-w-[250px]">
                    {selectedPartnerName}
                  </h3>
                  <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Active Now
                  </p>
                </div>
              </div>
            </div>
            
            {/* 聊天记录展示区 */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-slate-50/30">
              {messages.length === 0 && (
                <div className="text-center py-10 opacity-50">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Start the conversation</p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-3xl text-sm font-medium shadow-sm leading-relaxed ${
                    msg.sender_id === user?.id 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }`}>
                    {msg.content}
                    <div className={`text-[9px] mt-2 opacity-60 font-bold ${msg.sender_id === user?.id ? 'text-right text-blue-200' : 'text-left text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 🌟 包含发送卡片和输入框的底部区域 */}
            <div className="bg-white flex flex-col border-t shadow-[0_-5px_20px_rgba(0,0,0,0.02)] z-10">
              
              {/* 🌟 淘宝同款：快捷发送房源信息卡片 */}
              {showPropCard && selectedPartner === initialPartnerId && (
                <div className="mx-4 md:mx-6 mt-4 p-3 bg-blue-50/80 border border-blue-100 rounded-2xl shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm shrink-0">
                      <Home className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Inquiring about</p>
                      <p className="text-sm font-black text-blue-950 truncate max-w-[200px] md:max-w-[300px]">{initialPropertyName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-blue-400 hover:text-blue-600 hover:bg-blue-100 h-8 w-8 rounded-full"
                      onClick={() => setShowPropCard(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-8 px-4 text-xs shadow-md shadow-blue-200 active:scale-95 transition-all"
                      onClick={handleSendPropCard}
                    >
                      Send Link
                    </Button>
                  </div>
                </div>
              )}

              {/* 传统的文本输入框 */}
              <form onSubmit={handleSendMessage} className="p-4 md:p-6 flex gap-2 md:gap-4">
                <Input 
                  value={newMessage} 
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type your message..." 
                  className="rounded-2xl bg-slate-100 border-none h-12 md:h-14 pl-4 md:pl-6 focus-visible:ring-blue-500"
                />
                <Button type="submit" disabled={!newMessage.trim()} className="rounded-2xl w-12 h-12 md:w-14 md:h-14 p-0 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none">
                  <Send className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white text-center p-10">
            <MessageCircle className="w-16 h-16 text-slate-200 mb-4" />
            <h2 className="text-xl font-black text-slate-800">Your Inbox</h2>
            <p className="text-sm text-slate-400 font-bold mt-2 italic max-w-xs">Select a conversation from the left to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  )
}