"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

type Conversation = {
  id: number
  landlordName: string
  propertyName: string
  lastMessage: string
  timestamp: Date
}

const initialConversations: Conversation[] = [
  {
    id: 1,
    landlordName: "John Doe",
    propertyName: "Cozy Studio Apartment",
    lastMessage: "Yes, the apartment is still available.",
    timestamp: new Date("2023-08-01T10:30:00"),
  },
  {
    id: 2,
    landlordName: "Jane Smith",
    propertyName: "Modern 2-Bedroom Flat",
    lastMessage: "The viewing is scheduled for tomorrow at 2 PM.",
    timestamp: new Date("2023-08-02T09:15:00"),
  },
  {
    id: 3,
    landlordName: "Mike Johnson",
    propertyName: "Spacious 3-Bedroom House",
    lastMessage: "Could you provide more details about your move-in date?",
    timestamp: new Date("2023-08-03T14:45:00"),
  },
]

export default function MessagingPage() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.landlordName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.propertyName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    // 🌟 外层：删掉 bg-gray-100，让房东/租户背景图透出来
    <div className="min-h-screen pb-20">
      
      {/* 🌟 头部：换成半透明毛玻璃 bg-white/80 backdrop-blur-md */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 sticky top-0 z-10 border-b border-white/50">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight text-center">Messages</h1>
      </header>

      <main className="p-4 mt-2">
        {/* 🌟 内层卡片：换成高级毛玻璃背景 bg-white/90 backdrop-blur-md */}
        <Card className="max-w-2xl mx-auto shadow-xl border-none bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-5">
            <CardTitle className="text-lg font-bold">Your Conversations</CardTitle>
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-4 bg-white/10 border-slate-700 text-white placeholder:text-slate-400 focus:bg-white focus:text-slate-900 transition-colors"
            />
          </CardHeader>
          
          <CardContent className="space-y-3 p-4">
            {filteredConversations.map((conversation) => (
              <Link href={`/messages/${conversation.id}`} key={conversation.id} className="block">
                <div className="flex items-center space-x-4 p-3 bg-white/50 hover:bg-white rounded-xl transition duration-300 ease-out border border-white shadow-sm">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-lg">
                      {conversation.landlordName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{conversation.landlordName}</h3>
                    <p className="text-xs font-semibold text-blue-600 truncate">{conversation.propertyName}</p>
                    <p className="text-sm text-slate-500 truncate mt-0.5">{conversation.lastMessage}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2">
                    {conversation.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </Link>
            ))}
            {filteredConversations.length === 0 && (
              <div className="text-center py-10 bg-white/50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500 font-medium">No conversations found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}