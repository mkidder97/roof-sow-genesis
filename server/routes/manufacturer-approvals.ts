// Manufacturer Approvals API Routes
import express from 'express';
import { 
  getManufacturerSpecs, 
  getAvailableManufacturers, 
  getManufacturerProducts,
  hasValidApproval,
  getExpiringApprovals 
} from '../lib/manufacturer-approvals.js';

const router = express.Router();

/**
 * GET /api/manufacturer-approvals/specs/:manufacturer/:productType
 * Get specific manufacturer specifications
 */
router.get('/specs/:manufacturer/:productType', async (req, res) => {
  try {
    const { manufacturer, productType } = req.params;
    
    console.log(`📋 API request: Get specs for ${manufacturer} ${productType}`);
    
    const specs = await getManufacturerSpecs(manufacturer, productType);
    
    if (!specs) {
      return res.status(404).json({
        success: false,
        error: `No approval found for ${manufacturer} ${productType}`,
        manufacturer,
        productType
      });
    }
    
    res.json({
      success: true,
      data: specs,
      metadata: {
        manufacturer: specs.manufacturer,
        productType: specs.productType,
        isValid: !specs.isExpired,
        requestedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching manufacturer specs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/manufacturer-approvals/available/:productType
 * Get all available manufacturers for a product type
 */
router.get('/available/:productType', async (req, res) => {
  try {
    const { productType } = req.params;
    
    console.log(`📋 API request: Get available manufacturers for ${productType}`);
    
    const manufacturers = await getAvailableManufacturers(productType);
    
    res.json({
      success: true,
      data: manufacturers,
      metadata: {
        productType,
        count: manufacturers.length,
        activeCount: manufacturers.filter(m => !m.isExpired).length,
        expiredCount: manufacturers.filter(m => m.isExpired).length,
        requestedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching available manufacturers:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/manufacturer-approvals/products/:manufacturer
 * Get all products for a specific manufacturer
 */
router.get('/products/:manufacturer', async (req, res) => {
  try {
    const { manufacturer } = req.params;
    
    console.log(`📋 API request: Get products for ${manufacturer}`);
    
    const products = await getManufacturerProducts(manufacturer);
    
    res.json({
      success: true,
      data: products,
      metadata: {
        manufacturer,
        count: products.length,
        productTypes: [...new Set(products.map(p => p.productType))],
        requestedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching manufacturer products:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/manufacturer-approvals/validate/:manufacturer/:productType
 * Validate if a manufacturer/product combination has valid approval
 */
router.get('/validate/:manufacturer/:productType', async (req, res) => {
  try {
    const { manufacturer, productType } = req.params;
    
    console.log(`📋 API request: Validate approval for ${manufacturer} ${productType}`);
    
    const isValid = await hasValidApproval(manufacturer, productType);
    const specs = await getManufacturerSpecs(manufacturer, productType);
    
    res.json({
      success: true,
      data: {
        isValid,
        manufacturer,
        productType,
        specs: specs || null,
        validationDetails: {
          exists: specs !== null,
          isExpired: specs ? specs.isExpired : null,
          expirationDate: specs ? specs.expirationDate : null
        }
      },
      metadata: {
        requestedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error validating approval:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/manufacturer-approvals/expiring
 * Get approvals expiring within specified days (default: 30)
 */
router.get('/expiring', async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.days as string) || 30;
    
    console.log(`📋 API request: Get approvals expiring within ${daysAhead} days`);
    
    const expiringApprovals = await getExpiringApprovals(daysAhead);
    
    res.json({
      success: true,
      data: expiringApprovals,
      metadata: {
        daysAhead,
        count: expiringApprovals.length,
        expiredCount: expiringApprovals.filter(a => a.isExpired).length,
        soonToExpireCount: expiringApprovals.filter(a => !a.isExpired).length,
        requestedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching expiring approvals:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/manufacturer-approvals/health
 * Health check for manufacturer approvals system
 */
router.get('/health', async (req, res) => {
  try {
    console.log('📋 API request: Health check for manufacturer approvals');
    
    // Test database connectivity by trying to fetch one record
    const testManufacturers = await getAvailableManufacturers('tpo');
    const expiringApprovals = await getExpiringApprovals(30);
    
    res.json({
      success: true,
      status: 'healthy',
      data: {
        databaseConnected: true,
        totalTPOManufacturers: testManufacturers.length,
        expiringSoon: expiringApprovals.length,
        lastChecked: new Date().toISOString()
      },
      metadata: {
        service: 'manufacturer-approvals',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/manufacturer-approvals/test
 * Test endpoint with sample data for development
 */
router.get('/test', async (req, res) => {
  try {
    console.log('📋 API request: Test manufacturer approvals with sample data');
    
    // Test with known manufacturers from our seed data
    const johnsMantvilleTPO = await getManufacturerSpecs('johns-manville', 'tpo');
    const carlisleTPO = await getManufacturerSpecs('carlisle', 'tpo');
    const gafEPDM = await getManufacturerSpecs('gaf', 'epdm');
    
    const allTPOManufacturers = await getAvailableManufacturers('tpo');
    
    res.json({
      success: true,
      testResults: {
        johnsMantvilleTPO: {
          found: johnsMantvilleTPO !== null,
          isValid: johnsMantvilleTPO ? !johnsMantvilleTPO.isExpired : false,
          fpaNumber: johnsMantvilleTPO?.fpaNumber || 'N/A',
          mcrfValue: johnsMantvilleTPO?.mcrfValue || 'N/A'
        },
        carlisleTPO: {
          found: carlisleTPO !== null,
          isValid: carlisleTPO ? !carlisleTPO.isExpired : false,
          fpaNumber: carlisleTPO?.fpaNumber || 'N/A',
          mcrfValue: carlisleTPO?.mcrfValue || 'N/A'
        },
        gafEPDM: {
          found: gafEPDM !== null,
          isValid: gafEPDM ? !gafEPDM.isExpired : false,
          fpaNumber: gafEPDM?.fpaNumber || 'N/A',
          mcrfValue: gafEPDM?.mcrfValue || 'N/A'
        },
        allTPOManufacturers: {
          count: allTPOManufacturers.length,
          manufacturers: allTPOManufacturers.map(m => m.manufacturer)
        }
      },
      metadata: {
        message: 'Test completed successfully',
        timestamp: new Date().toISOString(),
        note: 'This endpoint is for development and testing purposes'
      }
    });
    
  } catch (error) {
    console.error('❌ Test endpoint failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
