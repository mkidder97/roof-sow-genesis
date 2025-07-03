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
      asce_params: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          param_name: string
          param_value: number
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          param_name: string
          param_value: number
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          param_name?: string
          param_value?: number
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      consultant_reviews: {
        Row: {
          additional_work_items: Json | null
          bid_alerts: Json | null
          budget_considerations: string | null
          client_requirements: Json | null
          competitive_considerations: string | null
          consultant_id: string
          created_at: string | null
          engineer_briefing: string | null
          exclusions: string | null
          field_inspection_id: string | null
          id: string
          priority_items: string | null
          project_id: string
          review_completed: boolean | null
          reviewed_at: string | null
          risk_factors: string | null
          scope_modifications: Json | null
          special_conditions: string | null
          template_concerns: string | null
          template_preferences: string[] | null
          timeline_requirements: string | null
          updated_at: string | null
        }
        Insert: {
          additional_work_items?: Json | null
          bid_alerts?: Json | null
          budget_considerations?: string | null
          client_requirements?: Json | null
          competitive_considerations?: string | null
          consultant_id: string
          created_at?: string | null
          engineer_briefing?: string | null
          exclusions?: string | null
          field_inspection_id?: string | null
          id?: string
          priority_items?: string | null
          project_id: string
          review_completed?: boolean | null
          reviewed_at?: string | null
          risk_factors?: string | null
          scope_modifications?: Json | null
          special_conditions?: string | null
          template_concerns?: string | null
          template_preferences?: string[] | null
          timeline_requirements?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_work_items?: Json | null
          bid_alerts?: Json | null
          budget_considerations?: string | null
          client_requirements?: Json | null
          competitive_considerations?: string | null
          consultant_id?: string
          created_at?: string | null
          engineer_briefing?: string | null
          exclusions?: string | null
          field_inspection_id?: string | null
          id?: string
          priority_items?: string | null
          project_id?: string
          review_completed?: boolean | null
          reviewed_at?: string | null
          risk_factors?: string | null
          scope_modifications?: Json | null
          special_conditions?: string | null
          template_concerns?: string | null
          template_preferences?: string[] | null
          timeline_requirements?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultant_reviews_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_reviews_field_inspection_id_fkey"
            columns: ["field_inspection_id"]
            isOneToOne: false
            referencedRelation: "field_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_reviews_field_inspection_id_fkey"
            columns: ["field_inspection_id"]
            isOneToOne: false
            referencedRelation: "sow_generation_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      database_performance_log: {
        Row: {
          details: Json | null
          id: string
          metric_name: string
          metric_value: number
          recorded_at: string | null
        }
        Insert: {
          details?: Json | null
          id?: string
          metric_name: string
          metric_value: number
          recorded_at?: string | null
        }
        Update: {
          details?: Json | null
          id?: string
          metric_name?: string
          metric_value?: number
          recorded_at?: string | null
        }
        Relationships: []
      }
      engineering_config: {
        Row: {
          created_at: string | null
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      fastening_patterns: {
        Row: {
          created_at: string | null
          deck_type: string
          description: string | null
          id: number
          insulation_type: string
          pattern_data: Json
          product_id: string
          updated_at: string | null
          zone: string
        }
        Insert: {
          created_at?: string | null
          deck_type: string
          description?: string | null
          id?: number
          insulation_type: string
          pattern_data: Json
          product_id: string
          updated_at?: string | null
          zone: string
        }
        Update: {
          created_at?: string | null
          deck_type?: string
          description?: string | null
          id?: number
          insulation_type?: string
          pattern_data?: Json
          product_id?: string
          updated_at?: string | null
          zone?: string
        }
        Relationships: []
      }
      field_inspections: {
        Row: {
          access_method: string | null
          asce_requirements: Json | null
          asce_version: string | null
          building_classification: string | null
          building_height: number | null
          building_length: number | null
          building_width: number | null
          city: string | null
          completed: boolean | null
          completed_at: string | null
          concerns: string | null
          conditions: Json | null
          conduit_attached: boolean | null
          county: string | null
          cover_board_type: string | null
          created_at: string | null
          curbs_above_8: boolean | null
          customer_name: string | null
          customer_phone: string | null
          deck_type: string | null
          drainage_options: Json | null
          existing_membrane_condition: number | null
          existing_membrane_type: string | null
          exposure_category: string | null
          gas_line_penetrating_deck: boolean | null
          handoff_notes: string | null
          hvac_units: Json | null
          id: string
          inspection_date: string | null
          inspector_id: string | null
          inspector_name: string
          insulation_condition: string | null
          insulation_layers: Json | null
          insulation_type: string | null
          interior_fall_protection: boolean | null
          interior_protection_needed: boolean | null
          interior_protection_sqft: number | null
          measurements: Json | null
          notes: string | null
          number_of_stories: number | null
          observations: Json | null
          overall_condition: number | null
          penetrations: Json | null
          photos: string[] | null
          priority_level: string | null
          project_address: string
          project_id: string | null
          project_name: string
          ready_for_handoff: boolean | null
          recommendations: string | null
          roof_age_years: number | null
          roof_drains: Json | null
          roof_hatches: number | null
          roof_slope: string | null
          skylights: number | null
          skylights_detailed: Json | null
          sow_generated: boolean | null
          sow_generation_count: number | null
          sow_id: string | null
          special_requirements: string | null
          square_footage: number | null
          state: string | null
          status: string | null
          takeoff_items: Json | null
          updated_at: string | null
          upgraded_lighting: boolean | null
          weather_conditions: string | null
          wind_speed: number | null
          zip_code: string | null
        }
        Insert: {
          access_method?: string | null
          asce_requirements?: Json | null
          asce_version?: string | null
          building_classification?: string | null
          building_height?: number | null
          building_length?: number | null
          building_width?: number | null
          city?: string | null
          completed?: boolean | null
          completed_at?: string | null
          concerns?: string | null
          conditions?: Json | null
          conduit_attached?: boolean | null
          county?: string | null
          cover_board_type?: string | null
          created_at?: string | null
          curbs_above_8?: boolean | null
          customer_name?: string | null
          customer_phone?: string | null
          deck_type?: string | null
          drainage_options?: Json | null
          existing_membrane_condition?: number | null
          existing_membrane_type?: string | null
          exposure_category?: string | null
          gas_line_penetrating_deck?: boolean | null
          handoff_notes?: string | null
          hvac_units?: Json | null
          id?: string
          inspection_date?: string | null
          inspector_id?: string | null
          inspector_name: string
          insulation_condition?: string | null
          insulation_layers?: Json | null
          insulation_type?: string | null
          interior_fall_protection?: boolean | null
          interior_protection_needed?: boolean | null
          interior_protection_sqft?: number | null
          measurements?: Json | null
          notes?: string | null
          number_of_stories?: number | null
          observations?: Json | null
          overall_condition?: number | null
          penetrations?: Json | null
          photos?: string[] | null
          priority_level?: string | null
          project_address: string
          project_id?: string | null
          project_name: string
          ready_for_handoff?: boolean | null
          recommendations?: string | null
          roof_age_years?: number | null
          roof_drains?: Json | null
          roof_hatches?: number | null
          roof_slope?: string | null
          skylights?: number | null
          skylights_detailed?: Json | null
          sow_generated?: boolean | null
          sow_generation_count?: number | null
          sow_id?: string | null
          special_requirements?: string | null
          square_footage?: number | null
          state?: string | null
          status?: string | null
          takeoff_items?: Json | null
          updated_at?: string | null
          upgraded_lighting?: boolean | null
          weather_conditions?: string | null
          wind_speed?: number | null
          zip_code?: string | null
        }
        Update: {
          access_method?: string | null
          asce_requirements?: Json | null
          asce_version?: string | null
          building_classification?: string | null
          building_height?: number | null
          building_length?: number | null
          building_width?: number | null
          city?: string | null
          completed?: boolean | null
          completed_at?: string | null
          concerns?: string | null
          conditions?: Json | null
          conduit_attached?: boolean | null
          county?: string | null
          cover_board_type?: string | null
          created_at?: string | null
          curbs_above_8?: boolean | null
          customer_name?: string | null
          customer_phone?: string | null
          deck_type?: string | null
          drainage_options?: Json | null
          existing_membrane_condition?: number | null
          existing_membrane_type?: string | null
          exposure_category?: string | null
          gas_line_penetrating_deck?: boolean | null
          handoff_notes?: string | null
          hvac_units?: Json | null
          id?: string
          inspection_date?: string | null
          inspector_id?: string | null
          inspector_name?: string
          insulation_condition?: string | null
          insulation_layers?: Json | null
          insulation_type?: string | null
          interior_fall_protection?: boolean | null
          interior_protection_needed?: boolean | null
          interior_protection_sqft?: number | null
          measurements?: Json | null
          notes?: string | null
          number_of_stories?: number | null
          observations?: Json | null
          overall_condition?: number | null
          penetrations?: Json | null
          photos?: string[] | null
          priority_level?: string | null
          project_address?: string
          project_id?: string | null
          project_name?: string
          ready_for_handoff?: boolean | null
          recommendations?: string | null
          roof_age_years?: number | null
          roof_drains?: Json | null
          roof_hatches?: number | null
          roof_slope?: string | null
          skylights?: number | null
          skylights_detailed?: Json | null
          sow_generated?: boolean | null
          sow_generation_count?: number | null
          sow_id?: string | null
          special_requirements?: string | null
          square_footage?: number | null
          state?: string | null
          status?: string | null
          takeoff_items?: Json | null
          updated_at?: string | null
          upgraded_lighting?: boolean | null
          weather_conditions?: string | null
          wind_speed?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      gcp_config: {
        Row: {
          created_at: string
          gc_p_value: number
          id: string
          roof_type: string
          updated_at: string
          zone: string
        }
        Insert: {
          created_at?: string
          gc_p_value: number
          id?: string
          roof_type: string
          updated_at?: string
          zone: string
        }
        Update: {
          created_at?: string
          gc_p_value?: number
          id?: string
          roof_type?: string
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
      project_comments: {
        Row: {
          comment: string
          comment_type: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          project_id: string
          stage: Database["public"]["Enums"]["workflow_stage_enum"] | null
          user_id: string
        }
        Insert: {
          comment: string
          comment_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
          stage?: Database["public"]["Enums"]["workflow_stage_enum"] | null
          user_id: string
        }
        Update: {
          comment?: string
          comment_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
          stage?: Database["public"]["Enums"]["workflow_stage_enum"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_handoffs: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          from_stage: Database["public"]["Enums"]["workflow_stage_enum"]
          from_user_id: string | null
          handoff_data: Json | null
          id: string
          notes: string | null
          project_id: string
          to_stage: Database["public"]["Enums"]["workflow_stage_enum"]
          to_user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          from_stage: Database["public"]["Enums"]["workflow_stage_enum"]
          from_user_id?: string | null
          handoff_data?: Json | null
          id?: string
          notes?: string | null
          project_id: string
          to_stage: Database["public"]["Enums"]["workflow_stage_enum"]
          to_user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          from_stage?: Database["public"]["Enums"]["workflow_stage_enum"]
          from_user_id?: string | null
          handoff_data?: Json | null
          id?: string
          notes?: string | null
          project_id?: string
          to_stage?: Database["public"]["Enums"]["workflow_stage_enum"]
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_handoffs_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_handoffs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_handoffs_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string
          assigned_consultant: string | null
          assigned_engineer: string | null
          assigned_inspector: string | null
          building_height: number | null
          company_name: string | null
          cover_board_thickness: number | null
          cover_board_type: string | null
          created_at: string
          current_stage:
            | Database["public"]["Enums"]["workflow_stage_enum"]
            | null
          deck_type: string | null
          document_attachment: Json | null
          downspouts: number | null
          drain_types: string[] | null
          elevation: number | null
          existing_insulation_condition: string | null
          expansion_joints: number | null
          exposure_category: string | null
          gutter_type: string | null
          has_existing_insulation: boolean | null
          hvac_units: number | null
          id: string
          insulation_r_value: number | null
          insulation_thickness: number | null
          insulation_type: string | null
          length: number | null
          membrane_color: string | null
          membrane_thickness: string | null
          number_of_drains: number | null
          number_of_penetrations: number | null
          parapet_height: number | null
          penetration_types: string[] | null
          project_name: string
          project_type: string | null
          roof_configuration: string | null
          roof_hatches: number | null
          roof_slope: number | null
          skylights: number | null
          square_footage: number | null
          stage_data: Json | null
          updated_at: string
          user_id: string
          walkway_pad_requested: boolean | null
          width: number | null
          workflow_status: Json | null
        }
        Insert: {
          address: string
          assigned_consultant?: string | null
          assigned_engineer?: string | null
          assigned_inspector?: string | null
          building_height?: number | null
          company_name?: string | null
          cover_board_thickness?: number | null
          cover_board_type?: string | null
          created_at?: string
          current_stage?:
            | Database["public"]["Enums"]["workflow_stage_enum"]
            | null
          deck_type?: string | null
          document_attachment?: Json | null
          downspouts?: number | null
          drain_types?: string[] | null
          elevation?: number | null
          existing_insulation_condition?: string | null
          expansion_joints?: number | null
          exposure_category?: string | null
          gutter_type?: string | null
          has_existing_insulation?: boolean | null
          hvac_units?: number | null
          id?: string
          insulation_r_value?: number | null
          insulation_thickness?: number | null
          insulation_type?: string | null
          length?: number | null
          membrane_color?: string | null
          membrane_thickness?: string | null
          number_of_drains?: number | null
          number_of_penetrations?: number | null
          parapet_height?: number | null
          penetration_types?: string[] | null
          project_name: string
          project_type?: string | null
          roof_configuration?: string | null
          roof_hatches?: number | null
          roof_slope?: number | null
          skylights?: number | null
          square_footage?: number | null
          stage_data?: Json | null
          updated_at?: string
          user_id: string
          walkway_pad_requested?: boolean | null
          width?: number | null
          workflow_status?: Json | null
        }
        Update: {
          address?: string
          assigned_consultant?: string | null
          assigned_engineer?: string | null
          assigned_inspector?: string | null
          building_height?: number | null
          company_name?: string | null
          cover_board_thickness?: number | null
          cover_board_type?: string | null
          created_at?: string
          current_stage?:
            | Database["public"]["Enums"]["workflow_stage_enum"]
            | null
          deck_type?: string | null
          document_attachment?: Json | null
          downspouts?: number | null
          drain_types?: string[] | null
          elevation?: number | null
          existing_insulation_condition?: string | null
          expansion_joints?: number | null
          exposure_category?: string | null
          gutter_type?: string | null
          has_existing_insulation?: boolean | null
          hvac_units?: number | null
          id?: string
          insulation_r_value?: number | null
          insulation_thickness?: number | null
          insulation_type?: string | null
          length?: number | null
          membrane_color?: string | null
          membrane_thickness?: string | null
          number_of_drains?: number | null
          number_of_penetrations?: number | null
          parapet_height?: number | null
          penetration_types?: string[] | null
          project_name?: string
          project_type?: string | null
          roof_configuration?: string | null
          roof_hatches?: number | null
          roof_slope?: number | null
          skylights?: number | null
          square_footage?: number | null
          stage_data?: Json | null
          updated_at?: string
          user_id?: string
          walkway_pad_requested?: boolean | null
          width?: number | null
          workflow_status?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_consultant_fkey"
            columns: ["assigned_consultant"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_assigned_engineer_fkey"
            columns: ["assigned_engineer"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_assigned_inspector_fkey"
            columns: ["assigned_inspector"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sow_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          sow_generation_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          sow_generation_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          sow_generation_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sow_audit_log_sow_generation_id_fkey"
            columns: ["sow_generation_id"]
            isOneToOne: false
            referencedRelation: "sow_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      sow_generations: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_mime_type: string | null
          file_size_bytes: number | null
          generation_completed_at: string | null
          generation_duration_seconds: number | null
          generation_started_at: string | null
          generation_status: string | null
          id: string
          input_data: Json
          inspection_id: string | null
          output_file_path: string | null
          template_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_mime_type?: string | null
          file_size_bytes?: number | null
          generation_completed_at?: string | null
          generation_duration_seconds?: number | null
          generation_started_at?: string | null
          generation_status?: string | null
          id?: string
          input_data: Json
          inspection_id?: string | null
          output_file_path?: string | null
          template_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_mime_type?: string | null
          file_size_bytes?: number | null
          generation_completed_at?: string | null
          generation_duration_seconds?: number | null
          generation_started_at?: string | null
          generation_status?: string | null
          id?: string
          input_data?: Json
          inspection_id?: string | null
          output_file_path?: string | null
          template_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sow_generations_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "field_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sow_generations_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "sow_generation_data"
            referencedColumns: ["id"]
          },
        ]
      }
      sow_outputs: {
        Row: {
          asce_version: string | null
          created_at: string
          engineering_summary: Json | null
          file_size: number | null
          file_url: string | null
          filename: string | null
          generation_time_ms: number | null
          hvhz: boolean | null
          id: string
          key_issues: string[] | null
          manufacturer: string | null
          metadata: Json | null
          penetration_depth: string | null
          project_id: string
          rationale: string | null
          spacing_corner: string | null
          spacing_field: string | null
          takeoff_risk: string | null
          template_name: string | null
          wind_speed: number | null
          zone1_field: number | null
          zone2_perimeter: number | null
          zone3_corner: number | null
        }
        Insert: {
          asce_version?: string | null
          created_at?: string
          engineering_summary?: Json | null
          file_size?: number | null
          file_url?: string | null
          filename?: string | null
          generation_time_ms?: number | null
          hvhz?: boolean | null
          id?: string
          key_issues?: string[] | null
          manufacturer?: string | null
          metadata?: Json | null
          penetration_depth?: string | null
          project_id: string
          rationale?: string | null
          spacing_corner?: string | null
          spacing_field?: string | null
          takeoff_risk?: string | null
          template_name?: string | null
          wind_speed?: number | null
          zone1_field?: number | null
          zone2_perimeter?: number | null
          zone3_corner?: number | null
        }
        Update: {
          asce_version?: string | null
          created_at?: string
          engineering_summary?: Json | null
          file_size?: number | null
          file_url?: string | null
          filename?: string | null
          generation_time_ms?: number | null
          hvhz?: boolean | null
          id?: string
          key_issues?: string[] | null
          manufacturer?: string | null
          metadata?: Json | null
          penetration_depth?: string | null
          project_id?: string
          rationale?: string | null
          spacing_corner?: string | null
          spacing_field?: string | null
          takeoff_risk?: string | null
          template_name?: string | null
          wind_speed?: number | null
          zone1_field?: number | null
          zone2_perimeter?: number | null
          zone3_corner?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sow_outputs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sow_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          template_data: Json
          template_type: string
          version: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_data: Json
          template_type: string
          version: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_data?: Json
          template_type?: string
          version?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          permissions: string[] | null
          phone: string | null
          preferences: Json | null
          role: Database["public"]["Enums"]["user_role_enum"]
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          permissions?: string[] | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role_enum"]
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          permissions?: string[] | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          data_changes: Json | null
          id: string
          metadata: Json | null
          notes: string | null
          project_id: string
          stage_from: Database["public"]["Enums"]["workflow_stage_enum"] | null
          stage_to: Database["public"]["Enums"]["workflow_stage_enum"] | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          data_changes?: Json | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          project_id: string
          stage_from?: Database["public"]["Enums"]["workflow_stage_enum"] | null
          stage_to?: Database["public"]["Enums"]["workflow_stage_enum"] | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          data_changes?: Json | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          project_id?: string
          stage_from?: Database["public"]["Enums"]["workflow_stage_enum"] | null
          stage_to?: Database["public"]["Enums"]["workflow_stage_enum"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_engineering_config: {
        Row: {
          description: string | null
          key: string | null
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          description?: string | null
          key?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          description?: string | null
          key?: string | null
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      dashboard_metrics_cache: {
        Row: {
          avg_generation_time: number | null
          completed_sows: number | null
          inspections_this_week: number | null
          last_updated: string | null
          pending_sows: number | null
          sows_this_week: number | null
          total_inspections: number | null
        }
        Relationships: []
      }
      sow_generation_data: {
        Row: {
          access_method: string | null
          asce_approval_date: string | null
          asce_approval_engineer: string | null
          asce_engineer_approved: boolean | null
          asce_requirements: Json | null
          asce_version: string | null
          building_classification: string | null
          building_height: number | null
          building_length: number | null
          building_width: number | null
          city: string | null
          completed: boolean | null
          completed_at: string | null
          concerns: string | null
          conditions: Json | null
          conduit_attached: boolean | null
          county: string | null
          cover_board_type: string | null
          created_at: string | null
          curbs_above_8: boolean | null
          customer_name: string | null
          customer_phone: string | null
          deck_type: string | null
          drainage_options: Json | null
          existing_membrane_condition: number | null
          existing_membrane_type: string | null
          exposure_category: string | null
          gas_line_penetrating_deck: boolean | null
          handoff_notes: string | null
          hvac_units: Json | null
          id: string | null
          inspection_date: string | null
          inspector_id: string | null
          inspector_name: string | null
          insulation_condition: string | null
          insulation_layers: Json | null
          insulation_type: string | null
          interior_fall_protection: boolean | null
          interior_protection_needed: boolean | null
          interior_protection_sqft: number | null
          measurements: Json | null
          notes: string | null
          number_of_stories: number | null
          observations: Json | null
          overall_condition: number | null
          penetrations: Json | null
          photos: string[] | null
          priority_level: string | null
          project_address: string | null
          project_asce_version: string | null
          project_building_classification: string | null
          project_city: string | null
          project_county: string | null
          project_exposure_category: string | null
          project_id: string | null
          project_name: string | null
          project_state: string | null
          project_wind_speed: number | null
          project_zip: string | null
          ready_for_handoff: boolean | null
          recommendations: string | null
          roof_age_years: number | null
          roof_drains: Json | null
          roof_hatches: number | null
          roof_slope: string | null
          skylights: number | null
          skylights_detailed: Json | null
          sow_generated: boolean | null
          sow_generation_count: number | null
          sow_id: string | null
          special_requirements: string | null
          square_footage: number | null
          state: string | null
          status: string | null
          takeoff_items: Json | null
          updated_at: string | null
          upgraded_lighting: boolean | null
          weather_conditions: string | null
          wind_speed: number | null
          zip_code: string | null
        }
        Insert: {
          access_method?: string | null
          asce_approval_date?: never
          asce_approval_engineer?: never
          asce_engineer_approved?: never
          asce_requirements?: Json | null
          asce_version?: string | null
          building_classification?: string | null
          building_height?: number | null
          building_length?: number | null
          building_width?: number | null
          city?: string | null
          completed?: boolean | null
          completed_at?: string | null
          concerns?: string | null
          conditions?: Json | null
          conduit_attached?: boolean | null
          county?: string | null
          cover_board_type?: string | null
          created_at?: string | null
          curbs_above_8?: boolean | null
          customer_name?: string | null
          customer_phone?: string | null
          deck_type?: string | null
          drainage_options?: Json | null
          existing_membrane_condition?: number | null
          existing_membrane_type?: string | null
          exposure_category?: string | null
          gas_line_penetrating_deck?: boolean | null
          handoff_notes?: string | null
          hvac_units?: Json | null
          id?: string | null
          inspection_date?: string | null
          inspector_id?: string | null
          inspector_name?: string | null
          insulation_condition?: string | null
          insulation_layers?: Json | null
          insulation_type?: string | null
          interior_fall_protection?: boolean | null
          interior_protection_needed?: boolean | null
          interior_protection_sqft?: number | null
          measurements?: Json | null
          notes?: string | null
          number_of_stories?: number | null
          observations?: Json | null
          overall_condition?: number | null
          penetrations?: Json | null
          photos?: string[] | null
          priority_level?: string | null
          project_address?: string | null
          project_asce_version?: never
          project_building_classification?: never
          project_city?: never
          project_county?: never
          project_exposure_category?: never
          project_id?: string | null
          project_name?: string | null
          project_state?: never
          project_wind_speed?: never
          project_zip?: never
          ready_for_handoff?: boolean | null
          recommendations?: string | null
          roof_age_years?: number | null
          roof_drains?: Json | null
          roof_hatches?: number | null
          roof_slope?: string | null
          skylights?: number | null
          skylights_detailed?: Json | null
          sow_generated?: boolean | null
          sow_generation_count?: number | null
          sow_id?: string | null
          special_requirements?: string | null
          square_footage?: number | null
          state?: string | null
          status?: string | null
          takeoff_items?: Json | null
          updated_at?: string | null
          upgraded_lighting?: boolean | null
          weather_conditions?: string | null
          wind_speed?: number | null
          zip_code?: string | null
        }
        Update: {
          access_method?: string | null
          asce_approval_date?: never
          asce_approval_engineer?: never
          asce_engineer_approved?: never
          asce_requirements?: Json | null
          asce_version?: string | null
          building_classification?: string | null
          building_height?: number | null
          building_length?: number | null
          building_width?: number | null
          city?: string | null
          completed?: boolean | null
          completed_at?: string | null
          concerns?: string | null
          conditions?: Json | null
          conduit_attached?: boolean | null
          county?: string | null
          cover_board_type?: string | null
          created_at?: string | null
          curbs_above_8?: boolean | null
          customer_name?: string | null
          customer_phone?: string | null
          deck_type?: string | null
          drainage_options?: Json | null
          existing_membrane_condition?: number | null
          existing_membrane_type?: string | null
          exposure_category?: string | null
          gas_line_penetrating_deck?: boolean | null
          handoff_notes?: string | null
          hvac_units?: Json | null
          id?: string | null
          inspection_date?: string | null
          inspector_id?: string | null
          inspector_name?: string | null
          insulation_condition?: string | null
          insulation_layers?: Json | null
          insulation_type?: string | null
          interior_fall_protection?: boolean | null
          interior_protection_needed?: boolean | null
          interior_protection_sqft?: number | null
          measurements?: Json | null
          notes?: string | null
          number_of_stories?: number | null
          observations?: Json | null
          overall_condition?: number | null
          penetrations?: Json | null
          photos?: string[] | null
          priority_level?: string | null
          project_address?: string | null
          project_asce_version?: never
          project_building_classification?: never
          project_city?: never
          project_county?: never
          project_exposure_category?: never
          project_id?: string | null
          project_name?: string | null
          project_state?: never
          project_wind_speed?: never
          project_zip?: never
          ready_for_handoff?: boolean | null
          recommendations?: string | null
          roof_age_years?: number | null
          roof_drains?: Json | null
          roof_hatches?: number | null
          roof_slope?: string | null
          skylights?: number | null
          skylights_detailed?: Json | null
          sow_generated?: boolean | null
          sow_generation_count?: number | null
          sow_id?: string | null
          special_requirements?: string | null
          square_footage?: number | null
          state?: string | null
          status?: string | null
          takeoff_items?: Json | null
          updated_at?: string | null
          upgraded_lighting?: boolean | null
          weather_conditions?: string | null
          wind_speed?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      archive_old_sows: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_database_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      log_performance_metric: {
        Args: {
          p_metric_name: string
          p_metric_value: number
          p_details?: Json
        }
        Returns: undefined
      }
      refresh_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_asce_requirements: {
        Args: { requirements: Json }
        Returns: boolean
      }
    }
    Enums: {
      user_role_enum: "inspector" | "consultant" | "engineer" | "admin"
      workflow_stage_enum:
        | "inspection"
        | "consultant_review"
        | "engineering"
        | "complete"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role_enum: ["inspector", "consultant", "engineer", "admin"],
      workflow_stage_enum: [
        "inspection",
        "consultant_review",
        "engineering",
        "complete",
      ],
    },
  },
} as const
