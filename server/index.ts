// Enhanced Express Server with Complete Multi-Role Workflow Integration & File Management & Engineering Config
// NOW INCLUDES: Phase 1 Complete SOW Generation Engine + Advanced Section-Input Mapping System + Draft Management + SOW Generation API + Database-Driven Engineering Configuration

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

// Import NEW: Phase 1 Complete SOW Generation Engine routes
import sowCompleteRouter from './routes/sow-complete.js';

// Import NEW: Database-driven Engineering Configuration routes
import engineeringConfigRouter from './routes/engineering-config.js';

// Import simple test endpoints (that work without complex dependencies)
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
    // Add any additional origins as needed
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
// NEW: DATABASE-DRIVEN ENGINEERING CONFIGURATION
// ======================

// Engineering configuration routes (replaces hardcoded constants)
app.use('/api/engineering-config', engineeringConfigRouter);

// ======================
// NEW: PHASE 1 COMPLETE SOW GENERATION ENGINE
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

// Enhanced system status endpoint with Engineering Config status
app.get('/api/status', async (req, res) => {
  const supabaseStatus = await checkSupabaseConnection();
  
  res.json({
    phase: 'Phase 1 Complete SOW Generation Engine + Multi-Role Workflow System + File Management + Section-Input Mapping + Draft Management + Database-Driven Engineering Configuration',
    version: '12.0.0-phase1-complete-config',
    engineVersion: '12.0.0 - Phase 1 Complete SOW Generation Engine + Section Mapping + Content Generation + Wind Analysis + Database-Driven Engineering Configuration',
    serverStatus: 'running',
    timestamp: new Date().toISOString(),
    
    // NEW: Database-Driven Engineering Configuration
    engineeringConfiguration: {
      config_storage: 'Supabase database with JSONB values ✅',
      template_rules: 'Dynamic template selection from database ✅',
      engineering_constants: 'Importance factors, pressure coefficients, directivity factors ✅',
      caching_system: 'Memory caching with TTL for performance ✅',
      fallback_mechanisms: 'Graceful degradation to hardcoded values ✅',
      api_endpoints: 'Complete RESTful configuration management ✅',
      type_safety: 'Full TypeScript interfaces and validation ✅'
    },
    
    // NEW: Phase 1 Complete SOW Generation Engine
    phase1SOWEngine: {
      section_selector: 'Dynamic section selection based on project inputs ✅',
      content_generator: 'Professional SOW content generation ✅',
      wind_integrator: 'Complete ASCE wind analysis with zone calculations ✅',
      template_support: 'T5, T6, T7, T8 templates with intelligent selection ✅',
      validation_system: 'Comprehensive input and output validation ✅',
      test_framework: 'Automated testing with real project data ✅',
      database_config: 'Engineering constants loaded from database ✅'
    },
    
    // Existing SOW Generation API Status
    sowGenerationAPI: {
      frontend_integration: 'Complete ✅',
      file_upload_support: 'Multipart form data with file handling ✅',
      database_tracking: 'Full SOW generation tracking ✅',
      error_handling: 'Comprehensive error handling and recovery ✅',
      download_system: 'PDF download endpoints ✅',
      supabase_connection: supabaseStatus.connected ? 'Connected ✅' : `Disconnected: ${supabaseStatus.error} ⚠️`
    },
    
    draftManagement: {
      draft_persistence: 'In-memory draft storage with validation ✅',
      auto_calculation: 'Real-time square footage calculation ✅',
      user_isolation: 'Per-user draft management ✅',
      data_validation: 'Comprehensive input validation ✅',
      error_recovery: 'Graceful error handling and recovery ✅'
    },
    sectionInputMapping: {
      mapping_engine: 'Advanced section-to-input mapping with validation ✅',
      input_validation: 'Comprehensive validation with fallbacks ✅',
      content_transformation: 'Dynamic input transformation system ✅',
      audit_trails: 'Complete input resolution audit trails ✅',
      self_healing: 'Automatic fallback and error recovery ✅',
      csv_integration: 'SOW_SectiontoInput_Mapping.csv fully integrated ✅'
    },
    fileManagement: {
      storage_system: 'Hybrid Local + Supabase Cloud Storage ✅',
      photo_processing: 'Advanced EXIF + GPS + Thumbnails ✅',
      document_versioning: 'Complete version control with audit trails ✅',
      security_scanning: 'Multi-layer security validation ✅',
      workflow_integration: 'Stage-based file organization ✅',
      cloud_sync: 'Automatic cloud backup and CDN delivery ✅'
    },
    workflow: {
      database_schema: 'Complete ✅',
      role_management: 'Implemented ✅',
      project_lifecycle: 'Full workflow support ✅',
      handoff_system: 'Inspector → Consultant → Engineer ✅',
      collaboration: 'Comments, activities, audit trail ✅',
      api_endpoints: 'Complete workflow management ✅',
      sow_integration: 'ENHANCED + MAPPING ENGINE + API INTEGRATION ✅',
      file_integration: 'COMPLETE ✅'
    },
    endpoints: {
      // NEW: Database-Driven Engineering Configuration
      engineeringConfiguration: {
        'GET /api/engineering-config/health': 'Engineering config system health check',
        'GET /api/engineering-config/all': 'Get all configuration values',
        'GET /api/engineering-config/:key': 'Get specific configuration by key',
        'POST /api/engineering-config/template-match': 'Find matching template based on conditions',
        'GET /api/engineering-config/values/importance-factor/:classification': 'Get importance factor',
        'GET /api/engineering-config/values/internal-pressure/:enclosure': 'Get internal pressure coefficient',
        'GET /api/engineering-config/values/directivity-factor': 'Get wind directionality factor',
        'POST /api/engineering-config/clear-cache': 'Clear configuration cache',
        'GET /api/engineering-config/test': 'Comprehensive configuration test'
      },
      
      // NEW: Phase 1 Complete SOW Generation Engine
      phase1SOWEngine: {
        'POST /api/sow/generate-complete': 'Complete SOW generation with database config',
        'POST /api/sow/generate-from-inspection/:id': 'Generate SOW from field inspection',
        'POST /api/sow/validate': 'Validate project inputs without generation',
        'GET /api/sow/test': 'Test SOW generation with sample data',
        'GET /api/sow/templates': 'Get available templates and requirements',
        'POST /api/sow/wind-analysis': 'Standalone wind analysis with database config',
        'GET /api/sow/status': 'Phase 1 engine system status'
      },
      // Existing endpoints...\
      sowGenerationAPI: {
        'POST /api/sow-legacy/generate': 'Legacy SOW generation with file upload',
        'GET /api/sow-legacy/download/:sowId': 'Download generated PDF',
        'GET /api/sow-legacy/status/:sowId': 'Check generation status',
        'GET /api/sow-legacy/list': 'List user SOWs with pagination',
        'DELETE /api/sow-legacy/:sowId': 'Delete SOW and associated files'
      },
      draftManagement: {
        'POST /api/drafts/save': 'Save inspection draft with auto-calculation',
        'GET /api/drafts/:draftId': 'Load specific draft',
        'GET /api/drafts/list': 'List user drafts',
        'DELETE /api/drafts/:draftId': 'Delete draft',
        'POST /api/drafts/calculate-sqft': 'Calculate square footage utility',
        'GET /api/drafts/health': 'Draft system health check'
      },
      sectionInputMapping: {
        'GET /api/test/section-mapping': 'Section mapping system test (WORKING)',
        'GET /api/sow/mappings': 'SOW mappings overview (WORKING)'
      },
      fileManagement: {
        'POST /api/files/upload': 'Upload file to project workflow stage',
        'GET /api/files/project/:projectId': 'Get all files for a project with filtering',
        'GET /api/files/config': 'Get file management configuration'
      },
      workflow: {
        'POST /api/workflow/projects': 'Create new project with role assignments',
        'GET /api/workflow/projects': 'Get user projects filtered by role'
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
    workflow_integration: req.path.includes('workflow') || req.body?.project_id,
    file_management: req.path.includes('files'),
    section_mapping: req.path.includes('mapping'),
    draft_management: req.path.includes('drafts'),
    sow_generation_api: req.path.includes('/api/sow/'),
    engineering_config: req.path.includes('/api/engineering-config/'),
    phase1_engine: req.path.includes('/api/sow/generate-complete') || req.path.includes('/api/sow/test')
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
      
      // NEW: Database-Driven Engineering Configuration
      'GET /api/engineering-config/health - Engineering config health',
      'GET /api/engineering-config/all - All configuration values',
      'GET /api/engineering-config/:key - Specific configuration',
      'POST /api/engineering-config/template-match - Template matching',
      'GET /api/engineering-config/test - Comprehensive config test',
      
      // NEW: Phase 1 Complete SOW Generation Engine
      'POST /api/sow/generate-complete - Complete SOW generation',
      'POST /api/sow/generate-from-inspection/:id - Generate from field inspection',
      'POST /api/sow/validate - Validate inputs only',
      'GET /api/sow/test - Test with sample data',
      'GET /api/sow/templates - Available templates',
      'POST /api/sow/wind-analysis - Wind analysis only',
      'GET /api/sow/status - Engine status',
      
      // Legacy endpoints
      'POST /api/sow-legacy/generate - Legacy SOW generation',
      'GET /api/sow-legacy/download/:sowId - Download generated PDF',
      'GET /api/sow-legacy/status/:sowId - Check generation status',
      'GET /api/sow-legacy/list - List user SOWs',
      'DELETE /api/sow-legacy/:sowId - Delete SOW',
      
      // Existing endpoints
      'GET /api/test/section-mapping - Section mapping test',
      'GET /api/sow/mappings - SOW mappings overview',
      'POST /api/drafts/save - Save inspection draft',
      'GET /api/drafts/list - List user drafts',
      'POST /api/drafts/calculate-sqft - Calculate square footage',
      'POST /api/workflow/projects - Create workflow project',
      'POST /api/files/upload - Upload files to project',
      'GET /api/files/project/:id - Get project files'
    ]
  });
});

app.listen(PORT, () => {
  console.log('🚀 Phase 1 Complete SOW Generation Engine + Multi-Role Workflow System + Database-Driven Engineering Configuration Starting...');
  console.log('=' .repeat(130));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📊 System Status:');
  console.log(`   ✅ Health Check: GET /health`);
  console.log(`   📈 Full Status: GET /api/status`);
  console.log('');
  console.log('🎯 NEW: Database-Driven Engineering Configuration:');
  console.log(`   ⚙️ Config Health: GET /api/engineering-config/health`);
  console.log(`   📋 All Configs: GET /api/engineering-config/all`);
  console.log(`   🔍 Specific Config: GET /api/engineering-config/:key`);
  console.log(`   🎯 Template Match: POST /api/engineering-config/template-match`);
  console.log(`   🧪 Test All: GET /api/engineering-config/test`);
  console.log('');
  console.log('🎯 NEW: Phase 1 Complete SOW Generation Engine:');
  console.log(`   🎨 Complete Generation: POST /api/sow/generate-complete`);
  console.log(`   🔍 From Inspection: POST /api/sow/generate-from-inspection/:id`);
  console.log(`   ✅ Validate Only: POST /api/sow/validate`);
  console.log(`   🧪 Test Engine: GET /api/sow/test`);
  console.log(`   📋 Templates: GET /api/sow/templates`);
  console.log(`   🌪️ Wind Analysis: POST /api/sow/wind-analysis`);
  console.log(`   📊 Engine Status: GET /api/sow/status`);
  console.log('');
  console.log('🎯 Legacy SOW Generation API (Moved to /api/sow-legacy):');
  console.log(`   🎨 Generate SOW: POST /api/sow-legacy/generate`);
  console.log(`   📥 Download PDF: GET /api/sow-legacy/download/:sowId`);
  console.log(`   📊 Check Status: GET /api/sow-legacy/status/:sowId`);
  console.log(`   📋 List SOWs: GET /api/sow-legacy/list`);
  console.log(`   🗑️ Delete SOW: DELETE /api/sow-legacy/:sowId`);
  console.log('');
  console.log('💾 Draft Management System:');
  console.log(`   💾 Save Draft: POST /api/drafts/save`);
  console.log(`   📖 Load Draft: GET /api/drafts/:draftId`);
  console.log(`   📋 List Drafts: GET /api/drafts/list`);
  console.log(`   🗑️ Delete Draft: DELETE /api/drafts/:draftId`);
  console.log(`   🧮 Calculate Sq Ft: POST /api/drafts/calculate-sqft`);
  console.log(`   ❤️ Health Check: GET /api/drafts/health`);
  console.log('');
  console.log('🗺️ Section-Input Mapping System:');
  console.log(`   🧪 Test Section Mapping: GET /api/test/section-mapping`);
  console.log(`   📋 View SOW Mappings: GET /api/sow/mappings`);
  console.log('');
  console.log('📁 Complete File Management System:');
  console.log(`   📤 Upload Files: POST /api/files/upload`);
  console.log(`   📋 Project Files: GET /api/files/project/:projectId`);
  console.log(`   ⚙️ Configuration: GET /api/files/config`);
  console.log('');
  console.log('🔧 Enhanced SOW Generation:');
  console.log(`   🎨 Standard Enhanced: POST /api/sow-enhanced/debug-sow`);
  console.log(`   📋 Section Engine: POST /api/sow-enhanced/debug-sections`);
  console.log(`   🔄 Self-Healing: POST /api/sow-enhanced/debug-self-healing`);
  console.log('');
  console.log('✨ Phase 1 Implementation Status:');
  console.log(`   ✅ Section Selection Engine - COMPLETE`);
  console.log(`   ✅ Content Generation Engine - COMPLETE`);
  console.log(`   ✅ Wind Analysis Integration - COMPLETE`);
  console.log(`   ✅ Template Support (T5, T6, T7, T8) - COMPLETE`);
  console.log(`   ✅ Input Validation System - COMPLETE`);
  console.log(`   ✅ Test Framework - COMPLETE`);
  console.log(`   ✅ API Integration - COMPLETE`);
  console.log(`   ✅ Database-Driven Engineering Configuration - COMPLETE`);
  console.log('');
  console.log('🧪 Quick Test Commands:');
  console.log(`   curl http://localhost:${PORT}/api/engineering-config/health`);
  console.log(`   curl http://localhost:${PORT}/api/engineering-config/test`);
  console.log(`   curl http://localhost:${PORT}/api/sow/status`);
  console.log(`   curl http://localhost:${PORT}/api/sow/test`);
  console.log(`   curl http://localhost:${PORT}/api/sow/templates`);
  console.log('');
  console.log('📁 Output Directory:', outputDir);
  console.log('🌍 CORS Enabled for Lovable and local development');
  console.log('🗄️ Database: Supabase with complete workflow + file management + SOW tracking + engineering configuration schema');
  console.log('=' .repeat(130));
  console.log('🎉 Phase 1 Complete SOW Generation Engine + Database-Driven Engineering Configuration OPERATIONAL!');
  console.log('');
  console.log('🎯 NEW FEATURES:');
  console.log('    🧠 Dynamic section selection based on project characteristics');
  console.log('    📝 Professional content generation with conditional logic');
  console.log('    🌪️ Complete ASCE wind analysis with zone calculations');
  console.log('    🎯 Intelligent template selection (T5, T6, T7, T8)');
  console.log('    ✅ Comprehensive validation at every step');
  console.log('    🧪 Automated testing with the existing Southridge 12 project');
  console.log('    🔗 Full integration with field inspection workflow');
  console.log('    ⚙️ Database-driven engineering constants and template rules');
  console.log('    🔄 Fallback mechanisms for robust operation');
  console.log('    📊 Type-safe configuration management');
  console.log('');
  console.log('🚀 Ready for immediate testing and Phase 2 implementation!');
});

export default app;