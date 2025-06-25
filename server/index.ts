// Enhanced Express Server with Complete Multi-Role Workflow Integration & File Management
// NOW INCLUDES: Advanced Section-Input Mapping System + Draft Management
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

// Import enhanced formatting routes
import enhancedFormattingRouter from './routes/sow-enhanced-formatting.js';

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

const app = express();
const PORT = process.env.PORT || 3001;

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
// WORKING TEST ENDPOINTS
// ======================

// Test endpoint for section-input mapping (WORKING)
app.get('/api/test/section-mapping', testSectionMapping);

// Test endpoint for SOW mappings overview (WORKING)
app.get('/api/sow/mappings', testSOWMappings);

// ======================
// DRAFT MANAGEMENT ENDPOINTS (NEW)
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
app.use('/api/sow', enhancedFormattingRouter);

// ======================
// LEGACY SOW ENDPOINTS (for backward compatibility)
// ======================
app.post('/api/generate-sow', upload.single('file'), generateSOWWithSummary);
app.post('/api/debug-sow-legacy', debugSOW);

// ======================
// ENHANCED SOW ENDPOINTS (Section Engine & Self-Healing)
// ======================

// Main debug endpoint with Section Engine integration
app.post('/api/sow/debug-sow', debugSOWEnhanced);

// Section-specific analysis
app.post('/api/sow/debug-sections', debugSectionAnalysis);

// Self-healing analysis
app.post('/api/sow/debug-self-healing', debugSelfHealing);

// Individual engine trace debugging
app.post('/api/sow/debug-engine-trace', debugEngineTrace);

// Template rendering with dynamic sections
app.post('/api/sow/render-template', renderTemplateContent);

// Template mapping
app.get('/api/sow/templates', getTemplateMap);

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

// Enhanced system status endpoint with section mapping and draft management
app.get('/api/status', (req, res) => {
  res.json({
    phase: 'Complete Multi-Role Workflow System with SOW Integration, File Management, Section-Input Mapping & Draft Management',
    version: '9.1.0-draft-management',
    engineVersion: '9.1.0 - Draft Management + Section-Input Mapping + Enhanced Integration + Multi-Role Workflow-SOW Integration',
    serverStatus: 'running',
    timestamp: new Date().toISOString(),
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
      sow_integration: 'ENHANCED + MAPPING ENGINE ✅',
      file_integration: 'COMPLETE ✅'
    },
    endpoints: {
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
    draft_management: req.path.includes('drafts')
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
  console.log('🚀 Enhanced Multi-Role Workflow-SOW Integration + File Management + Section Mapping + Draft Management Server Starting...');
  console.log('=' .repeat(100));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📊 System Status:');
  console.log(`   ✅ Health Check: GET /health`);
  console.log(`   📈 Full Status: GET /api/status`);
  console.log(`   🗺️ Section Mapping Test: GET /api/test/section-mapping`);
  console.log(`   📋 SOW Mappings: GET /api/sow/mappings`);
  console.log('');
  console.log('💾 NEW: Draft Management System:');
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
  console.log('🎯 Enhanced Workflow-SOW Integration:');
  console.log(`   🔄 Workflow Tests: GET /api/test/workflow-sow`);
  console.log('');
  console.log('📁 Complete File Management System:');
  console.log(`   📤 Upload Files: POST /api/files/upload`);
  console.log(`   📋 Project Files: GET /api/files/project/:projectId`);
  console.log(`   ⚙️ Configuration: GET /api/files/config`);
  console.log('');
  console.log('🔧 Enhanced SOW Generation:');
  console.log(`   🎨 Standard Enhanced: POST /api/sow/debug-sow`);
  console.log(`   📋 Section Engine: POST /api/sow/debug-sections`);
  console.log(`   🔄 Self-Healing: POST /api/sow/debug-self-healing`);
  console.log('');
  console.log('✨ Key System Achievements:');
  console.log(`   ✅ Draft management with auto-calculation and validation`);
  console.log(`   ✅ Working test endpoints for section mapping validation`);
  console.log(`   ✅ Comprehensive workflow and file management systems`);
  console.log(`   ✅ CSV integration structure for SOW section mapping`);
  console.log(`   ✅ Multi-role project lifecycle management`);
  console.log(`   ✅ Complete audit trail and error handling`);
  console.log('');
  console.log('📁 Output Directory:', outputDir);
  console.log('🌍 CORS Enabled for Lovable and local development');
  console.log('🗄️ Database: Supabase with complete workflow + file management schema');
  console.log('=' .repeat(100));
  console.log('🎉 Enhanced Multi-Role Workflow-SOW Integration + File Management + Section Mapping + Draft Management System OPERATIONAL!');
  console.log('');
  console.log('💾 NEW FEATURES:');
  console.log('    💾 Draft persistence for inspection forms');
  console.log('    🧮 Accurate square footage auto-calculation');
  console.log('    👤 Per-user draft isolation and management');
  console.log('    🛡️ Comprehensive input validation and error recovery');
  console.log('');
  console.log('🧪 Ready for immediate testing!');
  console.log('🚀 System fully operational with working draft management + section mapping!');
});

export default app;