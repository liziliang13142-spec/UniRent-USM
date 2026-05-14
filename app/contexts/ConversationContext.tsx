"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Message = {
  id: number
  sender: "tenant" | "landlord"
  content: string
  timestamp: Date
}

type Conversation = {
  id: number
  landlordName: string
  propertyName: string
  messages: Message[]
}

type ConversationContextType = {
  conversations: Conversation[]
  addMessage: (conversationId: number, message: Omit<Message, "id">) => void
  getConversation: (id: number) => Conversation | undefined
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

export const useConversation = () => {
  const context = useContext(ConversationContext)
  if (!context) {
    throw new Error("useConversation must be used within a ConversationProvider")
  }
  return context
}

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    const storedConversations = localStorage.getItem("conversations")
    if (storedConversations) {
      setConversations(JSON.parse(storedConversations))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations))
  }, [conversations])

  const addMessage = (conversationId: number, message: Omit<Message, "id">) => {
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.id === conversationId ? { ...conv, messages: [...conv.messages, { ...message, id: Date.now() }] } : conv,
      ),
    )
  }

  const getConversation = (id: number) => {
    return conversations.find((conv) => conv.id === id)
  }

  return (
    <ConversationContext.Provider value={{ conversations, addMessage, getConversation }}>
      {children}
    </ConversationContext.Provider>
  )
}

