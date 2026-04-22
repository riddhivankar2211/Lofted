'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Job, JobType } from '@/types'
import JobCard from '@/components/jobs/JobCard'

const jobTypes: JobType[] = ['full-time', 'part-time', 'contract', 'internship', 'remote']
const typeLabels: Record<JobType, string> = {
  'full-time': 'Full-time', 'part-time': 'Part-time',
  contract: 'Contract', internship: 'Internship', remote: 'Remote',
}

interface JobsClientProps {
  jobs: Job[]
  currentUserId: string
}

const emptyForm = { title: '', company: '', location: '', description: '', type: 'full-time' as JobType, salary_range: '' }

export default function JobsClient({ jobs: initial, currentUserId }: JobsClientProps) {
  const supabase = createClient()
  const [jobs, setJobs] = useState(initial)
  const [filter, setFilter] = useState<JobType | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const filtered = filter === 'all' ? jobs : jobs.filter((j) => j.type === filter)

  async function postJob() {
    setSaving(true)
    const { data } = await supabase
      .from('jobs')
      .insert({ ...form, poster_id: currentUserId })
      .select('*, poster:profiles(*)')
      .single()
    if (data) setJobs((j) => [data as Job, ...j])
    setForm(emptyForm)
    setShowForm(false)
    setSaving(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside className="lg:col-span-1">
        <div className="card p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by type</h3>
          <button
            onClick={() => setFilter('all')}
            className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${filter === 'all' ? 'bg-brand-100 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            All jobs
          </button>
          {jobTypes.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${filter === t ? 'bg-brand-100 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {typeLabels[t]}
            </button>
          ))}
        </div>
      </aside>

      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {filtered.length} job{filtered.length !== 1 ? 's' : ''} found
          </h1>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Post a job
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">No jobs found for this filter.</div>
        ) : (
          filtered.map((job) => (
            <JobCard key={job.id} job={job} currentUserId={currentUserId} />
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Post a job</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Job title *</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as JobType })}>
                  {jobTypes.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary range</label>
                <input className="input" placeholder="e.g. $80k–$100k" value={form.salary_range}
                  onChange={(e) => setForm({ ...form, salary_range: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="textarea" rows={4} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
              <button
                onClick={postJob}
                disabled={saving || !form.title || !form.company}
                className="btn-primary"
              >
                {saving ? 'Posting...' : 'Post job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
