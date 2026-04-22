'use client'

import { MessageSquare } from 'lucide-react'
import type { Conversation, Message, Profile } from '@/types'
import ConversationList from '@/components/messaging/ConversationList'
import ChatWindow from '@/components/messaging/ChatWindow'

interface MessagingClientProps {
  conversations: Conversation[]
  activeConversation: Conversation | null
  initialMessages: Message[]
  otherParticipant: Profile | null
  currentUserId: string
  currentProfile: Profile
}

export default function MessagingClient({
  conversations,
  activeConversation,
  initialMessages,
  otherParticipant,
  currentUserId,
}: MessagingClientProps) {
  return (
    <div className="card overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="flex h-full">
        <div className="w-80 border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Messaging</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              activeId={activeConversation?.id}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {activeConversation && otherParticipant ? (
            <ChatWindow
              conversationId={activeConversation.id}
              currentUserId={currentUserId}
              otherParticipant={otherParticipant}
              initialMessages={initialMessages}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
              <MessageSquare className="w-12 h-12" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm">Or message someone from their profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
