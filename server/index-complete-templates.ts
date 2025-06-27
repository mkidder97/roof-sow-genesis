// Enhanced Server with Complete 8-Template SOW Generation System (T1-T8)
// NOW INCLUDES: Complete Template System + Enhanced Content Generator + 36+ Page Output Target

// CRITICAL: Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import enhanced template coordinator
import { createEnhancedTemplateCoordinator } from './logic/template-coordinator-enhanced.js';

// Import SOW routes
import { generateSOWWithSummary, healthCheck, debugSOW } from './routes/sow.js';

// Import enhanced SOW routes with Section Engine
import { 
  debugSOWEnhanced, 
  debugSectionAnalysis, 
  debugSelfHealing,
  debugEngineTrace,
  renderTemplateContent,
  getTemplateMap
} from './routes/sow-enhanced.js';

// Import NEW SOW Generation API routes for frontend integration
import { 
  generateSOW,
  downloadSOW,
  getSOWStatus,
  listSOWs,
  deleteSOW
} from './routes/sow-generation-api.js';

// Import enhanced formatting routes
import enhancedFormattingRouter from './routes/sow-enhanced-formatting.js';

// Import Phase 1 Complete SOW Generation Engine routes
import sowCompleteRouter from './routes/sow-complete.js';

// Import simple test endpoints
import { 
  testSectionMapping, 
  testSOWMappings 
} from './routes/test-endpoints.js';

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
} from './routes/jurisdiction.js';

// Import workflow management routes
import workflowRouter from './routes/workflow.js';

// Import file management routes
import fileManagementRouter from './routes/file-management.js';

// Import draft management routes
import { 
  saveDraft, 
  loadDraft, 
  listDrafts, 
  deleteDraft, 
  calculateSquareFootageEndpoint,
  draftSystemHealth 
} from './routes/draft-management.js';

// Import Supabase health check
import { checkSupabaseConnection } from './lib/supabase.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize enhanced template coordinator
const templateCoordinator = createEnhancedTemplateCoordinator();

