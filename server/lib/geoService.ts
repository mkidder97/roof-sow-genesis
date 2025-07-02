// Geo Service Module - Externalized Geographic Analysis
// Handles jurisdiction lookups, HVHZ status, and coordinate-based queries

import { supabase } from './supabase.js';

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface JurisdictionInfo {
  county: string;
  state: string;
  city?: string;
  zipCode?: string;
  country: string;
}

export interface HVHZStatus {
  isHVHZ: boolean;
  zoneName?: string;
  county: string;
  state: string;
  codeReference?: string;
  notes?: string;
}

export interface GeoServiceConfig {
  openCageApiKey?: string;
  fallbackToLocal: boolean;
  cacheResults: boolean;
  cacheTTL: number; // minutes
}

// In-memory cache for geocoding results
const geocodeCache = new Map<string, any>();
const hvhzCache = new Map<string, HVHZStatus>();

export class GeoService {
  private config: GeoServiceConfig;

  constructor(config: Partial<GeoServiceConfig> = {}) {
    this.config = {
      openCageApiKey: process.env.OPENCAGE_API_KEY,
      fallbackToLocal: true,
      cacheResults: true,
      cacheTTL: 60,
      ...config
    };
  }

  /**
   * Get jurisdiction information from coordinates
   */
  async getJurisdiction(lat: number, lng: number): Promise<JurisdictionInfo> {
    console.log(`🌍 Getting jurisdiction for coordinates: ${lat}, ${lng}`);
    
    const cacheKey = `jurisdiction_${lat}_${lng}`;
    
    // Check cache first
    if (this.config.cacheResults && geocodeCache.has(cacheKey)) {
      const cached = geocodeCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTTL * 60 * 1000) {
        console.log('📋 Using cached jurisdiction data');
        return cached.data;
      }
    }

