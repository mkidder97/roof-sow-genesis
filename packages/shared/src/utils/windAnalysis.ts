// Wind Analysis Calculation Utilities
// These pure functions can be used by both frontend and backend

export interface WindZonePressures {
  zone1Field: number;
  zone1Perimeter: number;
  zone2Perimeter: number;
  zone3Corner: number;
}

export interface WindFactors {
  velocityPressureConstant: number;
  Kd: number; // Directionality factor
  internalPressureCoeff: number;
}

/**
 * Get basic wind speed based on geographic coordinates
 * Enhanced wind speed map based on geographic regions
 */
export function getBasicWindSpeed(lat: number, lng: number): number {
  // Florida HVHZ (High Velocity Hurricane Zone)
  if (lat >= 24.0 && lat <= 27.0 && lng >= -82.0 && lng <= -79.5) {
    return 180;
  }
  
  // Gulf Coast (High wind areas)
  if (lat >= 25.0 && lat <= 30.5 && lng >= -98.0 && lng <= -80.0) {
    return 160;
  }
  
  // Atlantic Coast (Moderate-High wind)
  if (lat >= 32.0 && lat <= 42.0 && lng >= -81.0 && lng <= -75.0) {
    return 150;
  }
  
  // Default for most inland areas
  return 140;
}

/**
 * Get ASCE wind factors based on version
 */
export function getASCEWindFactors(asceVersion: '7-10' | '7-16' | '7-22'): WindFactors {
  // Base factors (consistent across versions for most cases)
  const baseFactors: WindFactors = {
    velocityPressureConstant: 0.00256,
    Kd: 0.85, // Buildings
    internalPressureCoeff: 0.18
  };
  
  // Version-specific adjustments could be added here
  switch (asceVersion) {
    case '7-22':
      // Future version adjustments
      return { ...baseFactors, Kd: 0.85 };
    case '7-16':
      return baseFactors;
    case '7-10':
      // Older version might have slight differences
      return { ...baseFactors, velocityPressureConstant: 0.00256 };
    default:
      return baseFactors;
  }
}

/**
 * Calculate velocity pressure coefficient based on height and exposure
 */
export function getVelocityPressureCoefficient(
  height: number, 
  exposure: string, 
  asceVersion: '7-10' | '7-16' | '7-22'
): number {
  // Minimum effective height per ASCE
  const z = Math.max(height, 15);
  
  // Base case for minimum height
  if (z <= 15) return 0.85;
  
  // Exposure category coefficients
  let alpha: number;
  let zg: number; // Gradient height
  
  switch (exposure.toUpperCase()) {
    case 'B': // Urban/suburban
      alpha = 0.143;
      zg = 365;
      break;
    case 'C': // Open terrain
      alpha = 0.182;
      zg = 274;
      break;
    case 'D': // Flat, unobstructed areas
      alpha = 0.25;
      zg = 213;
      break;
    default:
      alpha = 0.182; // Default to C
      zg = 274;
  }
  
  // ASCE formula for velocity pressure coefficient
  return 0.85 * Math.pow(z / 33, alpha);
}

/**
 * Get topographic factor based on elevation
 */
export function getTopographicFactor(
  elevation: number, 
  asceVersion: '7-10' | '7-16' | '7-22'
): number {
  // Simplified topographic factor
  // In practice, this would require detailed topographic analysis
  
  if (elevation > 3000) {
    return 1.20; // High elevation areas
  } else if (elevation > 1500) {
    return 1.10; // Moderate elevation
  } else {
    return 1.0; // Sea level/low elevation
  }
}

/**
 * Calculate zone pressures using ASCE methodology
 */
export function calculateZonePressures(
  qh: number, 
  GCp: Record<string, number>, 
  asceVersion: '7-10' | '7-16' | '7-22',
  internalPressureCoeff = 0.18
): WindZonePressures {
  const GCpi = internalPressureCoeff;
  
  return {
    zone1Field: qh * (GCp.zone1Field - GCpi),
    zone1Perimeter: qh * (GCp.zone1Perimeter - GCpi),
    zone2Perimeter: qh * (GCp.zone2Perimeter - GCpi),
    zone3Corner: qh * (GCp.zone3Corner - GCpi)
  };
}

/**
 * Calculate velocity pressure (qh) using ASCE formula
 */
export function calculateVelocityPressure(
  basicWindSpeed: number,
  buildingHeight: number,
  exposureCategory: string,
  elevation: number,
  asceVersion: '7-10' | '7-16' | '7-22',
  importanceFactor = 1.0
): number {
  const factors = getASCEWindFactors(asceVersion);
  const Kh = getVelocityPressureCoefficient(buildingHeight, exposureCategory, asceVersion);
  const Kzt = getTopographicFactor(elevation, asceVersion);
  const Kd = factors.Kd;
  const I = importanceFactor;
  
  // ASCE formula: qh = 0.00256 * Kh * Kzt * Kd * I * V²
  return factors.velocityPressureConstant * Kh * Kzt * Kd * I * Math.pow(basicWindSpeed, 2);
}

/**
 * Determine if location is in High Velocity Hurricane Zone (HVHZ)
 */
export function isHVHZ(lat: number, lng: number): boolean {
  // Florida HVHZ areas (simplified boundaries)
  const floridaHVHZ = lat >= 24.0 && lat <= 27.0 && lng >= -82.0 && lng <= -79.5;
  
  // Could add other HVHZ areas (Hawaii, Puerto Rico, etc.)
  return floridaHVHZ;
}

/**
 * Get standard wind pressure coefficients for different ASCE versions
 */
export function getStandardWindPressureCoefficients(asceVersion: '7-10' | '7-16' | '7-22') {
  // Standard GCp values for components and cladding
  const standardGCp = {
    zone1Field: -0.9,
    zone1Perimeter: -1.4,
    zone2Perimeter: -1.8,
    zone3Corner: -2.8
  };
  
  // Version-specific adjustments could be added here
  switch (asceVersion) {
    case '7-22':
    case '7-16':
    case '7-10':
    default:
      return standardGCp;
  }
}
