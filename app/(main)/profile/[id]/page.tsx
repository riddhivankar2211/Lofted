import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ExperienceSection from '@/components/profile/ExperienceSection'
import SkillsSection from '@/components/profile/SkillsSection'
import PostCard from '@/components/feed/PostCard'
import type { Profile, WorkExperience, Skill, Post, ConnectionStatus } from '@/types'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: profile },
    { data: experience },
    { data: skills },
    { data: postsRaw },
    { data: connectionRaw },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('work_experience').select('*').eq('profile_id', id).order('start_date', { ascending: false }),
    supabase.from('skills').select('*').eq('profile_id', id),
    supabase
      .from('posts')
      .select('*, author:profiles(*), post_likes(user_id), comments(count)')
      .eq('author_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('connections')
      .select('*')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .or(`requester_id.eq.${id},receiver_id.eq.${id}`)
      .limit(1)
      .maybeSingle(),
  ])

  if (!profile) notFound()

  const isOwner = user.id === id

  let connectionStatus: ConnectionStatus | null = null
  let connectionId: string | null = null

  if (connectionRaw) {
    const c = connectionRaw as { id: string; status: ConnectionStatus; requester_id: string; receiver_id: string }
    const involves = (c.requester_id === user.id && c.receiver_id === id) ||
                     (c.receiver_id === user.id && c.requester_id === id)
    if (involves) {
      connectionStatus = c.status
      connectionId = c.id
    }
  }

  const posts: Post[] = (postsRaw ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    likes_count: Array.isArray(p.post_likes) ? (p.post_likes as unknown[]).length : 0,
    liked_by_user: Array.isArray(p.post_likes)
      ? (p.post_likes as { user_id: string }[]).some((l) => l.user_id === user.id)
      : false,
    comments_count: Array.isArray(p.comments) && p.comments.length > 0
      ? (p.comments[0] as { count: number }).count
      : 0,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <ProfileHeader
          profile={profile as Profile}
          isOwner={isOwner}
          connectionStatus={connectionStatus}
          connectionId={connectionId}
          currentUserId={user.id}
        />
        <ExperienceSection
          experience={(experience as WorkExperience[]) ?? []}
          profileId={id}
          isOwner={isOwner}
        />
        <SkillsSection
          skills={(skills as Skill[]) ?? []}
          profileId={id}
          isOwner={isOwner}
        />

        {posts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 px-1">Activity</h2>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={user.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
