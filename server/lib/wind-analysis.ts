// Wind Load Calculations per ASCE 7
import { WindAnalysisParams, WindAnalysisResult } from '../types';

export async function calculateWindPressures(params: WindAnalysisParams): Promise<WindAnalysisResult> {
  console.log(`🌪️ Calculating wind pressures for coordinates: ${params.latitude}, ${params.longitude}`);
  
  // Basic wind speed lookup (simplified - in production would use ASCE wind maps)
  const basicWindSpeed = getBasicWindSpeed(params.latitude, params.longitude);
  
  // Wind pressure calculations per ASCE 7
  const Kd = 0.85; // Directionality factor for buildings
  const Kh = getVelocityPressureCoefficient(params.buildingHeight, params.exposureCategory);
  const Kzt = getTopographicFactor(params.elevation); // Simplified
  const I = 1.0; // Importance factor for normal buildings
  
  // Calculate velocity pressure
  const qh = 0.00256 * Kh * Kzt * Kd * I * Math.pow(basicWindSpeed, 2);
  
  console.log(`📊 Wind calculation factors: V=${basicWindSpeed}mph, Kh=${Kh.toFixed(2)}, Kzt=${Kzt.toFixed(2)}, qh=${qh.toFixed(1)}psf`);
  
  // Zone pressure coefficients per ASCE 7 (simplified values for roofing)
  const GCp = getWindPressureCoefficients(params.asceVersion);
  
  const zonePressures = {
    zone1Field: qh * GCp.zone1Field,
    zone1Perimeter: qh * GCp.zone1Perimeter,
    zone2Perimeter: qh * GCp.zone2Perimeter,
    zone3Corner: qh * GCp.zone3Corner
  };
  
  console.log(`💨 Zone pressures calculated: Z1F=${zonePressures.zone1Field.toFixed(1)}, Z3C=${zonePressures.zone3Corner.toFixed(1)}`);
  
  return {
    designWindSpeed: basicWindSpeed,
    exposureCategory: params.exposureCategory,
    elevation: params.elevation,
    zonePressures
  };
}

function getBasicWindSpeed(lat: number, lng: number): number {
  // Simplified wind speed map based on geographic regions
  // In production, this would use ASCE 7 wind maps or NOAA data
  
  // Florida HVHZ
  if (lat >= 24.0 && lat <= 27.0 && lng >= -82.0 && lng <= -79.5) {
    if (lat <= 25.5) {
      return 185; // Extreme South Florida
    }
    return 175; // South Florida HVHZ
  }
  
  // Florida Non-HVHZ
  if (lat >= 25.0 && lat <= 31.0 && lng >= -87.5 && lng <= -79.5) {
    return 150; // Central/North Florida
  }
  
  // Texas Gulf Coast
  if (lat >= 28.0 && lat <= 30.5 && lng >= -97.5 && lng <= -93.5) {
    return 145; // Houston/Galveston area
  }
  
  // Texas Inland
  if (lat >= 25.5 && lat <= 36.5 && lng >= -106.5 && lng <= -93.5) {
    if (lat >= 32.0 && lat <= 33.5 && lng >= -97.5 && lng <= -96.0) {
      return 115; // Dallas-Fort Worth
    }
    return 120; // General Texas
  }
  
  // Louisiana/Mississippi Gulf Coast
  if (lat >= 29.0 && lat <= 31.0 && lng >= -94.0 && lng <= -88.0) {
    return 150;
  }
  
  // California
  if (lat >= 32.0 && lat <= 42.0 && lng >= -124.5 && lng <= -114.0) {
    return 85; // Most of California (seismic governs)
  }
  
  // Southeast Atlantic Coast
  if (lat >= 32.0 && lat <= 36.0 && lng >= -81.0 && lng <= -75.5) {
    return 140; // Carolinas coast
  }
  
  // New York/Northeast
  if (lat >= 40.0 && lat <= 45.0 && lng >= -79.0 && lng <= -67.0) {
    return 115;
  }
  
  // Default for unmapped areas
  return 115;
}

