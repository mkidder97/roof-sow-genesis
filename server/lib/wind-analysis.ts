// Enhanced Wind Load Calculations per ASCE 7 with Jurisdiction Integration
import { WindAnalysisParams, WindAnalysisResult } from '../types';
import { getWindPressureCoefficients } from './jurisdiction-mapping';

export async function calculateWindPressures(params: WindAnalysisParams): Promise<WindAnalysisResult> {
  console.log(`🌪️ Calculating wind pressures using ${params.asceVersion} for coordinates: ${params.latitude}, ${params.longitude}`);
  
  // Basic wind speed lookup (simplified - in production would use ASCE wind maps)
  const basicWindSpeed = getBasicWindSpeed(params.latitude, params.longitude);
  
  // Wind pressure calculations per ASCE 7 with version-specific factors
  const windFactors = getASCEWindFactors(params.asceVersion);
  const Kd = windFactors.Kd; // Directionality factor for buildings
  const Kh = getVelocityPressureCoefficient(params.buildingHeight, params.exposureCategory, params.asceVersion);
  const Kzt = getTopographicFactor(params.elevation, params.asceVersion); 
  const I = 1.0; // Importance factor for normal buildings
  
  // Calculate velocity pressure using ASCE version-specific formula
  const qh = windFactors.velocityPressureConstant * Kh * Kzt * Kd * I * Math.pow(basicWindSpeed, 2);
  
  console.log(`📊 Wind calculation factors (${params.asceVersion}): V=${basicWindSpeed}mph, Kh=${Kh.toFixed(2)}, Kzt=${Kzt.toFixed(2)}, qh=${qh.toFixed(1)}psf`);
  
  // Get jurisdiction-specific pressure coefficients
  const GCp = await getWindPressureCoefficients(params.asceVersion);
  
  // Calculate zone pressures using proper ASCE methodology
  const zonePressures = calculateZonePressures(qh, GCp, params.asceVersion);
  
  console.log(`💨 Zone pressures calculated using ${params.asceVersion}: Z1F=${Math.abs(zonePressures.zone1Field).toFixed(1)}, Z3C=${Math.abs(zonePressures.zone3Corner).toFixed(1)}`);
  
  return {
    designWindSpeed: basicWindSpeed,
    exposureCategory: params.exposureCategory,
    elevation: params.elevation,
    zonePressures
  };
}

/**
 * Get ASCE version-specific wind factors
 */
function getASCEWindFactors(asceVersion: '7-10' | '7-16' | '7-22') {
  switch (asceVersion) {
    case '7-22':
      return {
        velocityPressureConstant: 0.00256, // psf
        Kd: 0.85, // Directionality factor (refined in 7-22)
        internalPressureCoeff: 0.18 // GCpi for partially enclosed buildings
      };
    case '7-16':
      return {
        velocityPressureConstant: 0.00256, // psf
        Kd: 0.85, // Directionality factor
        internalPressureCoeff: 0.18 // GCpi for partially enclosed buildings
      };
    case '7-10':
    default:
      return {
        velocityPressureConstant: 0.00256, // psf
        Kd: 0.85, // Directionality factor
        internalPressureCoeff: 0.18 // GCpi for partially enclosed buildings
      };
  }
}

/**
 * Calculate zone pressures with ASCE version-specific coefficients
 */
function calculateZonePressures(qh: number, GCp: Record<string, number>, asceVersion: '7-10' | '7-16' | '7-22') {
  const windFactors = getASCEWindFactors(asceVersion);
  const GCpi = windFactors.internalPressureCoeff;
  
  // Net pressure = q * (GCp - GCpi) for components and cladding
  // Values are negative for uplift (suction)
  
  if (asceVersion === '7-16' || asceVersion === '7-22') {
    // ASCE 7-16/22 has 4 zones for components and cladding
    return {
      zone1Field: qh * (GCp.zone1Field - GCpi),      // Zone 1' (interior field)
      zone1Perimeter: qh * (GCp.zone1Perimeter - GCpi), // Zone 1 (perimeter)
      zone2Perimeter: qh * (GCp.zone2Perimeter - GCpi), // Zone 2 (perimeter)
      zone3Corner: qh * (GCp.zone3Corner - GCpi)     // Zone 3 (corner)
    };
  } else {
    // ASCE 7-10 has 3 zones
    return {
      zone1Field: qh * (GCp.zone1Field - GCpi),      // Zone 1 (field)
      zone1Perimeter: qh * (GCp.zone1Perimeter - GCpi), // Zone 2 (perimeter) 
      zone2Perimeter: qh * (GCp.zone2Perimeter - GCpi), // Zone 2 (perimeter)
      zone3Corner: qh * (GCp.zone3Corner - GCpi)     // Zone 3 (corner)
    };
  }
}

