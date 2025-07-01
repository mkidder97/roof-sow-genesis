// Jurisdiction Analysis API Routes
import { Request, Response } from 'express';
import { 
  performComprehensiveAnalysis,
  quickJurisdictionLookup,
  validateJurisdictionCompliance,
  generateSOWMetadata,
  createPressureTable
} from '../lib/jurisdiction-analysis';
import { 
  getJurisdictionFromAddress,
  getCodeData
} from '../lib/jurisdiction-mapping';
import { 
  JurisdictionAnalysisRequest,
  JurisdictionAnalysisResponse,
  QuickJurisdictionLookup,
  QuickJurisdictionResponse
} from '@roof-sow-genesis/shared';

/**
 * Main jurisdiction analysis endpoint
 * POST /api/jurisdiction/analyze
 */
export async function analyzeJurisdiction(req: Request, res: Response) {
  try {
    const { address, buildingHeight, exposureCategory }: JurisdictionAnalysisRequest = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required for jurisdiction analysis'
      });
    }
    
    console.log(`🔍 Analyzing jurisdiction for: ${address}`);
    
    // Perform comprehensive analysis
    const analysis = await performComprehensiveAnalysis(
      address,
      buildingHeight || 30,
      exposureCategory
    );
    
    // Generate additional metadata
    const metadata = generateSOWMetadata(analysis);
    const pressureTable = createPressureTable(analysis);
    const compliance = validateJurisdictionCompliance(analysis);
    
    const response: JurisdictionAnalysisResponse = {
      success: true,
      analysis,
      metadata,
      pressureTable,
      compliance
    };
    
    console.log(`✅ Jurisdiction analysis completed for ${analysis.jurisdiction.county}, ${analysis.jurisdiction.state}`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Jurisdiction analysis failed:', error);
    
    const response: JurisdictionAnalysisResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Jurisdiction analysis failed'
    };
    
    res.status(500).json(response);
  }
}

/**
 * Quick jurisdiction lookup for known county/state
 * POST /api/jurisdiction/lookup
 */
export async function lookupJurisdiction(req: Request, res: Response) {
  try {
    const { county, state }: QuickJurisdictionLookup = req.body;
    
    if (!county || !state) {
      return res.status(400).json({
        success: false,
        error: 'County and state are required for jurisdiction lookup'
      });
    }
    
    console.log(`📋 Looking up jurisdiction: ${county}, ${state}`);
    
    const codeData = await quickJurisdictionLookup(county, state);
    
    const response: { success: boolean; data?: QuickJurisdictionResponse; error?: string } = {
      success: true,
      data: codeData
    };
    
    console.log(`✅ Jurisdiction lookup completed: ${codeData.codeCycle}, ${codeData.asceVersion}`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Jurisdiction lookup failed:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Jurisdiction lookup failed'
    });
  }
}

/**
 * Get jurisdiction from address (geocoding only)
 * POST /api/jurisdiction/geocode
 */
export async function geocodeToJurisdiction(req: Request, res: Response) {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required for geocoding'
      });
    }
    
    console.log(`📍 Geocoding address to jurisdiction: ${address}`);
    
    const jurisdiction = await getJurisdictionFromAddress(address);
    
    res.json({
      success: true,
      data: jurisdiction
    });
    
  } catch (error) {
    console.error('❌ Geocoding failed:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Geocoding failed'
    });
  }
}

/**
 * Get ASCE and code data for specific jurisdiction
 * POST /api/jurisdiction/codes
 */
export async function getJurisdictionCodes(req: Request, res: Response) {
  try {
    const { city, county, state } = req.body;
    
    if (!county || !state) {
      return res.status(400).json({
        success: false,
        error: 'County and state are required'
      });
    }
    
    console.log(`📋 Getting code data for: ${county}, ${state}`);
    
    const codeData = await getCodeData({ city: city || '', county, state });
    
    res.json({
      success: true,
      data: codeData
    });
    
  } catch (error) {
    console.error('❌ Code data lookup failed:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Code data lookup failed'
    });
  }
}

/**
 * Health check for jurisdiction services
 * GET /api/jurisdiction/health
 */
