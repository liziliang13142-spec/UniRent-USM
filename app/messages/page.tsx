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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-2xl font-bold text-blue-800">Messages</h1>
      </header>
      <main className="p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Your Conversations</CardTitle>
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredConversations.map((conversation) => (
              <Link href={`/messages/${conversation.id}`} key={conversation.id}>
                <div className="flex items-center space-x-4 p-2 hover:bg-gray-100 rounded-lg transition duration-150 ease-in-out">
                  <Avatar>
                    <AvatarFallback>{conversation.landlordName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <h3 className="font-semibold">{conversation.landlordName}</h3>
                    <p className="text-sm text-gray-600">{conversation.propertyName}</p>
                    <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {conversation.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </Link>
            ))}
            {filteredConversations.length === 0 && <p className="text-center text-gray-500">No conversations found.</p>}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

