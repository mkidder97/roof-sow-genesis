import { Router } from 'express';
import {
  engineeringConfig,
  getConfig,
  getAllConfigs,
  findMatchingTemplate
} from '../services/engineering-config';
import type { TemplateCondition } from '../types/engineering-config';

const router = Router();

/**
 * GET /api/engineering-config/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    // Test database connectivity by fetching a simple config
    const response = await getConfig('importance_factors');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database_connected: response.success,
      cache_size: (engineeringConfig as any).cache?.size || 0
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/engineering-config/all
 * Get all configuration values
 */
router.get('/all', async (req, res) => {
  try {
    const response = await getAllConfigs();
    
    if (!response.success) {
      return res.status(500).json({
        error: 'Failed to fetch configurations',
        details: response.error
      });
    }

    res.json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/engineering-config/:key
 * Get specific configuration by key
 */
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    // Type assertion - in production, you might want to validate this
    const response = await getConfig(key as any);
    
    if (!response.success) {
      return res.status(404).json({
        error: 'Configuration not found',
        key,
        details: response.error
      });
    }

    res.json({
      success: true,
      key,
      data: response.data,
      cached: response.cached,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/engineering-config/template-match
 * Find matching template based on project conditions
 */
router.post('/template-match', async (req, res) => {
  try {
    const conditions: TemplateCondition = req.body;
    
    if (!conditions || typeof conditions !== 'object') {
      return res.status(400).json({
        error: 'Invalid request body. Expected project conditions object.'
      });
    }

    const response = await findMatchingTemplate(conditions);
    
    if (!response.success) {
      return res.status(404).json({
        error: 'No matching template found',
        conditions,
        details: response.error
      });
    }

    res.json({
      success: true,
      template: response.data,
      conditions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/engineering-config/values/importance-factor/:classification
 * Get importance factor for specific building classification
 */
router.get('/values/importance-factor/:classification', async (req, res) => {
  try {
    const { classification } = req.params;
    
    if (!['standard', 'essential', 'emergency'].includes(classification)) {
      return res.status(400).json({
        error: 'Invalid classification. Must be: standard, essential, or emergency'
      });
    }

    const factor = await engineeringConfig.getImportanceFactor(classification as any);
    
    res.json({
      success: true,
      classification,
      importance_factor: factor,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/engineering-config/values/internal-pressure/:enclosure
 * Get internal pressure coefficient for enclosure type
 */
router.get('/values/internal-pressure/:enclosure', async (req, res) => {
  try {
    const { enclosure } = req.params;
    
    if (!['enclosed', 'partially_enclosed', 'open'].includes(enclosure)) {
      return res.status(400).json({
        error: 'Invalid enclosure type. Must be: enclosed, partially_enclosed, or open'
      });
    }

    const coeff = await engineeringConfig.getInternalPressureCoeff(enclosure as any);
    
    res.json({
      success: true,
      enclosure,
      internal_pressure_coeff: coeff,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/engineering-config/values/directivity-factor
 * Get wind directionality factor
 */
router.get('/values/directivity-factor', async (req, res) => {
  try {
    const factor = await engineeringConfig.getDirectivityFactor();
    
    res.json({
      success: true,
      directivity_factor: factor,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/engineering-config/clear-cache
 * Clear configuration cache (useful for development/testing)
 */
router.post('/clear-cache', async (req, res) => {
  try {
    engineeringConfig.clearCache();
    
    res.json({
      success: true,
      message: 'Configuration cache cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/engineering-config/test
 * Comprehensive test endpoint for all configurations
 */
router.get('/test', async (req, res) => {
  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: {} as Record<string, any>
    };

    // Test basic config access
    const importanceFactors = await getConfig('importance_factors');
    testResults.tests.importance_factors = {
      success: importanceFactors.success,
      cached: importanceFactors.cached,
      data_exists: !!importanceFactors.data
    };

    const internalPressure = await getConfig('internal_pressure_coeffs');
    testResults.tests.internal_pressure_coeffs = {
      success: internalPressure.success,
      cached: internalPressure.cached,
      data_exists: !!internalPressure.data
    };

    const directivity = await getConfig('directivity_factor');
    testResults.tests.directivity_factor = {
      success: directivity.success,
      cached: directivity.cached,
      data_exists: !!directivity.data
    };

    // Test template matching
    const templateTest = await findMatchingTemplate({
      roofType: 'tearoff',
      deckType: 'steel',
      membraneType: 'TPO',
      attachmentType: 'mechanically_attached',
      hasInsulation: true
    });
    testResults.tests.template_matching = {
      success: templateTest.success,
      template_found: !!templateTest.data,
      template: templateTest.data
    };

    // Test convenience methods
    const importanceFactor = await engineeringConfig.getImportanceFactor('standard');
    testResults.tests.convenience_methods = {
      importance_factor_standard: importanceFactor,
      success: typeof importanceFactor === 'number'
    };

    res.json({
      success: true,
      message: 'Engineering configuration test completed',
      results: testResults
    });
  } catch (error) {
    res.status(500).json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
