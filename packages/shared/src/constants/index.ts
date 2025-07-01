// Shared constants between frontend and backend

// Application constants
export const APP_NAME = 'Roof SOW Genesis';
export const APP_VERSION = '2.0.0';
export const API_VERSION = 'v1';

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  SOW: {
    GENERATE: '/api/sow/generate',
    HEALTH: '/api/sow/health',
    STATUS: '/api/status',
  },
  JURISDICTION: {
    ANALYZE: '/api/jurisdiction/analyze',
    LOOKUP: '/api/jurisdiction/lookup',
    GEOCODE: '/api/jurisdiction/geocode',
    CODES: '/api/jurisdiction/codes',
    VALIDATE: '/api/jurisdiction/validate',
    PRESSURE_TABLE: '/api/jurisdiction/pressure-table',
    DEBUG: '/api/jurisdiction/debug',
    HEALTH: '/api/jurisdiction/health',
  },
} as const;

// Status constants
export const INSPECTION_STATUSES = {
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

export const WEATHER_CONDITIONS = {
  CLEAR: 'Clear',
  CLOUDY: 'Cloudy',
  LIGHT_RAIN: 'Light Rain',
  HEAVY_RAIN: 'Heavy Rain',
  SNOW: 'Snow',
  WIND: 'Wind',
  OTHER: 'Other',
} as const;

// Roofing constants
export const MEMBRANE_TYPES = {
  TPO: 'TPO',
  EPDM: 'EPDM',
  PVC: 'PVC',
  MODIFIED_BITUMEN: 'Modified Bitumen',
  BUILT_UP: 'Built-Up',
  METAL: 'Metal',
} as const;

export const DECK_TYPES = {
  STEEL: 'Steel',
  CONCRETE: 'Concrete',
  WOOD: 'Wood',
  GYPSUM: 'Gypsum',
  LIGHTWEIGHT_CONCRETE: 'Lightweight Concrete',
} as const;

export const PROJECT_TYPES = {
  TEAROFF: 'Tearoff',
  RECOVER: 'Recover',
  NEW: 'New Construction',
  REPAIR: 'Repair',
} as const;

export const ATTACHMENT_METHODS = {
  MECHANICALLY_ATTACHED: 'Mechanically Attached',
  FULLY_ADHERED: 'Fully Adhered',
  BALLASTED: 'Ballasted',
  HYBRID: 'Hybrid',
} as const;

// ASCE constants
export const ASCE_VERSIONS = {
  ASCE_7_10: '7-10',
  ASCE_7_16: '7-16',
  ASCE_7_22: '7-22',
} as const;

export const EXPOSURE_CATEGORIES = {
  B: 'B',
  C: 'C',
  D: 'D',
} as const;

export const RISK_CATEGORIES = {
  I: 'I',
  II: 'II',
  III: 'III',
  IV: 'IV',
} as const;

// File constants
export const SUPPORTED_FILE_TYPES = {
  PDF: 'application/pdf',
  CSV: 'text/csv',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  EXCEL_LEGACY: 'application/vnd.ms-excel',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
} as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_PHOTOS = 20;

// Validation constants
export const VALIDATION_RULES = {
  PROJECT_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  PHONE: {
    REGEX: /^[\+]?[1-9][\d]{0,15}$/,
  },
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  ZIP_CODE: {
    REGEX: /^\d{5}(-\d{4})?$/,
  },
  BUILDING_HEIGHT: {
    MIN: 1,
    MAX: 2000,
  },
  SQUARE_FOOTAGE: {
    MIN: 100,
    MAX: 10000000,
  },
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  SOW_GENERATION_FAILED: 'SOW_GENERATION_FAILED',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  JURISDICTION_ANALYSIS_FAILED: 'JURISDICTION_ANALYSIS_FAILED',
} as const;

// Default values
export const DEFAULTS = {
  BUILDING_HEIGHT: 30,
  EXPOSURE_CATEGORY: 'C',
  WIND_SPEED: 140,
  ASCE_VERSION: '7-16',
  RISK_CATEGORY: 'II',
  IMPORTANCE_FACTOR: 1.0,
  PAGINATION: {
    PAGE: 1,
    LIMIT: 20,
  },
} as const;