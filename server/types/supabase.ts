
// TypeScript definitions for Supabase database schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          email: string | null
          settings: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          email?: string | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          role: 'inspector' | 'consultant' | 'engineer' | 'admin'
          company_id: string | null
          email: string
          full_name: string | null
          phone: string | null
          permissions: string[] | null
          preferences: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          role?: 'inspector' | 'consultant' | 'engineer' | 'admin'
          company_id?: string | null
          email: string
          full_name?: string | null
          phone?: string | null
          permissions?: string[] | null
          preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          role?: 'inspector' | 'consultant' | 'engineer' | 'admin'
          company_id?: string | null
          email?: string
          full_name?: string | null
          phone?: string | null
          permissions?: string[] | null
          preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          address: string
          company_name: string | null
          square_footage: number | null
          building_height: number | null
          building_dimensions: Json | null
          deck_type: string | null
          project_type: string | null
          roof_slope: number | null
          elevation: number | null
          exposure_category: string | null
          membrane_type: string | null
          membrane_thickness: string | null
          membrane_material: string | null
          selected_membrane_brand: string | null
          takeoff_data: Json | null
          basic_wind_speed: number | null
          preferred_manufacturer: string | null
          includes_tapered_insulation: boolean | null
          user_selected_system: string | null
          custom_notes: string[] | null
          created_at: string
          updated_at: string
          current_stage: 'inspection' | 'consultant_review' | 'engineering' | 'complete' | null
          assigned_inspector: string | null
          assigned_consultant: string | null
          assigned_engineer: string | null
          workflow_status: Json | null
          stage_data: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          address: string
          company_name?: string | null
          square_footage?: number | null
          building_height?: number | null
          building_dimensions?: Json | null
          deck_type?: string | null
          project_type?: string | null
          roof_slope?: number | null
          elevation?: number | null
          exposure_category?: string | null
          membrane_type?: string | null
          membrane_thickness?: string | null
          membrane_material?: string | null
          selected_membrane_brand?: string | null
          takeoff_data?: Json | null
          basic_wind_speed?: number | null
          preferred_manufacturer?: string | null
          includes_tapered_insulation?: boolean | null
          user_selected_system?: string | null
          custom_notes?: string[] | null
          created_at?: string
          updated_at?: string
          current_stage?: 'inspection' | 'consultant_review' | 'engineering' | 'complete' | null
          assigned_inspector?: string | null
          assigned_consultant?: string | null
          assigned_engineer?: string | null
          workflow_status?: Json | null
          stage_data?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          address?: string
          company_name?: string | null
          square_footage?: number | null
          building_height?: number | null
          building_dimensions?: Json | null
          deck_type?: string | null
          project_type?: string | null
          roof_slope?: number | null
          elevation?: number | null
          exposure_category?: string | null
          membrane_type?: string | null
          membrane_thickness?: string | null
          membrane_material?: string | null
          selected_membrane_brand?: string | null
          takeoff_data?: Json | null
          basic_wind_speed?: number | null
          preferred_manufacturer?: string | null
          includes_tapered_insulation?: boolean | null
          user_selected_system?: string | null
          custom_notes?: string[] | null
          created_at?: string
          updated_at?: string
          current_stage?: 'inspection' | 'consultant_review' | 'engineering' | 'complete' | null
          assigned_inspector?: string | null
          assigned_consultant?: string | null
          assigned_engineer?: string | null
          workflow_status?: Json | null
          stage_data?: Json | null
        }
      }
      field_inspections: {
        Row: {
          id: string
          inspector_id: string | null
          inspector_name: string
          project_name: string
          project_address: string
          customer_name: string | null
          customer_phone: string | null
          inspection_date: string | null
          weather_conditions: string | null
          access_method: string | null
          building_height: number | null
          building_length: number | null
          building_width: number | null
          square_footage: number | null
          number_of_stories: number | null
          deck_type: string | null
          roof_slope: string | null
          existing_membrane_type: string | null
          existing_membrane_condition: number | null
          roof_age_years: number | null
          insulation_type: string | null
          insulation_condition: string | null
          cover_board_type: string | null
          overall_condition: number | null
          hvac_units: Json | null
          roof_drains: Json | null
          penetrations: Json | null
          skylights: number | null
          roof_hatches: number | null
          drainage_options: Json | null
          interior_protection_needed: boolean | null
          interior_protection_sqft: number | null
          conduit_attached: boolean | null
          upgraded_lighting: boolean | null
          interior_fall_protection: boolean | null
          insulation_layers: Json | null
          skylights_detailed: Json | null
          curbs_above_8: boolean | null
          gas_line_penetrating_deck: boolean | null
          priority_level: string | null
          special_requirements: string | null
          notes: string | null
          photos: string[] | null
          status: string | null
          sow_generated: boolean | null
          sow_id: string | null
          created_at: string | null
          updated_at: string | null
          completed_at: string | null
          project_id: string | null
          observations: Json | null
          measurements: Json | null
          conditions: Json | null
          takeoff_items: Json | null
          recommendations: string | null
          concerns: string | null
          completed: boolean | null
          ready_for_handoff: boolean | null
          handoff_notes: string | null
        }
        Insert: {
          id?: string
          inspector_id?: string | null
          inspector_name: string
          project_name: string
          project_address: string
          customer_name?: string | null
          customer_phone?: string | null
          inspection_date?: string | null
          weather_conditions?: string | null
          access_method?: string | null
          building_height?: number | null
          building_length?: number | null
          building_width?: number | null
          square_footage?: number | null
          number_of_stories?: number | null
          deck_type?: string | null
          roof_slope?: string | null
          existing_membrane_type?: string | null
          existing_membrane_condition?: number | null
          roof_age_years?: number | null
          insulation_type?: string | null
          insulation_condition?: string | null
          cover_board_type?: string | null
          overall_condition?: number | null
          hvac_units?: Json | null
          roof_drains?: Json | null
          penetrations?: Json | null
          skylights?: number | null
          roof_hatches?: number | null
          drainage_options?: Json | null
          interior_protection_needed?: boolean | null
          interior_protection_sqft?: number | null
          conduit_attached?: boolean | null
          upgraded_lighting?: boolean | null
          interior_fall_protection?: boolean | null
          insulation_layers?: Json | null
          skylights_detailed?: Json | null
          curbs_above_8?: boolean | null
          gas_line_penetrating_deck?: boolean | null
          priority_level?: string | null
          special_requirements?: string | null
          notes?: string | null
          photos?: string[] | null
          status?: string | null
          sow_generated?: boolean | null
          sow_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          completed_at?: string | null
          project_id?: string | null
          observations?: Json | null
          measurements?: Json | null
          conditions?: Json | null
          takeoff_items?: Json | null
          recommendations?: string | null
          concerns?: string | null
          completed?: boolean | null
          ready_for_handoff?: boolean | null
          handoff_notes?: string | null
        }
        Update: {
          id?: string
          inspector_id?: string | null
          inspector_name?: string
          project_name?: string
          project_address?: string
          customer_name?: string | null
          customer_phone?: string | null
          inspection_date?: string | null
          weather_conditions?: string | null
          access_method?: string | null
          building_height?: number | null
          building_length?: number | null
          building_width?: number | null
          square_footage?: number | null
          number_of_stories?: number | null
          deck_type?: string | null
          roof_slope?: string | null
          existing_membrane_type?: string | null
          existing_membrane_condition?: number | null
          roof_age_years?: number | null
          insulation_type?: string | null
          insulation_condition?: string | null
          cover_board_type?: string | null
          overall_condition?: number | null
          hvac_units?: Json | null
          roof_drains?: Json | null
          penetrations?: Json | null
          skylights?: number | null
          roof_hatches?: number | null
          drainage_options?: Json | null
          interior_protection_needed?: boolean | null
          interior_protection_sqft?: number | null
          conduit_attached?: boolean | null
          upgraded_lighting?: boolean | null
          interior_fall_protection?: boolean | null
          insulation_layers?: Json | null
          skylights_detailed?: Json | null
          curbs_above_8?: boolean | null
          gas_line_penetrating_deck?: boolean | null
          priority_level?: string | null
          special_requirements?: string | null
          notes?: string | null
          photos?: string[] | null
          status?: string | null
          sow_generated?: boolean | null
          sow_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          completed_at?: string | null
          project_id?: string | null
          observations?: Json | null
          measurements?: Json | null
          conditions?: Json | null
          takeoff_items?: Json | null
          recommendations?: string | null
          concerns?: string | null
          completed?: boolean | null
          ready_for_handoff?: boolean | null
          handoff_notes?: string | null
        }
      }
      sow_outputs: {
        Row: {
          id: string
          project_id: string
          user_id: string
          template_name: string
          rationale: string | null
          asce_version: string | null
          hvhz: boolean | null
          wind_speed: number | null
          zone1_field: number | null
          zone1_perimeter: number | null
          zone2_perimeter: number | null
          zone3_corner: number | null
          manufacturer: string | null
          spacing_field: string | null
          spacing_perimeter: string | null
          spacing_corner: string | null
          penetration_depth: string | null
          takeoff_risk: string | null
          key_issues: string[] | null
          file_url: string | null
          filename: string | null
          file_size: number | null
          storage_path: string | null
          generation_time_ms: number | null
          engineering_summary: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          template_name: string
          rationale?: string | null
          asce_version?: string | null
          hvhz?: boolean | null
          wind_speed?: number | null
          zone1_field?: number | null
          zone1_perimeter?: number | null
          zone2_perimeter?: number | null
          zone3_corner?: number | null
          manufacturer?: string | null
          spacing_field?: string | null
          spacing_perimeter?: string | null
          spacing_corner?: string | null
          penetration_depth?: string | null
          takeoff_risk?: string | null
          key_issues?: string[] | null
          file_url?: string | null
          filename?: string | null
          file_size?: number | null
          storage_path?: string | null
          generation_time_ms?: number | null
          engineering_summary?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          template_name?: string
          rationale?: string | null
          asce_version?: string | null
          hvhz?: boolean | null
          wind_speed?: number | null
          zone1_field?: number | null
          zone1_perimeter?: number | null
          zone2_perimeter?: number | null
          zone3_corner?: number | null
          manufacturer?: string | null
          spacing_field?: string | null
          spacing_perimeter?: string | null
          spacing_corner?: string | null
          penetration_depth?: string | null
          takeoff_risk?: string | null
          key_issues?: string[] | null
          file_url?: string | null
          filename?: string | null
          file_size?: number | null
          storage_path?: string | null
          generation_time_ms?: number | null
          engineering_summary?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      project_handoffs: {
        Row: {
          id: string
          project_id: string
          from_user_id: string | null
          to_user_id: string | null
          from_stage: 'inspection' | 'consultant_review' | 'engineering' | 'complete'
          to_stage: 'inspection' | 'consultant_review' | 'engineering' | 'complete'
          handoff_data: Json | null
          notes: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          from_user_id?: string | null
          to_user_id?: string | null
          from_stage: 'inspection' | 'consultant_review' | 'engineering' | 'complete'
          to_stage: 'inspection' | 'consultant_review' | 'engineering' | 'complete'
          handoff_data?: Json | null
          notes?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          from_user_id?: string | null
          to_user_id?: string | null
          from_stage?: 'inspection' | 'consultant_review' | 'engineering' | 'complete'
          to_stage?: 'inspection' | 'consultant_review' | 'engineering' | 'complete'
          handoff_data?: Json | null
          notes?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
        }
      }
      workflow_activities: {
        Row: {
          id: string
          project_id: string
          user_id: string | null
          activity_type: string
          stage_from: 'inspection' | 'consultant_review' | 'engineering' | 'complete' | null
          stage_to: 'inspection' | 'consultant_review' | 'engineering' | 'complete' | null
          data_changes: Json | null
          notes: string | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id?: string | null
          activity_type: string
          stage_from?: 'inspection' | 'consultant_review' | 'engineering' | 'complete' | null
          stage_to?: 'inspection' | 'consultant_review' | 'engineering' | 'complete' | null
          data_changes?: Json | null
          notes?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string | null
          activity_type?: string
          stage_from?: 'inspection' | 'consultant_review' | 'engineering' | 'complete' | null
          stage_to?: 'inspection' | 'consultant_review' | 'engineering' | 'complete' | null
          data_changes?: Json | null
          notes?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
      }
      consultant_reviews: {
        Row: {
          id: string
          project_id: string
          consultant_id: string
          field_inspection_id: string | null
          client_requirements: Json | null
          special_conditions: string | null
          budget_considerations: string | null
          timeline_requirements: string | null
          scope_modifications: Json | null
          additional_work_items: Json | null
          exclusions: string | null
          bid_alerts: Json | null
          risk_factors: string | null
          competitive_considerations: string | null
          template_preferences: string[] | null
          template_concerns: string | null
          review_completed: boolean | null
          reviewed_at: string | null
          engineer_briefing: string | null
          priority_items: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          consultant_id: string
          field_inspection_id?: string | null
          client_requirements?: Json | null
          special_conditions?: string | null
          budget_considerations?: string | null
          timeline_requirements?: string | null
          scope_modifications?: Json | null
          additional_work_items?: Json | null
          exclusions?: string | null
          bid_alerts?: Json | null
          risk_factors?: string | null
          competitive_considerations?: string | null
          template_preferences?: string[] | null
          template_concerns?: string | null
          review_completed?: boolean | null
          reviewed_at?: string | null
          engineer_briefing?: string | null
          priority_items?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          consultant_id?: string
          field_inspection_id?: string | null
          client_requirements?: Json | null
          special_conditions?: string | null
          budget_considerations?: string | null
          timeline_requirements?: string | null
          scope_modifications?: Json | null
          additional_work_items?: Json | null
          exclusions?: string | null
          bid_alerts?: Json | null
          risk_factors?: string | null
          competitive_considerations?: string | null
          template_preferences?: string[] | null
          template_concerns?: string | null
          review_completed?: boolean | null
          reviewed_at?: string | null
          engineer_briefing?: string | null
          priority_items?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      project_comments: {
        Row: {
          id: string
          project_id: string
          user_id: string
          comment: string
          comment_type: string | null
          stage: 'inspection' | 'consultant_review' | 'engineering' | 'complete' | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          comment: string
          comment_type?: string | null
          stage?: 'inspection' | 'consultant_review' | 'engineering' | 'complete' | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          comment?: string
          comment_type?: string | null
          stage?: 'inspection' | 'consultant_review' | 'engineering' | 'complete' | null
          metadata?: Json | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role_enum: 'inspector' | 'consultant' | 'engineer' | 'admin'
      workflow_stage_enum: 'inspection' | 'consultant_review' | 'engineering' | 'complete'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for working with the database
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type SOWOutput = Database['public']['Tables']['sow_outputs']['Row']
export type SOWOutputInsert = Database['public']['Tables']['sow_outputs']['Insert']
export type SOWOutputUpdate = Database['public']['Tables']['sow_outputs']['Update']

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export type FieldInspection = Database['public']['Tables']['field_inspections']['Row']
export type FieldInspectionInsert = Database['public']['Tables']['field_inspections']['Insert']
export type FieldInspectionUpdate = Database['public']['Tables']['field_inspections']['Update']

export type ProjectHandoff = Database['public']['Tables']['project_handoffs']['Row']
export type ProjectHandoffInsert = Database['public']['Tables']['project_handoffs']['Insert']
export type ProjectHandoffUpdate = Database['public']['Tables']['project_handoffs']['Update']

export type WorkflowActivity = Database['public']['Tables']['workflow_activities']['Row']
export type WorkflowActivityInsert = Database['public']['Tables']['workflow_activities']['Insert']
export type WorkflowActivityUpdate = Database['public']['Tables']['workflow_activities']['Update']

export type ConsultantReview = Database['public']['Tables']['consultant_reviews']['Row']
export type ConsultantReviewInsert = Database['public']['Tables']['consultant_reviews']['Insert']
export type ConsultantReviewUpdate = Database['public']['Tables']['consultant_reviews']['Update']

export type ProjectComment = Database['public']['Tables']['project_comments']['Row']
export type ProjectCommentInsert = Database['public']['Tables']['project_comments']['Insert']
export type ProjectCommentUpdate = Database['public']['Tables']['project_comments']['Update']

// Workflow-specific types
export type UserRole = Database['public']['Enums']['user_role_enum']
export type WorkflowStage = Database['public']['Enums']['workflow_stage_enum']

// Additional types for the application
export interface ProjectWithSOWs extends Project {
  sow_outputs?: SOWOutput[]
}

export interface SOWOutputWithProject extends SOWOutput {
  project?: Project
}

export interface ProjectWithWorkflow extends Project {
  field_inspections?: FieldInspection[]
  consultant_reviews?: ConsultantReview[]
  project_handoffs?: ProjectHandoff[]
  workflow_activities?: WorkflowActivity[]
  project_comments?: ProjectComment[]
  assigned_inspector_profile?: UserProfile
  assigned_consultant_profile?: UserProfile
  assigned_engineer_profile?: UserProfile
}

export interface FieldInspectionWithProject extends FieldInspection {
  project?: Project
}

export interface ConsultantReviewWithDetails extends ConsultantReview {
  project?: Project
  field_inspection?: FieldInspection
  consultant_profile?: UserProfile
}
