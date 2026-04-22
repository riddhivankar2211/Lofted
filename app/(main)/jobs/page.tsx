import { createClient } from '@/lib/supabase/server'
import JobsClient from './JobsClient'
import type { Job, Profile } from '@/types'

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: jobsRaw }, { data: myApplications }] = await Promise.all([
    supabase
      .from('jobs')
      .select('*, poster:profiles(*)')
      .order('created_at', { ascending: false }),
    supabase
      .from('job_applications')
      .select('job_id')
      .eq('applicant_id', user.id),
  ])

  const appliedJobIds = new Set((myApplications ?? []).map((a: { job_id: string }) => a.job_id))

  const jobs: Job[] = (jobsRaw ?? []).map((j: Record<string, unknown>) => ({
    ...j,
    applied: appliedJobIds.has(j.id as string),
  }))

  return <JobsClient jobs={jobs} currentUserId={user.id} />
}
