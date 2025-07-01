
import { useState, useEffect } from 'react';

export interface ProjectLocation {
  state?: string;
  city?: string;
  county?: string;
}

export interface ASCESuggestion {
  suggestion: {
    version: string;
    wind_speed: number;
    exposure_category: string;
    building_classification: string;
    risk_category: string;
    importance_factor: number;
  };
  confidence: 'high' | 'medium' | 'low';
  confidence_score: number;
  source: string;
  reasoning: string[];
  special_notes: string[];
}

export const useASCEAutoSuggest = (location: ProjectLocation) => {
  const [suggestion, setSuggestion] = useState<ASCESuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestion = () => {
    if (!location.state) {
      setSuggestion(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Mock suggestion based on location - replace with real API call
    setTimeout(() => {
      try {
        const mockSuggestion: ASCESuggestion = {
          suggestion: {
            version: 'ASCE 7-22',
            wind_speed: location.state === 'FL' ? 175 : 140,
            exposure_category: 'C',
            building_classification: 'II',
            risk_category: 'II',
            importance_factor: 1.0,
          },
          confidence: 'high',
          confidence_score: 85,
          source: 'Jurisdiction Database',
          reasoning: [
            `Based on ${location.state} building codes`,
            'Standard commercial building classification',
            'Typical suburban exposure category'
          ],
          special_notes: location.state === 'FL' ? ['High wind zone requirements apply'] : []
        };

        setSuggestion(mockSuggestion);
      } catch (err) {
        setError('Failed to generate suggestion');
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  const refreshSuggestion = () => {
    generateSuggestion();
  };

  useEffect(() => {
    generateSuggestion();
  }, [location.state, location.city, location.county]);

  return {
    suggestion,
    isLoading,
    error,
    refreshSuggestion
  };
};

export const formatSuggestionSummary = (suggestion: ASCESuggestion): string => {
  return `${suggestion.suggestion.version}, ${suggestion.suggestion.wind_speed} mph, Exp ${suggestion.suggestion.exposure_category}, Class ${suggestion.suggestion.building_classification}`;
};

export const suggestionToRequirements = (suggestion: ASCESuggestion['suggestion'], metadata: { source: string; confidence: string; confidence_score: number }) => {
  return {
    version: suggestion.version,
    wind_speed: suggestion.wind_speed,
    exposure_category: suggestion.exposure_category,
    building_classification: suggestion.building_classification,
    risk_category: suggestion.risk_category,
    importance_factor: suggestion.importance_factor,
    notes: `Auto-suggested based on ${metadata.source} (${metadata.confidence} confidence, ${metadata.confidence_score}%)`
  };
};
