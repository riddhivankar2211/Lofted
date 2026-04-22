'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Clock, DollarSign, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils'
import type { Job } from '@/types'
import Avatar from '../ui/Avatar'

interface JobCardProps {
  job: Job
  currentUserId: string
}

const typeLabels: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  remote: 'Remote',
}

export default function JobCard({ job, currentUserId }: JobCardProps) {
  const supabase = createClient()
  const [applied, setApplied] = useState(job.applied ?? false)
  const [showModal, setShowModal] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(false)

  async function apply() {
    setLoading(true)
    await supabase.from('job_applications').insert({
      job_id: job.id,
      applicant_id: currentUserId,
      cover_letter: coverLetter || null,
    })
    setApplied(true)
    setShowModal(false)
    setLoading(false)
  }

  const poster = job.poster

  return (
    <>
      <div className="card p-5 hover:shadow-md transition-shadow">
        <div className="flex gap-3">
          {poster && (
            <Link href={`/profile/${poster.id}`}>
              <Avatar src={poster.avatar_url} name={poster.full_name} size="md" />
            </Link>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">{job.title}</h3>
            <p className="text-sm text-brand-600">{job.company}</p>

            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
              {job.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
              )}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{typeLabels[job.type]}</span>
              {job.salary_range && (
                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary_range}</span>
              )}
            </div>

            {job.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed">{job.description}</p>
            )}

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-400">{timeAgo(job.created_at)}</span>

              {job.poster_id === currentUserId ? (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Your posting</span>
              ) : applied ? (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" /> Applied
                </span>
              ) : (
                <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-1.5 px-4">
                  Apply
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold">Apply to {job.title}</h2>
            <p className="text-sm text-gray-500">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover letter (optional)</label>
              <textarea
                className="textarea"
                rows={5}
                placeholder="Tell them why you're a great fit..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
              <button onClick={apply} disabled={loading} className="btn-primary">
                {loading ? 'Submitting...' : 'Submit application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
