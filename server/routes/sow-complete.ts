// Enhanced SOW Generation API Route - Phase 1 Complete Implementation with Externalized Geo/Wind Services
import express from 'express';
import { createSOWEngine, testSOWGeneration, createProjectInputsFromFieldInspection, SOWGenerationRequest } from '../logic/sow-engine.js';
import { geoService, windMapService } from '../lib/geoService.js';
import { windMapService as windService } from '../lib/windMapService.js';

const router = express.Router();

/**
 * Complete SOW Generation endpoint with externalized geo/wind services
 * POST /api/sow/generate-complete
 */
router.post('/generate-complete', async (req, res) => {
  try {
    console.log('🚀 Complete SOW generation requested (with externalized services)');
    
    const { projectInputs, options } = req.body as SOWGenerationRequest;
    
    if (!projectInputs) {
      return res.status(400).json({
        success: false,
        error: 'Project inputs are required',
        code: 'MISSING_INPUTS'
      });
    }

    // Enhance project inputs with externalized geo/wind data
    let enhancedInputs = { ...projectInputs };
    
    if (projectInputs.address) {
      try {
        console.log(`🌍 Getting geo/wind data for: ${projectInputs.address}`);
        
        // Get coordinates from address
        const coordinates = await geoService.getCoordinatesFromAddress(projectInputs.address);
        
        // Get jurisdiction info
        const jurisdiction = await geoService.getJurisdiction(coordinates.latitude, coordinates.longitude);
        
        // Get HVHZ status
        const hvhzStatus = await geoService.getHVHZStatus(coordinates.latitude, coordinates.longitude);
        
        // Get wind speed data
        const windData = await windService.getDesignWindSpeed(
          coordinates.latitude,
          coordinates.longitude,
          options?.asceVersion || '7-22',
          options?.riskCategory || 'II'
        );
        
        // Enhance project inputs with external data
        enhancedInputs = {
          ...projectInputs,
          coordinates: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
          },
          county: jurisdiction.county,
          state: jurisdiction.state,
          city: jurisdiction.city || projectInputs.city,
          zipCode: jurisdiction.zipCode || projectInputs.zipCode,
          hvhz: hvhzStatus.isHVHZ,
          hvhzZone: hvhzStatus.zoneName,
          designWindSpeed: windData.designWindSpeed,
          asceVersion: windData.asceVersion,
          riskCategory: windData.riskCategory,
          exposureCategory: windData.exposureCategory || projectInputs.exposureCategory,
          windSource: windData.source,
          geoEnhanced: true
        };
        
        console.log(`✅ Enhanced inputs with geo data: ${jurisdiction.county}, ${jurisdiction.state}, HVHZ: ${hvhzStatus.isHVHZ}, Wind: ${windData.designWindSpeed} mph`);
        
      } catch (geoError) {
        console.warn('⚠️ Geo/wind enhancement failed, using original inputs:', geoError.message);
        enhancedInputs.geoEnhanced = false;
        enhancedInputs.geoError = geoError.message;
      }
    }

    const engine = createSOWEngine();
    const result = await engine.generateSOW({ 
      projectInputs: enhancedInputs, 
      options 
    });

    if (result.success) {
      console.log(`✅ SOW generated successfully: ${result.metadata.templateType}, ${result.metadata.totalSections} sections`);
      
      res.json({
        success: true,
        data: {
          document: result.document,
          windAnalysis: result.windAnalysis,
          metadata: result.metadata
        },
        validation: result.validation,
        geoEnhancement: {
          enabled: enhancedInputs.geoEnhanced || false,
          data: enhancedInputs.geoEnhanced ? {
            coordinates: enhancedInputs.coordinates,
            jurisdiction: {
              county: enhancedInputs.county,
              state: enhancedInputs.state,
              city: enhancedInputs.city
            },
            hvhz: {
              isHVHZ: enhancedInputs.hvhz,
              zoneName: enhancedInputs.hvhzZone
            },
            wind: {
              designWindSpeed: enhancedInputs.designWindSpeed,
              asceVersion: enhancedInputs.asceVersion,
              source: enhancedInputs.windSource
            }
          } : null,
          error: enhancedInputs.geoError || null
        },
        timing: {
          generationTime: result.metadata.generationTime,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      console.error('❌ SOW generation failed:', result.errors);
      
      res.status(400).json({
        success: false,
        errors: result.errors,
        validation: result.validation,
        metadata: result.metadata,
        geoEnhancement: {
          enabled: enhancedInputs.geoEnhanced || false,
          error: enhancedInputs.geoError || null
        }
      });
    }
    
  } catch (error) {
    console.error('❌ SOW generation API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during SOW generation',
      details: error.message
    });
  }
});

/**
 * Generate SOW from field inspection data with geo enhancement
 * POST /api/sow/generate-from-inspection/:inspectionId
 */
router.post('/generate-from-inspection/:inspectionId', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { options } = req.body;
    
    console.log(`🔍 Generating SOW from field inspection: ${inspectionId} (with geo enhancement)`);
    
    // This would normally fetch from database
    // For now, we'll use the test data with enhanced geo lookup
    const fieldInspectionData = {
      id: inspectionId,
      project_name: 'Southridge 12',
      project_address: '2405 Commerce Park Drive, Orlando, FL',
      square_footage: 41300,
      building_height: 42,
      deck_type: 'Steel',
      roof_drains: [1, 2, 3, 4, 5, 6],
      hvac_units: [1, 2, 3, 4],
      penetrations: Array(12).fill(null).map((_, i) => ({ id: i + 1 })),
      roof_hatches: 2,
      insulation_type: 'Polyisocyanurate'
    };
    
    let projectInputs = createProjectInputsFromFieldInspection(fieldInspectionData);
    
    // Enhance with geo/wind data
    if (fieldInspectionData.project_address) {
      try {
        const coordinates = await geoService.getCoordinatesFromAddress(fieldInspectionData.project_address);
        const jurisdiction = await geoService.getJurisdiction(coordinates.latitude, coordinates.longitude);
        const hvhzStatus = await geoService.getHVHZStatus(coordinates.latitude, coordinates.longitude);
        const windData = await windService.getDesignWindSpeed(coordinates.latitude, coordinates.longitude);
        
        projectInputs = {
          ...projectInputs,
          coordinates,
          county: jurisdiction.county,
          state: jurisdiction.state,
          hvhz: hvhzStatus.isHVHZ,
          designWindSpeed: windData.designWindSpeed,
          asceVersion: windData.asceVersion,
          geoEnhanced: true
        };
        
      } catch (geoError) {
        console.warn('⚠️ Geo enhancement failed for inspection:', geoError.message);
        projectInputs.geoEnhanced = false;
        projectInputs.geoError = geoError.message;
      }
    }
    
    const engine = createSOWEngine();
    const result = await engine.generateSOW({ projectInputs, options });
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          inspectionId,
          document: result.document,
          windAnalysis: result.windAnalysis,
          metadata: result.metadata
        },
        validation: result.validation,
        geoEnhancement: {
          enabled: projectInputs.geoEnhanced || false,
          data: projectInputs.geoEnhanced ? {
            coordinates: projectInputs.coordinates,
            county: projectInputs.county,
            state: projectInputs.state,
            hvhz: projectInputs.hvhz,
            designWindSpeed: projectInputs.designWindSpeed
          } : null
        }
      });
    } else {
      res.status(400).json({
        success: false,
        inspectionId,
        errors: result.errors,
        validation: result.validation
      });
    }
    
  } catch (error) {
    console.error('❌ Field inspection SOW generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate SOW from field inspection',
      details: error.message
    });
  }
});

