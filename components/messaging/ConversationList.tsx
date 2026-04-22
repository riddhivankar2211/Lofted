import Link from 'next/link'
import { cn, timeAgo } from '@/lib/utils'
import type { Conversation } from '@/types'
import Avatar from '../ui/Avatar'

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
}

export default function ConversationList({ conversations, activeId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-400">
        No conversations yet. Connect with someone and start chatting!
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conv) => {
        const other = conv.other_participant
        if (!other) return null
        return (
          <Link
            key={conv.id}
            href={`/messaging?id=${conv.id}`}
            className={cn(
              'flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors',
              activeId === conv.id && 'bg-brand-50'
            )}
          >
            <Avatar src={other.avatar_url} name={other.full_name} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-gray-900 truncate">{other.full_name}</p>
                {conv.last_message && (
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {timeAgo(conv.last_message.created_at)}
                  </span>
                )}
              </div>
              {conv.last_message && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message.content}</p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
