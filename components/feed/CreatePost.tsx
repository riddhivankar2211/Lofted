'use client'

import { useState } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import Avatar from '../ui/Avatar'

interface CreatePostProps {
  profile: Profile
  onPostCreated: () => void
}

export default function CreatePost({ profile, onPostCreated }: CreatePostProps) {
  const supabase = createClient()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    await supabase.from('posts').insert({ author_id: profile.id, content: content.trim() })

    setContent('')
    setExpanded(false)
    setLoading(false)
    onPostCreated()
  }

  return (
    <div className="card p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 items-start">
          <Avatar src={profile.avatar_url} name={profile.full_name} size="md" />
          <div className="flex-1">
            <textarea
              className="textarea min-h-[44px]"
              placeholder="Share something with your network..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setExpanded(true)}
              rows={expanded ? 4 : 1}
            />
            {expanded && (
              <div className="flex justify-between items-center mt-2">
                <button type="button" className="text-gray-400 hover:text-gray-600 p-1 rounded">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setExpanded(false); setContent('') }}
                    className="btn-ghost py-1.5 text-sm flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !content.trim()}
                    className="btn-primary py-1.5 text-sm"
                  >
                    {loading ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
