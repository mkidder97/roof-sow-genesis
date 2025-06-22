// Comprehensive Jurisdiction Analysis Utility
// This module provides integrated jurisdiction and wind analysis for SOW generation

import { GeocodeResult, WindAnalysisParams, WindAnalysisResult } from '../types';
import { getJurisdictionFromAddress, getCodeData, createJurisdictionSummary } from './jurisdiction-mapping';
import { geocodeAddress } from './geocoding';
import { calculateWindPressures, determineExposureCategory, createWindAnalysisSummary } from './wind-analysis';

export interface ComprehensiveJurisdictionAnalysis {
  // Basic location data
  address: string;
  geocoding: GeocodeResult;
  
  // Jurisdiction determination
  jurisdiction: {
    city: string;
    county: string;
    state: string;
    codeCycle: string;
    asceVersion: string;
    hvhz: boolean;
    windSpeed?: number;
    specialRequirements?: string[];
  };
  
  // Wind analysis
  windAnalysis: {
    designWindSpeed: number;
    exposureCategory: string;
    elevation: number;
    asceVersion: '7-10' | '7-16' | '7-22';
    zonePressures: {
      zone1Field: number;
      zone1Perimeter: number;
      zone2Perimeter: number;
      zone3Corner: number;
    };
    calculationFactors: {
      Kh: number;
      Kzt: number;
      Kd: number;
      qh: number;
    };
  };
  
  // Summary metadata
  summary: {
    appliedMethod: string;
    reasoning: string;
    compliance: {
      hvhzRequired: boolean;
      specialRequirements: string[];
      codeReferences: string[];
    };
  };
}

/**
 * Perform comprehensive jurisdiction and wind analysis for a given address
 * This is the main entry point for jurisdiction-based SOW generation
 */
export async function performComprehensiveAnalysis(
  address: string,
  buildingHeight: number = 30,
  exposureCategory?: 'B' | 'C' | 'D'
): Promise<ComprehensiveJurisdictionAnalysis> {
  console.log(`🔍 Starting comprehensive analysis for: ${address}`);
  
  try {
    // Step 1: Geocode address to get coordinates and basic location info
    console.log('📍 Step 1: Geocoding address...');
    const geocoding = await geocodeAddress(address);
    
    // Step 2: Determine jurisdiction and applicable codes
    console.log('📋 Step 2: Determining jurisdiction and codes...');
    const jurisdictionData = await getCodeData({
      city: geocoding.city,
      county: geocoding.county,
      state: geocoding.state
    });
    
    // Step 3: Determine exposure category if not provided
    const finalExposureCategory = exposureCategory || determineExposureCategory(
      undefined,
      { lat: geocoding.latitude, lng: geocoding.longitude }
    );
    
    // Step 4: Calculate wind pressures using jurisdiction-specific ASCE version
    console.log(`💨 Step 3: Calculating wind pressures using ${jurisdictionData.asce}...`);
    const asceVersion = jurisdictionData.asce.replace('ASCE ', '') as '7-10' | '7-16' | '7-22';
    
    const windParams: WindAnalysisParams = {
      latitude: geocoding.latitude,
      longitude: geocoding.longitude,
      elevation: geocoding.elevation,
      exposureCategory: finalExposureCategory,
      buildingHeight,
      asceVersion
    };
    
    const windAnalysis = await calculateWindPressures(windParams);
    
    // Step 5: Create detailed wind analysis summary
    const windSummary = await createWindAnalysisSummary(windParams, windAnalysis);
    
    // Step 6: Compile comprehensive analysis
    const analysis: ComprehensiveJurisdictionAnalysis = {
      address,
      geocoding,
      jurisdiction: {
        city: geocoding.city,
        county: geocoding.county,
        state: geocoding.state,
        codeCycle: jurisdictionData.codeCycle,
        asceVersion: jurisdictionData.asce,
        hvhz: jurisdictionData.hvhz,
        windSpeed: jurisdictionData.windSpeed,
        specialRequirements: jurisdictionData.specialRequirements || []
      },
      windAnalysis: {
        designWindSpeed: windAnalysis.designWindSpeed,
        exposureCategory: windAnalysis.exposureCategory,
        elevation: windAnalysis.elevation,
        asceVersion,
        zonePressures: windAnalysis.zonePressures,
        calculationFactors: windSummary.calculationFactors
      },
      summary: {
        appliedMethod: windSummary.method,
        reasoning: `Based on ${geocoding.county}, ${geocoding.state} jurisdiction: Applied ${jurisdictionData.codeCycle} with ${jurisdictionData.asce} wind methodology`,
        compliance: {
          hvhzRequired: jurisdictionData.hvhz,
          specialRequirements: jurisdictionData.specialRequirements || [],
          codeReferences: [
            jurisdictionData.codeCycle,
            jurisdictionData.asce,
            ...(jurisdictionData.hvhz ? ['HVHZ Compliance Required', 'FL Product Approval Required'] : [])
          ]
        }
      }
    };
    
    console.log(`✅ Comprehensive analysis completed for ${geocoding.county}, ${geocoding.state}`);
    console.log(`📊 Result: ${analysis.jurisdiction.codeCycle} | ${analysis.jurisdiction.asceVersion} | HVHZ: ${analysis.jurisdiction.hvhz}`);
    console.log(`💨 Wind: ${analysis.windAnalysis.designWindSpeed}mph | Zone 3: ${Math.abs(analysis.windAnalysis.zonePressures.zone3Corner).toFixed(1)}psf`);
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Error in comprehensive analysis:', error);
    throw new Error(`Failed to perform comprehensive jurisdiction analysis: ${error.message}`);
  }
}

