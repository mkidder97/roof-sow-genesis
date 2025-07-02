// Geo and Wind API Routes - Externalized geographic and wind services
import express from 'express';
import { 
  geoService, 
  windMapService, 
  checkGeoServiceHealth, 
  checkWindMapServiceHealth,
  getJurisdictionFromAddress,
  getHVHZFromAddress
} from '../lib/geoService.js';
import { windMapService as windService } from '../lib/windMapService.js';

const router = express.Router();

/**
 * Get jurisdiction from coordinates
 * POST /api/geo-wind/jurisdiction
 */
router.post('/jurisdiction', async (req, res) => {
  try {
    const { lat, lng, latitude, longitude } = req.body;
    
    const finalLat = lat || latitude;
    const finalLng = lng || longitude;
    
    if (!finalLat || !finalLng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    console.log(`🌍 Jurisdiction request for: ${finalLat}, ${finalLng}`);
    
    const jurisdiction = await geoService.getJurisdiction(finalLat, finalLng);
    
    res.json({
      success: true,
      jurisdiction,
      coordinates: {
        latitude: finalLat,
        longitude: finalLng
      }
    });

  } catch (error) {
    console.error('❌ Jurisdiction lookup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get HVHZ status from coordinates
 * POST /api/geo-wind/hvhz-status
 */
router.post('/hvhz-status', async (req, res) => {
  try {
    const { lat, lng, latitude, longitude } = req.body;
    
    const finalLat = lat || latitude;
    const finalLng = lng || longitude;
    
    if (!finalLat || !finalLng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    console.log(`🌪️ HVHZ status request for: ${finalLat}, ${finalLng}`);
    
    const hvhzStatus = await geoService.getHVHZStatus(finalLat, finalLng);
    
    res.json({
      success: true,
      hvhzStatus,
      coordinates: {
        latitude: finalLat,
        longitude: finalLng
      }
    });

  } catch (error) {
    console.error('❌ HVHZ status lookup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get wind speed from coordinates
 * POST /api/geo-wind/wind-speed
 */
router.post('/wind-speed', async (req, res) => {
  try {
    const { lat, lng, latitude, longitude, asceVersion, riskCategory } = req.body;
    
    const finalLat = lat || latitude;
    const finalLng = lng || longitude;
    
    if (!finalLat || !finalLng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    console.log(`💨 Wind speed request for: ${finalLat}, ${finalLng} (ASCE ${asceVersion || 'default'})`);
    
    const windData = await windService.getDesignWindSpeed(
      finalLat, 
      finalLng, 
      asceVersion, 
      riskCategory
    );
    
    res.json({
      success: true,
      windData,
      coordinates: {
        latitude: finalLat,
        longitude: finalLng
      }
    });

  } catch (error) {
    console.error('❌ Wind speed lookup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get coordinates from address
 * POST /api/geo-wind/geocode
 */
router.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }

    console.log(`📍 Geocoding request for: ${address}`);
    
    const coordinates = await geoService.getCoordinatesFromAddress(address);
    
    res.json({
      success: true,
      coordinates,
      address
    });

  } catch (error) {
    console.error('❌ Geocoding failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get complete geo and wind data from address
 * POST /api/geo-wind/complete-analysis
 */
router.post('/complete-analysis', async (req, res) => {
  try {
    const { address, asceVersion, riskCategory } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }

    console.log(`🔍 Complete analysis for: ${address}`);
    
    // Step 1: Geocode address
    const coordinates = await geoService.getCoordinatesFromAddress(address);
    
    // Step 2: Get jurisdiction
    const jurisdiction = await geoService.getJurisdiction(coordinates.latitude, coordinates.longitude);
    
    // Step 3: Get HVHZ status
    const hvhzStatus = await geoService.getHVHZStatus(coordinates.latitude, coordinates.longitude);
    
    // Step 4: Get wind speed
    const windData = await windService.getDesignWindSpeed(
      coordinates.latitude,
      coordinates.longitude,
      asceVersion,
      riskCategory
    );
    
    res.json({
      success: true,
      address,
      coordinates,
      jurisdiction,
      hvhzStatus,
      windData,
      summary: {
        county: jurisdiction.county,
        state: jurisdiction.state,
        isHVHZ: hvhzStatus.isHVHZ,
        designWindSpeed: windData.designWindSpeed,
        asceVersion: windData.asceVersion,
        riskCategory: windData.riskCategory
      }
    });

  } catch (error) {
    console.error('❌ Complete analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Service health check
 * GET /api/geo-wind/health
 */
router.get('/health', async (req, res) => {
  try {
    const [geoHealth, windHealth] = await Promise.all([
      checkGeoServiceHealth(),
      checkWindMapServiceHealth()
    ]);

    const overallStatus = (geoHealth.status === 'operational' && windHealth.status === 'operational') 
      ? 'operational' 
      : 'degraded';

    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        geoService: geoHealth,
        windMapService: windHealth
      },
      endpoints: {
        'POST /api/geo-wind/jurisdiction': 'Get jurisdiction from coordinates',
        'POST /api/geo-wind/hvhz-status': 'Get HVHZ status from coordinates',
        'POST /api/geo-wind/wind-speed': 'Get wind speed from coordinates',
        'POST /api/geo-wind/geocode': 'Get coordinates from address',
        'POST /api/geo-wind/complete-analysis': 'Complete geo and wind analysis from address',
        'GET /api/geo-wind/health': 'Service health check',
        'POST /api/geo-wind/clear-cache': 'Clear service caches'
      }
    });

  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Clear service caches
 * POST /api/geo-wind/clear-cache
 */
router.post('/clear-cache', (req, res) => {
  try {
    geoService.clearCaches();
    windService.clearCache();
    
    res.json({
      success: true,
      message: 'All caches cleared',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get cache statistics
 * GET /api/geo-wind/cache-stats
 */
router.get('/cache-stats', (req, res) => {
  try {
    const geoStats = geoService.getCacheStats();
    const windStats = windService.getCacheStats();
    
    res.json({
      success: true,
      cacheStats: {
        geoService: geoStats,
        windMapService: windStats,
        combined: {
          totalEntries: geoStats.geocode + geoStats.hvhz + windStats.entries,
          totalSizeMB: windStats.totalSizeMB
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test endpoint with sample data
 * GET /api/geo-wind/test
 */
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Running geo-wind service tests...');
    
    const testCases = [
      {
        name: 'Miami, FL (HVHZ)',
        address: '100 Biscayne Blvd, Miami, FL 33132',
        expectedHVHZ: true
      },
      {
        name: 'Orlando, FL (Non-HVHZ)',
        address: '1 Citrus Bowl Pl, Orlando, FL 32805',
        expectedHVHZ: false
      }
    ];

    const results = [];
    
    for (const testCase of testCases) {
      try {
        const coordinates = await geoService.getCoordinatesFromAddress(testCase.address);
        const jurisdiction = await geoService.getJurisdiction(coordinates.latitude, coordinates.longitude);
        const hvhzStatus = await geoService.getHVHZStatus(coordinates.latitude, coordinates.longitude);
        const windData = await windService.getDesignWindSpeed(coordinates.latitude, coordinates.longitude);
        
        results.push({
          testCase: testCase.name,
          address: testCase.address,
          passed: hvhzStatus.isHVHZ === testCase.expectedHVHZ,
          results: {
            coordinates,
            jurisdiction,
            hvhzStatus,
            windData: {
              designWindSpeed: windData.designWindSpeed,
              source: windData.source
            }
          }
        });
        
      } catch (error) {
        results.push({
          testCase: testCase.name,
          address: testCase.address,
          passed: false,
          error: error.message
        });
      }
    }

    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;

    res.json({
      success: true,
      testSummary: {
        passed: passedTests,
        total: totalTests,
        status: passedTests === totalTests ? 'all_passed' : 'some_failed'
      },
      testResults: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
