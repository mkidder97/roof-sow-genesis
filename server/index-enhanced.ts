// Enhanced Express Server - Phase 2 & 4 Implementation
// Advanced Engineering Intelligence & Template System
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

// Phase 2 & 4: Enhanced routes
import {
  debugSOWEnhanced,
  renderTemplateContent,
  debugEngineTrace,
  getTemplateMap
} from './routes/sow-enhanced';

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
    phase: 'Phase 2 & 4 Enhanced - Advanced Intelligence & Template System',
    version: '4.0.0',
    features: {
      // Phase 1 features
      windPressureCalculations: 'ASCE 7-10/16/22 dynamic formulas based on jurisdiction',
      manufacturerPatterns: 'Live fastening pattern selection',
      takeoffLogic: 'Smart section injection based on takeoff data',
      geocoding: 'OpenCage with fallback support',
      jurisdictionMapping: 'Comprehensive HVHZ and building code detection',
      jurisdictionAnalysis: 'Full address-to-wind-pressure analysis pipeline',
      complianceValidation: 'HVHZ and special requirements checking',
      pdfGeneration: 'Professional SOW documents with jurisdiction metadata',
      
      // Phase 2 new features
      enhancedExplainability: 'Detailed engineering summary with decision traceability',
      perEngineDebugMode: 'Individual engine debugging and tracing',
      takeoffFileSupport: 'PDF, CSV, and Excel takeoff file processing',
      engineeringIntelligence: 'Advanced risk analysis and recommendations',
      
      // Phase 4 new features
      templateSystem: 'Dynamic template mapping and rendering (T1-T8)',
      contentGeneration: 'Placeholder replacement with engineering data',
      multiTemplateSupport: 'Template selection based on project conditions',
      templateRenderer: 'File-based template system with dynamic content'
    },
    
    // Phase 2: Enhanced endpoints
    phase2Endpoints: {
      'POST /api/debug-sow-enhanced': 'Enhanced debug without PDF generation - returns engineeringSummary',
      'POST /api/debug-engine-trace': 'Per-engine debug tracing (template, wind, fastening, takeoff)',
      'POST /api/takeoff-file-process': 'Process uploaded takeoff files (PDF/CSV/Excel)'
    },
    
    // Phase 4: Template endpoints
    phase4Endpoints: {
      'POST /api/render-template': 'Render template content with engineering data',
      'GET /api/template-map': 'Get available templates (T1-T8) and mappings',
      'POST /api/template-debug': 'Debug template selection and rendering logic'
    },
    
    existingEndpoints: {
      'POST /api/generate-sow': 'Complete SOW generation with engineering summary',
      'POST /api/debug-sow': 'Debug endpoint with comprehensive diagnostics',
      'POST /api/jurisdiction/analyze': 'Comprehensive jurisdiction and wind analysis',
      'POST /api/jurisdiction/lookup': 'Quick jurisdiction code lookup',
      'POST /api/jurisdiction/geocode': 'Address to jurisdiction geocoding',
      'POST /api/jurisdiction/codes': 'Get ASCE/code data for jurisdiction',
      'POST /api/jurisdiction/validate': 'Validate compliance requirements',
      'POST /api/jurisdiction/pressure-table': 'Generate pressure tables for SOW',
      'POST /api/jurisdiction/debug': 'Debug jurisdiction analysis pipeline',
      'GET /api/jurisdiction/health': 'Jurisdiction services health check'
    },
    
    // Enhanced data structure documentation
    enhancedDataStructure: {
      engineeringSummary: {
        templateSelection: 'Template selection with rationale and rejected alternatives',
        windAnalysis: 'Wind calculations with methodology and coefficients',
        jurisdiction: 'Location analysis with HVHZ and code requirements',
        systemSelection: 'Manufacturer selection with compliance analysis',
        takeoffDiagnostics: 'Risk assessment with recommendations and flags'
      },
      debugTracing: {
        templateEngine: 'Decision tree, scoring matrix, alternatives',
        windEngine: 'Coefficients, factor calculations, methodology',
        fasteningEngine: 'System ranking, scoring breakdown, pressure analysis',
        takeoffEngine: 'Risk calculation, threshold comparisons, quantity analysis'
      },
      templateSystem: {
        templates: 'T1-T8 template files with dynamic placeholders',
        rendering: 'Placeholder replacement with engineering data',
        sections: 'Structured content with project-specific information'
      }
    },
    
    // New capabilities
    newCapabilities: {
      // Phase 2 capabilities
      detailedExplainability: 'Every engineering decision is traceable and documented',
      engineSpecificDebugging: 'Individual engine debugging for development and troubleshooting',
      advancedTakeoffAnalysis: 'File parsing with risk assessment and recommendations',
      enhancedDiagnostics: 'Comprehensive project analysis with quality flags',
      
      // Phase 4 capabilities
      dynamicTemplateGeneration: 'Templates adapt to project conditions and engineering data',
      contentPersonalization: 'SOW content customized based on analysis results',
      templateDebugging: 'Template selection and rendering logic debugging',
      placeholderIntelligence: 'Smart placeholder replacement with formatted engineering data'
    }
  });
});

