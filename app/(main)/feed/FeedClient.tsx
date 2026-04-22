'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Post } from '@/types'
import CreatePost from '@/components/feed/CreatePost'
import PostCard from '@/components/feed/PostCard'
import Avatar from '@/components/ui/Avatar'

interface FeedClientProps {
  currentProfile: Profile
  initialPosts: Post[]
  suggestions: Profile[]
}

export default function FeedClient({ currentProfile, initialPosts, suggestions }: FeedClientProps) {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>(initialPosts)

  async function refreshPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*, author:profiles(*), post_likes(user_id), comments(count)')
      .order('created_at', { ascending: false })
      .limit(30)

    if (data) {
      setPosts(data.map((p) => ({
        ...p,
        likes_count: Array.isArray(p.post_likes) ? p.post_likes.length : 0,
        liked_by_user: Array.isArray(p.post_likes)
          ? p.post_likes.some((l: { user_id: string }) => l.user_id === currentProfile.id)
          : false,
        comments_count: Array.isArray(p.comments) && p.comments.length > 0
          ? (p.comments[0] as { count: number }).count
          : 0,
      })))
    }
  }

  function removePost(postId: string) {
    setPosts((p) => p.filter((post) => post.id !== postId))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <aside className="hidden lg:block space-y-4">
        <div className="card overflow-hidden">
          <div className="h-16 bg-gradient-to-r from-brand-600 to-brand-400" />
          <div className="px-4 pb-4">
            <Link href={`/profile/${currentProfile.id}`} className="-mt-6 block">
              <Avatar src={currentProfile.avatar_url} name={currentProfile.full_name} size="lg"
                className="ring-2 ring-white" />
            </Link>
            <Link href={`/profile/${currentProfile.id}`} className="block mt-2 font-bold text-gray-900 hover:underline">
              {currentProfile.full_name}
            </Link>
            {currentProfile.headline && (
              <p className="text-xs text-gray-500 mt-0.5">{currentProfile.headline}</p>
            )}
          </div>
        </div>
      </aside>

      <div className="lg:col-span-2 space-y-4">
        <CreatePost profile={currentProfile} onPostCreated={refreshPosts} />

        {posts.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">
            <p className="font-medium">Nothing in your feed yet.</p>
            <p className="text-sm mt-1">Connect with people and follow topics to see posts here.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentProfile.id}
              onDeleted={removePost}
            />
          ))
        )}
      </div>

      {suggestions.length > 0 && (
        <aside className="hidden lg:block lg:col-start-1 lg:row-start-1 lg:row-span-2 space-y-4 order-last lg:order-none">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">People you may know</h3>
            <div className="space-y-3">
              {suggestions.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <Avatar src={p.avatar_url} name={p.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${p.id}`} className="text-sm font-medium text-gray-900 hover:underline truncate block">
                      {p.full_name}
                    </Link>
                    {p.headline && <p className="text-xs text-gray-400 truncate">{p.headline}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
