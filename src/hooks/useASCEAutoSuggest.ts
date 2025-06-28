import { useState, useEffect, useMemo } from 'react';
import stateDefaults from '../data/state-asce-defaults.json';
import { ASCERequirements } from './useASCEConfig';

export interface ProjectLocation {
  address?: string;
  city?: string;
  county?: string;
  state?: string;
  zip_code?: string;
}

export interface ASCESuggestion {
  version: string;
  wind_speed: number;
  exposure_category: string;
  building_classification: string;
  risk_category: string;
  importance_factor: number;
  hvhz_applicable: boolean;
}

export interface SuggestionResult {
  suggestion: ASCESuggestion;
  confidence: 'high' | 'medium' | 'low';
  confidence_score: number;
  reasoning: string[];
  source: 'state_specific' | 'regional' | 'fallback';
  requires_confirmation: boolean;
  special_notes?: string[];
}

export interface UseASCEAutoSuggestReturn {
  suggestion: SuggestionResult | null;
  isLoading: boolean;
  error: string | null;
  refreshSuggestion: () => void;
  getSuggestionForLocation: (location: ProjectLocation) => SuggestionResult;
}

export function useASCEAutoSuggest(location: ProjectLocation): UseASCEAutoSuggestReturn {
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSuggestionForLocation = useMemo(() => {
    return (loc: ProjectLocation): SuggestionResult => {
      try {
        // Extract state information
        const state = loc.state?.toUpperCase();
        if (!state) {
          return createFallbackSuggestion('No state provided');
        }

        // Find state configuration
        const stateConfig = stateDefaults.states[state as keyof typeof stateDefaults.states];
        if (!stateConfig) {
          return createFallbackSuggestion(`State ${state} not configured`);
        }

        // Determine region based on county or city
        const region = determineRegion(stateConfig, loc.county, loc.city);
        const regionData = stateConfig.regions[region] || stateConfig.regions[stateConfig.default_region];

        // Build suggestion
        const suggestion: ASCESuggestion = {
          version: stateConfig.default_asce_version,
          wind_speed: regionData.wind_speed,
          exposure_category: regionData.exposure_category,
          building_classification: regionData.building_classification,
          risk_category: regionData.building_classification, // Align with building class
          importance_factor: getImportanceFactorForClass(regionData.building_classification),
          hvhz_applicable: regionData.hvhz || false
        };

        // Calculate confidence
        const confidenceData = calculateConfidence(stateConfig, regionData, loc);

        // Build reasoning
        const reasoning = buildReasoning(stateConfig, regionData, region, loc);

        // Check for special requirements
        const specialNotes = gatherSpecialNotes(stateConfig, regionData);

        return {
          suggestion,
          confidence: confidenceData.level,
          confidence_score: confidenceData.score,
          reasoning,
          source: region === stateConfig.default_region ? 'state_specific' : 'regional',
          requires_confirmation: true, // Always require confirmation
          special_notes: specialNotes.length > 0 ? specialNotes : undefined
        };

      } catch (err) {
        console.error('Error generating ASCE suggestion:', err);
        return createFallbackSuggestion('Error processing location data');
      }
    };
  }, []);

  // Auto-generate suggestion when location changes
  useEffect(() => {
    if (location.state) {
      setIsLoading(true);
      try {
        const result = getSuggestionForLocation(location);
        setSuggestion(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setSuggestion(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSuggestion(null);
      setError(null);
    }
  }, [location, getSuggestionForLocation]);

  const refreshSuggestion = () => {
    if (location.state) {
      const result = getSuggestionForLocation(location);
      setSuggestion(result);
    }
  };

  return {
    suggestion,
    isLoading,
    error,
    refreshSuggestion,
    getSuggestionForLocation
  };
}

// Helper functions

function determineRegion(stateConfig: any, county?: string, city?: string): string {
  if (!county && !city) {
    return stateConfig.default_region;
  }

  // Check each region to see if county/city matches
  for (const [regionKey, regionData] of Object.entries(stateConfig.regions)) {
    const region = regionData as any;
    
    if (region.counties) {
      // Check if county matches (case insensitive, partial match)
      if (county && region.counties.some((c: string) => 
        c.toLowerCase().includes(county.toLowerCase()) || 
        county.toLowerCase().includes(c.toLowerCase())
      )) {
        return regionKey;
      }

      // Check if city is in a known county for this region
      if (city && isKnownCityInRegion(city, region.counties)) {
        return regionKey;
      }
    }
  }

  return stateConfig.default_region;
}

function isKnownCityInRegion(city: string, counties: string[]): boolean {
  // Simple city-to-county mapping for major metropolitan areas
  const cityCountyMap: Record<string, string[]> = {
    'miami': ['Miami-Dade'],
    'orlando': ['Orange'],
    'tampa': ['Hillsborough'],
    'atlanta': ['Fulton', 'DeKalb'],
    'houston': ['Harris'],
    'dallas': ['Dallas'],
    'charlotte': ['Mecklenburg'],
    'new orleans': ['Orleans']
  };

  const cityLower = city.toLowerCase();
  for (const [knownCity, knownCounties] of Object.entries(cityCountyMap)) {
    if (cityLower.includes(knownCity)) {
      return knownCounties.some(county => counties.includes(county));
    }
  }

  return false;
}

function calculateConfidence(stateConfig: any, regionData: any, location: ProjectLocation): { level: 'high' | 'medium' | 'low', score: number } {
  let score = 0;

  // State adoption confidence
  if (stateConfig.confidence === 'high') score += 40;
  else if (stateConfig.confidence === 'medium') score += 25;
  else score += 10;

  // Regional specificity
  if (location.county) score += 30;
  else if (location.city) score += 20;
  else score += 10;

  // Building code reference
  if (stateConfig.building_code && stateConfig.building_code !== 'Varies by jurisdiction') {
    score += 20;
  } else {
    score += 5;
  }

  // Special requirements clarity
  if (regionData.special_notes) score += 10;

  // Determine level
  let level: 'high' | 'medium' | 'low';
  if (score >= 80) level = 'high';
  else if (score >= 60) level = 'medium';
  else level = 'low';

  return { level, score };
}

function buildReasoning(stateConfig: any, regionData: any, region: string, location: ProjectLocation): string[] {
  const reasoning: string[] = [];

  // State adoption
  reasoning.push(`${stateConfig.name} typically uses ${stateConfig.default_asce_version}`);
  
  // Building code reference
  if (stateConfig.building_code) {
    reasoning.push(`Based on ${stateConfig.building_code}`);
  }

  // Regional considerations
  if (region !== stateConfig.default_region) {
    reasoning.push(`Regional adjustment for ${region} area`);
  }

  // Wind speed reasoning
  if (regionData.special_notes) {
    reasoning.push(regionData.special_notes);
  } else if (regionData.wind_speed > 150) {
    reasoning.push('High wind speed due to hurricane exposure');
  } else if (regionData.wind_speed < 100) {
    reasoning.push('Lower wind speed for inland/protected area');
  }

  // Exposure category reasoning
  if (regionData.exposure_category === 'B') {
    reasoning.push('Exposure B for dense urban environment');
  } else if (regionData.exposure_category === 'D') {
    reasoning.push('Exposure D for flat, unobstructed coastal area');
  }

  // HVHZ considerations
  if (regionData.hvhz) {
    reasoning.push('High-Velocity Hurricane Zone requirements apply');
  }

  return reasoning;
}

function gatherSpecialNotes(stateConfig: any, regionData: any): string[] {
  const notes: string[] = [];

  if (stateConfig.notes) {
    notes.push(stateConfig.notes);
  }

  if (regionData.special_notes) {
    notes.push(regionData.special_notes);
  }

  if (regionData.hvhz) {
    notes.push('Enhanced testing and impact resistance required for HVHZ');
  }

  return notes;
}

function getImportanceFactorForClass(classification: string): number {
  const factors: Record<string, number> = {
    'I': 0.87,
    'II': 1.0,
    'III': 1.15,
    'IV': 1.15
  };
  return factors[classification] || 1.0;
}

function createFallbackSuggestion(reason: string): SuggestionResult {
  const fallback = stateDefaults.fallback_defaults;
  
  return {
    suggestion: {
      version: fallback.asce_version,
      wind_speed: fallback.wind_speed,
      exposure_category: fallback.exposure_category,
      building_classification: fallback.building_classification,
      risk_category: fallback.building_classification,
      importance_factor: getImportanceFactorForClass(fallback.building_classification),
      hvhz_applicable: false
    },
    confidence: 'low',
    confidence_score: 30,
    reasoning: [reason, 'Using conservative default values'],
    source: 'fallback',
    requires_confirmation: true,
    special_notes: ['Manual verification strongly recommended - limited location data']
  };
}

// Export helper function for formatting suggestions
export function formatSuggestionSummary(result: SuggestionResult): string {
  const { suggestion, confidence, source } = result;
  return `${suggestion.version} | ${suggestion.wind_speed} mph | ${suggestion.exposure_category} | Class ${suggestion.building_classification} (${confidence} confidence, ${source})`;
}

// Export function to convert suggestion to ASCE requirements
export function suggestionToRequirements(
  suggestion: ASCESuggestion, 
  metadata: { source: string; confidence: string; confidence_score: number }
): ASCERequirements {
  return {
    version: suggestion.version,
    wind_speed: suggestion.wind_speed,
    exposure_category: suggestion.exposure_category,
    building_classification: suggestion.building_classification,
    risk_category: suggestion.risk_category,
    importance_factor: suggestion.importance_factor,
    hvhz_applicable: suggestion.hvhz_applicable,
    engineer_approved: false, // Always requires approval
    notes: `Auto-suggested (${metadata.confidence} confidence, ${metadata.source})`
  };
}
