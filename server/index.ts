// Enhanced Express Server with Comprehensive Jurisdiction Analysis
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { generateSOWWithSummary, healthCheck, debugSOW } from './routes/sow';
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

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload handling
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Static file serving for generated PDFs
app.use('/output', express.static('output'));

// Health check endpoint
app.get('/health', healthCheck);

// Main SOW generation endpoint
app.post('/api/generate-sow', upload.single('file'), generateSOWWithSummary);

// Debug endpoint for testing Phase 1 logic
app.post('/api/debug-sow', debugSOW);

// NEW: Comprehensive Jurisdiction Analysis Endpoints
app.post('/api/jurisdiction/analyze', analyzeJurisdiction);
app.post('/api/jurisdiction/lookup', lookupJurisdiction);
app.post('/api/jurisdiction/geocode', geocodeToJurisdiction);
app.post('/api/jurisdiction/codes', getJurisdictionCodes);
app.post('/api/jurisdiction/validate', validateCompliance);
app.post('/api/jurisdiction/pressure-table', getPressureTable);
app.post('/api/jurisdiction/debug', debugJurisdiction);
app.get('/api/jurisdiction/health', jurisdictionHealth);

// Enhanced system status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    phase: 'Enhanced with Jurisdiction Analysis',
    version: '2.1.0',
    features: {
      windPressureCalculations: 'ASCE 7-10/16/22 dynamic formulas based on jurisdiction',
      manufacturerPatterns: 'Live fastening pattern selection',
      takeoffLogic: 'Smart section injection based on takeoff data',
      geocoding: 'OpenCage with fallback support',
      jurisdictionMapping: 'Comprehensive HVHZ and building code detection',
      jurisdictionAnalysis: 'Full address-to-wind-pressure analysis pipeline',
      complianceValidation: 'HVHZ and special requirements checking',
      pdfGeneration: 'Professional SOW documents with jurisdiction metadata'
    },
    newEndpoints: {
      'POST /api/jurisdiction/analyze': 'Comprehensive jurisdiction and wind analysis',
      'POST /api/jurisdiction/lookup': 'Quick jurisdiction code lookup',
      'POST /api/jurisdiction/geocode': 'Address to jurisdiction geocoding',
      'POST /api/jurisdiction/codes': 'Get ASCE/code data for jurisdiction',
      'POST /api/jurisdiction/validate': 'Validate compliance requirements',
      'POST /api/jurisdiction/pressure-table': 'Generate pressure tables for SOW',
      'POST /api/jurisdiction/debug': 'Debug jurisdiction analysis pipeline',
      'GET /api/jurisdiction/health': 'Jurisdiction services health check'
    },
    dataStructure: {
      windUpliftPressures: 'zone1Field, zone1Perimeter, zone2Perimeter, zone3Corner (PSF)',
      fasteningSpecifications: 'fieldSpacing, perimeterSpacing, cornerSpacing, penetrationDepth',
      takeoffDiagnostics: 'drainOverflowRequired, highPenetrationDensity, etc.',
      asceVersion: 'Dynamic 7-10/7-16/7-22 based on jurisdiction mapping',
      hvhz: 'Auto-determined from county/state with special requirements',
      jurisdictionAnalysis: 'Full compliance and wind analysis metadata'
    },
    capabilities: {
      addressToWindPressure: 'Complete pipeline from address to ASCE-compliant wind pressures',
      jurisdictionCompliance: 'Automatic HVHZ, NOA, and special requirement detection',
      codeVersionMapping: 'Dynamic ASCE version selection based on local building codes',
      windCalculationSummary: 'Detailed calculation factors and methodology reporting'
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'SOW Generator API Documentation',
    version: '2.1.0',
    description: 'Comprehensive SOW generation with jurisdiction-based wind analysis',
    endpoints: {
      sow: {
        'POST /api/generate-sow': {
          description: 'Generate complete SOW with jurisdiction analysis',
          body: {
            projectName: 'string',
            address: 'string (required)',
            companyName: 'string',
            buildingHeight: 'number (default: 30)',
            squareFootage: 'number',
            membraneThickness: 'string',
            projectType: 'string',
            deckType: 'string'
          },
          response: 'Complete SOW PDF with engineering summary and metadata'
        },
        'POST /api/debug-sow': {
          description: 'Debug SOW generation with mock data',
          body: 'Optional overrides for testing',
          response: 'Debug information and generated SOW'
        }
      },
      jurisdiction: {
        'POST /api/jurisdiction/analyze': {
          description: 'Comprehensive jurisdiction and wind analysis',
          body: {
            address: 'string (required)',
            buildingHeight: 'number (optional)',
            exposureCategory: 'B|C|D (optional)'
          },
          response: 'Complete analysis with wind pressures, compliance, and metadata'
        },
        'POST /api/jurisdiction/lookup': {
          description: 'Quick jurisdiction code lookup',
          body: {
            county: 'string (required)',
            state: 'string (required)'
          },
          response: 'Code cycle, ASCE version, HVHZ status'
        },
        'POST /api/jurisdiction/geocode': {
          description: 'Convert address to jurisdiction',
          body: { address: 'string (required)' },
          response: 'City, county, state from geocoding'
        }
      },
      health: {
        'GET /health': 'Main system health check',
        'GET /api/jurisdiction/health': 'Jurisdiction services health check',
        'GET /api/status': 'System capabilities and features',
        'GET /api/docs': 'This documentation'
      }
    },
    examples: {
      jurisdictionAnalysis: {
        request: {
          address: '2650 NW 89th Ct, Doral, FL 33172',
          buildingHeight: 30
        },
        response: {
          success: true,
          analysis: {
            jurisdiction: {
              county: 'Miami-Dade County',
              state: 'FL',
              codeCycle: '2023 FBC',
              asceVersion: 'ASCE 7-16',
              hvhz: true
            },
            windAnalysis: {
              designWindSpeed: 185,
              zonePressures: {
                zone3Corner: -220.85
              }
            }
          }
        }
      }
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Enhanced SOW Generator server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Main API: http://localhost:${PORT}/api/generate-sow`);
  console.log(`🧪 Debug API: http://localhost:${PORT}/api/debug-sow`);
  console.log(`📊 Status: http://localhost:${PORT}/api/status`);
  console.log(`📖 Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`\\n🏛️ NEW: Jurisdiction Analysis APIs:`);
  console.log(`   📍 POST /api/jurisdiction/analyze - Comprehensive analysis`);
  console.log(`   📋 POST /api/jurisdiction/lookup - Quick code lookup`);
  console.log(`   🌍 POST /api/jurisdiction/geocode - Address geocoding`);
  console.log(`   ✅ POST /api/jurisdiction/validate - Compliance validation`);
  console.log(`   💨 POST /api/jurisdiction/pressure-table - Wind pressure tables`);
  console.log(`   🧪 POST /api/jurisdiction/debug - Debug analysis pipeline`);
  console.log(`   🔋 GET /api/jurisdiction/health - Service health check`);
  console.log(`\\n✅ Enhanced Features Active:`);
  console.log(`   - Jurisdiction-Based ASCE Version Selection (7-10/7-16/7-22)`);
  console.log(`   - Automatic HVHZ and Special Requirements Detection`);
  console.log(`   - Address-to-Wind-Pressure Analysis Pipeline`);
  console.log(`   - Comprehensive Building Code Compliance Validation`);
  console.log(`   - Dynamic Wind Pressure Calculations with Detailed Factors`);
  console.log(`   - Enhanced Engineering Summary Generation`);
});
