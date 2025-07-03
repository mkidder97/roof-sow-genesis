// Jurisdiction Analysis Utilities
// Common functions for analyzing building codes and jurisdiction requirements

export interface JurisdictionInfo {
  county: string;
  state: string;
  codeCycle: string;
  asceVersion: '7-10' | '7-16' | '7-22';
  hvhz: boolean;
  windSpeed: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ComplianceIssue {
  type: 'error' | 'warning';
  message: string;
  code?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ComplianceResult {
  compliant: boolean;
  issues: ComplianceIssue[];
  score: number; // 0-100
}

/**
 * Parse address components from a full address string
 */
export function parseAddress(address: string): {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
} {
  // Simple address parsing - in production would use more sophisticated parsing
  const parts = address.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    const lastPart = parts[parts.length - 1];
    const stateZipMatch = lastPart?.match(/([A-Z]{2})\s+(\d{5}(-\d{4})?)/);
    
    if (stateZipMatch) {
      const result: { street?: string; city?: string; state?: string; zipCode?: string; } = {};
      
      if (parts[0]) result.street = parts[0];
      if (parts[parts.length - 2]) result.city = parts[parts.length - 2];
      // Fix: Use non-null assertion or provide fallback
      if (stateZipMatch[1]) result.state = stateZipMatch[1];
      if (stateZipMatch[2]) result.zipCode = stateZipMatch[2];
      
      return result;
    }
  }
  
  const result: { street?: string; city?: string; state?: string; zipCode?: string; } = {};
  
  if (parts[0]) result.street = parts[0];
  if (parts[1]) result.city = parts[1];
  if (parts[2]) result.state = parts[2];
  
  return result;
}

/**
 * Determine ASCE version based on jurisdiction and code cycle
 */
export function getASCEVersion(codeCycle: string, state: string): '7-10' | '7-16' | '7-22' {
  const cycle = parseInt(codeCycle);
  
  // Most jurisdictions follow this pattern
  if (cycle >= 2024) {
    return '7-22';
  } else if (cycle >= 2018) {
    return '7-16';
  } else {
    return '7-10';
  }
}

/**
 * Check if coordinates fall within HVHZ boundaries
 */
export function isHVHZLocation(lat: number, lng: number): boolean {
  // Florida HVHZ (simplified boundaries)
  const floridaHVHZ = lat >= 24.0 && lat <= 27.0 && lng >= -82.0 && lng <= -79.5;
  
  // Hawaii HVHZ areas (simplified)
  const hawaiiHVHZ = lat >= 18.9 && lat <= 22.3 && lng >= -160.3 && lng <= -154.7;
  
  // Puerto Rico and other territories would be added here
  
  return floridaHVHZ || hawaiiHVHZ;
}

/**
 * Get wind speed based on location and ASCE version
 */
export function getWindSpeedForLocation(
  lat: number, 
  lng: number, 
  asceVersion: '7-10' | '7-16' | '7-22'
): number {
  // This would typically reference ASCE wind maps
  // Simplified implementation for common areas
  
  if (isHVHZLocation(lat, lng)) {
    return 180; // HVHZ minimum
  }
  
  // Florida (non-HVHZ)
  if (lat >= 24.5 && lat <= 31.0 && lng >= -87.6 && lng <= -80.0) {
    return 160;
  }
  
  // Gulf Coast
  if (lat >= 25.0 && lat <= 30.5 && lng >= -98.0 && lng <= -80.0) {
    return 150;
  }
  
  // Atlantic Coast
  if (lat >= 32.0 && lat <= 42.0 && lng >= -81.0 && lng <= -75.0) {
    return 140;
  }
  
  // Default inland
  return 130;
}

/**
 * Validate jurisdiction compliance requirements
 */
export function validateJurisdictionCompliance(
  jurisdictionInfo: JurisdictionInfo,
  projectRequirements: {
    membraneType?: string;
    attachmentMethod?: string;
    windUpliftPressure?: number;
    hvhzRequired?: boolean;
  }
): ComplianceResult {
  const issues: ComplianceIssue[] = [];
  let score = 100;
  
  // HVHZ Requirements Check
  if (jurisdictionInfo.hvhz && !projectRequirements.hvhzRequired) {
    issues.push({
      type: 'error',
      message: 'Project is in HVHZ area but HVHZ requirements not specified',
      code: 'HVHZ_REQUIRED',
      severity: 'high'
    });
    score -= 25;
  }
  
  // Wind Speed Validation
  if (jurisdictionInfo.windSpeed < 130) {
    issues.push({
      type: 'warning',
      message: 'Wind speed appears low for jurisdiction',
      code: 'LOW_WIND_SPEED',
      severity: 'medium'
    });
    score -= 10;
  }
  
  // ASCE Version Currency Check
  const currentYear = new Date().getFullYear();
  const codeAge = currentYear - parseInt(jurisdictionInfo.codeCycle);
  
  if (codeAge > 6) {
    issues.push({
      type: 'warning',
      message: `Code cycle ${jurisdictionInfo.codeCycle} may be outdated`,
      code: 'OUTDATED_CODE',
      severity: 'medium'
    });
    score -= 15;
  }
  
  return {
    compliant: issues.filter(i => i.type === 'error').length === 0,
    issues,
    score: Math.max(0, score)
  };
}

/**
 * Generate pressure table data for SOW documents
 */
export function generatePressureTableData(
  windPressures: Record<string, number>,
  asceVersion: '7-10' | '7-16' | '7-22'
) {
  const zones = [
    { name: 'Zone 1 (Field)', pressure: Math.abs(windPressures.zone1Field || 0) },
    { name: 'Zone 1 (Perimeter)', pressure: Math.abs(windPressures.zone1Perimeter || 0) },
    { name: 'Zone 2 (Perimeter)', pressure: Math.abs(windPressures.zone2Perimeter || 0) },
    { name: 'Zone 3 (Corner)', pressure: Math.abs(windPressures.zone3Corner || 0) }
  ];
  
  return {
    zones,
    methodology: `ASCE ${asceVersion} Components and Cladding`,
    maxPressure: Math.max(...zones.map(z => z.pressure)),
    minPressure: Math.min(...zones.map(z => z.pressure))
  };
}

/**
 * Create SOW metadata based on jurisdiction analysis
 */
export function createSOWMetadata(jurisdictionInfo: JurisdictionInfo) {
  return {
    generated: new Date().toISOString(),
    asceVersion: jurisdictionInfo.asceVersion,
    codeCycle: jurisdictionInfo.codeCycle,
    hvhz: jurisdictionInfo.hvhz,
    windSpeed: jurisdictionInfo.windSpeed,
    location: `${jurisdictionInfo.county}, ${jurisdictionInfo.state}`,
    coordinates: jurisdictionInfo.coordinates
  };
}

/**
 * Format jurisdiction name for display
 */
export function formatJurisdictionName(
  county: string, 
  state: string, 
  includeState = true
): string {
  const formattedCounty = county.replace(/\s+county$/i, '').trim();
  const displayName = `${formattedCounty} County`;
  
  return includeState ? `${displayName}, ${state}` : displayName;
}

/**
 * Get building code cycle options for a state
 */
export function getCodeCycleOptions(state: string): string[] {
  // Most common code cycles
  const commonCycles = ['2024', '2021', '2018', '2015', '2012', '2009'];
  
  // Some states have specific adoption patterns
  switch (state.toUpperCase()) {
    case 'FL':
      return ['2023', '2020', '2017', '2014', '2011'];
    case 'TX':
      return ['2021', '2018', '2015', '2012', '2009'];
    case 'CA':
      return ['2022', '2019', '2016', '2013', '2010'];
    default:
      return commonCycles;
  }
}

/**
 * Validate address format
 */
export function isValidAddress(address: string): boolean {
  // Basic address validation
  if (!address || address.length < 10) return false;
  
  // Should contain at least street, city, and state
  const commaCount = (address.match(/,/g) || []).length;
  if (commaCount < 1) return false;
  
  // Should contain a state abbreviation
  const statePattern = /\b[A-Z]{2}\b/;
  return statePattern.test(address);
}
