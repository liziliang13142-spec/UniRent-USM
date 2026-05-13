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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <Link href="/messages">
          <Button variant="ghost">← Back</Button>
        </Link>
        <h1 className="text-2xl font-bold text-blue-800">Chat with Landlord</h1>
      </header>
      <main className="p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "tenant" ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-start space-x-2 ${message.sender === "tenant" ? "flex-row-reverse" : ""}`}>
                  <Avatar>
                    <AvatarFallback>{message.sender === "tenant" ? "T" : "L"}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`p-2 rounded-lg ${message.sender === "tenant" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs mt-1 opacity-75">{message.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <form onSubmit={handleSendMessage} className="w-full flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-grow"
              />
              <Button type="submit">Send</Button>
            </form>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}

