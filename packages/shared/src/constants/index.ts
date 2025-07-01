// Constants for roof SOW generation system

export const API_ENDPOINTS = {
  SOW_GENERATE: '/api/sow/generate',
  SOW_STATUS: '/api/sow/status',
  FIELD_INSPECTIONS: '/api/field-inspections',
  HEALTH: '/api/health',
} as const;

export const ROOF_TYPES = {
  LOW_SLOPE: 'low_slope',
  STEEP_SLOPE: 'steep_slope',
} as const;

export const WIND_ZONES = {
  FIELD: 'field',
  PERIMETER: 'perimeter', 
  CORNER: 'corner',
} as const;

export const BUILDING_CLASSIFICATIONS = {
  I: 'I',
  II: 'II',
  III: 'III',
  IV: 'IV',
} as const;

export const INSPECTION_STATUS = {
  DRAFT: 'Draft',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  UNDER_REVIEW: 'Under Review',
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'Low',
  STANDARD: 'Standard', 
  HIGH: 'High',
  URGENT: 'Urgent',
} as const;

// Add more constants as we move them from the current structure
