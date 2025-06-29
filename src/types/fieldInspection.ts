export interface HVACUnit {
  id: string;
  description: string;
  quantity: number;
  condition: string;
  needs_curb_adapter?: boolean;
}

export interface RoofDrain {
  id: string;
  type: string;
  quantity: number;
  condition: string;
  location?: string;
}

export interface Penetration {
  id: string;
  type: string;
  quantity: number;
  condition: string;
  description?: string;
}

export interface SkylightEquipment {
  id: string;
  description: string;
  quantity: number;
  condition: string;
  curb_condition?: string;
  glazing_condition?: string;
  leaks?: boolean;
}

export interface AccessPointEquipment {
  id: string;
  type: string;
  description: string;
  quantity: number;
  condition: string;
  location?: string;
  size?: string;
}

export interface HVACEquipment {
  id: string;
  description: string;
  quantity: number;
  condition: string;
  mounting_type?: string;
  refrigerant_lines_condition?: string;
  electrical_connections_condition?: string;
  curb_condition?: string;
  clearances?: string;
}

interface RoofLayer {
  id: string;
  type: 'membrane' | 'insulation' | 'deck' | 'barrier' | 'coverboard';
  description: string;
  attachment: 'mechanically_attached' | 'adhered' | 'ballasted' | 'welded';
  thickness: string;
  material?: string;
}

export interface FieldInspection {
  id?: string;
  project_name: string;
  project_address: string;
  inspector_name: string;
  inspection_date?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Under Review';
  priority_level: 'Low' | 'Standard' | 'High' | 'Urgent';
  weather_conditions: 'Clear' | 'Cloudy' | 'Light Rain' | 'Heavy Rain' | 'Snow' | 'Wind' | 'Other';
  temperature?: number;
  wind_speed?: number;
  access_method: 'ladder' | 'internal_hatch' | 'external_stairs' | 'crane' | 'other';
  safety_concerns?: string;

  // Enhanced roof assembly configuration
  roof_assembly_layers?: RoofLayer[];
  project_type?: 'tearoff' | 'recover' | 'new';
  recover_type?: string;
  original_membrane_type?: string;

  // Legacy fields (kept for backward compatibility)
  deck_type?: string;
  existing_membrane_type?: string;
  insulation_type?: string;
  roof_slope?: string;
  insulation_condition?: string;
  existing_membrane_condition?: number;
  roof_age_years?: number;

  building_height?: number;
  building_length?: number;
  building_width?: number;
  square_footage?: number;
  number_of_stories?: number;
  parapet_height?: number;
  roof_configuration?: string;

  hvac_units?: HVACUnit[];
  roof_drains?: RoofDrain[];
  penetrations?: Penetration[];
  skylights?: number;
  roof_hatches?: number;
  overall_condition?: number;

  equipment_skylights?: SkylightEquipment[];
  equipment_access_points?: AccessPointEquipment[];
  equipment_hvac_units?: HVACEquipment[];

  drainage_primary_type?: 'Deck Drains' | 'Scuppers' | 'Gutters';
  drainage_overflow_type?: 'Deck Drains' | 'Scuppers' | 'Gutters';
  drainage_deck_drains_count?: number;
  drainage_deck_drains_diameter?: number;
  drainage_scuppers_count?: number;
  drainage_scuppers_length?: number;
  drainage_scuppers_width?: number;
  drainage_scuppers_height?: number;
  drainage_gutters_linear_feet?: number;
  drainage_gutters_height?: number;
  drainage_gutters_width?: number;
  drainage_gutters_depth?: number;
  drainage_condition?: string;
  drainage_additional_count?: number;
  drainage_additional_size?: string;
  drainage_additional_notes?: string;

  penetrations_gas_lines?: boolean;
  penetrations_conduit_attached?: boolean;
  curbs_8_inch_or_above?: boolean;
  side_discharge_units?: boolean;

  photos?: string[];
  completed?: boolean;
  ready_for_handoff?: boolean;

  city?: string;
  state?: string;
  zip_code?: string;

  notes?: string;
  concerns?: string;
  recommendations?: string;

  inspector_id?: string;
  engineer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;

  wind_speed_design?: number;
  exposure_category?: string;
  building_classification?: string;
}