function getVelocityPressureCoefficient(height: number, exposure: string): number {
  // Simplified Kh calculation per ASCE 7
  const alpha = getExposureParameters(exposure).alpha;
  const zg = getExposureParameters(exposure).zg;
  
  // Height above ground (minimum 15 ft for ASCE 7)
  const z = Math.max(height, 15);
  
  if (z <= 15) {
    return getExposureParameters(exposure).Kh15;
  }
  
  // Simplified power law formula
  return getExposureParameters(exposure).Kh15 * Math.pow(z / 15, 2 * alpha / zg);
}

function getExposureParameters(exposure: string) {
  switch (exposure.toUpperCase()) {
    case 'B':
      return { alpha: 7.0, zg: 1200, Kh15: 0.57 };
    case 'C':
      return { alpha: 9.5, zg: 900, Kh15: 0.85 };
    case 'D':
      return { alpha: 11.5, zg: 700, Kh15: 1.03 };
    default:
      return { alpha: 9.5, zg: 900, Kh15: 0.85 }; // Default to Exposure C
  }
}

function getTopographicFactor(elevation: number): number {
  // Simplified topographic factor
  // In reality, this requires detailed topographic analysis
  if (elevation > 2000) {
    return 1.15; // High elevation areas
  } else if (elevation > 1000) {
    return 1.05; // Moderate elevation
  }
  return 1.0; // Flat terrain
}

function getWindPressureCoefficients(asceVersion: '7-10' | '7-16' | '7-22') {
  // Pressure coefficients for components and cladding
  // Values are negative for uplift (suction)
  
  switch (asceVersion) {
    case '7-22':
      return {
        zone1Field: -0.9,
        zone1Perimeter: -1.4,
        zone2Perimeter: -2.0,
        zone3Corner: -2.8
      };
    case '7-16':
      return {
        zone1Field: -0.9,
        zone1Perimeter: -1.4,
        zone2Perimeter: -2.0,
        zone3Corner: -2.8
      };
    case '7-10':
    default:
      return {
        zone1Field: -0.7,
        zone1Perimeter: -1.0,
        zone2Perimeter: -1.4,
        zone3Corner: -2.0
      };
  }
}

// Helper function to determine exposure category from building description
export function determineExposureCategory(
  buildingDescription?: string,
  coordinates?: { lat: number; lng: number }
): 'B' | 'C' | 'D' {
  // Simplified exposure determination
  // In practice, this requires detailed site analysis
  
  if (coordinates) {
    // Near coastlines = Exposure D
    if (isNearCoast(coordinates.lat, coordinates.lng)) {
      return 'D';
    }
    
    // Urban areas = Exposure B
    if (isUrbanArea(coordinates.lat, coordinates.lng)) {
      return 'B';
    }
  }
  
  // Default to Exposure C (open terrain)
  return 'C';
}

function isNearCoast(lat: number, lng: number): boolean {
  // Simplified coastal detection (within ~30 miles of coast)
  
  // Atlantic Coast
  if (lng > -82 && lat > 25 && lat < 45) return true;
  
  // Gulf Coast
  if (lng > -98 && lng < -82 && lat > 25 && lat < 31) return true;
  
  // Pacific Coast
  if (lng < -117 && lat > 32 && lat < 49) return true;
  
  return false;
}

function isUrbanArea(lat: number, lng: number): boolean {
  // Major metropolitan areas (simplified)
  const metros = [
    { lat: 40.7, lng: -74.0, radius: 0.5 }, // NYC
    { lat: 34.1, lng: -118.2, radius: 0.4 }, // LA
    { lat: 41.9, lng: -87.6, radius: 0.3 }, // Chicago
    { lat: 29.8, lng: -95.4, radius: 0.3 }, // Houston
    { lat: 33.4, lng: -112.1, radius: 0.2 }, // Phoenix
    { lat: 32.8, lng: -96.8, radius: 0.2 }, // Dallas
  ];
  
  return metros.some(metro => {
    const distance = Math.sqrt(
      Math.pow(lat - metro.lat, 2) + Math.pow(lng - metro.lng, 2)
    );
    return distance < metro.radius;
  });
}
