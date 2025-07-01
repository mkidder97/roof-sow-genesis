// Jurisdiction Analysis Functions
import { 
  parseAddress,
  getASCEVersion,
  isHVHZLocation,
  getWindSpeedForLocation,
  validateJurisdictionCompliance,
  createSOWMetadata,
  generatePressureTableData,
  JurisdictionInfo
} from '@roof-sow-genesis/shared';

export async function analyzeJurisdiction(params: any) {
  // Enhanced implementation using shared utilities
  console.log('📍 Analyzing jurisdiction...', params);
  
  // Parse the address if it's a full address string
  const addressComponents = typeof params.address === 'string' 
    ? parseAddress(params.address)
    : params;
  
  // Use mock coordinates for now (in production would geocode)
  const coordinates = { lat: 25.7617, lng: -80.1918 };
  
  // Determine ASCE version based on typical Florida code cycles
  const asceVersion = getASCEVersion('2020', addressComponents.state || 'FL');
  
  // Check if location is in HVHZ
  const hvhz = isHVHZLocation(coordinates.lat, coordinates.lng);
  
  // Get wind speed for location
  const windSpeed = getWindSpeedForLocation(coordinates.lat, coordinates.lng, asceVersion);
  
  return {
    location: params.address || 'Unknown Location',
    asceVersion,
    hvhz,
    windSpeed,
    coordinates,
    county: addressComponents.city || 'Test County',
    state: addressComponents.state || 'FL',
    codeCycle: '2020'
  };
}

export async function performComprehensiveAnalysis(address: string, buildingHeight = 30, exposureCategory = 'C') {
  const addressComponents = parseAddress(address);
  const coordinates = { lat: 25.7617, lng: -80.1918 }; // Mock coordinates
  
  const jurisdictionInfo: JurisdictionInfo = {
    county: addressComponents.city || 'Test County',
    state: addressComponents.state || 'FL',
    codeCycle: '2020',
    asceVersion: getASCEVersion('2020', addressComponents.state || 'FL'),
    hvhz: isHVHZLocation(coordinates.lat, coordinates.lng),
    windSpeed: getWindSpeedForLocation(coordinates.lat, coordinates.lng, '7-16'),
    coordinates
  };
  
  // Mock wind pressures for analysis
  const windPressures = {
    zone1Field: -45.2,
    zone1Perimeter: -60.5,
    zone2Perimeter: -72.8,
    zone3Corner: -92.1
  };
  
  const pressureTableData = generatePressureTableData(windPressures, jurisdictionInfo.asceVersion);
  
  return {
    jurisdiction: jurisdictionInfo,
    windAnalysis: {
      designWindSpeed: jurisdictionInfo.windSpeed,
      zonePressures: windPressures,
      exposureCategory,
      pressureTable: pressureTableData
    },
    summary: {
      appliedMethod: `ASCE ${jurisdictionInfo.asceVersion}`
    }
  };
}

export async function quickJurisdictionLookup(county: string, state: string) {
  const asceVersion = getASCEVersion('2020', state);
  const coordinates = { lat: 25.7617, lng: -80.1918 }; // Mock coordinates
  
  return {
    codeCycle: '2020',
    asceVersion,
    hvhz: isHVHZLocation(coordinates.lat, coordinates.lng)
  };
}

export function validateJurisdictionCompliance(analysis: any) {
  // Use shared validation utility
  const jurisdictionInfo: JurisdictionInfo = {
    county: analysis.county || 'Unknown',
    state: analysis.state || 'FL',
    codeCycle: analysis.codeCycle || '2020',
    asceVersion: analysis.asceVersion || '7-16',
    hvhz: analysis.hvhz || false,
    windSpeed: analysis.windSpeed || 140
  };
  
  const projectRequirements = {
    hvhzRequired: analysis.hvhzRequired,
    windUpliftPressure: analysis.windUpliftPressure
  };
  
  return validateJurisdictionCompliance(jurisdictionInfo, projectRequirements);
}

export function generateSOWMetadata(analysis: any) {
  // Use shared utility for consistent metadata generation
  const jurisdictionInfo: JurisdictionInfo = {
    county: analysis.county || 'Unknown',
    state: analysis.state || 'FL',
    codeCycle: analysis.codeCycle || '2020',
    asceVersion: analysis.asceVersion || '7-16',
    hvhz: analysis.hvhz || false,
    windSpeed: analysis.windSpeed || 140,
    coordinates: analysis.coordinates
  };
  
  return createSOWMetadata(jurisdictionInfo);
}

export function createPressureTable(analysis: any) {
  // Use shared utility for pressure table generation
  const windPressures = analysis.windPressures || {
    zone1Field: -45.2,
    zone1Perimeter: -60.5,
    zone2Perimeter: -72.8,
    zone3Corner: -92.1
  };
  
  const asceVersion = analysis.asceVersion || '7-16';
  return generatePressureTableData(windPressures, asceVersion);
}
