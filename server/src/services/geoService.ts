import { supabase } from '../config/supabase';
import type {
  Coordinates,
  JurisdictionInfo,
  HVHZStatus,
  HVHZZone,
  GeoServiceResult,
  GeoServiceConfig,
  OpenCageResponse,
  HVHZZoneRecord,
  PostgresHVHZResult,
  CacheEntry,
  GeoCacheKey
} from '../types/geo-wind';

/**
 * Geographic Service
 * Provides jurisdiction lookup and HVHZ status determination
 */
class GeoService {
  private cache = new Map<string, CacheEntry<any>>();
  private config: GeoServiceConfig = {
    openCageApiKey: process.env.OPENCAGE_API_KEY,
    cacheTimeout: 1000 * 60 * 60 * 24, // 24 hours
    maxRetries: 3,
    rateLimitDelay: 1000, // 1 second
    enableFallback: true
  };

  /**
   * Get jurisdiction information for coordinates
   */
  async getJurisdiction(lat: number, lng: number): Promise<GeoServiceResult<JurisdictionInfo>> {
    try {
      // Validate coordinates
      if (!this.isValidCoordinates(lat, lng)) {
        return {
          success: false,
          error: 'Invalid coordinates provided',
          source: 'internal',
          timestamp: new Date().toISOString()
        };
      }

      // Check cache first
      const cacheKey = this.generateCacheKey({ type: 'reverse', lat, lng });
      const cached = this.getFromCache<JurisdictionInfo>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          source: 'cache',
          timestamp: new Date().toISOString()
        };
      }

      // Try internal database first (for known jurisdictions)
      const internalResult = await this.getJurisdictionFromDatabase(lat, lng);
      if (internalResult.success && internalResult.data) {
        this.setCache(cacheKey, internalResult.data);
        return {
          ...internalResult,
          source: 'supabase',
          timestamp: new Date().toISOString()
        };
      }

      // Fallback to OpenCage API
      if (this.config.openCageApiKey && this.config.enableFallback) {
        const openCageResult = await this.getJurisdictionFromOpenCage(lat, lng);
        if (openCageResult.success && openCageResult.data) {
          this.setCache(cacheKey, openCageResult.data);
          return {
            ...openCageResult,
            source: 'opencage',
            timestamp: new Date().toISOString()
          };
        }
      }

      // If all methods fail, provide basic fallback
      const fallbackData: JurisdictionInfo = {
        county: 'Unknown',
        state: 'Unknown',
        country: 'US'
      };

