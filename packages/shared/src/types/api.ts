// API-related types shared between frontend and backend

// Jurisdiction Analysis Types
export interface JurisdictionAnalysisRequest {
  address: string;
  buildingHeight?: number;
  exposureCategory?: string;
}

export interface JurisdictionAnalysisResponse {
  success: boolean;
  analysis?: any;
  metadata?: any;
  pressureTable?: any;
  compliance?: any;
  error?: string;
}

export interface QuickJurisdictionLookup {
  county: string;
  state: string;
}

export interface QuickJurisdictionResponse {
  codeCycle: string;
  asceVersion: string;
  hvhz: boolean;
}

// Wind Analysis Types
export interface WindAnalysisParams {
  buildingHeight: number;
  exposureCategory: string;
  latitude: number;
  longitude: number;
  elevation: number;
  asceVersion: '7-10' | '7-16' | '7-22';
}

export interface WindAnalysisResult {
  designWindSpeed: number;
  exposureCategory: string;
  elevation: number;
  zonePressures: {
    zone1Field: number;
    zone1Perimeter: number;
    zone2Perimeter: number;
    zone3Corner: number;
  };
}

// Health Check Types
export interface HealthCheckResponse {
  success: boolean;
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version?: string;
  components?: Record<string, string>;
  error?: string;
}

// API Response Wrappers
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}