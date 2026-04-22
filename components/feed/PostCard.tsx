'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThumbsUp, MessageCircle, Send, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'
import type { Post, Comment, Profile } from '@/types'
import Avatar from '../ui/Avatar'

interface PostCardProps {
  post: Post
  currentUserId: string
  onDeleted?: (postId: string) => void
}

export default function PostCard({ post, currentUserId, onDeleted }: PostCardProps) {
  const supabase = createClient()
  const [liked, setLiked] = useState(post.liked_by_user ?? false)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0)

  async function toggleLike() {
    if (liked) {
      await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: currentUserId })
      setLiked(false)
      setLikesCount((c) => c - 1)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId })
      setLiked(true)
      setLikesCount((c) => c + 1)
    }
  }

  async function loadComments() {
    if (commentsLoaded) {
      setShowComments((s) => !s)
      return
    }
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles(*)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })

    setComments((data as (Comment & { author: Profile })[]) ?? [])
    setCommentsLoaded(true)
    setShowComments(true)
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    const { data } = await supabase
      .from('comments')
      .insert({ post_id: post.id, author_id: currentUserId, content: newComment.trim() })
      .select('*, author:profiles(*)')
      .single()

    if (data) {
      setComments((c) => [...c, data as Comment & { author: Profile }])
      setCommentsCount((c) => c + 1)
      setNewComment('')
    }
  }

  async function deletePost() {
    await supabase.from('posts').delete().eq('id', post.id)
    onDeleted?.(post.id)
  }

  const author = post.author!

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${author.id}`}>
          <Avatar src={author.avatar_url} name={author.full_name} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={`/profile/${author.id}`} className="font-semibold text-gray-900 hover:underline">
                {author.full_name}
              </Link>
              {author.headline && (
                <p className="text-xs text-gray-500 truncate">{author.headline}</p>
              )}
              <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
            </div>
            {post.author_id === currentUserId && (
              <button
                onClick={deletePost}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="mt-3 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1 text-sm text-gray-500">
        {likesCount > 0 && <span className="text-xs mr-auto">{likesCount} like{likesCount !== 1 ? 's' : ''}</span>}
        {commentsCount > 0 && (
          <button onClick={loadComments} className="text-xs ml-auto hover:underline">
            {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div className="flex gap-1 border-t border-gray-100 pt-1 mt-1">
        <button
          onClick={toggleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg transition-colors text-sm font-medium ${
            liked ? 'text-brand-600 bg-brand-50 hover:bg-brand-100' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          Like
        </button>
        <button
          onClick={loadComments}
          className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          <MessageCircle className="w-4 h-4" />
          Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-sm font-medium">
          <Send className="w-4 h-4" />
          Share
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-3">
          {comments.map((comment) => {
            const a = comment.author as Profile
            return (
              <div key={comment.id} className="flex gap-2">
                <Avatar src={a?.avatar_url} name={a?.full_name ?? 'U'} size="sm" />
                <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                  <Link href={`/profile/${a?.id}`} className="text-xs font-semibold hover:underline">
                    {a?.full_name}
                  </Link>
                  <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
                </div>
              </div>
            )
          })}

          <form onSubmit={submitComment} className="flex gap-2 items-center">
            <input
              type="text"
              className="input text-sm py-1.5"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" disabled={!newComment.trim()} className="btn-primary py-1.5 text-sm px-3">
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
