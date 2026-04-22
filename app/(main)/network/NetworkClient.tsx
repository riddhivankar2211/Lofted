'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Connection, Profile } from '@/types'
import ConnectionCard from '@/components/network/ConnectionCard'
import Avatar from '@/components/ui/Avatar'
import Link from 'next/link'

interface NetworkClientProps {
  connections: Connection[]
  suggestions: Profile[]
  currentUserId: string
}

export default function NetworkClient({ connections: initial, suggestions: initialSugg, currentUserId }: NetworkClientProps) {
  const supabase = createClient()
  const [connections, setConnections] = useState(initial)
  const [suggestions, setSuggestions] = useState(initialSugg)

  const pendingReceived = connections.filter(
    (c) => c.status === 'pending' && c.receiver_id === currentUserId
  )
  const pendingSent = connections.filter(
    (c) => c.status === 'pending' && c.requester_id === currentUserId
  )
  const accepted = connections.filter((c) => c.status === 'accepted')

  async function refresh() {
    const { data } = await supabase
      .from('connections')
      .select('*, requester:profiles!connections_requester_id_fkey(*), receiver:profiles!connections_receiver_id_fkey(*)')
      .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
    setConnections((data as Connection[]) ?? [])
  }

  async function connectSuggestion(profileId: string) {
    await supabase.from('connections').insert({ requester_id: currentUserId, receiver_id: profileId })
    setSuggestions((s) => s.filter((p) => p.id !== profileId))
    await refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {pendingReceived.length > 0 && (
          <div className="card p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Invitations <span className="text-brand-600">({pendingReceived.length})</span>
            </h2>
            <div className="divide-y divide-gray-100">
              {pendingReceived.map((c) => (
                <ConnectionCard
                  key={c.id}
                  connection={c}
                  currentUserId={currentUserId}
                  variant="pending-received"
                  onUpdate={refresh}
                />
              ))}
            </div>
          </div>
        )}

        <div className="card p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Connections <span className="text-gray-400 font-normal text-base">({accepted.length})</span>
          </h2>
          {accepted.length === 0 ? (
            <p className="text-sm text-gray-400">No connections yet. Start connecting with people!</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {accepted.map((c) => (
                <ConnectionCard
                  key={c.id}
                  connection={c}
                  currentUserId={currentUserId}
                  variant="connected"
                  onUpdate={refresh}
                />
              ))}
            </div>
          )}
        </div>

        {pendingSent.length > 0 && (
          <div className="card p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pending sent ({pendingSent.length})</h2>
            <div className="divide-y divide-gray-100">
              {pendingSent.map((c) => (
                <ConnectionCard
                  key={c.id}
                  connection={c}
                  currentUserId={currentUserId}
                  variant="pending-sent"
                  onUpdate={refresh}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">People you may know</h3>
          {suggestions.length === 0 ? (
            <p className="text-sm text-gray-400">No suggestions available.</p>
          ) : (
            <div className="space-y-3">
              {suggestions.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <Link href={`/profile/${p.id}`}>
                    <Avatar src={p.avatar_url} name={p.full_name} size="sm" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${p.id}`} className="text-sm font-medium text-gray-900 hover:underline block truncate">
                      {p.full_name}
                    </Link>
                    {p.headline && <p className="text-xs text-gray-400 truncate">{p.headline}</p>}
                  </div>
                  <button
                    onClick={() => connectSuggestion(p.id)}
                    className="text-xs btn-outline py-1 px-2"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
