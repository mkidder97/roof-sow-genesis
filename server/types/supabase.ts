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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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

// Additional types for the application
export interface ProjectWithSOWs extends Project {
  sow_outputs?: SOWOutput[]
}

export interface SOWOutputWithProject extends SOWOutput {
  project?: Project
}
