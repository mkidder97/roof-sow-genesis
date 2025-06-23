// Enhanced Express Server with Section Engine & Self-Healing Integration
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import SOW routes
import { generateSOWWithSummary, healthCheck, debugSOW } from './routes/sow';

// Import enhanced SOW routes with Section Engine
import { 
  debugSOWEnhanced, 
  debugSectionAnalysis, 
  debugSelfHealing,
  debugEngineTrace,
  renderTemplateContent,
  getTemplateMap
} from './routes/sow-enhanced';

// Import jurisdiction analysis routes
import { 
  analyzeJurisdiction,
  lookupJurisdiction,
  geocodeToJurisdiction,
  getJurisdictionCodes,
  jurisdictionHealth,
  validateCompliance,
  getPressureTable,
  debugJurisdiction
} from './routes/jurisdiction';

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced CORS configuration for Lovable and local development
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://roof-sow-genesis.lovable.app',
    'http://localhost:3000',
    'http://localhost:4173'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload handling
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Ensure output directory exists
const outputDir = path.join(__dirname, '..', 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`📁 Created output directory: ${outputDir}`);
}

// Static file serving for generated PDFs
app.use('/output', express.static(outputDir));

// Health check endpoint
app.get('/health', healthCheck);

// ======================
// LEGACY SOW ENDPOINTS (for backward compatibility)
// ======================
app.post('/api/generate-sow', upload.single('file'), generateSOWWithSummary);
app.post('/api/debug-sow-legacy', debugSOW);

// ======================
// ENHANCED SOW ENDPOINTS (Phase 3: Section Engine & Self-Healing)
// ======================

// Main debug endpoint with Section Engine integration
app.post('/api/sow/debug-sow', debugSOWEnhanced);

// NEW: Section-specific analysis
app.post('/api/sow/debug-sections', debugSectionAnalysis);

// NEW: Self-healing analysis
app.post('/api/sow/debug-self-healing', debugSelfHealing);

// Individual engine trace debugging
app.post('/api/sow/debug-engine-trace', debugEngineTrace);

// Template rendering with dynamic sections
app.post('/api/sow/render-template', renderTemplateContent);

// Template mapping
app.get('/api/sow/templates', getTemplateMap);

// Main SOW generation endpoint (enhanced)
app.post('/api/sow/generate-sow', upload.single('file'), async (req, res) => {
  try {
    // This would be the enhanced SOW generation with section engine
    // For now, redirect to debug endpoint to test full pipeline
    console.log('🔄 Redirecting to enhanced debug SOW for testing...');
    await debugSOWEnhanced(req, res);
  } catch (error) {
    console.error('❌ Enhanced SOW generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'SOW generation failed'
    });
  }
});

// ======================
// JURISDICTION ANALYSIS ENDPOINTS
// ======================
app.post('/api/jurisdiction/analyze', analyzeJurisdiction);
app.post('/api/jurisdiction/lookup', lookupJurisdiction);
app.post('/api/jurisdiction/geocode', geocodeToJurisdiction);
app.post('/api/jurisdiction/codes', getJurisdictionCodes);
app.post('/api/jurisdiction/validate', validateCompliance);
app.post('/api/jurisdiction/pressure-table', getPressureTable);
app.post('/api/jurisdiction/debug', debugJurisdiction);
app.get('/api/jurisdiction/health', jurisdictionHealth);

// ======================
// SYSTEM STATUS & DOCUMENTATION
// ======================

