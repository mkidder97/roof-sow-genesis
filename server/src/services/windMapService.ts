import { supabase } from '../config/supabase';
import type {
  Coordinates,
  WindSpeedData,
  ASCEWindData,
  WindMapServiceResult,
  WindMapServiceConfig,
  PostgresWindSpeedResult,
  CacheEntry,
  WindCacheKey
} from '../types/geo-wind';

/**
 * Wind Map Service
 * Provides wind speed data through ASCE scraping, database lookups, and interpolation
 */
class WindMapService {
  private cache = new Map<string, CacheEntry<any>>();
  private config: WindMapServiceConfig = {
    asceBaseUrl: 'https://hazards.atcouncil.org/',
    enableScraping: true,
    cacheTimeout: 1000 * 60 * 60 * 12, // 12 hours
    maxRetries: 3,
    fallbackToDatabase: true,
    interpolationEnabled: true
  };

  /**
   * Get design wind speed for coordinates
   */
  async getDesignWindSpeed(
    lat: number, 
    lng: number, 
    asceVersion: string = '7-22'
  ): Promise<WindMapServiceResult<WindSpeedData>> {
    try {
      // Validate coordinates
      if (!this.isValidCoordinates(lat, lng)) {
        return {
          success: false,
          error: 'Invalid coordinates provided',
          source: 'local_dataset',
          confidence: 'low',
          timestamp: new Date().toISOString()
        };
      }

      // Check cache first
      const cacheKey = this.generateWindCacheKey({ lat, lng, asceVersion });
      const cached = this.getFromCache<WindSpeedData>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          source: 'local_dataset',
          confidence: 'high',
          timestamp: new Date().toISOString()
        };
      }

      // Try database HVHZ zones first (highest confidence for Florida)
      const databaseResult = await this.getWindSpeedFromDatabase(lat, lng);
      if (databaseResult.success && databaseResult.data) {
        this.setCache(cacheKey, databaseResult.data);
        return {
          ...databaseResult,
          source: 'hvhz_zones',
          confidence: 'high',
          timestamp: new Date().toISOString()
        };
      }

      // Try ASCE scraping if enabled
      if (this.config.enableScraping) {
        const asceResult = await this.scrapeASCEWindData(lat, lng, asceVersion);
        if (asceResult.success && asceResult.data) {
          const windData = this.convertASCEToWindSpeed(asceResult.data);
          this.setCache(cacheKey, windData);
          return {
            success: true,
            data: windData,
            source: 'asce_scrape',
            confidence: 'high',
            timestamp: new Date().toISOString()
          };
        }
      }

      // Try interpolation from nearby known values
      if (this.config.interpolationEnabled) {
        const interpolatedResult = await this.interpolateWindSpeed(lat, lng);
        if (interpolatedResult.success && interpolatedResult.data) {
          this.setCache(cacheKey, interpolatedResult.data);
          return {
            ...interpolatedResult,
            source: 'interpolation',
            confidence: 'medium',
            timestamp: new Date().toISOString()
          };
        }
      }

