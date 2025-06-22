// Dynamic Wind Pressure Calculation Engine
import asceMapping from '../data/asce-mapping.json';

export interface WindPressureInputs {
  buildingHeight: number;
  exposureCategory: 'B' | 'C' | 'D';
  roofSlope?: number;
  elevation: number;
  county: string;
  state: string;
  basicWindSpeed?: number; // Override if provided
}

export interface WindUpliftPressures {
  zone1Field: number;
  zone1Perimeter: number;
  zone2Perimeter: number;
  zone3Corner: number;
}

export interface WindPressureResult {
  windUpliftPressures: WindUpliftPressures;
  metadata: {
    asceVersion: string;
    codeCycle: string;
    hvhz: boolean;
    jurisdiction: string;
    basicWindSpeed: number;
    exposureCategory: string;
    velocityPressure: number;
    pressureCoefficients: {
      zone1Field: number;
      zone1Perimeter: number;
      zone2Perimeter: number;
      zone3Corner: number;
    };
  };
}

export function calculateWindPressures(inputs: WindPressureInputs): WindPressureResult {
  console.log(`🌪️ Calculating wind pressures for ${inputs.county}, ${inputs.state}`);
  
  // Step 1: Get jurisdiction data and ASCE version
  const jurisdictionData = getJurisdictionData(inputs.county, inputs.state);
  const asceVersion = jurisdictionData.asceVersion;
  const basicWindSpeed = inputs.basicWindSpeed || jurisdictionData.windSpeed;
  
  console.log(`📋 Jurisdiction: ${jurisdictionData.codeCycle}, ${asceVersion}, HVHZ: ${jurisdictionData.hvhz}`);
  console.log(`💨 Basic wind speed: ${basicWindSpeed} mph`);
  
  // Step 2: Calculate velocity pressure coefficients
  const Kh = calculateVelocityPressureCoefficient(inputs.buildingHeight, inputs.exposureCategory);
  const Kzt = calculateTopographicFactor(inputs.elevation);
  const Kd = 0.85; // Directionality factor for buildings
  const I = 1.0;   // Importance factor (Category II buildings)
  
  // Step 3: Calculate velocity pressure (qh)
  const qh = 0.00256 * Kh * Kzt * Kd * I * Math.pow(basicWindSpeed, 2);
  
  console.log(`📊 Factors: Kh=${Kh.toFixed(3)}, Kzt=${Kzt.toFixed(2)}, qh=${qh.toFixed(1)} psf`);
  
  // Step 4: Get pressure coefficients for ASCE version
  const pressureCoefficients = getPressureCoefficients(asceVersion, inputs.roofSlope);
  
  // Step 5: Calculate zone pressures (negative = uplift/suction)
  const windUpliftPressures: WindUpliftPressures = {
    zone1Field: qh * pressureCoefficients.zone1Field,
    zone1Perimeter: qh * pressureCoefficients.zone1Perimeter,
    zone2Perimeter: qh * pressureCoefficients.zone2Perimeter,
    zone3Corner: qh * pressureCoefficients.zone3Corner
  };
  
  console.log(`🎯 Zone pressures: Z1F=${windUpliftPressures.zone1Field.toFixed(1)}, Z3C=${windUpliftPressures.zone3Corner.toFixed(1)} psf`);
  
  return {
    windUpliftPressures,
    metadata: {
      asceVersion,
      codeCycle: jurisdictionData.codeCycle,
      hvhz: jurisdictionData.hvhz,
      jurisdiction: `${inputs.county}, ${inputs.state}`,
      basicWindSpeed,
      exposureCategory: inputs.exposureCategory,
      velocityPressure: qh,
      pressureCoefficients
    }
  };
}

function getJurisdictionData(county: string, state: string) {
  const stateData = asceMapping.states[state];
  
  if (!stateData) {
    console.warn(`⚠️ State ${state} not found in mapping, using defaults`);
    return {
      codeCycle: '2021 IBC',
      asceVersion: '7-16',
      hvhz: false,
      windSpeed: asceMapping.windSpeedDefaults.default
    };
  }
  
  // Check for specific county mapping
  const countyData = stateData.counties?.[county];
  if (countyData) {
    return countyData;
  }
  
  // Use state defaults
  return {
    codeCycle: stateData.defaultCode,
    asceVersion: stateData.defaultASCE,
    hvhz: false,
    windSpeed: asceMapping.windSpeedDefaults.default
  };
}