function getBasicWindSpeed(lat: number, lng: number): number {
  // Enhanced wind speed map based on geographic regions
  // This incorporates ASCE 7 wind speed maps and recent updates
  
  // Florida HVHZ (High Velocity Hurricane Zone)
  if (lat >= 24.0 && lat <= 27.0 && lng >= -82.0 && lng <= -79.5) {
    if (lat <= 25.5 && lng >= -80.5) {
      return 185; // Extreme South Florida (Miami-Dade)
    } else if (lat <= 26.5) {
      return 180; // Broward County
    }
    return 175; // Palm Beach County HVHZ
  }
  
  // Florida Keys
  if (lat >= 24.5 && lat <= 25.5 && lng >= -82.0 && lng <= -80.0) {
    return 185; // Monroe County
  }
  
  // Florida Non-HVHZ
  if (lat >= 25.0 && lat <= 31.0 && lng >= -87.5 && lng <= -79.5) {
    if (lat >= 30.0) {
      return 140; // North Florida
    } else if (lat >= 28.0) {
      return 150; // Central Florida
    }
    return 150; // South/Central Florida
  }
  
  // Texas Gulf Coast (Harris County area)
  if (lat >= 29.0 && lat <= 30.5 && lng >= -95.8 && lng <= -94.5) {
    return 145; // Houston/Galveston area
  }
  
  // Texas Inland
  if (lat >= 25.5 && lat <= 36.5 && lng >= -106.5 && lng <= -93.5) {
    if (lat >= 32.0 && lat <= 33.5 && lng >= -97.5 && lng <= -96.0) {
      return 115; // Dallas-Fort Worth
    } else if (lat >= 29.0 && lat <= 31.0 && lng >= -98.5 && lng <= -97.0) {
      return 115; // Austin/San Antonio
    }
    return 120; // General Texas
  }
  
  // Louisiana/Mississippi Gulf Coast
  if (lat >= 29.0 && lat <= 31.0 && lng >= -94.0 && lng <= -88.0) {
    return 150; // Gulf Coast
  }
  
  // Atlantic Coast - Carolinas
  if (lat >= 32.0 && lat <= 36.5 && lng >= -81.0 && lng <= -75.5) {
    return 140; // Coastal areas
  }
  
  // California (seismic typically governs)
  if (lat >= 32.0 && lat <= 42.0 && lng >= -124.5 && lng <= -114.0) {
    if (lng < -118.0) {
      return 85; // Coastal California
    }
    return 85; // Inland California
  }
  
  // New York/Northeast
  if (lat >= 40.0 && lat <= 45.0 && lng >= -79.0 && lng <= -67.0) {
    return 115; // Northeast corridor
  }
  
  // Great Lakes region
  if (lat >= 41.0 && lat <= 48.0 && lng >= -93.0 && lng <= -76.0) {
    return 105; // Generally lower wind speeds
  }
  
  // Mountain West (elevation effects considered separately)
  if (lat >= 37.0 && lat <= 49.0 && lng >= -125.0 && lng <= -100.0) {
    return 120; // Base wind speed before topographic effects
  }
  
  // Default for unmapped areas
  return 115;
}

function getVelocityPressureCoefficient(height: number, exposure: string, asceVersion: '7-10' | '7-16' | '7-22'): number {
  // ASCE version-specific Kh calculation
  const exposureParams = getExposureParameters(exposure, asceVersion);
  const { alpha, zg, Kh15 } = exposureParams;
  
  // Height above ground (minimum 15 ft for ASCE 7)
  const z = Math.max(height, 15);
  
  if (z <= 15) {
    return Kh15;
  }
  
  // Power law formula per ASCE 7
  const exponent = (2 * alpha) / zg;
  return Kh15 * Math.pow(z / 15, exponent);
}

function getExposureParameters(exposure: string, asceVersion: '7-10' | '7-16' | '7-22') {
  // ASCE version-specific exposure parameters
  const baseParams = {
    'B': { alpha: 7.0, zg: 1200, Kh15: 0.57 },
    'C': { alpha: 9.5, zg: 900, Kh15: 0.85 },
    'D': { alpha: 11.5, zg: 700, Kh15: 1.03 }
  };
  
  const params = baseParams[exposure.toUpperCase() as keyof typeof baseParams] || baseParams.C;
  
  // Minor adjustments for newer ASCE versions (if any)
  if (asceVersion === '7-22') {
    // ASCE 7-22 may have slight refinements
    return {
      ...params,
      // Any version-specific adjustments would go here
    };
  }
  
  return params;
}

function getTopographicFactor(elevation: number, asceVersion: '7-10' | '7-16' | '7-22'): number {
  // Enhanced topographic factor calculation
  // In reality, this requires detailed topographic analysis per ASCE 7 Section 26.8
  
  // Base factors (simplified for MVP)
  if (elevation > 3000) {
    return asceVersion === '7-22' ? 1.20 : 1.15; // High elevation areas
  } else if (elevation > 2000) {
    return asceVersion === '7-22' ? 1.10 : 1.05; // Moderate elevation
  } else if (elevation > 1000) {
    return 1.05; // Slight elevation increase
  }
  
  return 1.0; // Flat terrain
}

