
export interface GcpConfig {
  id: string;
  roof_type: string;
  zone: string;
  gc_p_value: number;
  created_at: string;
  updated_at: string;
}

export interface GcpConfigCreateInput {
  roof_type: string;
  zone: string;
  gc_p_value: number;
}

export interface GcpConfigUpdateInput extends Partial<GcpConfigCreateInput> {
  id: string;
}

export const ROOF_TYPES = [
  { value: 'low_slope', label: 'Low Slope' },
  { value: 'steep_slope', label: 'Steep Slope' }
] as const;

export const ZONES = [
  { value: 'field', label: 'Field' },
  { value: 'perimeter', label: 'Perimeter' },
  { value: 'corner', label: 'Corner' }
] as const;
