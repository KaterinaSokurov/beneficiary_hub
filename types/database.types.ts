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
      donors: {
        Row: {
          address: string | null
          address_proof_url: string | null
          aml_acknowledged_at: string | null
          aml_acknowledgment: boolean | null
          city: string | null
          company_registration_number: string | null
          connection_to_cause: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          donation_frequency_preference: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          full_name: string
          id: string
          id_document_url: string | null
          id_number: string | null
          id_type: string | null
          is_verified: boolean | null
          language_preference: string | null
          motivation_for_donating: string | null
          newsletter_consent: boolean | null
          occupation: string | null
          organization_name: string | null
          phone_number: string | null
          postal_code: string | null
          preferred_contact_method: string | null
          preferred_donation_categories: string[] | null
          previous_charitable_work: string | null
          privacy_policy_accepted: boolean | null
          privacy_policy_accepted_at: string | null
          state: string | null
          tax_id: string | null
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          updated_at: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          address_proof_url?: string | null
          aml_acknowledged_at?: string | null
          aml_acknowledgment?: boolean | null
          city?: string | null
          company_registration_number?: string | null
          connection_to_cause?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          donation_frequency_preference?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name: string
          id: string
          id_document_url?: string | null
          id_number?: string | null
          id_type?: string | null
          is_verified?: boolean | null
          language_preference?: string | null
          motivation_for_donating?: string | null
          newsletter_consent?: boolean | null
          occupation?: string | null
          organization_name?: string | null
          phone_number?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          preferred_donation_categories?: string[] | null
          previous_charitable_work?: string | null
          privacy_policy_accepted?: boolean | null
          privacy_policy_accepted_at?: string | null
          state?: string | null
          tax_id?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          address_proof_url?: string | null
          aml_acknowledged_at?: string | null
          aml_acknowledgment?: boolean | null
          city?: string | null
          company_registration_number?: string | null
          connection_to_cause?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          donation_frequency_preference?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string
          id?: string
          id_document_url?: string | null
          id_number?: string | null
          id_type?: string | null
          is_verified?: boolean | null
          language_preference?: string | null
          motivation_for_donating?: string | null
          newsletter_consent?: boolean | null
          occupation?: string | null
          organization_name?: string | null
          phone_number?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          preferred_donation_categories?: string[] | null
          previous_charitable_work?: string | null
          privacy_policy_accepted?: boolean | null
          privacy_policy_accepted_at?: string | null
          state?: string | null
          tax_id?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donors_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_verified_by"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          allocated_at: string | null
          allocated_to: string | null
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          available_from: string | null
          available_quantity: number | null
          available_until: string | null
          category: string[]
          city: string | null
          condition: string | null
          created_at: string
          delivered_at: string | null
          delivery_available: boolean | null
          delivery_radius_km: number | null
          delivery_status: string | null
          description: string
          donation_type: string
          donor_id: string
          id: string
          items: Json
          photos_urls: Json | null
          pickup_location: string | null
          province: string | null
          rejection_reason: string | null
          special_instructions: string | null
          status: string
          supporting_document_urls: Json | null
          title: string
          total_estimated_value: number | null
          updated_at: string
          urgency_level: string | null
        }
        Insert: {
          allocated_at?: string | null
          allocated_to?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          available_from?: string | null
          available_quantity?: number | null
          available_until?: string | null
          category: string[]
          city?: string | null
          condition?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_available?: boolean | null
          delivery_radius_km?: number | null
          delivery_status?: string | null
          description: string
          donation_type: string
          donor_id: string
          id?: string
          items: Json
          photos_urls?: Json | null
          pickup_location?: string | null
          province?: string | null
          rejection_reason?: string | null
          special_instructions?: string | null
          status?: string
          supporting_document_urls?: Json | null
          title: string
          total_estimated_value?: number | null
          updated_at?: string
          urgency_level?: string | null
        }
        Update: {
          allocated_at?: string | null
          allocated_to?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          available_from?: string | null
          available_quantity?: number | null
          available_until?: string | null
          category?: string[]
          city?: string | null
          condition?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_available?: boolean | null
          delivery_radius_km?: number | null
          delivery_status?: string | null
          description?: string
          donation_type?: string
          donor_id?: string
          id?: string
          items?: Json
          photos_urls?: Json | null
          pickup_location?: string | null
          province?: string | null
          rejection_reason?: string | null
          special_instructions?: string | null
          status?: string
          supporting_document_urls?: Json | null
          title?: string
          total_estimated_value?: number | null
          updated_at?: string
          urgency_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_allocated_to_fkey"
            columns: ["allocated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      resource_applications: {
        Row: {
          application_title: string
          application_type: string
          beneficiaries_count: number | null
          created_at: string
          current_situation: string
          expected_impact: string
          id: string
          implementation_timeline: string | null
          needed_by_date: string | null
          photos_urls: Json | null
          priority_level: string | null
          problem_statement: string | null
          resources_needed: Json
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school_id: string
          status: string
          submitted_at: string | null
          supporting_document_urls: Json | null
          total_estimated_cost: number | null
          updated_at: string
        }
        Insert: {
          application_title: string
          application_type: string
          beneficiaries_count?: number | null
          created_at?: string
          current_situation: string
          expected_impact: string
          id?: string
          implementation_timeline?: string | null
          needed_by_date?: string | null
          photos_urls?: Json | null
          priority_level?: string | null
          problem_statement?: string | null
          resources_needed: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id: string
          status?: string
          submitted_at?: string | null
          supporting_document_urls?: Json | null
          total_estimated_cost?: number | null
          updated_at?: string
        }
        Update: {
          application_title?: string
          application_type?: string
          beneficiaries_count?: number | null
          created_at?: string
          current_situation?: string
          expected_impact?: string
          id?: string
          implementation_timeline?: string | null
          needed_by_date?: string | null
          photos_urls?: Json | null
          priority_level?: string | null
          problem_statement?: string | null
          resources_needed?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id?: string
          status?: string
          submitted_at?: string | null
          supporting_document_urls?: Json | null
          total_estimated_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_applications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          additional_document_url: string | null
          alternative_contact_name: string | null
          alternative_contact_phone: string | null
          approval_status: string | null
          classroom_condition: string | null
          classroom_photo_url: string | null
          created_at: string | null
          district: string
          feeding_program_details: string | null
          female_students: number | null
          gps_coordinates: string | null
          grades_offered: string
          has_computer_lab: boolean | null
          has_electricity: boolean | null
          has_feeding_program: boolean | null
          has_library: boolean | null
          has_running_water: boolean | null
          head_teacher_email: string | null
          head_teacher_id_url: string | null
          head_teacher_name: string
          head_teacher_phone: string
          id: string
          is_verified: boolean | null
          male_students: number | null
          number_of_classrooms: number | null
          percentage_fee_paying: number | null
          physical_address: string
          province: string
          registration_certificate_url: string | null
          registration_number: string | null
          rejection_reason: string | null
          school_fees_amount: number | null
          school_name: string
          school_photo_url: string | null
          school_type: string
          students_requiring_meals: number | null
          total_students: number
          total_teachers: number
          updated_at: string | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          ward: string | null
        }
        Insert: {
          additional_document_url?: string | null
          alternative_contact_name?: string | null
          alternative_contact_phone?: string | null
          approval_status?: string | null
          classroom_condition?: string | null
          classroom_photo_url?: string | null
          created_at?: string | null
          district: string
          feeding_program_details?: string | null
          female_students?: number | null
          gps_coordinates?: string | null
          grades_offered: string
          has_computer_lab?: boolean | null
          has_electricity?: boolean | null
          has_feeding_program?: boolean | null
          has_library?: boolean | null
          has_running_water?: boolean | null
          head_teacher_email?: string | null
          head_teacher_id_url?: string | null
          head_teacher_name: string
          head_teacher_phone: string
          id: string
          is_verified?: boolean | null
          male_students?: number | null
          number_of_classrooms?: number | null
          percentage_fee_paying?: number | null
          physical_address: string
          province?: string
          registration_certificate_url?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          school_fees_amount?: number | null
          school_name: string
          school_photo_url?: string | null
          school_type: string
          students_requiring_meals?: number | null
          total_students: number
          total_teachers: number
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          ward?: string | null
        }
        Update: {
          additional_document_url?: string | null
          alternative_contact_name?: string | null
          alternative_contact_phone?: string | null
          approval_status?: string | null
          classroom_condition?: string | null
          classroom_photo_url?: string | null
          created_at?: string | null
          district?: string
          feeding_program_details?: string | null
          female_students?: number | null
          gps_coordinates?: string | null
          grades_offered?: string
          has_computer_lab?: boolean | null
          has_electricity?: boolean | null
          has_feeding_program?: boolean | null
          has_library?: boolean | null
          has_running_water?: boolean | null
          head_teacher_email?: string | null
          head_teacher_id_url?: string | null
          head_teacher_name?: string
          head_teacher_phone?: string
          id?: string
          is_verified?: boolean | null
          male_students?: number | null
          number_of_classrooms?: number | null
          percentage_fee_paying?: number | null
          physical_address?: string
          province?: string
          registration_certificate_url?: string | null
          registration_number?: string | null
          rejection_reason?: string | null
          school_fees_amount?: number | null
          school_name?: string
          school_photo_url?: string | null
          school_type?: string
          students_requiring_meals?: number | null
          total_students?: number
          total_teachers?: number
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          ward?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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

export type UserRole = Database["public"]["Enums"]["user_role"]
