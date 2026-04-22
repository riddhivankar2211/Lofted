'use client'

import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Message, Profile } from '@/types'
import Avatar from '../ui/Avatar'

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  otherParticipant: Profile
  initialMessages: Message[]
}

export default function ChatWindow({ conversationId, currentUserId, otherParticipant, initialMessages }: ChatWindowProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        if (payload.new.sender_id === currentUserId) return
        const { data: sender } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', payload.new.sender_id)
          .single()
        setMessages((m) => [...m, { ...payload.new, sender } as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUserId, supabase])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return
    setSending(true)

    const content = newMessage.trim()
    setNewMessage('')

    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, content })
      .select('*')
      .single()

    if (data) {
      setMessages((m) => [...m, data as Message])
    }

    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
        <Avatar src={otherParticipant.avatar_url} name={otherParticipant.full_name} size="md" />
        <div>
          <p className="font-semibold text-gray-900">{otherParticipant.full_name}</p>
          {otherParticipant.headline && (
            <p className="text-xs text-gray-500">{otherParticipant.headline}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={cn('flex gap-2', isOwn && 'flex-row-reverse')}>
              {!isOwn && (
                <Avatar src={otherParticipant.avatar_url} name={otherParticipant.full_name} size="sm" />
              )}
              <div
                className={cn(
                  'max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm',
                  isOwn
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                )}
              >
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white flex gap-2">
        <input
          type="text"
          className="input flex-1"
          placeholder="Write a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" disabled={sending || !newMessage.trim()} className="btn-primary p-2.5">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