/**
 * Quick jurisdiction lookup for existing geocoded locations
 */
export async function quickJurisdictionLookup(
  county: string,
  state: string
): Promise<{
  codeCycle: string;
  asceVersion: string;
  hvhz: boolean;
  windSpeed?: number;
  specialRequirements?: string[];
}> {
  const codeData = await getCodeData({ city: '', county, state });
  return codeData;
}

/**
 * Validate jurisdiction data and provide recommendations
 */
export function validateJurisdictionCompliance(analysis: ComprehensiveJurisdictionAnalysis): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
  requiredActions: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const requiredActions: string[] = [];
  
  // HVHZ Compliance Checks
  if (analysis.jurisdiction.hvhz) {
    requiredActions.push('Florida Product Approval (NOA/ESR) required for all roof components');
    requiredActions.push('HVHZ-compliant installation methods required');
    
    if (analysis.windAnalysis.designWindSpeed >= 180) {
      warnings.push(`High wind speed (${analysis.windAnalysis.designWindSpeed}mph) requires enhanced fastening`);
      recommendations.push('Consider increased fastener density beyond minimum requirements');
    }
    
    if (analysis.jurisdiction.specialRequirements?.includes('TAS-100')) {
      requiredActions.push('TAS-100 impact resistance testing required');
    }
    
    if (analysis.jurisdiction.specialRequirements?.includes('Third-Party-Inspection')) {
      requiredActions.push('Third-party inspection required during installation');
    }
  }
  
  // Wind Pressure Checks
  const cornerPressure = Math.abs(analysis.windAnalysis.zonePressures.zone3Corner);
  if (cornerPressure > 100) {
    warnings.push(`High corner wind pressure (${cornerPressure.toFixed(1)}psf) may require special fastening`);
    recommendations.push('Verify manufacturer system ratings exceed calculated pressures');
  }
  
  // Elevation Checks
  if (analysis.geocoding.elevation > 2000) {
    warnings.push(`High elevation (${analysis.geocoding.elevation}ft) may affect wind pressures`);
    recommendations.push('Consider topographic wind effects in detailed design');
  }
  
  // Exposure Category Validation
  if (analysis.windAnalysis.exposureCategory === 'D') {
    warnings.push('Exposure D (coastal) requires enhanced wind resistance');
    recommendations.push('Consider corrosion-resistant fasteners for coastal environment');
  }
  
  const isValid = requiredActions.length === 0 || analysis.jurisdiction.hvhz;
  
  return {
    isValid,
    warnings,
    recommendations,
    requiredActions
  };
}

