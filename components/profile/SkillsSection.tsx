'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Skill } from '@/types'

interface SkillsSectionProps {
  skills: Skill[]
  profileId: string
  isOwner: boolean
}

export default function SkillsSection({ skills: initial, profileId, isOwner }: SkillsSectionProps) {
  const supabase = createClient()
  const [skills, setSkills] = useState(initial)
  const [newSkill, setNewSkill] = useState('')
  const [adding, setAdding] = useState(false)

  async function addSkill() {
    const name = newSkill.trim()
    if (!name) return
    const { data } = await supabase
      .from('skills')
      .insert({ profile_id: profileId, name })
      .select()
      .single()
    if (data) setSkills((s) => [...s, data as Skill])
    setNewSkill('')
    setAdding(false)
  }

  async function removeSkill(id: string) {
    await supabase.from('skills').delete().eq('id', id)
    setSkills((s) => s.filter((sk) => sk.id !== id))
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Skills</h2>
        {isOwner && (
          <button onClick={() => setAdding(true)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {skills.length === 0 && !adding && (
        <p className="text-sm text-gray-400">No skills added yet.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill.id} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-sm font-medium px-3 py-1 rounded-full">
            {skill.name}
            {isOwner && (
              <button onClick={() => removeSkill(skill.id)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>

      {adding && (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            className="input text-sm"
            placeholder="e.g. TypeScript"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
            autoFocus
          />
          <button onClick={() => setAdding(false)} className="btn-ghost text-sm py-1.5">Cancel</button>
          <button onClick={addSkill} disabled={!newSkill.trim()} className="btn-primary text-sm py-1.5">Add</button>
        </div>
      )}
    </div>
  )
}
