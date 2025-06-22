// Enhanced Express Server with Supabase Integration
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { 
  generateSOWWithSummary, 
  healthCheck, 
  debugSOW, 
  getProjects, 
  getProject, 
  getSOWById 
} from './routes/sow-supabase';
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
import { testSupabaseConnection } from './lib/supabase';

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

// Main SOW generation endpoint with Supabase integration
app.post('/api/generate-sow', upload.single('file'), generateSOWWithSummary);

// Debug endpoint for testing logic with optional database save
app.post('/api/debug-sow', debugSOW);

// NEW: Project and SOW management endpoints
app.get('/api/projects', getProjects);
app.get('/api/projects/:id', getProject);
app.get('/api/sow/:id', getSOWById);

// Jurisdiction Analysis Endpoints (existing)
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
    phase: 'Enhanced with Supabase Database Integration',
    version: '3.1.0',
    features: {
      windPressureCalculations: 'ASCE 7-10/16/22 dynamic formulas based on jurisdiction',
      manufacturerPatterns: 'Live fastening pattern selection',
      takeoffLogic: 'Smart section injection based on takeoff data',
      geocoding: 'OpenCage with fallback support',
      jurisdictionMapping: 'Comprehensive HVHZ and building code detection',
      jurisdictionAnalysis: 'Full address-to-wind-pressure analysis pipeline',
      complianceValidation: 'HVHZ and special requirements checking',
      pdfGeneration: 'Professional SOW documents with jurisdiction metadata',
      databaseIntegration: 'Supabase PostgreSQL with RLS and user isolation',
      projectManagement: 'Complete project lifecycle and SOW history tracking'
    },
    newEndpoints: {
      'POST /api/generate-sow': 'Complete SOW generation with database persistence',
      'POST /api/debug-sow': 'Debug endpoint with optional database save',
      'GET /api/projects': 'Get all user projects with SOW history',
      'GET /api/projects/:id': 'Get specific project with all SOW outputs',
      'GET /api/sow/:id': 'Get specific SOW output with full metadata',
      'POST /api/jurisdiction/analyze': 'Comprehensive jurisdiction and wind analysis',
      'POST /api/jurisdiction/lookup': 'Quick jurisdiction code lookup',
      'POST /api/jurisdiction/geocode': 'Address to jurisdiction geocoding',
      'POST /api/jurisdiction/codes': 'Get ASCE/code data for jurisdiction',
      'POST /api/jurisdiction/validate': 'Validate compliance requirements',
      'POST /api/jurisdiction/pressure-table': 'Generate pressure tables for SOW',
      'POST /api/jurisdiction/debug': 'Debug jurisdiction analysis pipeline',
      'GET /api/jurisdiction/health': 'Jurisdiction services health check'
    },
    databaseSchema: {
      projects: {
        description: 'Core project input data with user isolation',
        fields: 'name, address, building specs, membrane details, takeoff data',
        relations: 'One-to-many with sow_outputs'
      },
      sow_outputs: {
        description: 'Engineering summary and PDF metadata',
        fields: 'template, wind analysis, fastening specs, file info, complete engineering summary',
        relations: 'Many-to-one with projects'
      }
    },
    dataStructure: {
      windUpliftPressures: 'zone1Field, zone1Perimeter, zone2Perimeter, zone3Corner (PSF)',
      fasteningSpecifications: 'fieldSpacing, perimeterSpacing, cornerSpacing, penetrationDepth',
      takeoffDiagnostics: 'drainOverflowRequired, highPenetrationDensity, overall risk assessment',
      asceVersion: 'Dynamic 7-10/7-16/7-22 based on jurisdiction mapping',
      hvhz: 'Auto-determined from county/state with special requirements',
      jurisdictionAnalysis: 'Full compliance and wind analysis metadata',
      engineeringSummary: 'Complete JSONB structure with all engine outputs'
    },
    capabilities: {
      addressToWindPressure: 'Complete pipeline from address to ASCE-compliant wind pressures',
      jurisdictionCompliance: 'Automatic HVHZ, NOA, and special requirement detection',
      codeVersionMapping: 'Dynamic ASCE version selection based on local building codes',
      windCalculationSummary: 'Detailed calculation factors and methodology reporting',
      projectPersistence: 'Find-or-create project logic with incremental updates',
      sowHistory: 'Complete audit trail of all SOW generations per project',
      userIsolation: 'Row Level Security ensures data privacy and multi-tenancy',
      apiConsistency: 'Standardized response format with database references'
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'SOW Generator API Documentation',
    version: '3.1.0',
    description: 'Comprehensive SOW generation with Supabase database integration',
    authentication: {
      description: 'Send user ID in x-user-id header or request body',
      fallback: 'System uses test user ID for development when no auth provided'
    },
    endpoints: {
      sow: {
        'POST /api/generate-sow': {
          description: 'Generate complete SOW with database persistence',
          headers: {
            'x-user-id': 'UUID of authenticated user (optional for testing)'
          },
          body: {
            projectName: 'string (required)',
            address: 'string (required)',
            companyName: 'string',
            buildingHeight: 'number (default: 30)',
            squareFootage: 'number',
            membraneThickness: 'string',
            projectType: 'string',
            deckType: 'string'
          },
          response: {
            success: 'boolean',
            projectId: 'UUID of project in database',
            sowOutputId: 'UUID of SOW output record',
            isNewProject: 'boolean',
            filename: 'string',
            outputPath: 'string',
            metadata: 'Complete engineering summary and database references'
          }
        },
        'POST /api/debug-sow': {
          description: 'Debug SOW generation with optional database save',
          body: {
            saveToDatabase: 'boolean (default: true)',
            ...{overrides: 'any project parameters to override for testing'}
          },
          response: 'Debug information with optional database references'
        }
      },
      projects: {
        'GET /api/projects': {
          description: 'Get all user projects with SOW history',
          headers: {
            'x-user-id': 'UUID of authenticated user'
          },
          query: {
            limit: 'number (default: 50)'
          },
          response: 'Array of projects with latest SOW information'
        },
        'GET /api/projects/:id': {
          description: 'Get specific project with all SOW outputs',
          response: 'Complete project details with SOW history'
        },
        'GET /api/sow/:id': {
          description: 'Get specific SOW output with metadata',
          query: {
            includeSummary: 'boolean (include full engineering summary)'
          },
          response: 'Complete SOW output with optional engineering summary'
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
        }
      },
      health: {
        'GET /health': 'System health check with database connectivity',
        'GET /api/status': 'System capabilities and features',
        'GET /api/docs': 'This documentation'
      }
    },
    examples: {
      generateSOW: {
        request: {
          headers: {
            'x-user-id': '123e4567-e89b-12d3-a456-426614174000'
          },
          body: {
            projectName: 'Miami Office Building',
            address: '2650 NW 89th Ct, Doral, FL 33172',
            companyName: 'ABC Construction',
            buildingHeight: 30,
            squareFootage: 50000,
            membraneThickness: '60mil',
            projectType: 'recover',
            deckType: 'steel'
          }
        },
        response: {
          success: true,
          projectId: '456e7890-e89b-12d3-a456-426614174001',
          sowOutputId: '789e0123-e89b-12d3-a456-426614174002',
          isNewProject: true,
          filename: 'SOW_Miami_Office_Building_20250622.pdf',
          outputPath: '/output/SOW_Miami_Office_Building_20250622.pdf',
          metadata: {
            projectName: 'Miami Office Building',
            template: 'T6-Tearoff-TPO(MA)-insul-steel',
            windPressure: '220.9 psf corner',
            jurisdiction: {
              county: 'Miami-Dade County',
              state: 'FL',
              codeCycle: '2023 FBC',
              asceVersion: 'ASCE 7-16',
              hvhz: true
            },
            database: {
              projectId: '456e7890-e89b-12d3-a456-426614174001',
              sowOutputId: '789e0123-e89b-12d3-a456-426614174002',
              createdAt: '2025-06-22T04:20:00.000Z',
              isNewProject: true
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
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Initialize server
app.listen(PORT, async () => {
  console.log(`🚀 Enhanced SOW Generator server with Supabase integration running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Main API: http://localhost:${PORT}/api/generate-sow`);
  console.log(`🧪 Debug API: http://localhost:${PORT}/api/debug-sow`);
  console.log(`📊 Status: http://localhost:${PORT}/api/status`);
  console.log(`📖 Documentation: http://localhost:${PORT}/api/docs`);
  
  console.log(`\\n🗄️ NEW: Database-Integrated APIs:`);
  console.log(`   📂 GET /api/projects - Get all user projects`);
  console.log(`   📄 GET /api/projects/:id - Get project with SOW history`);
  console.log(`   📋 GET /api/sow/:id - Get specific SOW output`);
  
  console.log(`\\n🏛️ Jurisdiction Analysis APIs:`);
  console.log(`   📍 POST /api/jurisdiction/analyze - Comprehensive analysis`);
  console.log(`   📋 POST /api/jurisdiction/lookup - Quick code lookup`);
  console.log(`   🌍 POST /api/jurisdiction/geocode - Address geocoding`);
  console.log(`   ✅ POST /api/jurisdiction/validate - Compliance validation`);
  console.log(`   💨 POST /api/jurisdiction/pressure-table - Wind pressure tables`);
  console.log(`   🧪 POST /api/jurisdiction/debug - Debug analysis pipeline`);
  console.log(`   🔋 GET /api/jurisdiction/health - Service health check`);
  
  console.log(`\\n✅ Enhanced Features Active:`);
  console.log(`   - Supabase PostgreSQL Integration with Row Level Security`);
  console.log(`   - Project Lifecycle Management (Find-or-Create Logic)`);
  console.log(`   - Complete SOW History and Audit Trail`);
  console.log(`   - User Data Isolation and Multi-Tenancy Support`);
  console.log(`   - Jurisdiction-Based ASCE Version Selection (7-10/7-16/7-22)`);
  console.log(`   - Automatic HVHZ and Special Requirements Detection`);
  console.log(`   - Address-to-Wind-Pressure Analysis Pipeline`);
  console.log(`   - Comprehensive Building Code Compliance Validation`);
  console.log(`   - Dynamic Wind Pressure Calculations with Detailed Factors`);
  console.log(`   - Enhanced Engineering Summary Generation with Database Persistence`);
  
  // Test Supabase connection on startup
  console.log(`\\n🔗 Testing Supabase connection...`);
  const connectionTest = await testSupabaseConnection();
  if (connectionTest) {
    console.log(`✅ Supabase connection successful`);
  } else {
    console.log(`❌ Supabase connection failed - check environment variables`);
    console.log(`   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY`);
  }
  
  console.log(`\\n🎯 Ready for SOW generation with full database integration!`);
});
