export interface Profile {
  id: string
  username: string
  full_name: string
  headline?: string | null
  bio?: string | null
  location?: string | null
  avatar_url?: string | null
  cover_url?: string | null
  website?: string | null
  created_at: string
}

export interface WorkExperience {
  id: string
  profile_id: string
  company: string
  title: string
  location?: string | null
  start_date: string
  end_date?: string | null
  current: boolean
  description?: string | null
  created_at: string
}

export interface Skill {
  id: string
  profile_id: string
  name: string
  created_at: string
}

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected'

export interface Connection {
  id: string
  requester_id: string
  receiver_id: string
  status: ConnectionStatus
  created_at: string
  requester?: Profile
  receiver?: Profile
}

export interface Post {
  id: string
  author_id: string
  content: string
  image_url?: string | null
  created_at: string
  updated_at: string
  author?: Profile
  likes_count?: number
  comments_count?: number
  liked_by_user?: boolean
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  author?: Profile
}

export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote'

export interface Job {
  id: string
  poster_id: string
  title: string
  company: string
  location?: string | null
  description?: string | null
  type: JobType
  salary_range?: string | null
  created_at: string
  poster?: Profile
  applied?: boolean
  applications_count?: number
}

export interface JobApplication {
  id: string
  job_id: string
  applicant_id: string
  cover_letter?: string | null
  created_at: string
  applicant?: Profile
  job?: Job
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
  sender?: Profile
}

export interface Conversation {
  id: string
  created_at: string
  participants?: Profile[]
  last_message?: Message
  other_participant?: Profile
}