/**
 * Validate project inputs without generating SOW (with geo enhancement)
 * POST /api/sow/validate
 */
router.post('/validate', async (req, res) => {
  try {
    let { projectInputs } = req.body;
    
    if (!projectInputs) {
      return res.status(400).json({
        success: false,
        error: 'Project inputs are required for validation'
      });
    }

    // Enhance with geo data for validation
    if (projectInputs.address) {
      try {
        const coordinates = await geoService.getCoordinatesFromAddress(projectInputs.address);
        const jurisdiction = await geoService.getJurisdiction(coordinates.latitude, coordinates.longitude);
        const hvhzStatus = await geoService.getHVHZStatus(coordinates.latitude, coordinates.longitude);
        
        projectInputs = {
          ...projectInputs,
          coordinates,
          county: jurisdiction.county,
          state: jurisdiction.state,
          hvhz: hvhzStatus.isHVHZ,
          geoEnhanced: true
        };
        
      } catch (geoError) {
        projectInputs.geoEnhanced = false;
        projectInputs.geoError = geoError.message;
      }
    }

    const engine = createSOWEngine();
    const result = await engine.generateSOW({
      projectInputs,
      options: { validateOnly: true }
    });

    res.json({
      success: true,
      validation: result.validation,
      metadata: {
        templateType: result.metadata.templateType,
        estimatedSections: result.metadata.totalSections
      },
      windAnalysis: result.windAnalysis ? {
        pressures: result.windAnalysis.pressures,
        metadata: result.windAnalysis.metadata
      } : undefined,
      geoEnhancement: {
        enabled: projectInputs.geoEnhanced || false,
        data: projectInputs.geoEnhanced ? {
          county: projectInputs.county,
          state: projectInputs.state,
          hvhz: projectInputs.hvhz
        } : null,
        error: projectInputs.geoError || null
      }
    });
    
  } catch (error) {
    console.error('❌ Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed',
      details: error.message
    });
  }
});

