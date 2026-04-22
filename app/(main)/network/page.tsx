import { createClient } from '@/lib/supabase/server'
import NetworkClient from './NetworkClient'
import type { Connection, Profile } from '@/types'

export default async function NetworkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: connectionsRaw }, { data: allProfiles }] = await Promise.all([
    supabase
      .from('connections')
      .select('*, requester:profiles!connections_requester_id_fkey(*), receiver:profiles!connections_receiver_id_fkey(*)')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`),

    supabase.from('profiles').select('*').neq('id', user.id).limit(20),
  ])

  const connections = (connectionsRaw as Connection[]) ?? []
  const connectedIds = new Set(
    connections
      .filter((c) => c.status === 'accepted')
      .flatMap((c) => [c.requester_id, c.receiver_id])
  )
  connectedIds.delete(user.id)

  const pendingConnectionIds = new Set(
    connections.map((c) => c.requester_id === user.id ? c.receiver_id : c.requester_id)
  )

  const suggestions: Profile[] = (allProfiles ?? []).filter(
    (p: Profile) => !connectedIds.has(p.id) && !pendingConnectionIds.has(p.id)
  )

  return (
    <NetworkClient
      connections={connections}
      suggestions={suggestions}
      currentUserId={user.id}
    />
  )
}
