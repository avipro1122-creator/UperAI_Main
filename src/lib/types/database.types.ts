// Hand-written to match supabase/migrations/20260806000000_initial_schema.sql
// and supabase/migrations/20260807000000_admin_role.sql.
// If you have the Supabase CLI, prefer regenerating with:
//   supabase gen types typescript --project-id <id> > src/lib/types/database.types.ts

export type UserRole = 'creator' | 'editor'
export type JobFormat = 'long' | 'shorts' | 'both'
export type JobStatus = 'open' | 'closed'
export type ApplicationStatus = 'sent' | 'shortlisted' | 'declined' | 'hired'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: UserRole | null
          name: string
          handle: string
          avatar_url: string | null
          bio: string | null
          city: string | null
          last_active_at: string
          created_at: string
          // Not selectable/updatable via the anon/authenticated roles (see
          // the admin_role migration) — only ever set server-side via the
          // service role client. Omit from any client-side select('*').
          is_admin: boolean
        }
        Insert: Partial<Database['public']['Tables']['users']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['users']['Row']>
        Relationships: []
      }
      editor_profiles: {
        Row: {
          user_id: string
          headline: string | null
          software: string[]
          turnaround_days: number | null
          min_rate: number | null
          max_rate: number | null
          rate_long: number | null
          rate_short: number | null
          currency: string
          open_to_work: boolean
          whatsapp: string | null
          instagram_handle: string | null
          // Admin moderation flag — soft hide, no hard delete. Only admins
          // can change it (enforced by a trigger, see admin_role migration).
          is_hidden: boolean
        }
        Insert: Partial<Database['public']['Tables']['editor_profiles']['Row']> & { user_id: string }
        Update: Partial<Database['public']['Tables']['editor_profiles']['Row']>
        Relationships: [
          {
            foreignKeyName: 'editor_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      portfolio_items: {
        Row: {
          id: string
          editor_id: string
          youtube_url: string
          video_id: string
          title: string | null
          role_description: string
          duration_seconds: number | null
          position: number
          thumbnail_url: string | null
          is_short: boolean
          is_available: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['portfolio_items']['Row']> & {
          editor_id: string
          youtube_url: string
          video_id: string
          role_description: string
        }
        Update: Partial<Database['public']['Tables']['portfolio_items']['Row']>
        Relationships: [
          {
            foreignKeyName: 'portfolio_items_editor_id_fkey'
            columns: ['editor_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      contact_clicks: {
        Row: {
          id: string
          editor_id: string
          clicked_at: string
        }
        Insert: { editor_id: string; clicked_at?: string }
        Update: never
        Relationships: [
          {
            foreignKeyName: 'contact_clicks_editor_id_fkey'
            columns: ['editor_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      creator_profiles: {
        Row: {
          user_id: string
          channel_url: string | null
          subscriber_count: number | null
          niche: string | null
          avg_video_length: number | null
        }
        Insert: Partial<Database['public']['Tables']['creator_profiles']['Row']> & { user_id: string }
        Update: Partial<Database['public']['Tables']['creator_profiles']['Row']>
        Relationships: [
          {
            foreignKeyName: 'creator_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      jobs: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          format: JobFormat
          budget_min: number
          budget_max: number
          currency: string
          deadline_days: number | null
          status: JobStatus
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['jobs']['Row']> & {
          creator_id: string
          title: string
          format: JobFormat
          budget_min: number
          budget_max: number
        }
        Update: Partial<Database['public']['Tables']['jobs']['Row']>
        Relationships: [
          {
            foreignKeyName: 'jobs_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      applications: {
        Row: {
          id: string
          job_id: string
          editor_id: string
          message: string | null
          quoted_rate: number | null
          status: ApplicationStatus
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['applications']['Row']> & {
          job_id: string
          editor_id: string
        }
        Update: Partial<Database['public']['Tables']['applications']['Row']>
        Relationships: [
          {
            foreignKeyName: 'applications_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'applications_editor_id_fkey'
            columns: ['editor_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      messages: {
        Row: {
          id: string
          application_id: string
          sender_id: string
          body: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['messages']['Row']> & {
          application_id: string
          sender_id: string
          body: string
        }
        Update: Partial<Database['public']['Tables']['messages']['Row']>
        Relationships: [
          {
            foreignKeyName: 'messages_application_id_fkey'
            columns: ['application_id']
            isOneToOne: false
            referencedRelation: 'applications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {}
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}