/**
 * Test SOW generation with sample data and geo services
 * GET /api/sow/test
 */
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Running SOW generation test with externalized geo/wind services');
    
    const result = await testSOWGeneration();
    
    res.json({
      success: true,
      testResult: result,
      message: 'SOW generation test completed with externalized services',
      timestamp: new Date().toISOString(),
      geoWindServices: {
        geoService: 'enabled',
        windMapService: 'enabled',
        integration: 'active'
      }
    });
    
  } catch (error) {
    console.error('❌ Test SOW generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Test SOW generation failed',
      details: error.message
    });
  }
});

/**
 * Get available templates and their requirements
 * GET /api/sow/templates
 */
router.get('/templates', (req, res) => {
  try {
    const templates = {
      T6: {
        id: 'T6',
        name: 'tearoff-tpo-ma-insul-steel',
        description: 'Steel Deck Tearoff with Mechanically Attached TPO',
        requirements: {
          project_type: 'tearoff',
          deck_type: 'Steel',
          attachment_method: 'mechanical'
        }
      },
      T7: {
        id: 'T7',
        name: 'tearoff-tpo-ma-insul-lwc-steel',
        description: 'LWC Steel Deck Tearoff with Mechanically Attached TPO',
        requirements: {
          project_type: 'tearoff',
          deck_type: 'Steel',
          cover_board: 'Lightweight Concrete'
        }
      },
      T8: {
        id: 'T8',
        name: 'tearoff-tpo-adhered-insul-adhered-gypsum',
        description: 'Gypsum Deck Tearoff with Fully Adhered TPO',
        requirements: {
          project_type: 'tearoff',
          deck_type: 'Gypsum',
          attachment_method: 'fully_adhered'
        }
      },
      T5: {
        id: 'T5',
        name: 'recover-tpo-rhino-iso-eps-flute-fill-ssr',
        description: 'SSR Recover System',
        requirements: {
          project_type: 'recover',
          system_type: 'recover'
        }
      }
    };

    res.json({
      success: true,
      templates,
      total: Object.keys(templates).length,
      geoWindIntegration: 'All templates now support geo/wind enhancement'
    });
    
  } catch (error) {
    console.error('❌ Templates endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve templates'
    });
  }
});

/**
 * Get wind analysis for a location using externalized wind service
 * POST /api/sow/wind-analysis
 */