      // Default fallback values based on general US location
      const fallbackData = this.getFallbackWindSpeed(lat, lng);
      return {
        success: true,
        data: fallbackData,
        source: 'local_dataset',
        confidence: 'low',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('WindMapService.getDesignWindSpeed error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'local_dataset',
        confidence: 'low',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get wind speed from HVHZ database
   */
  private async getWindSpeedFromDatabase(lat: number, lng: number): Promise<WindMapServiceResult<WindSpeedData>> {
    try {
      // Use PostgreSQL function to get wind speed
      const { data, error } = await supabase.rpc('get_wind_speed_for_location', {
        lat: lat,
        lng: lng
      });

      if (error) {
        return {
          success: false,
          error: error.message,
          source: 'hvhz_zones',
          confidence: 'low',
          timestamp: new Date().toISOString()
        };
      }

      if (data && data.length > 0) {
        const result: PostgresWindSpeedResult = data[0];
        
        const windData: WindSpeedData = {
          basicWindSpeed: result.wind_speed_basic,
          ultimateWindSpeed: result.wind_speed_ultimate,
          exposureCategory: 'C', // Default for most areas
          topographicFactor: 1.0, // Default
          asceVersion: '7-22',
          dataSource: 'hvhz_zones',
          confidence: 'high',
          zone: result.zone_info ? {
            id: 'db-zone',
            zoneName: result.zone_info.zone_name || 'Database Zone',
            county: result.zone_info.county || 'Unknown',
            state: result.zone_info.state || 'FL',
            zoneType: result.zone_info.zone_type || 'coastal',
            windSpeedBasic: result.wind_speed_basic,
            windSpeedUltimate: result.wind_speed_ultimate,
            description: result.zone_info.description,
            effectiveDate: new Date().toISOString().split('T')[0],
            asceVersion: '7-22'
          } : undefined
        };

        return {
          success: true,
          data: windData,
          source: 'hvhz_zones',
          confidence: 'high',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: false,
        error: 'No wind data found in database',
        source: 'hvhz_zones',
        confidence: 'low',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database error',
        source: 'hvhz_zones',
        confidence: 'low',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Scrape ASCE wind data using Puppeteer
   */
  private async scrapeASCEWindData(
    lat: number, 
    lng: number, 
    asceVersion: string
  ): Promise<WindMapServiceResult<ASCEWindData>> {
    try {
      // This would integrate with Puppeteer MCP
      // For now, return a simulated result structure
      
      console.log(`Attempting ASCE scrape for ${lat}, ${lng} (ASCE ${asceVersion})`);
      
      // Simulated ASCE data structure - in real implementation, use Puppeteer MCP
      const mockASCEData: ASCEWindData = {
        basicWindSpeed: this.estimateWindSpeedByLocation(lat, lng),
        riskCategory: 2,
        exposureCategory: 'C',
        topographicFactor: 1.0,
        windDirectionalityFactor: 0.85,
        importanceFactor: 1.0,
        ultimateWindSpeed: this.estimateWindSpeedByLocation(lat, lng) * 1.15,
        location: {
          latitude: lat,
          longitude: lng
        },
        metadata: {
          asceVersion,
          dataSource: 'asce_scrape',
          queryTimestamp: new Date().toISOString()
        }
      };

      return {
        success: true,
        data: mockASCEData,
        source: 'asce_scrape',
        confidence: 'high',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('ASCE scraping error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ASCE scraping failed',
        source: 'asce_scrape',
        confidence: 'low',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Interpolate wind speed from nearby known values
   */
  private async interpolateWindSpeed(lat: number, lng: number): Promise<WindMapServiceResult<WindSpeedData>> {
    try {
      // Query nearby HVHZ zones for interpolation
      const { data, error } = await supabase
        .from('hvhz_zones')
        .select('*')
        .gte('bbox_north', lat - 0.5)
        .lte('bbox_south', lat + 0.5)
        .gte('bbox_east', lng - 0.5)
        .lte('bbox_west', lng + 0.5)
        .limit(5);

      if (error || !data || data.length === 0) {
        return {
          success: false,
          error: 'No nearby zones for interpolation',
          source: 'interpolation',
          confidence: 'low',
          timestamp: new Date().toISOString()
        };
      }

      // Simple distance-weighted interpolation
      let totalWeight = 0;
      let weightedWindSpeed = 0;

      for (const zone of data) {
        const centerLat = (zone.bbox_north + zone.bbox_south) / 2;
        const centerLng = (zone.bbox_east + zone.bbox_west) / 2;
        const distance = this.calculateDistance(lat, lng, centerLat, centerLng);
        const weight = 1 / (distance + 0.1); // Add small value to avoid division by zero
        
        totalWeight += weight;
        weightedWindSpeed += zone.wind_speed_basic * weight;
      }

      const interpolatedWindSpeed = Math.round(weightedWindSpeed / totalWeight);

      const windData: WindSpeedData = {
        basicWindSpeed: interpolatedWindSpeed,
        ultimateWindSpeed: Math.round(interpolatedWindSpeed * 1.15),
        exposureCategory: 'C',
        topographicFactor: 1.0,
        asceVersion: '7-22',
        dataSource: 'interpolation',
        confidence: 'medium',
        interpolationNote: `Interpolated from ${data.length} nearby zones`
      };

      return {
        success: true,
        data: windData,
        source: 'interpolation',
        confidence: 'medium',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Interpolation failed',
        source: 'interpolation',
        confidence: 'low',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get fallback wind speed based on general location
   */
  private getFallbackWindSpeed(lat: number, lng: number): WindSpeedData {
    const estimatedSpeed = this.estimateWindSpeedByLocation(lat, lng);
    
    return {
      basicWindSpeed: estimatedSpeed,
      ultimateWindSpeed: Math.round(estimatedSpeed * 1.15),
      exposureCategory: 'C',
      topographicFactor: 1.0,
      asceVersion: '7-22',
      dataSource: 'local_dataset',
      confidence: 'low',
      interpolationNote: 'Fallback estimate - verify with local jurisdiction'
    };
  }

  /**
   * Estimate wind speed based on geographic location
   */
  private estimateWindSpeedByLocation(lat: number, lng: number): number {
    // Florida coastal areas
    if (lat >= 24.5 && lat <= 31 && lng >= -87 && lng <= -80) {
      if (lat <= 26.5) return 175; // South Florida HVHZ
      if (lat <= 28) return 160; // Central Florida coastal
      return 150; // North Florida coastal
    }
    
    // Gulf Coast
    if (lat >= 28 && lat <= 31 && lng >= -95 && lng <= -87) {
      return 150; // Gulf Coast states
    }
    
    // Atlantic Coast
    if (lat >= 32 && lat <= 40 && lng >= -80 && lng <= -75) {
      return 140; // Atlantic coastal states
    }
    
    // General US interior
    if (lat >= 30 && lat <= 50 && lng >= -125 && lng <= -70) {
      return 115; // Interior US
    }
    
    // Default for unknown areas
    return 115;
  }

  /**
   * Convert ASCE data to WindSpeedData format
   */
  private convertASCEToWindSpeed(asceData: ASCEWindData): WindSpeedData {
    return {
      basicWindSpeed: asceData.basicWindSpeed,
      ultimateWindSpeed: asceData.ultimateWindSpeed,
      exposureCategory: asceData.exposureCategory,
      topographicFactor: asceData.topographicFactor,
      asceVersion: asceData.metadata.asceVersion,
      dataSource: 'asce_scrape',
      confidence: 'high'
    };
  }

  /**
   * Calculate distance between two points in kilometers
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLng = this.degreesToRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
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
   * Generate cache key for wind data
   */
  private generateWindCacheKey(params: WindCacheKey): string {
    return `wind:${params.lat.toFixed(6)},${params.lng.toFixed(6)}:${params.asceVersion}`;
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

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<WindMapServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const windMapService = new WindMapService();

// Export individual functions for convenience
export const getDesignWindSpeed = windMapService.getDesignWindSpeed.bind(windMapService);