// Verify environment variables are loaded
console.log('🔧 Environment Check:');
console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   PORT: ${PORT}`);

// Enhanced CORS configuration for Lovable and local development
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
// NEW: ENHANCED TEMPLATE SYSTEM (T1-T8) WITH 36+ PAGE TARGET
// ======================

// Get all available templates
app.get('/api/templates', (req, res) => {
  try {
    const templates = templateCoordinator.getAvailableTemplates();
    res.json({
      success: true,
      templates,
      totalTemplates: templates.length,
      targetOutput: "36+ pages per template",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Validate template compatibility
app.post('/api/templates/validate', (req, res) => {
  try {
    const { templateType, projectInputs } = req.body;
    
    if (!templateType || !projectInputs) {
      return res.status(400).json({
        success: false,
        error: 'Template type and project inputs are required'
      });
    }
    
    const validation = templateCoordinator.validateTemplateCompatibility(templateType, projectInputs);
    
    res.json({
      success: true,
      templateType,
      validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Estimate document metrics before generation
app.post('/api/templates/estimate', (req, res) => {
  try {
    const { projectInputs } = req.body;
    
    if (!projectInputs) {
      return res.status(400).json({
        success: false,
        error: 'Project inputs are required'
      });
    }
    
    const estimates = templateCoordinator.estimateDocumentMetrics(projectInputs);
    
    res.json({
      success: true,
      estimates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced SOW generation with complete template system
app.post('/api/sow/generate-enhanced', upload.single('file'), async (req, res) => {
  try {
    console.log('🎯 Starting Enhanced SOW Generation (T1-T8 Support)...');
    
    const projectInputs = req.body;
    const manufacturerData = req.file ? JSON.parse(req.file.buffer.toString()) : null;
    
    // Validate required inputs
    if (!projectInputs.project_type || !projectInputs.square_footage || !projectInputs.deck_type) {
      return res.status(400).json({
        success: false,
        error: 'Required fields missing: project_type, square_footage, deck_type'
      });
    }
    
    console.log(`📊 Project: ${projectInputs.project_type} - ${projectInputs.square_footage} sqft`);
    console.log(`🏗️ Deck: ${projectInputs.deck_type}, Membrane: ${projectInputs.membrane_type}`);
    
    // Generate complete SOW using enhanced template coordinator
    const result = await templateCoordinator.generateCompleteSOW(projectInputs, manufacturerData);
    
    console.log(`✅ Generated ${result.templateType}: ${result.qualityMetrics.wordCount} words, ${result.qualityMetrics.pageEstimate} pages`);
    
    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Enhanced SOW generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test enhanced template system with sample data
app.get('/api/sow/test-enhanced', async (req, res) => {
  try {
    console.log('🧪 Testing Enhanced Template System...');
    
    // Sample project for testing all templates
    const testProjects = [
      {
        name: "T1 Test - Recover TPO(MA) over BUR on Steel",
        inputs: {
          project_type: 'recover',
          square_footage: 75000,
          building_height: 40,
          deck_type: 'Steel',
          existing_system: 'BUR',
          membrane_type: 'TPO',
          membrane_thickness: '60',
          attachment_method: 'mechanical',
          insulation_type: 'Polyisocyanurate',
          insulation_thickness: 3.0,
          insulation_r_value: 18,
          cover_board_type: 'Fiberboard',
          address: '12345 Test St, Dallas, TX',
          county: 'Dallas',
          state: 'TX',
          hvac_units: 8,
          penetrations: 12,
          number_of_drains: 6,
          drain_types: ['Primary', 'Overflow'],
          skylights: 0,
          roof_hatches: 2,
          walkway_pad_requested: true
        }
      },
      {
        name: "T8 Test - Tearoff TPO(Adhered) on Gypsum",
        inputs: {
          project_type: 'tearoff',
          square_footage: 45000,
          building_height: 25,
          deck_type: 'Gypsum',
          membrane_type: 'TPO',
          membrane_thickness: '80',
          attachment_method: 'fully_adhered',
          insulation_type: 'Polyisocyanurate',
          insulation_thickness: 4.5,
          insulation_r_value: 25,
          address: '67890 Test Ave, Miami, FL',
          county: 'Miami-Dade',
          state: 'FL',
          hvhz: true,
          hvac_units: 4,
          penetrations: 8,
          number_of_drains: 4,
          drain_types: ['Primary', 'Overflow'],
          skylights: 2,
          roof_hatches: 1,
          walkway_pad_requested: false
        }
      }
    ];
    
    const testResults = [];
    
    for (const testProject of testProjects) {
      try {
        console.log(`🧪 Testing: ${testProject.name}`);
        
        // Estimate first
        const estimates = templateCoordinator.estimateDocumentMetrics(testProject.inputs);
        
        // Generate SOW
        const result = await templateCoordinator.generateCompleteSOW(testProject.inputs);
        
        testResults.push({
          projectName: testProject.name,
          templateSelected: result.templateType,
          templateDescription: result.templateDescription,
          estimates,
          actualMetrics: result.qualityMetrics,
          processingTime: result.processingTime,
          warnings: result.warnings,
          success: true
        });
        
        console.log(`✅ ${testProject.name}: ${result.templateType} - ${result.qualityMetrics.pageEstimate} pages`);
        
      } catch (error) {
        console.error(`❌ ${testProject.name} failed:`, error);
        testResults.push({
          projectName: testProject.name,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      systemTest: {
        totalTemplatesTested: testProjects.length,
        successfulTests: testResults.filter(r => r.success).length,
        failedTests: testResults.filter(r => !r.success).length,
        results: testResults
      },
      availableTemplates: templateCoordinator.getAvailableTemplates(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Enhanced template system test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ======================
// PHASE 1 COMPLETE SOW GENERATION ENGINE
// ======================

// Phase 1 Complete SOW Generation Engine routes
app.use('/api/sow', sowCompleteRouter);

// ======================
// WORKING TEST ENDPOINTS
// ======================

// Test endpoint for section-input mapping (WORKING)
app.get('/api/test/section-mapping', testSectionMapping);

// Test endpoint for SOW mappings overview (WORKING)
app.get('/api/sow/mappings', testSOWMappings);

// ======================
// EXISTING SOW GENERATION API ENDPOINTS (Frontend Ready)
// ======================

// Main SOW generation endpoint - Frontend ready
app.post('/api/sow-legacy/generate', upload.single('file'), generateSOW);

// Download generated SOW PDF
app.get('/api/sow-legacy/download/:sowId', downloadSOW);

// Get SOW generation status
app.get('/api/sow-legacy/status/:sowId', getSOWStatus);

// List user's SOWs
app.get('/api/sow-legacy/list', listSOWs);

// Delete SOW
app.delete('/api/sow-legacy/:sowId', deleteSOW);

// ======================
// DRAFT MANAGEMENT ENDPOINTS
// ======================
app.post('/api/drafts/save', saveDraft);
app.get('/api/drafts/:draftId', loadDraft);
app.get('/api/drafts/list', listDrafts);
app.delete('/api/drafts/:draftId', deleteDraft);
app.post('/api/drafts/calculate-sqft', calculateSquareFootageEndpoint);
app.get('/api/drafts/health', draftSystemHealth);

// ======================
// MULTI-ROLE WORKFLOW ENDPOINTS
// ======================
app.use('/api/workflow', workflowRouter);

// ======================
// COMPREHENSIVE FILE MANAGEMENT ENDPOINTS
// ======================
app.use('/api/files', fileManagementRouter);

// ======================
// ENHANCED SOW FORMATTING ENDPOINTS
// ======================
app.use('/api/sow-enhanced', enhancedFormattingRouter);

// ======================
// LEGACY SOW ENDPOINTS (for backward compatibility)
// ======================
app.post('/api/generate-sow', upload.single('file'), generateSOWWithSummary);
app.post('/api/debug-sow-legacy', debugSOW);

// ======================
// ENHANCED SOW ENDPOINTS (Section Engine & Self-Healing)
// ======================

// Main debug endpoint with Section Engine integration
app.post('/api/sow-enhanced/debug-sow', upload.single('takeoffFile'), debugSOWEnhanced);

// Section-specific analysis
app.post('/api/sow-enhanced/debug-sections', debugSectionAnalysis);

// Self-healing analysis
app.post('/api/sow-enhanced/debug-self-healing', debugSelfHealing);

// Individual engine trace debugging
app.post('/api/sow-enhanced/debug-engine-trace', debugEngineTrace);

// Template rendering with dynamic sections
app.post('/api/sow-enhanced/render-template', renderTemplateContent);

// Template mapping
app.get('/api/sow-enhanced/templates', getTemplateMap);

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
app.get('/api/status', async (req, res) => {
  const supabaseStatus = await checkSupabaseConnection();
  
  res.json({
    phase: 'Complete 8-Template SOW Generation System (T1-T8) with 36+ Page Target',
    version: '12.0.0-complete-templates',
    engineVersion: '12.0.0 - Complete Template System + Enhanced Content Generator + 36+ Page Output',
    serverStatus: 'running',
    timestamp: new Date().toISOString(),
    
    // NEW: Complete Template System
    completeTemplateSystem: {
      total_templates: '8 templates (T1-T8) ✅',
      template_coordinator: 'Enhanced coordination with quality metrics ✅',
      content_generator: 'Comprehensive submittal sections for 36+ pages ✅',
      section_mapping: 'Enhanced mapping with template-specific rules ✅',
      validation_system: 'Template compatibility validation ✅',
      estimation_system: 'Pre-generation metrics estimation ✅',
      quality_metrics: 'Word count, page count, complexity scoring ✅'
    },
    
    templateBreakdown: {
      recover_templates: 'T1, T2, T3, T4, T5 (5 templates)',
      tearoff_templates: 'T6, T7, T8 (3 templates)',
      attachment_methods: 'Mechanical, Fully Adhered, SSR',
      deck_types: 'Steel, Gypsum, Lightweight Concrete',
      target_pages: '36+ pages per template',
      target_word_count: '12,000-15,000 words per document'
    },
    
    // Phase 1 Complete SOW Generation Engine
    phase1SOWEngine: {
      section_selector: 'Dynamic section selection based on project inputs ✅',
      content_generator: 'Professional SOW content generation ✅',
      wind_integrator: 'Complete ASCE wind analysis with zone calculations ✅',
      template_support: 'ALL 8 templates (T1-T8) with intelligent selection ✅',
      validation_system: 'Comprehensive input and output validation ✅',
      test_framework: 'Automated testing with real project data ✅'
    },
    
    // Existing systems...
    sowGenerationAPI: {
      frontend_integration: 'Complete ✅',
      file_upload_support: 'Multipart form data with file handling ✅',
      database_tracking: 'Full SOW generation tracking ✅',
      error_handling: 'Comprehensive error handling and recovery ✅',
      download_system: 'PDF download endpoints ✅',
      supabase_connection: supabaseStatus.connected ? 'Connected ✅' : `Disconnected: ${supabaseStatus.error} ⚠️`
    },
    
    endpoints: {
      // NEW: Enhanced Template System
      enhancedTemplateSystem: {
        'GET /api/templates': 'Get all 8 available templates with descriptions',
        'POST /api/templates/validate': 'Validate template compatibility with project inputs',
        'POST /api/templates/estimate': 'Estimate document metrics before generation',
        'POST /api/sow/generate-enhanced': 'Generate SOW with enhanced template system',
        'GET /api/sow/test-enhanced': 'Test all templates with sample data'
      },
      // Existing endpoints preserved...
      phase1SOWEngine: {
        'POST /api/sow/generate-complete': 'Complete SOW generation with all features',
        'POST /api/sow/generate-from-inspection/:id': 'Generate SOW from field inspection',
        'POST /api/sow/validate': 'Validate project inputs without generation',
        'GET /api/sow/test': 'Test SOW generation with sample data',
        'GET /api/sow/templates': 'Get available templates and requirements',
        'POST /api/sow/wind-analysis': 'Standalone wind analysis',
        'GET /api/sow/status': 'Phase 1 engine system status'
      }
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
    requestPath: req.path,
    template_system: req.path.includes('templates') || req.path.includes('enhanced'),
    workflow_integration: req.path.includes('workflow') || req.body?.project_id,
    file_management: req.path.includes('files'),
    section_mapping: req.path.includes('mapping'),
    draft_management: req.path.includes('drafts'),
    sow_generation_api: req.path.includes('/api/sow/'),
    phase1_engine: req.path.includes('/api/sow/generate-complete') || req.path.includes('/api/sow/test')
  });
});

// 404 handler with enhanced template endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    requestedPath: req.originalUrl,
    availableEndpoints: [
      'GET /health - System health check',
      'GET /api/status - Complete system status',
      
      // NEW: Enhanced Template System
      'GET /api/templates - Get all 8 available templates',
      'POST /api/templates/validate - Validate template compatibility',
      'POST /api/templates/estimate - Estimate document metrics',
      'POST /api/sow/generate-enhanced - Enhanced SOW generation (T1-T8)',
      'GET /api/sow/test-enhanced - Test all templates',
      
      // Phase 1 Complete SOW Generation Engine
      'POST /api/sow/generate-complete - Complete SOW generation',
      'POST /api/sow/generate-from-inspection/:id - Generate from field inspection',
      'POST /api/sow/validate - Validate inputs only',
      'GET /api/sow/test - Test with sample data',
      'GET /api/sow/templates - Available templates',
      'POST /api/sow/wind-analysis - Wind analysis only',
      'GET /api/sow/status - Engine status'
    ]
  });
});

app.listen(PORT, () => {
  console.log('🚀 Complete 8-Template SOW Generation System Starting...');
  console.log('=' .repeat(120));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📊 System Status:');
  console.log(`   ✅ Health Check: GET /health`);
  console.log(`   📈 Full Status: GET /api/status`);
  console.log('');
  console.log('🎯 NEW: Complete Template System (T1-T8):');
  console.log(`   📋 All Templates: GET /api/templates`);
  console.log(`   ✅ Validate Template: POST /api/templates/validate`);
  console.log(`   📊 Estimate Metrics: POST /api/templates/estimate`);
  console.log(`   🎨 Enhanced Generation: POST /api/sow/generate-enhanced`);
  console.log(`   🧪 Test All Templates: GET /api/sow/test-enhanced`);
  console.log('');
  console.log('📋 Template Breakdown:');
  console.log(`   🔄 T1: Recover-TPO(MA)-cvr bd-BUR-insul-steel`);
  console.log(`   🔄 T2: Recover-TPO(MA)-cvr bd-BUR-lwc-steel`);
  console.log(`   🔄 T3: Recover-TPOfleece(MA)-BUR-insul-steel`);
  console.log(`   🔄 T4: Recover-TPOfleece(MA)-BUR-lwc-steel`);
  console.log(`   🔄 T5: Recover-TPO(Rhino)-iso-EPS flute fill-SSR`);
  console.log(`   🗑️ T6: Tearoff-TPO(MA)-insul-steel`);
  console.log(`   🗑️ T7: Tearoff-TPO(MA)-insul-lwc-steel`);
  console.log(`   🗑️ T8: Tearoff-TPO(adhered)-insul(adhered)-gypsum`);
  console.log('');
  console.log('🎯 Target Output:');
  console.log(`   📄 36+ pages per template`);
  console.log(`   📝 12,000-15,000 words per document`);
  console.log(`   📋 Complete submittal sections (4 categories)`);
  console.log(`   ✅ Comprehensive project requirements`);
  console.log('');
  console.log('🧪 Quick Test Commands:');
  console.log(`   curl http://localhost:${PORT}/api/templates`);
  console.log(`   curl http://localhost:${PORT}/api/sow/test-enhanced`);
  console.log(`   curl http://localhost:${PORT}/api/status`);
  console.log('');
  console.log('✨ Complete Template System Features:');
  console.log(`   ✅ All 8 Templates (T1-T8) - COMPLETE`);
  console.log(`   ✅ Enhanced Content Generator - COMPLETE`);
  console.log(`   ✅ Template Coordinator - COMPLETE`);
  console.log(`   ✅ Quality Metrics System - COMPLETE`);
  console.log(`   ✅ Compatibility Validation - COMPLETE`);
  console.log(`   ✅ 36+ Page Target Output - COMPLETE`);
  console.log('');
  console.log('🎉 COMPLETE 8-TEMPLATE SOW SYSTEM OPERATIONAL!');
  console.log('🚀 Ready for immediate testing and production use!');
  console.log('=' .repeat(120));
});

export default app;