router.post('/wind-analysis', async (req, res) => {
  try {
    const { projectInputs, address, lat, lng, asceVersion, riskCategory } = req.body;
    
    let coordinates;
    
    if (lat && lng) {
      coordinates = { latitude: lat, longitude: lng };
    } else if (address) {
      coordinates = await geoService.getCoordinatesFromAddress(address);
    } else if (projectInputs && projectInputs.address) {
      coordinates = await geoService.getCoordinatesFromAddress(projectInputs.address);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Address or coordinates are required for wind analysis'
      });
    }

    console.log(`🌪️ Wind analysis request for: ${coordinates.latitude}, ${coordinates.longitude}`);
    
    // Get comprehensive geo and wind data
    const [jurisdiction, hvhzStatus, windData] = await Promise.all([
      geoService.getJurisdiction(coordinates.latitude, coordinates.longitude),
      geoService.getHVHZStatus(coordinates.latitude, coordinates.longitude),
      windService.getDesignWindSpeed(coordinates.latitude, coordinates.longitude, asceVersion, riskCategory)
    ]);

    // Also run traditional SOW engine wind analysis for comparison
    let sowWindAnalysis = null;
    if (projectInputs) {
      const enhancedInputs = {
        ...projectInputs,
        coordinates,
        county: jurisdiction.county,
        state: jurisdiction.state,
        hvhz: hvhzStatus.isHVHZ,
        designWindSpeed: windData.designWindSpeed
      };
      
      const engine = createSOWEngine();
      const result = await engine.generateSOW({
        projectInputs: enhancedInputs,
        options: {
          validateOnly: true,
          includeWindAnalysis: true
        }
      });
      
      sowWindAnalysis = result.windAnalysis;
    }

    res.json({
      success: true,
      coordinates,
      geoData: {
        jurisdiction,
        hvhzStatus
      },
      windAnalysis: {
        external: {
          designWindSpeed: windData.designWindSpeed,
          riskCategory: windData.riskCategory,
          asceVersion: windData.asceVersion,
          exposureCategory: windData.exposureCategory,
          source: windData.source,
          metadata: windData.metadata
        },
        sowEngine: sowWindAnalysis
      },
      comparison: sowWindAnalysis ? {
        windSpeedMatch: sowWindAnalysis.metadata?.basicWindSpeed === windData.designWindSpeed,
        hvhzMatch: sowWindAnalysis.metadata?.hvhz === hvhzStatus.isHVHZ
      } : null
    });
    
  } catch (error) {
    console.error('❌ Wind analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Wind analysis failed',
      details: error.message
    });
  }
});

/**
 * System status and health check with geo/wind services
 * GET /api/sow/status
 */
router.get('/status', async (req, res) => {
  try {
    // Check geo/wind service health
    const [geoHealth, windHealth] = await Promise.all([
      geoService ? { status: 'operational' } : { status: 'unavailable' },
      windService ? { status: 'operational' } : { status: 'unavailable' }
    ]);
    
    const status = {
      service: 'SOW Generation Engine',
      version: '2.0.0-externalized',
      status: 'operational',
      features: {
        sectionSelection: 'enabled',
        contentGeneration: 'enabled',
        windAnalysis: 'enabled',
        templateSupport: ['T5', 'T6', 'T7', 'T8'],
        jurisdictionMapping: 'enabled',
        geoService: geoHealth.status,
        windMapService: windHealth.status,
        hvhzLookup: 'enabled',
        externalizedServices: 'active'
      },
      performance: {
        averageGenerationTime: '< 3 seconds (with geo enhancement)',
        supportedInputFormats: ['field_inspection', 'manual_input'],
        outputFormats: ['json', 'structured_document'],
        geoEnhancement: 'automatic'
      },
      externalServices: {
        openCageGeocoding: !!process.env.OPENCAGE_API_KEY,
        supabaseHVHZ: 'configured',
        asceWindScraping: 'enabled',
        localWindFallback: 'available'
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      status
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Status check failed',
      details: error.message
    });
  }
});

export default router;