/**
 * Generate summary metadata for SOW documents
 */
export function generateSOWMetadata(analysis: ComprehensiveJurisdictionAnalysis): {
  projectLocation: string;
  appliedCodes: string[];
  windCriteria: string;
  complianceNotes: string[];
  engineeringBasis: string;
} {
  const validation = validateJurisdictionCompliance(analysis);
  
  return {
    projectLocation: `${analysis.jurisdiction.city}, ${analysis.jurisdiction.county}, ${analysis.jurisdiction.state}`,
    appliedCodes: [
      analysis.jurisdiction.codeCycle,
      analysis.jurisdiction.asceVersion,
      ...(analysis.jurisdiction.hvhz ? ['HVHZ Requirements'] : [])
    ],
    windCriteria: `${analysis.windAnalysis.designWindSpeed}mph basic wind speed, Exposure ${analysis.windAnalysis.exposureCategory}, per ${analysis.jurisdiction.asceVersion}`,
    complianceNotes: [
      ...validation.requiredActions,
      ...validation.warnings,
      ...validation.recommendations
    ],
    engineeringBasis: `Wind pressures calculated per ${analysis.jurisdiction.asceVersion} methodology for ${analysis.jurisdiction.codeCycle} compliance`
  };
}

/**
 * Create formatted pressure table for SOW documents
 */
export function createPressureTable(analysis: ComprehensiveJurisdictionAnalysis): {
  title: string;
  method: string;
  zones: Array<{
    zone: string;
    description: string;
    pressure: string;
    units: string;
  }>;
} {
  const { zonePressures } = analysis.windAnalysis;
  const { asceVersion } = analysis.windAnalysis;
  
  // Format pressures as positive values with "psf" units
  const zones = [];
  
  if (asceVersion === '7-16' || asceVersion === '7-22') {
    zones.push(
      {
        zone: "Zone 1'",
        description: "Field (interior)",
        pressure: Math.abs(zonePressures.zone1Field).toFixed(1),
        units: "psf"
      },
      {
        zone: "Zone 1",
        description: "Perimeter (inner)",
        pressure: Math.abs(zonePressures.zone1Perimeter).toFixed(1),
        units: "psf"
      },
      {
        zone: "Zone 2", 
        description: "Perimeter (outer)",
        pressure: Math.abs(zonePressures.zone2Perimeter).toFixed(1),
        units: "psf"
      },
      {
        zone: "Zone 3",
        description: "Corner",
        pressure: Math.abs(zonePressures.zone3Corner).toFixed(1),
        units: "psf"
      }
    );
  } else {
    zones.push(
      {
        zone: "Zone 1",
        description: "Field",
        pressure: Math.abs(zonePressures.zone1Field).toFixed(1),
        units: "psf"
      },
      {
        zone: "Zone 2",
        description: "Perimeter",
        pressure: Math.abs(zonePressures.zone2Perimeter).toFixed(1),
        units: "psf"
      },
      {
        zone: "Zone 3",
        description: "Corner", 
        pressure: Math.abs(zonePressures.zone3Corner).toFixed(1),
        units: "psf"
      }
    );
  }
  
  return {
    title: `Wind Uplift Pressures - ${analysis.jurisdiction.asceVersion}`,
    method: `Calculated per ${analysis.jurisdiction.asceVersion} for ${analysis.windAnalysis.designWindSpeed}mph wind speed`,
    zones
  };
}
