'use client'

import { useState } from 'react'
import { Plus, Trash2, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { WorkExperience } from '@/types'

interface ExperienceSectionProps {
  experience: WorkExperience[]
  profileId: string
  isOwner: boolean
}

const emptyForm = {
  title: '', company: '', location: '',
  start_date: '', end_date: '', current: false, description: '',
}

export default function ExperienceSection({ experience: initial, profileId, isOwner }: ExperienceSectionProps) {
  const supabase = createClient()
  const [items, setItems] = useState(initial)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function addExperience() {
    setSaving(true)
    const { data } = await supabase
      .from('work_experience')
      .insert({ ...form, profile_id: profileId, end_date: form.current ? null : form.end_date || null })
      .select()
      .single()
    if (data) setItems((e) => [data as WorkExperience, ...e])
    setForm(emptyForm)
    setAdding(false)
    setSaving(false)
  }

  async function deleteExperience(id: string) {
    await supabase.from('work_experience').delete().eq('id', id)
    setItems((e) => e.filter((x) => x.id !== id))
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Experience</h2>
        {isOwner && (
          <button onClick={() => setAdding(true)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {items.length === 0 && !adding && (
        <p className="text-sm text-gray-400">No experience added yet.</p>
      )}

      <div className="space-y-4">
        {items.map((exp) => (
          <div key={exp.id} className="flex gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{exp.title}</p>
                  <p className="text-sm text-gray-600">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(exp.start_date)} – {exp.current ? 'Present' : exp.end_date ? formatDate(exp.end_date) : ''}
                  </p>
                </div>
                {isOwner && (
                  <button onClick={() => deleteExperience(exp.id)} className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {exp.description && (
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{exp.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {adding && (
        <div className="mt-4 border-t pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Job title *</label>
              <input className="input text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company *</label>
              <input className="input text-sm" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
              <input className="input text-sm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start date *</label>
              <input type="date" className="input text-sm" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            {!form.current && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
                <input type="date" className="input text-sm" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={form.current} onChange={(e) => setForm({ ...form, current: e.target.checked })} className="rounded" />
            I currently work here
          </label>
          <textarea className="textarea text-sm" rows={2} placeholder="Description (optional)"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="btn-ghost text-sm py-1.5">Cancel</button>
            <button onClick={addExperience} disabled={saving || !form.title || !form.company || !form.start_date} className="btn-primary text-sm py-1.5">
              {saving ? 'Saving...' : 'Add'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
