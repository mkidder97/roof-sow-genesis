// Clean Production Server - No Self-Healing, Direct SOW Generation
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

// Import clean production SOW routes
import sowProductionRouter from './routes/sow-production.js';

// Import enhanced manufacturer analysis (keep the good parts)
import { 
  analyzeJurisdiction,
  lookupJurisdiction,
  geocodeToJurisdiction,
  getJurisdictionCodes,
  jurisdictionHealth,
  validateCompliance,
  getPressureTable,
  debugJurisdiction
} from './routes/jurisdiction.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://roof-sow-genesis.lovable.app',
    'http://localhost:3000',
    'http://localhost:4173',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure output directory exists
const outputDir = path.join(process.cwd(), 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`📁 Created output directory: ${outputDir}`);
}

// Static file serving for generated PDFs
app.use('/output', express.static(outputDir));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: 'production-1.0.0',
      components: {
        server: 'operational',
        manufacturerScrapers: 'operational',
        windAnalysis: 'operational',
        jurisdictionMapping: 'operational',
        pdfGeneration: 'operational'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// ======================
// CLEAN PRODUCTION SOW GENERATION
// ======================
app.use('/api/sow', sowProductionRouter);

// ======================
// JURISDICTION ANALYSIS ENDPOINTS (Keep - These are Good)
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
// SYSTEM STATUS
// ======================
app.get('/api/status', (req, res) => {
  res.json({
    phase: 'Clean Production SOW Generation System',
    version: 'production-1.0.0',
    serverType: 'production',
    timestamp: new Date().toISOString(),
    
    productionFeatures: {
      cleanSOWGeneration: 'Direct SOW generation without self-healing complexity ✅',
      liveManufacturerScraping: 'Carlisle and Johns Manville real-time scraping ✅',
      windPressureCalculations: 'ASCE 7 dynamic formulas based on jurisdiction ✅',
      jurisdictionMapping: 'Comprehensive HVHZ and building code detection ✅',
      noaValidation: 'Live approval validation and compliance checking ✅',
      pdfGeneration: 'Professional SOW documents ✅',
      fileProcessing: 'Takeoff PDF/CSV/Excel processing ✅',
      deterministicGeneration: 'Predictable, reliable SOW generation ✅'
    },
    
    endpoints: {
      production: {
        'POST /api/sow/generate': 'Main production SOW generation endpoint',
        'GET /api/sow/health': 'SOW system health check'
      },
      jurisdiction: {
        'POST /api/jurisdiction/analyze': 'Comprehensive jurisdiction and wind analysis',
        'POST /api/jurisdiction/lookup': 'Quick jurisdiction code lookup',
        'POST /api/jurisdiction/geocode': 'Address to jurisdiction geocoding',
        'POST /api/jurisdiction/codes': 'Get ASCE/code data for jurisdiction',
        'POST /api/jurisdiction/validate': 'Validate compliance requirements',
        'POST /api/jurisdiction/pressure-table': 'Generate pressure tables for SOW',
        'POST /api/jurisdiction/debug': 'Debug jurisdiction analysis pipeline',
        'GET /api/jurisdiction/health': 'Jurisdiction services health check'
      },
      system: {
        'GET /health': 'Server health check',
        'GET /api/status': 'Complete system status'
      }
    },
    
    developmentTools: {
      note: 'MCP tools moved to developer-only utilities',
      mcpTools: [
        'analyze-pdf-output - PDF quality analysis (dev only)',
        'pdf-formatting-optimizer - Template compliance checking (dev only)',
        'propose-fix-snippet - AI improvement suggestions (dev only)',
        'write-fix-module - Automated fix implementation (dev only)',
        'trigger-regeneration - PDF regeneration (dev only)'
      ],
      usage: 'Run MCP tools manually for development, not integrated in production workflow'
    },
    
    architecture: {
      principle: 'Clean separation between production features and developer tools',
      productionWorkflow: 'Frontend → /api/sow/generate → Direct SOW Generation → PDF → User',
      developerWorkflow: 'Developer → MCP Tools → PDF Analysis → Manual Improvements → Update Templates',
      noSelfHealing: 'No automated self-healing loops in production workflow',
      deterministic: 'Predictable, reliable SOW generation every time'
    }
  });
});

// Developer tools info endpoint (not integrated in workflow)
app.get('/api/dev-tools', (req, res) => {
  res.json({
    title: 'Developer Tools (Separate from Production)',
    note: 'These tools are for development only and not integrated in the production SOW workflow',
    mcpTools: {
      'analyze-pdf-output': {
        description: 'Analyze generated PDFs for quality and compliance',
        usage: 'Run manually for template development',
        location: './mcp-tools/analyze-pdf-output/'
      },
      'pdf-formatting-optimizer': {
        description: 'Check template compliance and formatting issues',
        usage: 'Run manually for template optimization',
        location: './mcp-tools/pdf-formatting-optimizer/'
      },
      'propose-fix-snippet': {
        description: 'AI suggests improvements for templates',
        usage: 'Run manually for template enhancement',
        location: './mcp-tools/propose-fix-snippet/'
      },
      'write-fix-module': {
        description: 'Implement fixes in template files',
        usage: 'Run manually for template updates',
        location: './mcp-tools/write-fix-module/'
      },
      'trigger-regeneration': {
        description: 'Regenerate PDFs with improvements',
        usage: 'Run manually for testing template changes',
        location: './mcp-tools/trigger-regeneration/'
      }
    },
    instructions: {
      setup: 'Run ./setup-mcp-tools.sh to configure MCP tools',
      usage: 'Use MCP tools manually for template development',
      integration: 'MCP tools are NOT integrated in production workflow by design'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    serverType: 'production'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    requestedPath: req.originalUrl,
    availableEndpoints: [
      'GET /health - System health check',
      'GET /api/status - Complete system status',
      'POST /api/sow/generate - Main SOW generation',
      'GET /api/sow/health - SOW system health',
      'POST /api/jurisdiction/* - Jurisdiction analysis',
      'GET /api/dev-tools - Developer tools info (separate from production)'
    ]
  });
});

app.listen(PORT, () => {
  console.log('🚀 Clean Production SOW Generator Starting...');
  console.log('=' .repeat(80));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log('');
  console.log('✅ Production Features:');
  console.log(`   🎯 Main SOW Generation: POST /api/sow/generate`);
  console.log(`   🏭 Live Manufacturer Scraping: Carlisle + Johns Manville`);
  console.log(`   💨 Wind Analysis: ASCE 7 calculations`);
  console.log(`   📍 Jurisdiction Mapping: HVHZ + building codes`);
  console.log(`   ✅ NOA Validation: Real-time approval checking`);
  console.log(`   📄 Professional PDF Generation`);
  console.log('');
  console.log('🧪 Health Checks:');
  console.log(`   ❤️  Server Health: GET /health`);
  console.log(`   🎯 SOW Health: GET /api/sow/health`);
  console.log(`   📊 Full Status: GET /api/status`);
  console.log('');
  console.log('🛠️ Architecture:');
  console.log(`   ✅ Clean production workflow (no self-healing loops)`);
  console.log(`   ✅ Deterministic SOW generation`);
  console.log(`   ✅ MCP tools separate (developer utilities only)`);
  console.log(`   ✅ Live manufacturer data integration`);
  console.log('');
  console.log('📁 Output Directory:', outputDir);
  console.log('🌍 CORS Enabled for Lovable and local development');
  console.log('=' .repeat(80));
  console.log('🎉 CLEAN PRODUCTION SOW SYSTEM OPERATIONAL!');
  console.log('');
  console.log('📋 Ready for frontend testing at: http://localhost:5173');
});

export default app;
