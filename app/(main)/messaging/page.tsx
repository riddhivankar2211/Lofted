import { createClient } from '@/lib/supabase/server'
import MessagingClient from './MessagingClient'
import type { Conversation, Message, Profile } from '@/types'

export default async function MessagingPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; with?: string }>
}) {
  const { id: activeId, with: withUserId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: participations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('profile_id', user.id)

  const conversationIds = (participations ?? []).map((p: { conversation_id: string }) => p.conversation_id)

  let conversations: Conversation[] = []

  if (conversationIds.length > 0) {
    const { data: convsRaw } = await supabase
      .from('conversations')
      .select('*, conversation_participants(profile_id, profiles(*))')
      .in('id', conversationIds)
      .order('created_at', { ascending: false })

    conversations = ((convsRaw ?? []) as Record<string, unknown>[]).map((conv) => {
      const parts = (conv.conversation_participants as { profile_id: string; profiles: Profile }[]) ?? []
      const other = parts.find((p) => p.profile_id !== user.id)?.profiles
      return { ...conv, other_participant: other } as Conversation
    })

    await Promise.all(
      conversations.map(async (conv) => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        conv.last_message = (lastMsg as Message) ?? undefined
      })
    )
  }

  let activeConversation: Conversation | null = null
  let initialMessages: Message[] = []
  let otherParticipant: Profile | null = null

  if (withUserId && withUserId !== user.id) {
    const existing = conversations.find((c) => c.other_participant?.id === withUserId)

    if (existing) {
      activeConversation = existing
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single()

      if (newConv) {
        await supabase.from('conversation_participants').insert([
          { conversation_id: newConv.id, profile_id: user.id },
          { conversation_id: newConv.id, profile_id: withUserId },
        ])
        const { data: otherProfile } = await supabase
          .from('profiles').select('*').eq('id', withUserId).single()
        activeConversation = { ...newConv, other_participant: otherProfile as Profile }
        conversations = [activeConversation, ...conversations]
      }
    }
  } else if (activeId) {
    activeConversation = conversations.find((c) => c.id === activeId) ?? null
  } else if (conversations.length > 0) {
    activeConversation = conversations[0]
  }

  if (activeConversation) {
    otherParticipant = activeConversation.other_participant ?? null
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', activeConversation.id)
      .order('created_at', { ascending: true })
    initialMessages = (msgs as Message[]) ?? []
  }

  return (
    <MessagingClient
      conversations={conversations}
      activeConversation={activeConversation}
      initialMessages={initialMessages}
      otherParticipant={otherParticipant}
      currentUserId={user.id}
      currentProfile={myProfile as Profile}
    />
  )
}
