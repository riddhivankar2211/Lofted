'use client'

import { useState } from 'react'
import { MapPin, Globe, Pencil, UserPlus, UserCheck, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, ConnectionStatus } from '@/types'
import Avatar from '../ui/Avatar'

interface ProfileHeaderProps {
  profile: Profile
  isOwner: boolean
  connectionStatus?: ConnectionStatus | null
  connectionId?: string | null
  currentUserId?: string
}

export default function ProfileHeader({
  profile,
  isOwner,
  connectionStatus: initialStatus,
  connectionId: initialConnectionId,
  currentUserId,
}: ProfileHeaderProps) {
  const supabase = createClient()
  const [status, setStatus] = useState(initialStatus)
  const [connectionId, setConnectionId] = useState(initialConnectionId)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: profile.full_name,
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    website: profile.website ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function sendConnectionRequest() {
    const { data } = await supabase
      .from('connections')
      .insert({ requester_id: currentUserId, receiver_id: profile.id })
      .select()
      .single()
    if (data) { setStatus('pending'); setConnectionId(data.id) }
  }

  async function acceptConnection() {
    await supabase.from('connections').update({ status: 'accepted' }).eq('id', connectionId)
    setStatus('accepted')
  }

  async function removeConnection() {
    await supabase.from('connections').delete().eq('id', connectionId)
    setStatus(null)
    setConnectionId(null)
  }

  async function saveProfile() {
    setSaving(true)
    await supabase.from('profiles').update(form).eq('id', profile.id)
    setSaving(false)
    setEditing(false)
    window.location.reload()
  }

  return (
    <div className="card overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-brand-600 to-brand-400" />

      <div className="px-6 pb-6">
        <div className="flex items-end justify-between -mt-12 mb-4">
          <Avatar src={profile.avatar_url} name={profile.full_name} size="xl"
            className="ring-4 ring-white shadow-md" />

          <div className="flex gap-2 mt-14">
            {isOwner ? (
              <button onClick={() => setEditing(true)} className="btn-outline flex items-center gap-2 py-1.5 text-sm">
                <Pencil className="w-4 h-4" /> Edit profile
              </button>
            ) : (
              <>
                {!status && (
                  <button onClick={sendConnectionRequest} className="btn-primary flex items-center gap-2 py-1.5 text-sm">
                    <UserPlus className="w-4 h-4" /> Connect
                  </button>
                )}
                {status === 'pending' && (
                  <button onClick={removeConnection} className="btn-outline flex items-center gap-2 py-1.5 text-sm">
                    <UserCheck className="w-4 h-4" /> Pending
                  </button>
                )}
                {status === 'accepted' && (
                  <button onClick={removeConnection} className="btn-outline flex items-center gap-2 py-1.5 text-sm">
                    <UserCheck className="w-4 h-4" /> Connected
                  </button>
                )}
                <a href={`/messaging?with=${profile.id}`} className="btn-ghost flex items-center gap-2 py-1.5 text-sm">
                  <MessageSquare className="w-4 h-4" /> Message
                </a>
              </>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
        {profile.headline && <p className="text-gray-600 mt-0.5">{profile.headline}</p>}

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
          {profile.location && (
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{profile.location}</span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-brand-600 hover:underline">
              <Globe className="w-4 h-4" />{profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

        {profile.bio && (
          <p className="mt-4 text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold">Edit Profile</h2>

            {(['full_name', 'headline', 'location', 'website'] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {field.replace('_', ' ')}
                </label>
                <input
                  type="text"
                  className="input"
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea className="textarea" rows={3} value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
              <button onClick={saveProfile} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