// Enhanced API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'SOW Generator API Documentation - Phase 2 & 4 Enhanced',
    version: '4.0.0',
    description: 'Advanced SOW generation with engineering intelligence and dynamic templates',
    
    phase2Features: {
      title: 'Phase 2: Advanced Engineering Intelligence & Traceability',
      endpoints: {
        'POST /api/debug-sow-enhanced': {
          description: 'Enhanced debug endpoint without PDF generation',
          body: 'Optional project overrides for testing',
          response: 'engineeringSummary block with full explainability and debug info',
          example: {
            engineeringSummary: {
              templateSelection: { templateName: 'T4 - HVHZ Recover', rationale: 'HVHZ location detected' },
              windAnalysis: { asceVersion: 'ASCE 7-16', windSpeed: 185, zonePressures: {} },
              systemSelection: { selectedSystem: 'Carlisle TPO', fasteningSpecs: {} }
            }
          }
        },
        
        'POST /api/debug-engine-trace': {
          description: 'Per-engine debug tracing with detailed internal data',
          body: { engine: 'template|wind|fastening|takeoff', inputs: 'optional overrides' },
          response: 'Specific engine trace with decision trees and calculations',
          example: {
            engine: 'template',
            trace: {
              decisionTree: [{ condition: 'HVHZ', value: true, result: 'T4 Selected' }],
              scoringMatrix: { hvhzScore: 75, steepSlopeScore: 0 }
            }
          }
        }
      }
    },
    
    phase4Features: {
      title: 'Phase 4: Template Mapping & Multi-Template System',
      endpoints: {
        'POST /api/render-template': {
          description: 'Render template content with engineering data',
          body: { templateId: 'T1|T2|T3|T4|T5|T6|T7|T8', engineeringSummary: 'object' },
          response: 'Rendered template sections with placeholders replaced',
          example: {
            templateId: 'T4',
            renderedSections: {
              'Project Overview': 'This HVHZ project uses Carlisle TPO with enhanced wind resistance...',
              'Wind Requirements': 'Designed for 185 mph basic wind speed per ASCE 7-16...'
            }
          }
        },
        
        'GET /api/template-map': {
          description: 'Get available templates and their mappings',
          response: 'Template map with T1-T8 definitions and file mappings',
          example: {
            templateMap: {
              T1: { name: 'Recover', file: 'T1-recover.txt', type: 'recover' },
              T4: { name: 'HVHZ Recover', file: 'T4-hvhz.txt', type: 'hvhz_recover' }
            }
          }
        }
      }
    },
    
    examples: {
      enhancedDebugging: {
        request: { debug: true, engineDebug: { template: true, wind: true } },
        response: {
          success: true,
          engineeringSummary: {
            templateSelection: { templateName: 'T6 - Steep Slope', rationale: 'Roof slope 4.5:12 > 2:12 threshold' },
            windAnalysis: { asceVersion: 'ASCE 7-16', pressureMethodology: ['Components and Cladding method'] }
          },
          debugInfo: {
            engineTraces: {
              templateEngine: { decisionTree: [], scoringMatrix: {} },
              windEngine: { coefficients: {}, factorCalculations: [] }
            }
          }
        }
      },
      
      templateRendering: {
        request: {
          templateId: 'T1',
          engineeringSummary: {
            systemSelection: { selectedSystem: 'Johns Manville TPO' },
            windAnalysis: { zonePressures: { zone_1: -30, zone_3: -90 } }
          }
        },
        response: {
          templateId: 'T1',
          templateName: 'Recover',
          renderedSections: {
            'Project Overview': 'This project involves a Johns Manville TPO roof recover system...',
            'Wind Load Requirements': 'Field: 30.0 psf, Corner: 90.0 psf wind uplift requirements'
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
  console.log('');
  console.log('🆕 PHASE 2 - ADVANCED ENGINEERING INTELLIGENCE:');
  console.log('   🧪 POST /api/debug-sow-enhanced - Enhanced debug without PDF');
  console.log('   🔍 POST /api/debug-engine-trace - Per-engine debugging');
  console.log('   📊 Enhanced takeoff file processing (PDF/CSV/Excel)');
  console.log('   🎯 Detailed decision traceability and explainability');
  console.log('');
  console.log('🆕 PHASE 4 - TEMPLATE MAPPING & RENDERING:');
  console.log('   📄 POST /api/render-template - Dynamic template rendering');
  console.log('   📋 GET /api/template-map - Template system mappings');
  console.log('   🔧 Template file system with placeholder replacement');
  console.log('   📝 T1-T8 templates with engineering data integration');
  console.log('');
  console.log('✅ Enhanced Features Active:');
  console.log('   - Detailed Engineering Summary with Full Traceability');
  console.log('   - Per-Engine Debug Modes for Development & Troubleshooting');
  console.log('   - Advanced Takeoff File Processing (PDF/CSV/Excel)');
  console.log('   - Dynamic Template System with Smart Placeholder Replacement');
  console.log('   - Multi-Template Support Based on Project Conditions');
  console.log('   - Template Content Rendering with Engineering Data Integration');
  console.log('   - Enhanced Risk Analysis and Diagnostic Recommendations');
});
