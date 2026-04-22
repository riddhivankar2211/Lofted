import { createClient } from '@/lib/supabase/server'
import FeedClient from './FeedClient'
import type { Profile, Post } from '@/types'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: postsRaw }, { data: suggestions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),

    supabase
      .from('posts')
      .select('*, author:profiles(*), post_likes(user_id), comments(count)')
      .order('created_at', { ascending: false })
      .limit(30),

    supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .limit(5),
  ])

  const posts: Post[] = (postsRaw ?? []).map((p) => {
    const post = p as Record<string, unknown>
    return {
      ...(post as unknown as Post),
      likes_count: Array.isArray(post.post_likes) ? (post.post_likes as unknown[]).length : 0,
      liked_by_user: Array.isArray(post.post_likes)
        ? (post.post_likes as { user_id: string }[]).some((l) => l.user_id === user.id)
        : false,
      comments_count: Array.isArray(post.comments) && post.comments.length > 0
        ? (post.comments[0] as { count: number }).count
        : 0,
    }
  })

  return (
    <FeedClient
      currentProfile={profile as Profile}
      initialPosts={posts}
      suggestions={(suggestions as Profile[]) ?? []}
    />
  )
}