export async function jurisdictionHealth(req: Request, res: Response) {
  try {
    // Test basic functionality
    const testJurisdiction = await quickJurisdictionLookup('Dallas County', 'TX');
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        'jurisdiction-mapping': 'operational',
        'geocoding': 'operational', 
        'wind-analysis': 'operational',
        'asce-data-loading': 'operational'
      },
      testResult: {
        county: 'Dallas County',
        state: 'TX',
        codeCycle: testJurisdiction.codeCycle,
        asceVersion: testJurisdiction.asceVersion,
        hvhz: testJurisdiction.hvhz
      },
      endpoints: {
        'POST /api/jurisdiction/analyze': 'Comprehensive jurisdiction analysis',
        'POST /api/jurisdiction/lookup': 'Quick jurisdiction code lookup',
        'POST /api/jurisdiction/geocode': 'Address to jurisdiction geocoding',
        'POST /api/jurisdiction/codes': 'Get ASCE/code data for jurisdiction',
        'GET /api/jurisdiction/health': 'Service health check'
      }
    });
    
  } catch (error) {
    console.error('❌ Jurisdiction health check failed:', error);
    
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
      services: {
        'jurisdiction-mapping': 'unknown',
        'geocoding': 'unknown',
        'wind-analysis': 'unknown',
        'asce-data-loading': 'unknown'
      }
    });
  }
}

/**
 * Validate compliance for jurisdiction data
 * POST /api/jurisdiction/validate
 */
export async function validateCompliance(req: Request, res: Response) {
  try {
    const { address, buildingHeight } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required for compliance validation'
      });
    }
    
    console.log(`✅ Validating compliance for: ${address}`);
    
    // Perform analysis to get compliance data
    const analysis = await performComprehensiveAnalysis(address, buildingHeight || 30);
    const compliance = validateJurisdictionCompliance(analysis);
    
    res.json({
      success: true,
      address,
      jurisdiction: {
        county: analysis.jurisdiction.county,
        state: analysis.jurisdiction.state,
        codeCycle: analysis.jurisdiction.codeCycle,
        asceVersion: analysis.jurisdiction.asceVersion,
        hvhz: analysis.jurisdiction.hvhz
      },
      compliance
    });
    
  } catch (error) {
    console.error('❌ Compliance validation failed:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Compliance validation failed'
    });
  }
}

/**
 * Get pressure table data for SOW generation
 * POST /api/jurisdiction/pressure-table
 */
export async function getPressureTable(req: Request, res: Response) {
  try {
    const { address, buildingHeight, exposureCategory } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required for pressure table generation'
      });
    }
    
    console.log(`📊 Generating pressure table for: ${address}`);
    
    const analysis = await performComprehensiveAnalysis(
      address,
      buildingHeight || 30,
      exposureCategory
    );
    
    const pressureTable = createPressureTable(analysis);
    
    res.json({
      success: true,
      pressureTable,
      metadata: {
        jurisdiction: `${analysis.jurisdiction.county}, ${analysis.jurisdiction.state}`,
        method: analysis.summary.appliedMethod,
        windSpeed: `${analysis.windAnalysis.designWindSpeed} mph`,
        asceVersion: analysis.jurisdiction.asceVersion
      }
    });
    
  } catch (error) {
    console.error('❌ Pressure table generation failed:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Pressure table generation failed'
    });
  }
}

/**
 * Test endpoint for debugging jurisdiction analysis
 * POST /api/jurisdiction/debug
 */
export async function debugJurisdiction(req: Request, res: Response) {
  try {
    const { address = '2650 NW 89th Ct, Doral, FL 33172' } = req.body;
    
    console.log(`🧪 Debug jurisdiction analysis for: ${address}`);
    
    // Step-by-step debug information
    const debugInfo: any = {
      step1_geocoding: null,
      step2_jurisdiction: null,
      step3_codeData: null,
      step4_windAnalysis: null,
      step5_compliance: null,
      errors: []
    };
    
    try {
      // Step 1: Geocoding
      const jurisdiction = await getJurisdictionFromAddress(address);
      debugInfo.step1_geocoding = jurisdiction;
      
      // Step 2: Code data
      const codeData = await getCodeData(jurisdiction);
      debugInfo.step3_codeData = codeData;
      
      // Step 3: Full analysis
      const analysis = await performComprehensiveAnalysis(address, 30);
      debugInfo.step4_windAnalysis = {
        windSpeed: analysis.windAnalysis.designWindSpeed,
        zonePressures: analysis.windAnalysis.zonePressures,
        exposure: analysis.windAnalysis.exposureCategory
      };
      
      // Step 4: Compliance
      const compliance = validateJurisdictionCompliance(analysis);
      debugInfo.step5_compliance = compliance;
      
      res.json({
        success: true,
        debug: true,
        address,
        debugInfo,
        fullAnalysis: analysis
      });
      
    } catch (stepError) {
      debugInfo.errors.push({
        step: 'unknown',
        error: stepError instanceof Error ? stepError.message : 'Unknown error'
      });
      
      res.status(500).json({
        success: false,
        debug: true,
        address,
        debugInfo,
        error: stepError instanceof Error ? stepError.message : 'Debug failed'
      });
    }
    
  } catch (error) {
    console.error('❌ Debug endpoint failed:', error);
    
    res.status(500).json({
      success: false,
      debug: true,
      error: error instanceof Error ? error.message : 'Debug endpoint failed'
    });
  }
}