function calculateVelocityPressureCoefficient(height: number, exposure: 'B' | 'C' | 'D'): number {
  const exposureData = asceMapping.exposureCategories[exposure];
  const { alpha, zg, Kh15 } = exposureData;
  
  // Height above ground (minimum 15 ft for ASCE 7)
  const z = Math.max(height, 15);
  
  if (z <= 15) {
    return Kh15;
  }
  
  // Power law formula: Kh = Kh15 * (z/15)^(2*alpha/zg)
  const exponent = (2 * alpha) / zg;
  return Kh15 * Math.pow(z / 15, exponent);
}

function calculateTopographicFactor(elevation: number): number {
  // Simplified topographic factor
  // In practice, this requires detailed analysis of terrain features
  if (elevation > 3000) {
    return 1.20; // High mountain areas
  } else if (elevation > 2000) {
    return 1.15; // Elevated terrain
  } else if (elevation > 1000) {
    return 1.05; // Moderate elevation
  }
  
  return 1.0; // Flat terrain
}

function getPressureCoefficients(asceVersion: string, roofSlope: number = 0) {
  const baseCoefficients = asceMapping.asceVersions[asceVersion]?.pressureCoefficients;
  
  if (!baseCoefficients) {
    console.warn(`⚠️ ASCE version ${asceVersion} not found, using 7-16 defaults`);
    return asceMapping.asceVersions['7-16'].pressureCoefficients;
  }
  
  // Adjust coefficients for roof slope if needed
  // For low-slope roofs (≤ 7°), use base coefficients
  if (roofSlope <= 7) {
    return baseCoefficients;
  }
  
  // For steeper roofs, coefficients may be reduced (less critical)
  const slopeReduction = Math.min(0.2, roofSlope * 0.01);
  return {
    zone1Field: baseCoefficients.zone1Field * (1 - slopeReduction),
    zone1Perimeter: baseCoefficients.zone1Perimeter * (1 - slopeReduction),
    zone2Perimeter: baseCoefficients.zone2Perimeter * (1 - slopeReduction),
    zone3Corner: baseCoefficients.zone3Corner * (1 - slopeReduction)
  };
}

// Helper function to determine exposure category automatically
export function determineExposureCategory(
  coordinates: { lat: number; lng: number },
  buildingDescription?: string
): 'B' | 'C' | 'D' {
  // Simplified exposure determination based on location
  
  // Coastal areas (within ~10 miles of coast) = Exposure D
  if (isCoastalArea(coordinates)) {
    return 'D';
  }
  
  // Urban/suburban areas = Exposure B
  if (isUrbanArea(coordinates)) {
    return 'B';
  }
  
  // Default to Exposure C (open terrain)
  return 'C';
}

function isCoastalArea(coords: { lat: number; lng: number }): boolean {
  const { lat, lng } = coords;
  
  // Atlantic Coast
  if (lng > -85 && lat > 24 && lat < 46) return true;
  
  // Gulf Coast  
  if (lng > -98 && lng < -80 && lat > 24 && lat < 32) return true;
  
  // Pacific Coast
  if (lng < -115 && lat > 30 && lat < 50) return true;
  
  return false;
}

function isUrbanArea(coords: { lat: number; lng: number }): boolean {
  const { lat, lng } = coords;
  
  // Major metropolitan areas
  const metros = [
    { lat: 40.7, lng: -74.0, radius: 0.5 }, // NYC
    { lat: 34.1, lng: -118.2, radius: 0.4 }, // LA
    { lat: 41.9, lng: -87.6, radius: 0.3 }, // Chicago
    { lat: 29.8, lng: -95.4, radius: 0.3 }, // Houston
    { lat: 32.8, lng: -96.8, radius: 0.3 }, // Dallas
    { lat: 25.8, lng: -80.2, radius: 0.2 }, // Miami
  ];
  
  return metros.some(metro => {
    const distance = Math.sqrt(
      Math.pow(lat - metro.lat, 2) + Math.pow(lng - metro.lng, 2)
    );
    return distance < metro.radius;
  });
}

// Validation function for wind pressure results
export function validateWindPressures(pressures: WindUpliftPressures): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let valid = true;
  
  // Check for reasonable pressure ranges
  const maxPressure = Math.abs(pressures.zone3Corner);
  
  if (maxPressure > 100) {
    warnings.push(`Extreme wind pressure detected: ${maxPressure.toFixed(1)} psf - verify building height and exposure`);
  }
  
  if (maxPressure < 10) {
    warnings.push(`Unusually low wind pressure: ${maxPressure.toFixed(1)} psf - verify wind speed and calculations`);
    valid = false;
  }
  
  // Check pressure progression (should increase from field to corner)
  if (Math.abs(pressures.zone1Field) >= Math.abs(pressures.zone3Corner)) {
    warnings.push('Pressure progression anomaly: Corner pressure should exceed field pressure');
    valid = false;
  }
  
  return { valid, warnings };
}