    try {
      // Try OpenCage API first
      if (this.config.openCageApiKey) {
        const jurisdiction = await this.getJurisdictionFromOpenCage(lat, lng);
        
        // Cache result
        if (this.config.cacheResults) {
          geocodeCache.set(cacheKey, {
            data: jurisdiction,
            timestamp: Date.now()
          });
        }
        
        return jurisdiction;
      }
      
      // Fallback to local database lookup
      if (this.config.fallbackToLocal) {
        return await this.getJurisdictionFromDatabase(lat, lng);
      }
      
      throw new Error('No geocoding service available');
      
    } catch (error) {
      console.error('❌ Jurisdiction lookup failed:', error);
      
      // Try database fallback
      if (this.config.fallbackToLocal) {
        console.log('🔄 Falling back to database lookup');
        return await this.getJurisdictionFromDatabase(lat, lng);
      }
      
      throw error;
    }
  }

  /**
   * Get HVHZ status from coordinates using Supabase database
   */
  async getHVHZStatus(lat: number, lng: number): Promise<HVHZStatus> {
    console.log(`🌪️ Checking HVHZ status for coordinates: ${lat}, ${lng}`);
    
    const cacheKey = `hvhz_${lat}_${lng}`;
    
    // Check cache first
    if (this.config.cacheResults && hvhzCache.has(cacheKey)) {
      const cached = hvhzCache.get(cacheKey);
      if (Date.now() - (cached as any).timestamp < this.config.cacheTTL * 60 * 1000) {
        console.log('📋 Using cached HVHZ data');
        return cached;
      }
    }

    try {
      const { data, error } = await supabase
        .rpc('is_hvhz_location', { 
          lat: Number(lat), 
          lng: Number(lng) 
        });

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      let hvhzStatus: HVHZStatus;

      if (data && data.length > 0) {
        const result = data[0];
        hvhzStatus = {
          isHVHZ: result.is_hvhz || false,
          zoneName: result.zone_name,
          county: result.county,
          state: result.state,
        };
      } else {
        // No zone found - default to non-HVHZ
        const jurisdiction = await this.getJurisdiction(lat, lng);
        hvhzStatus = {
          isHVHZ: false,
          county: jurisdiction.county,
          state: jurisdiction.state,
          notes: 'Location not in database - defaulted to non-HVHZ'
        };
      }

      // Cache result
      if (this.config.cacheResults) {
        (hvhzStatus as any).timestamp = Date.now();
        hvhzCache.set(cacheKey, hvhzStatus);
      }

      console.log(`✅ HVHZ Status: ${hvhzStatus.isHVHZ ? 'HVHZ' : 'Standard'} in ${hvhzStatus.county}, ${hvhzStatus.state}`);
      return hvhzStatus;

    } catch (error) {
      console.error('❌ HVHZ status lookup failed:', error);
      
      // Graceful fallback
      const jurisdiction = await this.getJurisdiction(lat, lng);
      return {
        isHVHZ: false,
        county: jurisdiction.county,
        state: jurisdiction.state,
        notes: `HVHZ lookup failed: ${error.message}`
      };
    }
  }

  /**
   * Get coordinates from address string
   */
  async getCoordinatesFromAddress(address: string): Promise<GeoLocation> {
    console.log(`📍 Geocoding address: ${address}`);
    
    if (!this.config.openCageApiKey) {
      throw new Error('OpenCage API key required for address geocoding');
    }

    const cacheKey = `geocode_${address}`;
    
    // Check cache
    if (this.config.cacheResults && geocodeCache.has(cacheKey)) {
      const cached = geocodeCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTTL * 60 * 1000) {
        return cached.data;
      }
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodedAddress}&key=${this.config.openCageApiKey}&limit=1&country=US`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`OpenCage API error: ${data.status?.message || 'Unknown error'}`);
      }
      
      if (!data.results || data.results.length === 0) {
        throw new Error(`No geocoding results found for address: ${address}`);
      }
      
      const result = data.results[0];
      const coordinates = {
        latitude: result.geometry.lat,
        longitude: result.geometry.lng
      };
      
      // Cache result
      if (this.config.cacheResults) {
        geocodeCache.set(cacheKey, {
          data: coordinates,
          timestamp: Date.now()
        });
      }
      
      console.log(`✅ Geocoded to: ${coordinates.latitude}, ${coordinates.longitude}`);
      return coordinates;
      
    } catch (error) {
      console.error('❌ Address geocoding failed:', error);
      throw error;
    }
  }

  /**
   * Get jurisdiction from OpenCage API
   */
  private async getJurisdictionFromOpenCage(lat: number, lng: number): Promise<JurisdictionInfo> {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${this.config.openCageApiKey}&limit=1&country=US`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenCage API error: ${data.status?.message || 'Unknown error'}`);
    }
    
    if (!data.results || data.results.length === 0) {
      throw new Error(`No reverse geocoding results found for coordinates: ${lat}, ${lng}`);
    }
    
    const result = data.results[0];
    const components = result.components;
    
    return {
      county: components.county || components.state_district || '',
      state: components.state_code || components.state || '',
      city: components.city || components.town || components.village || '',
      zipCode: components.postcode || '',
      country: components.country_code?.toUpperCase() || 'US'
    };
  }

  /**
   * Get jurisdiction from local database as fallback
   */
  private async getJurisdictionFromDatabase(lat: number, lng: number): Promise<JurisdictionInfo> {
    try {
      const { data, error } = await supabase
        .rpc('get_county_from_coordinates', { 
          lat: Number(lat), 
          lng: Number(lng) 
        });

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      if (data && data.length > 0) {
        const result = data[0];
        return {
          county: result.county,
          state: result.state,
          city: '',
          zipCode: '',
          country: 'US'
        };
      }
      
      // Ultimate fallback for Florida coordinates
      if (lat >= 24.5 && lat <= 31 && lng >= -87.5 && lng <= -79.8) {
        return {
          county: 'Unknown',
          state: 'FL',
          city: '',
          zipCode: '',
          country: 'US'
        };
      }
      
      throw new Error('Location not found in database');
      
    } catch (error) {
      console.error('❌ Database jurisdiction lookup failed:', error);
      throw error;
    }
  }

  /**
   * Validate coordinates
   */
  private validateCoordinates(lat: number, lng: number): void {
    if (lat < -90 || lat > 90) {
      throw new Error(`Invalid latitude: ${lat}. Must be between -90 and 90.`);
    }
    if (lng < -180 || lng > 180) {
      throw new Error(`Invalid longitude: ${lng}. Must be between -180 and 180.`);
    }
  }

  /**
   * Clear caches (useful for testing or memory management)
   */
  clearCaches(): void {
    geocodeCache.clear();
    hvhzCache.clear();
    console.log('🧹 Geo service caches cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { geocode: number; hvhz: number } {
    return {
      geocode: geocodeCache.size,
      hvhz: hvhzCache.size
    };
  }
}

// Factory function for creating geo service
export function createGeoService(config?: Partial<GeoServiceConfig>): GeoService {
  return new GeoService(config);
}

// Default instance
export const geoService = createGeoService();

// Utility functions for common operations
export async function getJurisdictionFromAddress(address: string): Promise<JurisdictionInfo> {
  const coordinates = await geoService.getCoordinatesFromAddress(address);
  return await geoService.getJurisdiction(coordinates.latitude, coordinates.longitude);
}

export async function getHVHZFromAddress(address: string): Promise<HVHZStatus> {
  const coordinates = await geoService.getCoordinatesFromAddress(address);
  return await geoService.getHVHZStatus(coordinates.latitude, coordinates.longitude);
}

// Health check function
export async function checkGeoServiceHealth(): Promise<{
  status: string;
  openCageApiKey: boolean;
  databaseConnection: boolean;
  cacheStats: { geocode: number; hvhz: number };
}> {
  try {
    // Test database connection
    const { data, error } = await supabase.from('hvhz_zones').select('count').limit(1);
    const databaseConnection = !error;
    
    return {
      status: 'operational',
      openCageApiKey: !!process.env.OPENCAGE_API_KEY,
      databaseConnection,
      cacheStats: geoService.getCacheStats()
    };
  } catch (error) {
    return {
      status: 'degraded',
      openCageApiKey: !!process.env.OPENCAGE_API_KEY,
      databaseConnection: false,
      cacheStats: { geocode: 0, hvhz: 0 }
    };
  }
}
