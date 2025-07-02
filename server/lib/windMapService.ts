// Wind Map Service - Externalized Wind Speed Data and ASCE Integration
// Handles ASCE wind speed lookups via scraping or local datasets

import puppeteer from 'puppeteer';

export interface WindSpeedResult {
  designWindSpeed: number; // mph
  riskCategory: 'I' | 'II' | 'III' | 'IV';
  asceVersion: string;
  exposureCategory?: 'B' | 'C' | 'D';
  topographicFactor?: number;
  elevation?: number;
  source: 'asce_hazard_tool' | 'local_dataset' | 'fallback';
  metadata: {
    county?: string;
    state?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    queryTimestamp: string;
    cacheHit?: boolean;
  };
}

export interface WindMapConfig {
  preferredAsceVersion: string;
  defaultRiskCategory: 'I' | 'II' | 'III' | 'IV';
  enableScraping: boolean;
  fallbackToLocal: boolean;
  cacheResults: boolean;
  cacheTTL: number; // minutes
  timeoutMs: number;
  userAgent: string;
}

// Local wind speed dataset for fallback
const localWindSpeedData: Record<string, { [key: string]: number }> = {
  'FL': {
    'Miami-Dade': 185,
    'Broward': 180,
    'Monroe': 190,
    'Palm Beach': 175,
    'Martin': 165,
    'Orange': 130,
    'Hillsborough': 140,
    'Pinellas': 145,
    'Duval': 150,
    'Lee': 170,
    'Collier': 175
  },
  'TX': {
    'Harris': 130,
    'Dallas': 115,
    'Bexar': 120,
    'Tarrant': 115,
    'Travis': 110
  },
  'CA': {
    'Los Angeles': 85,
    'San Diego': 85,
    'Orange': 85,
    'Riverside': 90,
    'San Bernardino': 90
  }
};

// In-memory cache for wind speed results
const windSpeedCache = new Map<string, WindSpeedResult>();

export class WindMapService {
  private config: WindMapConfig;

  constructor(config: Partial<WindMapConfig> = {}) {
    this.config = {
      preferredAsceVersion: '7-22',
      defaultRiskCategory: 'II',
      enableScraping: true,
      fallbackToLocal: true,
      cacheResults: true,
      cacheTTL: 720, // 12 hours
      timeoutMs: 30000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      ...config
    };
  }

  /**
   * Get design wind speed for coordinates
   */
  async getDesignWindSpeed(
    lat: number, 
    lng: number, 
    asceVersion?: string,
    riskCategory?: 'I' | 'II' | 'III' | 'IV'
  ): Promise<WindSpeedResult> {
    const version = asceVersion || this.config.preferredAsceVersion;
    const risk = riskCategory || this.config.defaultRiskCategory;
    
    console.log(`🌪️ Getting wind speed for ${lat}, ${lng} (ASCE ${version}, Risk Category ${risk})`);
    
    const cacheKey = `wind_${lat}_${lng}_${version}_${risk}`;
    
    // Check cache first
    if (this.config.cacheResults && windSpeedCache.has(cacheKey)) {
      const cached = windSpeedCache.get(cacheKey)!;
      const ageMinutes = (Date.now() - new Date(cached.metadata.queryTimestamp).getTime()) / (1000 * 60);
      
      if (ageMinutes < this.config.cacheTTL) {
        console.log('📋 Using cached wind speed data');
        cached.metadata.cacheHit = true;
        return cached;
      }
    }

    try {
      let result: WindSpeedResult;

      // Try ASCE scraping first
      if (this.config.enableScraping) {
        try {
          result = await this.scrapeASCEHazardTool(lat, lng, version, risk);
          console.log(`✅ Wind speed from ASCE: ${result.designWindSpeed} mph`);
        } catch (scrapeError) {
          console.warn('⚠️ ASCE scraping failed:', scrapeError.message);
          if (this.config.fallbackToLocal) {
            result = await this.getLocalWindSpeed(lat, lng, version, risk);
          } else {
            throw scrapeError;
          }
        }
      } else {
        // Use local dataset
        result = await this.getLocalWindSpeed(lat, lng, version, risk);
      }

      // Cache result
      if (this.config.cacheResults) {
        windSpeedCache.set(cacheKey, result);
      }

      return result;

    } catch (error) {
      console.error('❌ Wind speed lookup failed:', error);
      
      // Ultimate fallback
      if (this.config.fallbackToLocal) {
        return await this.getLocalWindSpeed(lat, lng, version, risk);
      }
      
      throw error;
    }
  }

