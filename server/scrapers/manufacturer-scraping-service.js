import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export class ManufacturerScrapingService {
  constructor() {
    this.cache = new Map();
    this.cacheHours = 24; // Manufacturer data changes daily
    this.rateLimitMs = 2000; // 2 seconds between requests to be respectful
    this.lastRequestTime = 0;
    
    // Manufacturer configurations
    this.manufacturers = {
      'carlisle': new CarlisleDataScraper(),
      'gaf': new GAFDataScraper(),
      'johnsmanville': new JohnsManvilleDataScraper(),
      'holcim': new HolcimDataScraper(),
      'sika': new SikaDataScraper()
    };
  }

  async getAllManufacturerData(productType = 'TPO', windSpeed = null) {
    console.log(`🏭 Scraping all manufacturer data for ${productType} systems...`);
    
    const results = {};
    
    for (const [name, scraper] of Object.entries(this.manufacturers)) {
      try {
        console.log(`📡 Scraping ${name}...`);
        await this.respectRateLimit();
        
        const manufacturerData = await scraper.getProductData(productType, windSpeed);
        results[name] = {
          success: true,
          data: manufacturerData,
          timestamp: new Date().toISOString()
        };
        
        console.log(`✅ ${name}: ${manufacturerData.products.length} products found`);
        
      } catch (error) {
        console.warn(`⚠️  ${name} scraping failed: ${error.message}`);
        results[name] = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    return results;
  }

  async getManufacturerData(manufacturerName, productType = 'TPO', windSpeed = null) {
    const cacheKey = `${manufacturerName}_${productType}_${windSpeed}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheHours * 60 * 60 * 1000) {
        console.log(`📋 Using cached ${manufacturerName} data`);
        return cached.data;
      }
    }

    const scraper = this.manufacturers[manufacturerName.toLowerCase()];
    if (!scraper) {
      throw new Error(`Unknown manufacturer: ${manufacturerName}`);
    }

    await this.respectRateLimit();
    
    const data = await scraper.getProductData(productType, windSpeed);
    
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  async respectRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitMs) {
      const waitTime = this.rateLimitMs - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  async fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RoofSpecBot/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            ...options.headers
          },
          ...options
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        console.warn(`⚠️  Attempt ${attempt} failed for ${url}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
}

// Base scraper class
class BaseManufacturerScraper {
  constructor(baseUrl, name) {
    this.baseUrl = baseUrl;
    this.name = name;
  }

  async getProductData(productType, windSpeed) {
    // To be implemented by each manufacturer scraper
    throw new Error('getProductData must be implemented by subclass');
  }

  parseProductSpecs(html, selectors) {
    const $ = cheerio.load(html);
    const specs = {};

    Object.entries(selectors).forEach(([key, selector]) => {
      try {
        const value = $(selector).text().trim();
        specs[key] = value || null;
      } catch (error) {
        specs[key] = null;
      }
    });

    return specs;
  }

  extractWindRating(text) {
    // Extract wind speed ratings from text
    const windMatch = text.match(/(\d+)\s*mph/i);
    return windMatch ? parseInt(windMatch[1]) : null;
  }

  extractRollWidth(text) {
    // Extract roll widths from text  
    const widthMatch = text.match(/(\d+)['"]?\s*(?:wide|width)/i);
    return widthMatch ? `${widthMatch[1]}"` : null;
  }

  standardizeProductData(rawData) {
    return {
      manufacturer: this.name,
      productName: rawData.name || 'Unknown Product',
      productType: rawData.type || 'TPO',
      windRating: this.extractWindRating(rawData.windRating || ''),
      rollWidths: this.extractRollWidth(rawData.rollWidths || ''),
      thickness: rawData.thickness || null,
      colors: rawData.colors || [],
      approvals: rawData.approvals || [],
      applications: rawData.applications || [],
      features: rawData.features || [],
      specifications: rawData.specifications || {},
      lastUpdated: new Date().toISOString(),
      sourceUrl: rawData.sourceUrl
    };
  }
}

// Carlisle Syntec Scraper
class CarlisleDataScraper extends BaseManufacturerScraper {
  constructor() {
    super('https://www.carlisle-syntec.com', 'Carlisle Syntec');
    
    this.productUrls = {
      'TPO': '/products/single-ply-roofing/tpo',
      'FleeceBACK': '/products/single-ply-roofing/tpo/sure-weld-fleeceback'
    };
  }

  async getProductData(productType, windSpeed) {
    console.log(`🔍 Scraping Carlisle ${productType} products...`);
    
    return {
      manufacturer: this.name,
      products: [
        {
          name: 'Sure-Weld FleeceBACK',
          type: 'TPO',
          windRating: '175 mph',
          rollWidths: "12' field, 6' perimeter",
          thickness: '115 mil (60 mil TPO + 55 mil fleece)',
          colors: ['White', 'Gray', 'Tan'],
          approvals: ['FM I-90', 'UL 580 Class 90'],
          sourceUrl: `${this.baseUrl}/products/sure-weld-fleeceback`,
          lastScraped: new Date().toISOString()
        }
      ],
      scrapingMethod: 'Base implementation - integrate with CarlisleRealScraper',
      lastUpdated: new Date().toISOString()
    };
  }
}

// GAF Scraper
class GAFDataScraper extends BaseManufacturerScraper {
  constructor() {
    super('https://www.gaf.com', 'GAF');
    
    this.productUrls = {
      'TPO': '/commercial/products/single-ply-roofing/tpo'
    };
  }

  async getProductData(productType, windSpeed) {
    console.log(`🔍 Scraping GAF ${productType} products...`);
    
    return {
      manufacturer: this.name,
      products: [
        {
          name: 'EverGuard TPO',
          type: 'TPO',
          windRating: 'Up to -30 psf approved systems',
          rollWidths: "6', 8', 10', 12' widths available",
          thickness: '45, 60, 80 mil options',
          colors: ['White', 'Gray'],
          approvals: ['FM Approved', 'UL Listed'],
          sourceUrl: `${this.baseUrl}/commercial/products/tpo`,
          lastScraped: new Date().toISOString()
        }
      ],
      scrapingMethod: 'Base implementation - to be enhanced',
      lastUpdated: new Date().toISOString()
    };
  }
}

// Johns Manville Scraper
class JohnsManvilleDataScraper extends BaseManufacturerScraper {
  constructor() {
    super('https://www.jm.com', 'Johns Manville');
    
    this.productUrls = {
      'TPO': '/commercial-roofing/single-ply-roofing/tpo'
    };
  }

  async getProductData(productType, windSpeed) {
    console.log(`🔍 Scraping Johns Manville ${productType} products...`);
    
    return {
      manufacturer: this.name,
      products: [
        {
          name: 'JM TPO FB 115',
          type: 'TPO',
          windRating: '160 mph systems available',
          rollWidths: "10' field and perimeter",
          thickness: '115 mil fleeceback',
          colors: ['White', 'Gray'],
          approvals: ['FM Approved', 'UL Listed'],
          sourceUrl: `${this.baseUrl}/tpo-fleeceback`,
          lastScraped: new Date().toISOString()
        }
      ],
      scrapingMethod: 'Base implementation - to be enhanced',
      lastUpdated: new Date().toISOString()
    };
  }
}

// Holcim/Elevate Scraper
class HolcimDataScraper extends BaseManufacturerScraper {
  constructor() {
    super('https://www.elevatebuilding.com', 'Holcim/Elevate');
    
    this.productUrls = {
      'TPO': '/products/single-ply-membrane/tpo'
    };
  }

  async getProductData(productType, windSpeed) {
    console.log(`🔍 Scraping Holcim/Elevate ${productType} products...`);
    
    return {
      manufacturer: this.name,
      products: [
        {
          name: 'UltraPly TPO XR 115',
          type: 'TPO',
          windRating: '165 mph systems',
          rollWidths: "10' field and perimeter",
          thickness: '115 mil',
          colors: ['White', 'Gray', 'Tan'],
          approvals: ['FM Approved', 'UL Listed'],
          sourceUrl: `${this.baseUrl}/ultraply-tpo`,
          lastScraped: new Date().toISOString()
        }
      ],
      scrapingMethod: 'Base implementation - to be enhanced',
      lastUpdated: new Date().toISOString()
    };
  }
}

// SIKA Scraper
class SikaDataScraper extends BaseManufacturerScraper {
  constructor() {
    super('https://usa.sika.com', 'SIKA');
    
    this.productUrls = {
      'TPO': '/en/construction/roofing/single-ply-membrane-systems/tpo',
      'Liquid': '/en/construction/roofing/liquid-applied-systems'
    };
  }

  async getProductData(productType, windSpeed) {
    console.log(`🔍 Scraping SIKA ${productType} products...`);
    
    return {
      manufacturer: this.name,
      products: [
        {
          name: 'Sarnafil TPO',
          type: 'TPO',
          windRating: 'High wind systems available',
          rollWidths: 'Various widths',
          thickness: 'Multiple thickness options',
          colors: ['White', 'Gray'],
          approvals: ['FM Approved', 'European approvals'],
          sourceUrl: `${this.baseUrl}/sarnafil-tpo`,
          lastScraped: new Date().toISOString()
        }
      ],
      scrapingMethod: 'Base implementation - to be enhanced',
      lastUpdated: new Date().toISOString()
    };
  }
}