      return {
        success: true,
        data: fallbackData,
        source: 'internal',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('GeoService.getJurisdiction error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'internal',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get HVHZ status for coordinates
   */
  async getHVHZStatus(lat: number, lng: number): Promise<GeoServiceResult<HVHZStatus>> {
    try {
      // Validate coordinates
      if (!this.isValidCoordinates(lat, lng)) {
        return {
          success: false,
          error: 'Invalid coordinates provided',
          source: 'internal',
          timestamp: new Date().toISOString()
        };
      }

      // Check cache first
      const cacheKey = `hvhz:${lat.toFixed(6)},${lng.toFixed(6)}`;
      const cached = this.getFromCache<HVHZStatus>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          source: 'cache',
          timestamp: new Date().toISOString()
        };
      }

      // Query HVHZ zones from database
      const hvhzResult = await this.queryHVHZFromDatabase(lat, lng);
      
      if (hvhzResult.success && hvhzResult.data) {
        this.setCache(cacheKey, hvhzResult.data);
        return {
          ...hvhzResult,
          source: 'supabase',
          timestamp: new Date().toISOString()
        };
      }

      // Default non-HVHZ status
      const defaultStatus: HVHZStatus = {
        isHVHZ: false,
        isWBDR: false
      };

      return {
        success: true,
        data: defaultStatus,
        source: 'internal',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('GeoService.getHVHZStatus error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'internal',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get jurisdiction from internal database
   */
  private async getJurisdictionFromDatabase(lat: number, lng: number): Promise<GeoServiceResult<JurisdictionInfo>> {
    try {
      // Query HVHZ zones to get county/state information
      const { data, error } = await supabase
        .from('hvhz_zones')
        .select('county, state, zone_name')
        .gte('bbox_north', lat)
        .lte('bbox_south', lat)
        .gte('bbox_east', lng)
        .lte('bbox_west', lng)
        .limit(1);

      if (error) {
        return {
          success: false,
          error: error.message,
          source: 'supabase',
          timestamp: new Date().toISOString()
        };
      }

      if (data && data.length > 0) {
        const zone = data[0];
        const jurisdiction: JurisdictionInfo = {
          county: zone.county,
          state: zone.state,
          country: 'US'
        };

        return {
          success: true,
          data: jurisdiction,
          source: 'supabase',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: false,
        error: 'No jurisdiction data found in database',
        source: 'supabase',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database error',
        source: 'supabase',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get jurisdiction from OpenCage API
   */
  private async getJurisdictionFromOpenCage(lat: number, lng: number): Promise<GeoServiceResult<JurisdictionInfo>> {
    try {
      if (!this.config.openCageApiKey) {
        throw new Error('OpenCage API key not configured');
      }

      const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${this.config.openCageApiKey}&no_annotations=1&language=en`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenCage API error: ${response.status}`);
      }

      const data: OpenCageResponse = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const components = result.components;

        const jurisdiction: JurisdictionInfo = {
          county: components.county || 'Unknown',
          state: components.state || components.state_code || 'Unknown',
          country: components.country_code?.toUpperCase() || 'US',
          city: components.city || components.town || components.village,
          zipCode: components.postcode
        };

        return {
          success: true,
          data: jurisdiction,
          source: 'opencage',
          timestamp: new Date().toISOString()
        };
      }

      throw new Error('No results from OpenCage API');

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OpenCage API error',
        source: 'opencage',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Query HVHZ status from database
   */
  private async queryHVHZFromDatabase(lat: number, lng: number): Promise<GeoServiceResult<HVHZStatus>> {
    try {
      // Use the PostgreSQL function for HVHZ detection
      const { data, error } = await supabase.rpc('is_point_in_hvhz', {
        lat: lat,
        lng: lng
      });

      if (error) {
        console.error('Database HVHZ query error:', error);
        return {
          success: false,
          error: error.message,
          source: 'supabase',
          timestamp: new Date().toISOString()
        };
      }

      if (data && data.length > 0) {
        const result: PostgresHVHZResult = data[0];
        
        let hvhzZone: HVHZZone | undefined;
        if (result.in_hvhz && result.zone_info) {
          hvhzZone = {
            id: 'db-zone',
            zoneName: result.zone_info.zone_name || 'Unknown Zone',
            county: result.zone_info.county || 'Unknown',
            state: result.zone_info.state || 'FL',
            zoneType: result.zone_info.zone_type || 'hvhz',
            windSpeedBasic: result.zone_info.wind_speed_basic || 175,
            windSpeedUltimate: result.zone_info.wind_speed_ultimate,
            description: result.zone_info.description,
            effectiveDate: new Date().toISOString().split('T')[0],
            asceVersion: '7-22'
          };
        }

        const hvhzStatus: HVHZStatus = {
          isHVHZ: result.in_hvhz,
          isWBDR: result.in_hvhz || (hvhzZone?.zoneType === 'wbdr'),
          zone: hvhzZone
        };

        return {
          success: true,
          data: hvhzStatus,
          source: 'supabase',
          timestamp: new Date().toISOString()
        };
      }

      // Default non-HVHZ response
      return {
        success: true,
        data: { isHVHZ: false, isWBDR: false },
        source: 'supabase',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database query error',
        source: 'supabase',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate coordinates
   */
  private isValidCoordinates(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      !isNaN(lat) &&
      !isNaN(lng)
    );
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(params: GeoCacheKey): string {
    if (params.type === 'reverse' && params.lat !== undefined && params.lng !== undefined) {
      return `reverse:${params.lat.toFixed(6)},${params.lng.toFixed(6)}`;
    }
    if (params.type === 'forward' && params.address) {
      return `forward:${params.address.toLowerCase().trim()}`;
    }
    return 'unknown';
  }

  /**
   * Get data from cache
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiry) {
      return entry.data as T;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Set data in cache
   */
  private setCache<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + this.config.cacheTimeout,
      source: 'cache'
    };
    this.cache.set(key, entry);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const geoService = new GeoService();

// Export individual functions for convenience
export const getJurisdiction = geoService.getJurisdiction.bind(geoService);
export const getHVHZStatus = geoService.getHVHZStatus.bind(geoService);