  /**
   * Scrape ASCE Hazard Tool for wind speed data
   */
  private async scrapeASCEHazardTool(
    lat: number,
    lng: number,
    asceVersion: string,
    riskCategory: string
  ): Promise<WindSpeedResult> {
    console.log('🕷️ Scraping ASCE Hazard Tool...');
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        timeout: this.config.timeoutMs,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      await page.setUserAgent(this.config.userAgent);
      await page.setViewport({ width: 1280, height: 720 });

      // Navigate to ASCE Hazard Tool
      const url = 'https://hazards.atcouncil.org/';
      await page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.timeoutMs });

      // Wait for the map to load
      await page.waitForSelector('#map', { timeout: 10000 });

      // Set coordinates
      await page.evaluate((latitude, longitude) => {
        // This is a simplified example - actual implementation would need
        // to interact with the specific ASCE tool interface
        (window as any).setCoordinates(latitude, longitude);
      }, lat, lng);

      // Wait for results
      await page.waitForSelector('.wind-speed-result', { timeout: 15000 });

      // Extract wind speed data
      const windData = await page.evaluate(() => {
        const windSpeedElement = document.querySelector('.wind-speed-value');
        const windSpeed = windSpeedElement ? 
          parseInt(windSpeedElement.textContent?.replace(/\D/g, '') || '0') : 0;
        
        return {
          windSpeed,
          riskCategory: 'II', // Would extract from page
          version: '7-22' // Would extract from page
        };
      });

      if (!windData.windSpeed || windData.windSpeed === 0) {
        throw new Error('No wind speed data found in ASCE tool');
      }

      return {
        designWindSpeed: windData.windSpeed,
        riskCategory: riskCategory as any,
        asceVersion: asceVersion,
        source: 'asce_hazard_tool',
        metadata: {
          coordinates: { latitude: lat, longitude: lng },
          queryTimestamp: new Date().toISOString(),
          cacheHit: false
        }
      };

    } catch (error) {
      console.error('❌ ASCE scraping error:', error);
      throw new Error(`ASCE scraping failed: ${error.message}`);
      
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Get wind speed from local dataset
   */
  private async getLocalWindSpeed(
    lat: number,
    lng: number,
    asceVersion: string,
    riskCategory: string
  ): Promise<WindSpeedResult> {
    console.log('📚 Using local wind speed dataset...');
    
    // Simple state/county determination based on coordinates
    const { state, county } = this.getStateCountyFromCoordinates(lat, lng);
    
    let windSpeed = 110; // Default fallback
    let source: WindSpeedResult['source'] = 'fallback';
    
    if (localWindSpeedData[state] && localWindSpeedData[state][county]) {
      windSpeed = localWindSpeedData[state][county];
      source = 'local_dataset';
      console.log(`✅ Found wind speed in local dataset: ${windSpeed} mph for ${county}, ${state}`);
    } else {
      console.log(`⚠️ No local data for ${county}, ${state}, using fallback: ${windSpeed} mph`);
    }

    // Apply risk category adjustments (simplified)
    const riskFactors = { 'I': 0.87, 'II': 1.0, 'III': 1.15, 'IV': 1.15 };
    const adjustedWindSpeed = Math.round(windSpeed * riskFactors[riskCategory]);

    return {
      designWindSpeed: adjustedWindSpeed,
      riskCategory: riskCategory as any,
      asceVersion,
      exposureCategory: this.determineExposureCategory(lat, lng),
      source,
      metadata: {
        county,
        state,
        coordinates: { latitude: lat, longitude: lng },
        queryTimestamp: new Date().toISOString(),
        cacheHit: false
      }
    };
  }

  /**
   * Simple state/county determination from coordinates
   */
  private getStateCountyFromCoordinates(lat: number, lng: number): { state: string; county: string } {
    // Florida
    if (lat >= 24.5 && lat <= 31 && lng >= -87.5 && lng <= -79.8) {
      if (lat >= 25.1 && lat <= 26.0 && lng >= -80.9 && lng <= -80.1) {
        return { state: 'FL', county: 'Miami-Dade' };
      } else if (lat >= 26.0 && lat <= 26.5 && lng >= -80.5 && lng <= -80.0) {
        return { state: 'FL', county: 'Broward' };
      } else if (lat >= 28.3 && lat <= 28.8 && lng >= -81.7 && lng <= -81.1) {
        return { state: 'FL', county: 'Orange' };
      }
      return { state: 'FL', county: 'Unknown' };
    }
    
    // Texas
    if (lat >= 25.8 && lat <= 36.5 && lng >= -106.6 && lng <= -93.5) {
      if (lat >= 29.5 && lat <= 30.1 && lng >= -95.8 && lng <= -95.0) {
        return { state: 'TX', county: 'Harris' };
      } else if (lat >= 32.6 && lat <= 33.0 && lng >= -97.0 && lng <= -96.5) {
        return { state: 'TX', county: 'Dallas' };
      }
      return { state: 'TX', county: 'Unknown' };
    }
    
    // California
    if (lat >= 32.5 && lat <= 42.0 && lng >= -124.4 && lng <= -114.1) {
      return { state: 'CA', county: 'Los Angeles' };
    }
    
    return { state: 'Unknown', county: 'Unknown' };
  }

  /**
   * Determine exposure category based on coordinates
   */
  private determineExposureCategory(lat: number, lng: number): 'B' | 'C' | 'D' {
    // Simplified determination - in reality would use more sophisticated logic
    const { state } = this.getStateCountyFromCoordinates(lat, lng);
    
    // Coastal states typically have more exposure D
    const coastalStates = ['FL', 'CA', 'TX', 'NY', 'NC', 'SC'];
    if (coastalStates.includes(state)) {
      // Simple coastal proximity check
      if (state === 'FL' && lng > -81.0) return 'D'; // East coast FL
      if (state === 'CA' && lng < -118.0) return 'D'; // CA coast
      if (state === 'TX' && lng > -95.0) return 'D'; // TX coast
    }
    
    return 'C'; // Default suburban/open terrain
  }

  /**
   * Clear wind speed cache
   */
  clearCache(): void {
    windSpeedCache.clear();
    console.log('🧹 Wind speed cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { entries: number; totalSizeMB: number } {
    const entries = windSpeedCache.size;
    const totalSizeMB = Math.round((JSON.stringify([...windSpeedCache.values()]).length / 1024 / 1024) * 100) / 100;
    
    return { entries, totalSizeMB };
  }

  /**
   * Validate wind speed result
   */
  private validateWindSpeed(result: WindSpeedResult): boolean {
    return (
      result.designWindSpeed >= 70 && 
      result.designWindSpeed <= 250 &&
      ['I', 'II', 'III', 'IV'].includes(result.riskCategory)
    );
  }
}

// Factory function
export function createWindMapService(config?: Partial<WindMapConfig>): WindMapService {
  return new WindMapService(config);
}

// Default instance
export const windMapService = createWindMapService();

// Utility functions
export async function getWindSpeedForAddress(
  address: string, 
  asceVersion?: string,
  riskCategory?: 'I' | 'II' | 'III' | 'IV'
): Promise<WindSpeedResult> {
  // This would integrate with geoService to get coordinates first
  // For now, throwing an error to indicate this needs geoService integration
  throw new Error('getWindSpeedForAddress requires geoService integration');
}

// Health check function
export async function checkWindMapServiceHealth(): Promise<{
  status: string;
  scrapingEnabled: boolean;
  localDatasetAvailable: boolean;
  cacheStats: { entries: number; totalSizeMB: number };
  lastError?: string;
}> {
  try {
    const service = createWindMapService();
    
    return {
      status: 'operational',
      scrapingEnabled: service['config'].enableScraping,
      localDatasetAvailable: Object.keys(localWindSpeedData).length > 0,
      cacheStats: service.getCacheStats()
    };
  } catch (error) {
    return {
      status: 'degraded',
      scrapingEnabled: false,
      localDatasetAvailable: false,
      cacheStats: { entries: 0, totalSizeMB: 0 },
      lastError: error.message
    };
  }
}

// Export local dataset for testing/inspection
export { localWindSpeedData };
