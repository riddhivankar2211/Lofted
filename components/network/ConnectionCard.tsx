'use client'

import Link from 'next/link'
import { UserCheck, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Connection } from '@/types'
import Avatar from '../ui/Avatar'

interface ConnectionCardProps {
  connection: Connection
  currentUserId: string
  variant: 'suggestion' | 'pending-received' | 'pending-sent' | 'connected'
  onUpdate?: () => void
}

export default function ConnectionCard({ connection, currentUserId, variant, onUpdate }: ConnectionCardProps) {
  const supabase = createClient()

  const other: Profile = connection.requester_id === currentUserId
    ? connection.receiver!
    : connection.requester!

  async function accept() {
    await supabase.from('connections').update({ status: 'accepted' }).eq('id', connection.id)
    onUpdate?.()
  }

  async function reject() {
    await supabase.from('connections').delete().eq('id', connection.id)
    onUpdate?.()
  }

  async function connect() {
    await supabase.from('connections').insert({ requester_id: currentUserId, receiver_id: other.id })
    onUpdate?.()
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <Link href={`/profile/${other.id}`}>
        <Avatar src={other.avatar_url} name={other.full_name} size="md" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${other.id}`} className="font-semibold text-sm text-gray-900 hover:underline">
          {other.full_name}
        </Link>
        {other.headline && <p className="text-xs text-gray-500 truncate">{other.headline}</p>}
        {other.location && <p className="text-xs text-gray-400">{other.location}</p>}
      </div>

      <div className="flex gap-2 flex-shrink-0">
        {variant === 'pending-received' && (
          <>
            <button onClick={accept} className="btn-primary py-1.5 text-sm flex items-center gap-1">
              <UserCheck className="w-4 h-4" /> Accept
            </button>
            <button onClick={reject} className="btn-ghost py-1.5 text-sm">
              <X className="w-4 h-4" />
            </button>
          </>
        )}
        {variant === 'pending-sent' && (
          <button onClick={reject} className="btn-outline py-1.5 text-sm">Withdraw</button>
        )}
        {variant === 'suggestion' && (
          <button onClick={connect} className="btn-outline py-1.5 text-sm">Connect</button>
        )}
        {variant === 'connected' && (
          <button onClick={reject} className="btn-ghost py-1.5 text-sm text-red-500 hover:bg-red-50">Remove</button>
        )}
      </div>
    </div>
  )
}
