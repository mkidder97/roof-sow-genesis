
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
