import { Models } from 'node-appwrite'

export type UserRole = 'creator' | 'editor'
export type JobFormat = 'long' | 'shorts' | 'both'
export type JobStatus = 'open' | 'closed'
export type ApplicationStatus = 'sent' | 'shortlisted' | 'declined' | 'hired'

export interface UserDocument extends Models.Document {
  name: string
  handle: string
  avatar_url?: string | null
  bio?: string | null
  city?: string | null
  role?: UserRole | null
  last_active_at?: string
  is_admin?: boolean
}

export interface Testimonial {
  clientName: string
  channelOrBrand: string
  clientLink: string
  quote: string
  rating: number
}

export interface EditorProfileDocument extends Models.Document {
  user_id: string
  full_name?: string | null
  headline?: string | null
  specialty_tag?: string | null
  software?: string[]
  turnaround_days?: number | null
  turnaround_time?: string | null
  min_rate?: number | null
  max_rate?: number | null
  base_rate?: number | null
  rate_long?: number | null
  rate_short?: number | null
  currency?: string
  open_to_work?: boolean
  whatsapp?: string | null
  whatsapp_number?: string | null
  instagram_handle?: string | null
  youtube_url?: string | null
  is_hidden?: boolean
  testimonials?: Testimonial[]
}

export interface PortfolioItemDocument extends Models.Document {
  editor_id: string
  youtube_url?: string | null
  video_url?: string | null
  video_id?: string | null
  title?: string | null
  role_description?: string | null
  role_explanation?: string | null
  duration_seconds?: number | null
  position?: number
  thumbnail_url?: string | null
  is_short?: boolean
  is_available?: boolean
  format?: string | null
}

export interface ContactClickDocument extends Models.Document {
  editor_id: string
  clicked_at?: string
}

export interface CreatorProfileDocument extends Models.Document {
  user_id: string
  channel_url?: string | null
  subscriber_count?: number | null
  niche?: string | null
  avg_video_length?: number | null
}

export interface JobDocument extends Models.Document {
  creator_id: string
  title: string
  description?: string | null
  format: JobFormat
  budget_min: number
  budget_max: number
  currency: string
  deadline_days?: number | null
  status: JobStatus
}

export interface ApplicationDocument extends Models.Document {
  job_id: string
  editor_id: string
  message?: string | null
  quoted_rate?: number | null
  status: ApplicationStatus
}
