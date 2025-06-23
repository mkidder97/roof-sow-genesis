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
      field_inspections: {
        Row: {
          access_method: string | null
          building_height: number | null
          building_length: number | null
          building_width: number | null
          completed_at: string | null
          conduit_attached: boolean | null
          cover_board_type: string | null
          created_at: string | null
          curbs_above_8: boolean | null
          customer_name: string | null
          customer_phone: string | null
          deck_type: string | null
          drainage_options: Json | null
          existing_membrane_condition: number | null
          existing_membrane_type: string | null
          gas_line_penetrating_deck: boolean | null
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
          notes: string | null
          number_of_stories: number | null
          overall_condition: number | null
          penetrations: Json | null
          photos: string[] | null
          priority_level: string | null
          project_address: string
          project_name: string
          roof_age_years: number | null
          roof_drains: Json | null
          roof_hatches: number | null
          roof_slope: string | null
          skylights: number | null
          skylights_detailed: Json | null
          sow_generated: boolean | null
          sow_id: string | null
          special_requirements: string | null
          square_footage: number | null
          status: string | null
          updated_at: string | null
          upgraded_lighting: boolean | null
          weather_conditions: string | null
        }
        Insert: {
          access_method?: string | null
          building_height?: number | null
          building_length?: number | null
          building_width?: number | null
          completed_at?: string | null
          conduit_attached?: boolean | null
          cover_board_type?: string | null
          created_at?: string | null
          curbs_above_8?: boolean | null
          customer_name?: string | null
          customer_phone?: string | null
          deck_type?: string | null
          drainage_options?: Json | null
          existing_membrane_condition?: number | null
          existing_membrane_type?: string | null
          gas_line_penetrating_deck?: boolean | null
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
          notes?: string | null
          number_of_stories?: number | null
          overall_condition?: number | null
          penetrations?: Json | null
          photos?: string[] | null
          priority_level?: string | null
          project_address: string
          project_name: string
          roof_age_years?: number | null
          roof_drains?: Json | null
          roof_hatches?: number | null
          roof_slope?: string | null
          skylights?: number | null
          skylights_detailed?: Json | null
          sow_generated?: boolean | null
          sow_id?: string | null
          special_requirements?: string | null
          square_footage?: number | null
          status?: string | null
          updated_at?: string | null
          upgraded_lighting?: boolean | null
          weather_conditions?: string | null
        }
        Update: {
          access_method?: string | null
          building_height?: number | null
          building_length?: number | null
          building_width?: number | null
          completed_at?: string | null
          conduit_attached?: boolean | null
          cover_board_type?: string | null
          created_at?: string | null
          curbs_above_8?: boolean | null
          customer_name?: string | null
          customer_phone?: string | null
          deck_type?: string | null
          drainage_options?: Json | null
          existing_membrane_condition?: number | null
          existing_membrane_type?: string | null
          gas_line_penetrating_deck?: boolean | null
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
          notes?: string | null
          number_of_stories?: number | null
          overall_condition?: number | null
          penetrations?: Json | null
          photos?: string[] | null
          priority_level?: string | null
          project_address?: string
          project_name?: string
          roof_age_years?: number | null
          roof_drains?: Json | null
          roof_hatches?: number | null
          roof_slope?: string | null
          skylights?: number | null
          skylights_detailed?: Json | null
          sow_generated?: boolean | null
          sow_id?: string | null
          special_requirements?: string | null
          square_footage?: number | null
          status?: string | null
          updated_at?: string | null
          upgraded_lighting?: boolean | null
          weather_conditions?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          address: string
          building_height: number | null
          company_name: string | null
          cover_board_thickness: number | null
          cover_board_type: string | null
          created_at: string
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
          updated_at: string
          user_id: string
          walkway_pad_requested: boolean | null
          width: number | null
        }
        Insert: {
          address: string
          building_height?: number | null
          company_name?: string | null
          cover_board_thickness?: number | null
          cover_board_type?: string | null
          created_at?: string
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
          updated_at?: string
          user_id: string
          walkway_pad_requested?: boolean | null
          width?: number | null
        }
        Update: {
          address?: string
          building_height?: number | null
          company_name?: string | null
          cover_board_thickness?: number | null
          cover_board_type?: string | null
          created_at?: string
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
          updated_at?: string
          user_id?: string
          walkway_pad_requested?: boolean | null
          width?: number | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