// Helper function to determine exposure category from building description
export function determineExposureCategory(
  buildingDescription?: string,
  coordinates?: { lat: number; lng: number }
): 'B' | 'C' | 'D' {
  // Enhanced exposure determination with more geographic precision
  
  if (coordinates) {
    // Near coastlines = Exposure D (within 1 mile of shore)
    if (isNearCoast(coordinates.lat, coordinates.lng)) {
      return 'D';
    }
    
    // Urban areas = Exposure B
    if (isUrbanArea(coordinates.lat, coordinates.lng)) {
      return 'B';
    }
    
    // Check for specific geographic exposure conditions
    if (isOpenTerrain(coordinates.lat, coordinates.lng)) {
      return 'C';
    }
  }
  
  // Default to Exposure C (open terrain with scattered obstructions)
  return 'C';
}

function isNearCoast(lat: number, lng: number): boolean {
  // More precise coastal detection for Exposure D determination
  
  // Atlantic Coast (tighter tolerance for Exposure D)
  if (lng > -81.5 && lat > 25 && lat < 45) {
    // Check if within ~5 miles of coast (simplified)
    const distanceFromCoast = Math.abs(lng + 81.0); // Simplified distance
    return distanceFromCoast < 0.1; // Roughly 5-7 miles
  }
  
  // Gulf Coast
  if (lng > -98 && lng < -82 && lat > 25 && lat < 31) {
    const distanceFromCoast = Math.abs(lat - 29.5); // Simplified
    return distanceFromCoast < 0.1;
  }
  
  // Pacific Coast
  if (lng < -117 && lat > 32 && lat < 49) {
    const distanceFromCoast = Math.abs(lng + 118.0); // Simplified
    return distanceFromCoast < 0.1;
  }
  
  return false;
}

function isUrbanArea(lat: number, lng: number): boolean {
  // Enhanced metropolitan area detection for Exposure B
  const metros = [
    { lat: 40.7, lng: -74.0, radius: 0.8, name: 'NYC Metro' }, 
    { lat: 34.1, lng: -118.2, radius: 0.6, name: 'LA Metro' }, 
    { lat: 41.9, lng: -87.6, radius: 0.5, name: 'Chicago' },
    { lat: 29.8, lng: -95.4, radius: 0.4, name: 'Houston' },
    { lat: 33.4, lng: -112.1, radius: 0.3, name: 'Phoenix' },
    { lat: 32.8, lng: -96.8, radius: 0.3, name: 'Dallas' },
    { lat: 25.8, lng: -80.2, radius: 0.4, name: 'Miami Metro' },
    { lat: 30.3, lng: -97.7, radius: 0.2, name: 'Austin' },
  ];
  
  return metros.some(metro => {
    const distance = Math.sqrt(
      Math.pow(lat - metro.lat, 2) + Math.pow(lng - metro.lng, 2)
    );
    return distance < metro.radius;
  });
}

function isOpenTerrain(lat: number, lng: number): boolean {
  // Check for open terrain conditions (Exposure C)
  // This is a simplified implementation
  
  // Great Plains region (typically open terrain)
  if (lat >= 35.0 && lat <= 49.0 && lng >= -104.0 && lng <= -94.0) {
    return true;
  }
  
  // Agricultural areas in Midwest
  if (lat >= 38.0 && lat <= 48.0 && lng >= -98.0 && lng <= -80.0) {
    return true;
  }
  
  return false;
}

/**
 * Create wind analysis summary with jurisdiction context
 */
export async function createWindAnalysisSummary(
  params: WindAnalysisParams,
  result: WindAnalysisResult
): Promise<{
  method: string;
  asceVersion: string;
  windSpeed: number;
  zonePressures: typeof result.zonePressures;
  reasoning: string;
  calculationFactors: {
    Kh: number;
    Kzt: number;
    Kd: number;
    qh: number;
  };
}> {
  const windFactors = getASCEWindFactors(params.asceVersion);
  const Kh = getVelocityPressureCoefficient(params.buildingHeight, params.exposureCategory, params.asceVersion);
  const Kzt = getTopographicFactor(params.elevation, params.asceVersion);
  const qh = windFactors.velocityPressureConstant * Kh * Kzt * windFactors.Kd * Math.pow(result.designWindSpeed, 2);
  
  return {
    method: `ASCE ${params.asceVersion} Components and Cladding Wind Pressure Analysis`,
    asceVersion: params.asceVersion,
    windSpeed: result.designWindSpeed,
    zonePressures: result.zonePressures,
    reasoning: `Wind pressures calculated using ${params.asceVersion} methodology for ${params.exposureCategory} exposure at ${params.elevation}ft elevation`,
    calculationFactors: {
      Kh: Number(Kh.toFixed(3)),
      Kzt: Number(Kzt.toFixed(3)), 
      Kd: windFactors.Kd,
      qh: Number(qh.toFixed(1))
    }
  };
}
