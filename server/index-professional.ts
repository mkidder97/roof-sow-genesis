// Enhanced Express Server - Professional Engineering Intelligence
// Phase 4: Enhanced engineering intelligence layer for professional SOW previews
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { 
  generateSOWWithSummary, 
  healthCheck, 
  debugSOW 
} from './routes/sow';
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
import {
  debugSOWEnhanced,
  renderTemplateContent,
  debugEngineTrace,
  getTemplateMap
} from './routes/sow-enhanced';
import {
  generateEnhancedEngineeringPreview
} from './routes/enhanced-intelligence';

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

// Core endpoints
app.get('/health', healthCheck);
app.post('/api/generate-sow', upload.single('file'), generateSOWWithSummary);
app.post('/api/debug-sow', debugSOW);

// Phase 2: Enhanced explainability endpoints
app.post('/api/debug-sow-enhanced', debugSOWEnhanced);
app.post('/api/debug-engine-trace', debugEngineTrace);

// Phase 4: Template system endpoints
app.post('/api/render-template', renderTemplateContent);
app.get('/api/template-map', getTemplateMap);

// 🧠 NEW: Professional Engineering Intelligence Endpoint
app.post('/api/engineering-preview', generateEnhancedEngineeringPreview);

// Jurisdiction analysis endpoints
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
    phase: 'Professional Engineering Intelligence - Enhanced Decision Transparency',
    version: '4.1.0',
    features: {
      // Core features
      windPressureCalculations: 'ASCE 7-10/16/22 dynamic formulas based on jurisdiction',
      manufacturerPatterns: 'Live fastening pattern selection with compliance verification',
      takeoffLogic: 'Smart section injection based on takeoff data',
      geocoding: 'OpenCage with fallback support',
      jurisdictionMapping: 'Comprehensive HVHZ and building code detection',
      jurisdictionAnalysis: 'Full address-to-wind-pressure analysis pipeline',
      complianceValidation: 'HVHZ and special requirements checking',
      pdfGeneration: 'Professional SOW documents with jurisdiction metadata',
      
      // Phase 2 features
      enhancedExplainability: 'Detailed engineering summary with decision traceability',
      perEngineDebugMode: 'Individual engine debugging and tracing',
      takeoffFileSupport: 'PDF, CSV, and Excel takeoff file processing',
      engineeringIntelligence: 'Advanced risk analysis and recommendations',
      
      // Phase 4 features
      templateSystem: 'Dynamic template mapping and rendering (T1-T8)',
      contentGeneration: 'Placeholder replacement with engineering data',
      multiTemplateSupport: 'Template selection based on project conditions',
      templateRenderer: 'File-based template system with dynamic content',
      
      // NEW: Professional Intelligence Features
      professionalIntelligence: 'Complete decision transparency for contractors, clients, and inspectors',
      jurisdictionalReporting: 'County, city, state with HVHZ status and code mapping',
      asceComplianceDetails: 'All calculation factors with roof zone mapping and thresholds',
      templateJustification: 'Template selection reasoning with rejection analysis',
      manufacturerLogic: 'NOA compliance verification with pressure margin analysis',
      takeoffEvaluation: 'Density scoring with risk assessment and crew recommendations'
    },
    
    // Professional Intelligence Endpoints
    professionalIntelligenceEndpoints: {
      'POST /api/engineering-preview': 'Comprehensive engineering intelligence for professional SOW previews'
    },
    
    // Enhanced response structure
    enhancedResponseStructure: {
      engineeringIntelligence: {
        jurisdictionAnalysis: 'HVHZ status, county/city/state, ASCE version, code cycle, special requirements',
        windCalculation: 'Wind speed, exposure, factors (Kd/Kzt/Kh/Ke/I), zone pressures, roof mapping',
        templateSelection: 'Selected template with rationale, selection factors, rejected alternatives',
        manufacturerSelection: 'Selected system with compliance margins, rejected manufacturers',
        takeoffSummary: 'Project metrics, density analysis, risk assessment, crew recommendations',
        complianceSummary: 'Code compliance, manufacturer approvals, warranty information'
      }
    },
    
    // Professional use cases
    professionalUseCases: {
      contractors: 'Complete system justification and installation guidance',
      clients: 'Transparent decision-making process and quality assurance',
      inspectors: 'Comprehensive compliance verification and approval documentation',
      engineers: 'Detailed calculation methodology and safety factor verification'
    },
    
    existingEndpoints: {
      'POST /api/generate-sow': 'Complete SOW generation with engineering summary',
      'POST /api/debug-sow': 'Debug endpoint with comprehensive diagnostics',
      'POST /api/debug-sow-enhanced': 'Enhanced debug without PDF generation',
      'POST /api/debug-engine-trace': 'Per-engine debug tracing',
      'POST /api/render-template': 'Dynamic template content rendering',
      'GET /api/template-map': 'Available templates and mappings',
      'POST /api/jurisdiction/analyze': 'Comprehensive jurisdiction and wind analysis'
    }
  });
});

