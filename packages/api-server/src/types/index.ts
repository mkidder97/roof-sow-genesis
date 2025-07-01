// Re-export shared types for backward compatibility
// This file ensures existing imports continue to work during migration

export * from '@roof-sow-genesis/shared';

// Legacy exports for backward compatibility
export type {
  JurisdictionAnalysisRequest,
  JurisdictionAnalysisResponse,
  QuickJurisdictionLookup,
  QuickJurisdictionResponse,
  WindAnalysisParams,
  WindAnalysisResult,
  HealthCheckResponse,
  ApiResponse
} from '@roof-sow-genesis/shared';