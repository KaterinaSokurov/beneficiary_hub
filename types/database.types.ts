export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: "admin" | "approver" | "donor" | "school"
          full_name: string | null
          [key: string]: any
        }
        Insert: {
          id: string
          email: string
          role: "admin" | "approver" | "donor" | "school"
          [key: string]: any
        }
        Update: {
          [key: string]: any
        }
        Relationships: []
      }
      donors: {
        Row: {
          id: string
          full_name: string
          [key: string]: any
        }
        Insert: {
          id: string
          full_name: string
          [key: string]: any
        }
        Update: {
          [key: string]: any
        }
        Relationships: []
      }
      schools: {
        Row: {
          id: string
          school_name: string
          [key: string]: any
        }
        Insert: {
          id: string
          school_name: string
          [key: string]: any
        }
        Update: {
          [key: string]: any
        }
        Relationships: []
      }
      donations: {
        Row: {
          id: string
          donor_id: string
          title: string
          [key: string]: any
        }
        Insert: {
          id?: string
          donor_id: string
          title: string
          [key: string]: any
        }
        Update: {
          [key: string]: any
        }
        Relationships: []
      }
      resource_applications: {
        Row: {
          id: string
          school_id: string
          application_title: string
          [key: string]: any
        }
        Insert: {
          id?: string
          school_id: string
          application_title: string
          [key: string]: any
        }
        Update: {
          [key: string]: any
        }
        Relationships: []
      }
      donation_matches: {
        Row: {
          id: string
          donation_id: string
          application_id: string
          school_id: string
          match_score: number
          match_justification: string
          priority_rank: number | null
          status: string
          admin_notes: string | null
          allocated_by: string | null
          allocated_at: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          approver_notes: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          donation_id: string
          application_id: string
          school_id: string
          match_score: number
          match_justification: string
          priority_rank?: number | null
          status?: string
          admin_notes?: string | null
          allocated_by?: string | null
          allocated_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          approver_notes?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          donation_id?: string
          application_id?: string
          school_id?: string
          match_score?: number
          match_justification?: string
          priority_rank?: number | null
          status?: string
          admin_notes?: string | null
          allocated_by?: string | null
          allocated_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          approver_notes?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "admin" | "approver" | "donor" | "school"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type UserRole = Database["public"]["Enums"]["user_role"];
