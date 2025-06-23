
export interface FieldInspection {
  id?: string;
  inspector_name: string;
  inspector_id?: string;
  inspection_date: string;
  project_name: string;
  project_address: string;
  customer_name?: string;
  customer_phone?: string;
  building_height?: number;
  building_length?: number;
  building_width?: number;
  square_footage?: number;
  number_of_stories?: number;
  roof_slope?: string;
  deck_type?: string;
  existing_membrane_type?: string;
  existing_membrane_condition?: number;
  roof_age_years?: number;
  insulation_type?: string;
  insulation_condition?: string;
  insulation_layers?: InsulationLayer[];
  cover_board_type?: string;
  hvac_units?: HVACUnit[];
  roof_drains?: RoofDrain[];
  penetrations?: Penetration[];
  skylights?: number;
  roof_hatches?: number;
  overall_condition?: number;
  priority_level: 'Standard' | 'Expedited' | 'Emergency';
  special_requirements?: string;
  weather_conditions?: string;
  photos?: string[];
  notes?: string;
  status: 'Draft' | 'Completed' | 'Under Review' | 'Approved';
  sow_generated?: boolean;
  sow_id?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export interface InsulationLayer {
  id: string;
  type: string;
  thickness: number;
  description?: string;
}

export interface HVACUnit {
  type: string;
  count: number;
  condition: string;
}

export interface RoofDrain {
  type: string;
  count: number;
  condition: string;
}

export interface Penetration {
  type: string;
  count: number;
}

export interface InspectionFormStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

// Database row type that matches Supabase types exactly
export interface FieldInspectionRow {
  id: string;
  inspector_name: string;
  inspector_id: string | null;
  inspection_date: string | null;
  project_name: string;
  project_address: string;
  customer_name: string | null;
  customer_phone: string | null;
  building_height: number | null;
  building_length: number | null;
  building_width: number | null;
  square_footage: number | null;
  number_of_stories: number | null;
  roof_slope: string | null;
  deck_type: string | null;
  existing_membrane_type: string | null;
  existing_membrane_condition: number | null;
  roof_age_years: number | null;
  insulation_type: string | null;
  insulation_condition: string | null;
  insulation_layers: any; // JSON from database
  cover_board_type: string | null;
  hvac_units: any; // JSON from database
  roof_drains: any; // JSON from database
  penetrations: any; // JSON from database
  skylights: number | null;
  roof_hatches: number | null;
  overall_condition: number | null;
  priority_level: string | null;
  special_requirements: string | null;
  weather_conditions: string | null;
  photos: string[] | null;
  notes: string | null;
  status: string | null;
  sow_generated: boolean | null;
  sow_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
}