// Enhanced system status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    phase: 'Section Engine & Self-Healing (Phase 3)',
    version: '4.0.0',
    engineVersion: '4.0.0 - Section Engine & Self-Healing',
    serverStatus: 'running',
    timestamp: new Date().toISOString(),
    features: {
      sectionEngine: 'Dynamic paragraph mapping and content generation',
      selfHealing: 'Intelligent input validation and correction',
      windPressureCalculations: 'ASCE 7-10/16/22 dynamic formulas',
      manufacturerPatterns: 'Live fastening pattern selection',
      takeoffLogic: 'Smart section injection based on takeoff data',
      jurisdictionMapping: 'Comprehensive HVHZ and building code detection',
      templateSystem: 'T1-T8 template selection and rendering',
      complianceValidation: 'HVHZ and special requirements checking',
      pdfGeneration: 'Professional SOW documents with dynamic sections'
    },
    endpoints: {
      main: {
        'POST /api/sow/generate-sow': 'Main SOW generation with section engine',
        'POST /api/sow/debug-sow': 'Complete debug with section analysis',
        'GET /health': 'System health check'
      },
      sectionEngine: {
        'POST /api/sow/debug-sections': 'Section mapping and reasoning',
        'POST /api/sow/debug-self-healing': 'Self-healing actions report',
        'POST /api/sow/debug-engine-trace': 'Individual engine debugging',
        'POST /api/sow/render-template': 'Template content rendering',
        'GET /api/sow/templates': 'Available template mapping'
      },
      jurisdiction: {
        'POST /api/jurisdiction/analyze': 'Comprehensive jurisdiction analysis',
        'POST /api/jurisdiction/lookup': 'Quick jurisdiction lookup',
        'POST /api/jurisdiction/debug': 'Debug jurisdiction pipeline'
      }
    },
    dataStructure: {
      sectionAnalysis: 'includedSections, excludedSections, reasoningMap, confidenceScore',
      selfHealingReport: 'totalActions, highImpactActions, recommendations, requiresUserReview',
      windUpliftPressures: 'zone1Field, zone1Perimeter, zone2Perimeter, zone3Corner (PSF)',
      fasteningSpecifications: 'fieldSpacing, perimeterSpacing, cornerSpacing, penetrationDepth',
      templateSelection: 'templateName, rationale, rejectedTemplates',
      engineeringSummary: 'Complete analysis with all engine outputs'
    },
    newCapabilities: {
      intelligentSectionMapping: 'Rules-based section inclusion/exclusion',
      contentGeneration: 'Professional paragraph content for each section',
      selfHealingInputs: 'Automatic correction of missing/invalid data',
      confidenceScoring: 'Reliability metrics for all decisions',
      transparentReasoning: 'Complete explainability for all choices',
      userReviewFlags: 'Intelligent flagging for human verification'
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Enhanced SOW Generator API - Section Engine & Self-Healing',
    version: '4.0.0',
    description: 'Intelligent SOW generation with dynamic section mapping and self-healing logic',
    testEndpoint: 'POST /api/sow/debug-sow',
    testData: {
      projectName: 'Test Project',
      address: 'Miami, FL',
      squareFootage: 50000,
      buildingHeight: 35,
      projectType: 'recover',
      membraneType: 'TPO',
      membraneThickness: '60mil',
      deckType: 'steel'
    },
    expectedResponse: {
      success: true,
      engineeringSummary: {
        templateSelection: 'Template selection with rationale',
        windAnalysis: 'ASCE-compliant wind pressure analysis',
        systemSelection: 'Manufacturer system selection',
        sectionAnalysis: 'Dynamic section mapping with reasoning',
        selfHealingReport: 'Input corrections and confidence metrics'
      },
      metadata: {
        sectionsIncluded: 'Number of included sections',
        sectionsExcluded: 'Number of excluded sections',  
        selfHealingActions: 'Number of corrections made'
      }
    },
    endpoints: {
      primary: {
        'POST /api/sow/debug-sow': {
          description: 'Main testing endpoint - returns complete engineering summary',
          body: 'Project parameters (see testData above)',
          response: 'Complete engineeringSummary with section analysis and self-healing'
        }
      },
      specialized: {
        'POST /api/sow/debug-sections': {
          description: 'Section mapping analysis',
          response: 'Detailed section decisions and reasoning'
        },
        'POST /api/sow/debug-self-healing': {
          description: 'Self-healing actions report',
          response: 'Input corrections and recommendations'
        }
      }
    }
  });
});

// Test endpoint for quick validation
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Enhanced SOW Generator API is running',
    version: '4.0.0',
    capabilities: ['section-engine', 'self-healing', 'jurisdiction-analysis'],
    timestamp: new Date().toISOString(),
    testSuggestion: 'POST /api/sow/debug-sow with project data'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/status',
      'GET /api/docs',
      'POST /api/sow/debug-sow',
      'POST /api/sow/debug-sections',
      'POST /api/sow/debug-self-healing'
    ]
  });
});

app.listen(PORT, () => {
  console.log('🚀 Enhanced SOW Generator Server Starting...');
  console.log('=' .repeat(60));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📊 Core Endpoints:');
  console.log(`   ✅ Health Check: GET /health`);
  console.log(`   📈 Status: GET /api/status`);
  console.log(`   📖 Docs: GET /api/docs`);
  console.log(`   🧪 Test: GET /api/test`);
  console.log('');
  console.log('🎯 Main SOW Endpoints:');
  console.log(`   🔧 Debug SOW: POST /api/sow/debug-sow`);
  console.log(`   📋 Sections: POST /api/sow/debug-sections`);
  console.log(`   🔄 Self-Healing: POST /api/sow/debug-self-healing`);
  console.log(`   🎨 Templates: GET /api/sow/templates`);
  console.log('');
  console.log('🏛️ Jurisdiction Endpoints:');
  console.log(`   📍 Analyze: POST /api/jurisdiction/analyze`);
  console.log(`   📋 Lookup: POST /api/jurisdiction/lookup`);
  console.log(`   🧪 Debug: POST /api/jurisdiction/debug`);
  console.log('');
  console.log('✨ Enhanced Features Active:');
  console.log(`   🧠 Section Engine - Dynamic paragraph mapping`);
  console.log(`   🔧 Self-Healing Logic - Intelligent input correction`);
  console.log(`   📊 Transparency - Complete decision explainability`);
  console.log(`   🎯 Confidence Scoring - Reliability metrics`);
  console.log(`   🔍 Debug Tracing - Full engine visibility`);
  console.log('');
  console.log('📁 Output Directory:', outputDir);
  console.log('🌍 CORS Enabled for: localhost:5173, roof-sow-genesis.lovable.app');
  console.log('=' .repeat(60));
  console.log('🎉 Server ready for testing! Try: POST /api/sow/debug-sow');
});

export default app;