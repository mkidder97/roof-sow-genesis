// TypeScript interfaces for geographic and wind mapping services

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface JurisdictionInfo {
  county: string;
  state: string;
  country: string;
  city?: string;
  zipCode?: string;
  fips?: string; // Federal Information Processing Standards code
  timeZone?: string;
}

export interface HVHZZone {
  id: string;
  zoneName: string;
  county: string;
  state: string;
  zoneType: 'hvhz' | 'wbdr' | 'coastal' | 'inland';
  windSpeedBasic: number; // mph
  windSpeedUltimate?: number; // mph
  description?: string;
  effectiveDate: string;
  asceVersion: string;
}

export interface HVHZStatus {
  isHVHZ: boolean;
  isWBDR: boolean; // Wind-Borne Debris Region
  zone?: HVHZZone;
  alternativeZones?: HVHZZone[]; // Other applicable zones
}

export interface WindSpeedData {
  basicWindSpeed: number; // mph
  ultimateWindSpeed?: number; // mph
  exposureCategory: 'B' | 'C' | 'D';
  topographicFactor: number; // Kzt
  asceVersion: string;
  dataSource: 'hvhz_zones' | 'asce_scrape' | 'local_dataset' | 'interpolation';
  confidence: 'high' | 'medium' | 'low';
  zone?: HVHZZone;
  interpolationNote?: string;
}

export interface ASCEWindData {
  basicWindSpeed: number;
  riskCategory: 1 | 2 | 3 | 4;
  exposureCategory: 'B' | 'C' | 'D';
  topographicFactor: number;
  windDirectionalityFactor: number;
  importanceFactor: number;
  ultimateWindSpeed: number;
  allowableStressWindSpeed?: number;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  metadata: {
    asceVersion: string;
    dataSource: string;
    queryTimestamp: string;
    cacheExpiry?: string;
  };
}

export interface GeoServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  source: 'opencage' | 'internal' | 'supabase' | 'cache';
  timestamp: string;
}

export interface WindMapServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  source: 'asce_scrape' | 'local_dataset' | 'hvhz_zones' | 'interpolation';
  timestamp: string;
  confidence: 'high' | 'medium' | 'low';
}

// OpenCage Geocoding API Response Types
export interface OpenCageComponent {
  'ISO_3166-1_alpha-2'?: string;
  'ISO_3166-1_alpha-3'?: string;
  '_category'?: string;
  '_type'?: string;
  city?: string;
  continent?: string;
  country?: string;
  country_code?: string;
  county?: string;
  house_number?: string;
  neighbourhood?: string;
  postcode?: string;
  road?: string;
  state?: string;
  state_code?: string;
  suburb?: string;
  town?: string;
  village?: string;
}

export interface OpenCageGeometry {
  lat: number;
  lng: number;
}

export interface OpenCageResult {
  annotations: {
    DMS: {
      lat: string;
      lng: string;
    };
    MGRS: string;
    Maidenhead: string;
    Mercator: {
      x: number;
      y: number;
    };
    OSM: {
      edit_url: string;
      note_url: string;
      url: string;
    };
    UN_M49: {
      regions: {
        [key: string]: string;
      };
      statistical_groupings: string[];
    };
    callingcode: number;
    currency: {
      alternate_symbols: string[];
      decimal_mark: string;
      html_entity: string;
      iso_code: string;
      iso_numeric: string;
      name: string;
      smallest_denomination: number;
      subunit: string;
      subunit_to_unit: number;
      symbol: string;
      symbol_first: number;
      thousands_separator: string;
    };
    flag: string;
    geohash: string;
    qibla: number;
    roadinfo: {
      drive_on: string;
      road: string;
      speed_in: string;
    };
    sun: {
      rise: {
        apparent: number;
        astronomical: number;
        civil: number;
        nautical: number;
      };
      set: {
        apparent: number;
        astronomical: number;
        civil: number;
        nautical: number;
      };
    };
    timezone: {
      name: string;
      now_in_dst: number;
      offset_sec: number;
      offset_string: string;
      short_name: string;
    };
    what3words: {
      words: string;
    };
  };
  bounds: {
    northeast: {
      lat: number;
      lng: number;
    };
    southwest: {
      lat: number;
      lng: number;
    };
  };
  components: OpenCageComponent;
  confidence: number;
  formatted: string;
  geometry: OpenCageGeometry;
}

export interface OpenCageResponse {
  documentation: string;
  licenses: Array<{
    name: string;
    url: string;
  }>;
  rate: {
    limit: number;
    remaining: number;
    reset: number;
  };
  results: OpenCageResult[];
  status: {
    code: number;
    message: string;
  };
  stay_informed: {
    blog: string;
    twitter: string;
  };
  thanks: string;
  timestamp: {
    created_http: string;
    created_unix: number;
  };
  total_results: number;
}

// Service Configuration
export interface GeoServiceConfig {
  openCageApiKey?: string;
  cacheTimeout: number; // milliseconds
  maxRetries: number;
  rateLimitDelay: number; // milliseconds
  enableFallback: boolean;
}

export interface WindMapServiceConfig {
  asceBaseUrl: string;
  enableScraping: boolean;
  cacheTimeout: number; // milliseconds
  maxRetries: number;
  fallbackToDatabase: boolean;
  interpolationEnabled: boolean;
}

// Cache-related interfaces
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  source: string;
}

export interface GeoCacheKey {
  type: 'reverse' | 'forward';
  lat?: number;
  lng?: number;
  address?: string;
}

export interface WindCacheKey {
  lat: number;
  lng: number;
  asceVersion: string;
}

// Error types
export interface GeoServiceError {
  code: 'RATE_LIMIT' | 'API_ERROR' | 'NETWORK_ERROR' | 'INVALID_COORDINATES' | 'NO_RESULTS' | 'QUOTA_EXCEEDED';
  message: string;
  details?: any;
  retryAfter?: number;
}

export interface WindServiceError {
  code: 'SCRAPE_FAILED' | 'INVALID_COORDINATES' | 'NO_DATA' | 'ASCE_UNAVAILABLE' | 'INTERPOLATION_FAILED';
  message: string;
  details?: any;
  suggestion?: string;
}

// Database record interfaces
export interface HVHZZoneRecord {
  id: string;
  zone_name: string;
  county: string;
  state: string;
  zone_type: string;
  wind_speed_basic: number;
  wind_speed_ultimate?: number;
  bbox_north: number;
  bbox_south: number;
  bbox_east: number;
  bbox_west: number;
  description?: string;
  effective_date: string;
  asce_version: string;
  created_at: string;
  updated_at: string;
}

// Function result types from PostgreSQL
export interface PostgresHVHZResult {
  in_hvhz: boolean;
  zone_info: Record<string, any>;
}

export interface PostgresWindSpeedResult {
  wind_speed_basic: number;
  wind_speed_ultimate: number;
  zone_info: Record<string, any>;
}