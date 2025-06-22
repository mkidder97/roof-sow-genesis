// Enhanced Building Code and Jurisdiction Mapping
import fs from 'fs/promises';
import path from 'path';
import { JurisdictionData, GeocodeResult } from '../types';

interface ASCEMappingData {
  states: Record<string, {
    defaultCode: string;
    defaultASCE: string;
    counties: Record<string, {
      codeCycle: string;
      asceVersion: string;
      hvhz: boolean;
      windSpeed: number;
      specialRequirements?: string[];
    }>;
  }>;
  windSpeedDefaults: Record<string, number>;
  asceVersions: Record<string, {
    pressureCoefficients: Record<string, number>;
  }>;
  exposureCategories: Record<string, any>;
}

let cachedASCEData: ASCEMappingData | null = null;

async function loadASCEMappingData(): Promise<ASCEMappingData> {
  if (cachedASCEData) {
    return cachedASCEData;
  }

  try {
    const dataPath = path.join(__dirname, '../data/asce-mapping.json');
    const rawData = await fs.readFile(dataPath, 'utf-8');
    // Remove comments from JSON
    const cleanedData = rawData.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    cachedASCEData = JSON.parse(cleanedData);
    return cachedASCEData!;
  } catch (error) {
    console.error('Error loading ASCE mapping data:', error);
    throw new Error('Failed to load jurisdiction mapping data');
  }
}

/**
 * Get jurisdiction data from address
 * This function converts an address to city/county/state using geocoding
 */
export async function getJurisdictionFromAddress(address: string): Promise<{ city: string; county: string; state: string }> {
  const { geocodeAddress } = await import('./geocoding');
  
  try {
    const geocodeResult = await geocodeAddress(address);
    
    return {
      city: geocodeResult.city,
      county: geocodeResult.county,
      state: geocodeResult.state
    };
  } catch (error) {
    console.error('Failed to geocode address:', error);
    throw new Error(`Failed to determine jurisdiction for address: ${address}`);
  }
}

/**
 * Get code data for a specific jurisdiction
 * Returns ASCE version, code cycle, and HVHZ status
 */
export async function getCodeData(jurisdiction: { city: string; county: string; state: string }): Promise<{
  asce: string;
  codeCycle: string;
  hvhz: boolean;
  windSpeed?: number;
  specialRequirements?: string[];
}> {
  const asceData = await loadASCEMappingData();
  const { county, state } = jurisdiction;
  
  console.log(`🔍 Looking up jurisdiction: ${county}, ${state}`);
  
  const stateData = asceData.states[state];
  
  if (!stateData) {
    console.warn(`⚠️ No jurisdiction mapping found for state: ${state}, using defaults`);
    return {
      asce: 'ASCE 7-16',
      codeCycle: '2021 IBC',
      hvhz: false,
      windSpeed: 115
    };
  }
  
  // Check for specific county mapping
  const countyData = stateData.counties[county];
  
  if (countyData) {
    console.log(`✅ Found specific county mapping: ${county}, ${state}`);
    return {
      asce: `ASCE ${countyData.asceVersion}`,
      codeCycle: countyData.codeCycle,
      hvhz: countyData.hvhz,
      windSpeed: countyData.windSpeed,
      specialRequirements: countyData.specialRequirements
    };
  } else {
    console.log(`📋 Using state default for: ${county}, ${state}`);
    return {
      asce: `ASCE ${stateData.defaultASCE}`,
      codeCycle: stateData.defaultCode,
      hvhz: false, // Default to false unless specifically mapped
      windSpeed: asceData.windSpeedDefaults.default
    };
  }
}

/**
 * Enhanced jurisdiction data lookup with full metadata
 */
export async function getJurisdictionData(county: string, state: string): Promise<JurisdictionData & {
  windSpeed?: number;
  specialRequirements?: string[];
}> {
  const codeData = await getCodeData({ city: '', county, state });
  
  // Extract version number from ASCE string (e.g., "ASCE 7-16" -> "7-16")
  const asceVersion = codeData.asce.replace('ASCE ', '') as '7-10' | '7-16' | '7-22';
  
  const result = {
    codeCycle: codeData.codeCycle,
    asceVersion,
    hvhz: codeData.hvhz,
    windSpeed: codeData.windSpeed,
    specialRequirements: codeData.specialRequirements
  };
  
  console.log(`📋 Jurisdiction Data: ${county}, ${state} → ${result.codeCycle}, ${result.asceVersion}, HVHZ: ${result.hvhz}`);
  
  return result;
}

/**
 * Helper function to check if a location requires HVHZ compliance
 */
export function isHVHZLocation(county: string, state: string): boolean {
  // Quick check for Florida HVHZ counties
  if (state !== 'FL') return false;
  
  const hvhzCounties = [
    'Miami-Dade County',
    'Broward County', 
    'Monroe County',
    'Palm Beach County'
  ];
  
  return hvhzCounties.includes(county);
}

/**
 * Helper function to get ASCE version based on code cycle
 */
export function getASCEVersion(codeCycle: string): '7-10' | '7-16' | '7-22' {
  if (codeCycle.includes('2023') || codeCycle.includes('2022')) {
    return '7-22';
  } else if (codeCycle.includes('2021') || codeCycle.includes('2020') || codeCycle.includes('2018')) {
    return '7-16';
  } else {
    return '7-10';
  }
}

/**
 * Get wind pressure coefficients for specific ASCE version
 */
export async function getWindPressureCoefficients(asceVersion: '7-10' | '7-16' | '7-22'): Promise<Record<string, number>> {
  const asceData = await loadASCEMappingData();
  return asceData.asceVersions[asceVersion]?.pressureCoefficients || asceData.asceVersions['7-16'].pressureCoefficients;
}

/**
 * Create jurisdiction summary for metadata
 */
export async function createJurisdictionSummary(address: string): Promise<{
  address: string;
  jurisdiction: {
    city: string;
    county: string;
    state: string;
    codeCycle: string;
    asceVersion: string;
    hvhz: boolean;
  };
  reasoning: string;
  appliedMethod: string;
}> {
  try {
    const jurisdiction = await getJurisdictionFromAddress(address);
    const codeData = await getCodeData(jurisdiction);
    
    const summary = {
      address,
      jurisdiction: {
        ...jurisdiction,
        codeCycle: codeData.codeCycle,
        asceVersion: codeData.asce,
        hvhz: codeData.hvhz
      },
      reasoning: `Based on address geocoding to ${jurisdiction.county}, ${jurisdiction.state}, applied local jurisdiction mapping`,
      appliedMethod: `Used ${codeData.asce} wind pressure calculations with ${codeData.codeCycle} building code requirements`
    };
    
    console.log(`📊 Jurisdiction Summary Created:`, summary);
    return summary;
    
  } catch (error) {
    console.error('Error creating jurisdiction summary:', error);
    throw error;
  }
}
