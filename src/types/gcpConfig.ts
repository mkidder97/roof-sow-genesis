
export interface GCPConfig {
  id: string;
  roof_type: string;
  zone: string;
  gc_p_value: number;
  created_at: string;
  updated_at: string;
}

export interface GCPConfigFormData {
  roof_type: string;
  zone: string;
  gc_p_value: number;
}

export const ROOF_TYPES = [
  'Built-up',
  'Single-ply membrane',
  'Modified bitumen',
  'Metal',
  'Shingles',
  'Tile',
  'Other'
] as const;

export const ZONES = [
  'Zone 1 - Field',
  'Zone 2 - Perimeter',
  'Zone 3 - Corner'
] as const;