// Enhanced API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'SOW Generator API - Professional Engineering Intelligence',
    version: '4.1.0',
    description: 'Professional SOW generation with complete decision transparency',
    
    newFeature: {
      title: 'Professional Engineering Intelligence',
      endpoint: 'POST /api/engineering-preview',
      description: 'Enhanced engineering intelligence layer for professional SOW previews',
      purpose: 'For contractors, clients, and inspectors to understand system choices',
      
      objectives: [
        'Explain WHY the system made each choice',
        'Detail WHAT it\'s complying with (codes, NOAs, specs)',
        'Show WHICH options were rejected and why'
      ],
      
      responseStructure: {
        jurisdictionAnalysis: {
          hvhz: 'boolean - HVHZ status determination',
          county: 'string - County name from geocoding',
          city: 'string - City name',
          state: 'string - State abbreviation',
          asceVersion: 'string - ASCE version used (7-10/7-16/7-22)',
          codeCycle: 'string - Building code cycle',
          specialRequirements: 'array - HVHZ and special provisions'
        },
        
        windCalculation: {
          windSpeed: 'number - Basic wind speed (mph)',
          factors: 'object - All ASCE factors (Kd, Kzt, Kh, Ke, I)',
          pressures: 'object - Zone pressures (field, perimeter, corner)',
          roofZoneMap: 'object - Zone definitions and dimensions',
          thresholds: 'object - Acceptance criteria and safety factors'
        },
        
        templateSelection: {
          selected: 'string - Selected template name',
          rationale: 'string - Selection reasoning',
          selectionFactors: 'object - Boolean factors (HVHZ, steep slope, etc.)',
          rejected: 'array - Rejected templates with reasons'
        },
        
        manufacturerSelection: {
          selected: 'string - Selected manufacturer system',
          complianceMargin: 'object - Safety margins per zone',
          rejected: 'array - Rejected manufacturers with failure reasons',
          approvalSource: 'object - NOA/approval documentation'
        },
        
        takeoffSummary: {
          projectMetrics: 'object - Drain/penetration/flashing counts',
          densityAnalysis: 'object - Density per 1000 sq ft',
          riskAssessment: 'object - Risk level and factors',
          recommendations: 'object - Crew size and installation guidance'
        }
      }
    },
    
    examples: {
      engineeringIntelligenceRequest: {
        description: 'Generate professional engineering preview',
        request: {
          method: 'POST',
          url: '/api/engineering-preview',
          body: {
            address: '2650 NW 89th Ct, Doral, FL 33172',
            projectType: 'recover',
            buildingHeight: 35,
            squareFootage: 42000,
            membraneType: 'TPO Fleeceback'
          }
        },
        response: {
          success: true,
          engineeringIntelligence: {
            jurisdictionAnalysis: {
              hvhz: true,
              county: 'Miami-Dade County',
              asceVersion: 'ASCE 7-16',
              codeCycle: '2023 Florida Building Code'
            },
            windCalculation: {
              windSpeed: 185,
              factors: { Kd: 0.85, Kzt: 1.0, Kh: 0.98, I: 1.0 },
              pressures: {
                zone1Field: 71.2,
                zone2Perimeter: 158.4,
                zone3Corner: 220.8
              }
            },
            templateSelection: {
              selected: 'T4 - HVHZ Fleeceback Recover',
              rationale: 'HVHZ location with fleeceback membrane requires enhanced wind resistance'
            },
            manufacturerSelection: {
              selected: 'Carlisle 80mil TPO HVHZ Fleeceback',
              complianceMargin: {
                cornerMargin: '29.2 psf above required',
                overallSafetyFactor: 1.13
              }
            }
          }
        }
      },
      
      hvhzExampleOutput: {
        description: 'HVHZ project example with enhanced requirements',
        jurisdictionAnalysis: {
          hvhz: true,
          county: 'Miami-Dade County',
          specialRequirements: [
            'NOA (Notice of Acceptance) required for all components',
            'Special inspection required during installation',
            'Enhanced wind resistance requirements per TAS 105'
          ]
        },
        windCalculation: {
          windSpeed: 185,
          pressures: { zone3Corner: 220.8 },
          thresholds: { minimumSafetyFactor: 1.15 }
        },
        manufacturerSelection: {
          selected: 'Carlisle 80mil TPO HVHZ',
          approvalSource: {
            primaryApproval: 'Florida NOA 17-1021.09',
            hvhzApproval: 'Miami-Dade NOA Required and Verified'
          },
          rejected: [
            {
              name: 'GAF EverGuard TPO',
              reason: 'Not HVHZ approved per NOA requirements',
              failedZone: 'HVHZ_COMPLIANCE'
            }
          ]
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
  console.log(`🚀 Professional Engineering Intelligence Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Main API: http://localhost:${PORT}/api/generate-sow`);
  console.log(`🧪 Debug API: http://localhost:${PORT}/api/debug-sow`);
  console.log(`📊 Status: http://localhost:${PORT}/api/status`);
  console.log(`📖 Documentation: http://localhost:${PORT}/api/docs`);
  console.log('');
  console.log('🧠 PROFESSIONAL ENGINEERING INTELLIGENCE:');
  console.log('   📋 POST /api/engineering-preview - Complete decision transparency');
  console.log('   🎯 Jurisdictional analysis with HVHZ and code mapping');
  console.log('   💨 ASCE compliance details with all calculation factors');
  console.log('   📄 Template justification with rejection reasoning');
  console.log('   🏭 Manufacturer logic with compliance margins');
  console.log('   📊 Takeoff evaluation with risk assessment');
  console.log('');
  console.log('🎯 USE CASES:');
  console.log('   👷 Contractors: System justification and installation guidance');
  console.log('   🏢 Clients: Transparent decision-making and quality assurance');
  console.log('   🔍 Inspectors: Compliance verification and approval documentation');
  console.log('   👨‍💼 Engineers: Calculation methodology and safety verification');
  console.log('');
  console.log('✅ Enhanced Features Active:');
  console.log('   - Complete Decision Transparency for Professional Review');
  console.log('   - Jurisdictional Analysis with Code Mapping');
  console.log('   - ASCE Compliance Details with Factor Breakdown');
  console.log('   - Template Selection Logic with Rejection Analysis');
  console.log('   - Manufacturer Selection with Pressure Margin Verification');
  console.log('   - Takeoff Analysis with Risk Assessment and Crew Recommendations');
  console.log('   - Professional Documentation for Contractors, Clients, and Inspectors');
});
