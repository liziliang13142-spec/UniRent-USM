"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Message = {
  id: number
  sender: "tenant" | "landlord"
  content: string
  timestamp: Date
}

export default function MessagingPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "tenant",
      content: "Hi, I'm interested in your property.",
      timestamp: new Date("2023-08-01T10:00:00"),
    },
    {
      id: 2,
      sender: "landlord",
      content: "Hello! Thank you for your interest. What would you like to know?",
      timestamp: new Date("2023-08-01T10:05:00"),
    },
  ])
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      const newMsg: Message = {
        id: messages.length + 1,
        sender: "tenant",
        content: newMessage,
        timestamp: new Date(),
      }
      setMessages([...messages, newMsg])
      setNewMessage("")
    }
  }

  return (
    // 🌟 外层：砸掉 bg-gray-100 实心墙
    <div className="min-h-screen pb-24">
      
      {/* 🌟 头部：毛玻璃背景 bg-white/80 backdrop-blur-md */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 flex justify-between items-center sticky top-0 z-10 border-b border-white/50">
        <Link href="/messages">
          <Button variant="ghost" className="text-slate-600 hover:text-slate-900">← Back</Button>
        </Link>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">Chat with Landlord</h1>
      </header>

      <main className="p-4 mt-2">
        {/* 🌟 内容卡片：高级毛玻璃 bg-white/90 backdrop-blur-md */}
        <Card className="max-w-2xl mx-auto shadow-xl border-none bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-4">
            <CardTitle className="text-lg font-bold">Messages</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto p-4 scroll-smooth">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "tenant" ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-start space-x-2 max-w-[85%] ${message.sender === "tenant" ? "flex-row-reverse space-x-reverse" : ""}`}>
                  <Avatar className="h-8 w-8 border border-white shadow-sm">
                    <AvatarFallback className={`text-xs font-bold ${message.sender === "tenant" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"}`}>
                      {message.sender === "tenant" ? "T" : "L"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    // 🌟 聊天气泡样式优化：租客蓝色，房东淡白
                    className={`p-3 rounded-2xl shadow-sm ${
                      message.sender === "tenant" 
                        ? "bg-blue-600 text-white rounded-tr-sm" 
                        : "bg-white/80 text-slate-800 rounded-tl-sm border border-slate-100"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-[10px] mt-1.5 opacity-70 font-medium">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          
          <CardFooter className="p-4 bg-slate-50/50 border-t border-slate-100/50">
            <form onSubmit={handleSendMessage} className="w-full flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                // 🌟 输入框半透明化
                className="flex-grow bg-white/60 focus:bg-white border-white/50 shadow-sm transition-colors rounded-xl"
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-md">
                Send
              </Button>
            </form>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}