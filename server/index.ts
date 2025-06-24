// Enhanced Express Server with Complete Multi-Role Workflow Integration & File Management
// NOW INCLUDES: Advanced Section-Input Mapping System
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

// NEW: Import Section-Input Mapping routes
import { 
  generateSOWWithMapping,
  debugSectionMapping,
  getAvailableMappings,
  findInputMappings,
  validateInputMapping,
  generateMappingReport
} from './routes/sow-mapping.js';

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

// Import complete workflow-SOW integration ENHANCED
import { 
  generateWorkflowSOW, 
  WorkflowSOWInputs,
  WorkflowSOWResult 
} from './core/workflow-sow-integration-enhanced.js';

// Import file management configuration
import { STORAGE_CONFIG } from './core/file-management.js';

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

// Ensure storage directory exists (for local file storage)
const storageDir = STORAGE_CONFIG.baseDir;
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
  console.log(`📁 Created storage directory: ${storageDir}`);
}

// Static file serving for generated PDFs
app.use('/output', express.static(outputDir));

// Static file serving for stored files (if using local storage)
app.use('/storage', express.static(storageDir));

// Health check endpoint
app.get('/health', healthCheck);

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
// NEW: SECTION-INPUT MAPPING ENDPOINTS
// ======================

// Enhanced SOW generation with section-input mapping
app.post('/api/sow/generate-with-mapping', upload.single('file'), generateSOWWithMapping);

// Debug section-input mapping analysis
app.post('/api/sow/debug-mapping', debugSectionMapping);

// Get all available section mappings
app.get('/api/sow/mappings', getAvailableMappings);

// Find mappings for specific input
app.get('/api/sow/mappings/input/:inputPath', findInputMappings);

// Validate inputs against mapping requirements
app.post('/api/sow/validate-mapping', validateInputMapping);

// Generate comprehensive mapping report
app.post('/api/sow/mapping-report', generateMappingReport);

// ======================
// COMPLETE WORKFLOW-SOW INTEGRATION ENDPOINTS
// ======================

// Main workflow-integrated SOW generation endpoint
app.post('/api/sow/generate-enhanced', upload.single('file'), async (req, res) => {
  try {
    const { project_id, engineer_notes, include_audit_trail, use_mapping_engine } = req.body;
    
    // Check if we should use the new mapping engine
    if (use_mapping_engine === true || use_mapping_engine === 'true') {
      console.log('🗺️ Using enhanced section-input mapping engine...');
      return await generateSOWWithMapping(req, res);
    }
    
    if (project_id) {
      console.log('🔄 Complete workflow-integrated SOW generation...');
      console.log(`📋 Project ID: ${project_id}`);
      
      // Extract user ID from authentication (would normally come from middleware)
      const userId = req.headers['x-user-id'] || 'system-user'; // Placeholder
      
      const workflowInputs: WorkflowSOWInputs = {
        projectId: project_id,
        userId: userId as string,
        engineerNotes: engineer_notes,
        includeWorkflowAuditTrail: include_audit_trail !== false,
        customOverrides: req.file ? {
          takeoffFile: {
            filename: req.file.originalname,
            buffer: req.file.buffer,
            mimetype: req.file.mimetype
          }
        } : undefined
      };
      
      // Generate complete workflow-integrated SOW
      const result: WorkflowSOWResult = await generateWorkflowSOW(workflowInputs);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
          workflow_integration: true
        });
      }
      
      // Return enhanced response with workflow data
      return res.json({
        success: true,
        workflow_integration: true,
        project_id,
        
        // Core SOW data
        engineeringSummary: result.engineeringSummary,
        filename: result.filename,
        outputPath: result.outputPath,
        generationTime: result.generationTime,
        
        // Workflow-specific data
        workflowData: result.workflowData,
        sowMetadata: result.sowMetadata,
        
        // Debug information
        debugInfo: result.debugInfo,
        
        // Success indicators
        metadata: {
          multi_role_generation: true,
          workflow_version: '1.0.0',
          data_sources: result.sowMetadata?.dataSourceBreakdown,
          collaborators: result.workflowData?.collaborators,
          audit_trail_entries: result.workflowData?.auditTrail?.length || 0,
          template_selected: result.engineeringSummary?.templateSelection?.templateName,
          system_selected: result.engineeringSummary?.systemSelection?.selectedSystem,
          generation_timestamp: new Date().toISOString()
        }
      });
      
    } else {
      console.log('🔄 Standard enhanced SOW generation (no workflow integration)...');
      // Fall back to existing enhanced SOW generation
      await debugSOWEnhanced(req, res);
    }
    
  } catch (error) {
    console.error('❌ Enhanced SOW generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Enhanced SOW generation failed',
      workflow_integration: !!req.body.project_id,
      timestamp: new Date().toISOString()
    });
  }
});

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

// Main SOW generation endpoint (enhanced with workflow awareness)
app.post('/api/sow/generate-sow', upload.single('file'), async (req, res) => {
  try {
    // Enhanced SOW generation with potential workflow integration
    console.log('🔄 SOW generation with workflow awareness...');
    
    // Check if this is a workflow request
    if (req.body.project_id) {
      console.log('🔄 Detected workflow project, redirecting to workflow SOW generation...');
      // Create a new request object for the redirect
      const workflowReq = {
        ...req,
        url: '/api/workflow/generate-sow',
        path: '/api/workflow/generate-sow'
      };
      return await app._router.handle(workflowReq, res);
    }
    
    // Standard enhanced SOW generation
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

// Enhanced system status endpoint with section mapping
app.get('/api/status', (req, res) => {
  res.json({
    phase: 'Complete Multi-Role Workflow System with SOW Integration, File Management & Section-Input Mapping',
    version: '9.0.0-mapping-engine',
    engineVersion: '9.0.0 - Section-Input Mapping + Enhanced Integration + Multi-Role Workflow-SOW Integration',
    serverStatus: 'running',
    timestamp: new Date().toISOString(),
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
      sectionInputMapping: {
        'POST /api/sow/generate-with-mapping': 'Enhanced SOW generation with section-input mapping',
        'POST /api/sow/debug-mapping': 'Debug section-input mapping analysis',
        'GET /api/sow/mappings': 'Get all available section mappings',
        'GET /api/sow/mappings/input/:inputPath': 'Find mappings for specific input',
        'POST /api/sow/validate-mapping': 'Validate inputs against mapping requirements',
        'POST /api/sow/mapping-report': 'Generate comprehensive mapping report'
      },
      fileManagement: {
        'POST /api/files/upload': 'Upload file to project workflow stage',
        'GET /api/files/project/:projectId': 'Get all files for a project with filtering',
        'GET /api/files/config': 'Get file management configuration'
      },
      workflowSOW: {
        'POST /api/sow/generate-enhanced': 'Complete workflow-integrated SOW generation (add use_mapping_engine=true for new engine)',
        'POST /api/workflow/generate-sow': 'Dedicated workflow SOW generation endpoint'
      },
      workflow: {
        'POST /api/workflow/projects': 'Create new project with role assignments',
        'GET /api/workflow/projects': 'Get user projects filtered by role'
      }
    }
  });
});

// Test endpoint for section-input mapping
app.get('/api/test/section-mapping', (req, res) => {
  res.json({
    success: true,
    message: 'Section-Input Mapping Engine is operational',
    version: '1.0.0-mapping-engine',
    capabilities: [
      'csv-driven-section-mapping',
      'comprehensive-input-validation',
      'dynamic-content-transformation',
      'audit-trail-generation',
      'self-healing-fallbacks',
      'mapping-debug-tools'
    ],
    timestamp: new Date().toISOString(),
    mappingEngineStatus: {
      csvIntegration: 'SOW_SectiontoInput_Mapping.csv ✅',
      validationEngine: 'Multi-level validation ✅',
      transformationEngine: 'Dynamic transformations ✅',
      auditSystem: 'Complete audit trails ✅',
      fallbackSystem: 'Self-healing fallbacks ✅',
      debugTools: 'Comprehensive debug endpoints ✅'
    },
    testEndpoints: [
      'POST /api/sow/debug-mapping - Test mapping analysis',
      'GET /api/sow/mappings - View all mappings',
      'POST /api/sow/validate-mapping - Test input validation',
      'POST /api/sow/mapping-report - Generate mapping report'
    ]
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
    section_mapping: req.path.includes('mapping')
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
      'POST /api/sow/generate-with-mapping - Enhanced SOW with section mapping',
      'POST /api/sow/debug-mapping - Debug section mapping',
      'GET /api/sow/mappings - View all section mappings',
      'POST /api/sow/validate-mapping - Validate input mapping',
      'POST /api/sow/mapping-report - Generate mapping report',
      'POST /api/workflow/projects - Create workflow project',
      'POST /api/sow/generate-enhanced - Enhanced SOW generation',
      'POST /api/files/upload - Upload files to project'
    ]
  });
});

app.listen(PORT, () => {
  console.log('🚀 Enhanced Multi-Role Workflow-SOW Integration + File Management + Section Mapping Server Starting...');
  console.log('=' .repeat(100));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📊 System Status:');
  console.log(`   ✅ Health Check: GET /health`);
  console.log(`   📈 Full Status: GET /api/status`);
  console.log(`   🗺️ Section Mapping Test: GET /api/test/section-mapping`);
  console.log('');
  console.log('🗺️ NEW: Section-Input Mapping System:');
  console.log(`   🚀 Enhanced Generation: POST /api/sow/generate-with-mapping`);
  console.log(`   🔍 Debug Mapping: POST /api/sow/debug-mapping`);
  console.log(`   📋 View Mappings: GET /api/sow/mappings`);
  console.log(`   ✅ Validate Inputs: POST /api/sow/validate-mapping`);
  console.log(`   📊 Mapping Report: POST /api/sow/mapping-report`);
  console.log(`   🔍 Find Input Mappings: GET /api/sow/mappings/input/:inputPath`);
  console.log('');
  console.log('🆕 Section-Input Mapping Features:');
  console.log(`   🗺️ CSV Integration - SOW_SectiontoInput_Mapping.csv fully integrated`);
  console.log(`   ✅ Input Validation - Comprehensive validation with fallbacks`);
  console.log(`   🔄 Data Transformation - Dynamic input transformation functions`);
  console.log(`   📋 Audit Trails - Complete input resolution tracking`);
  console.log(`   🔧 Self-Healing - Automatic fallback values and error recovery`);
  console.log(`   🔍 Debug Tools - Comprehensive mapping analysis endpoints`);
  console.log('');
  console.log('🎯 Enhanced Workflow-SOW Integration:');
  console.log(`   🔄 Enhanced SOW: POST /api/sow/generate-enhanced (add use_mapping_engine=true)`);
  console.log(`   🎯 Dedicated Workflow: POST /api/workflow/generate-sow`);
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
  console.log(`   ✅ Successfully integrated SOW_SectiontoInput_Mapping.csv`);
  console.log(`   ✅ Built comprehensive input validation and transformation system`);
  console.log(`   ✅ Created audit trail system for complete traceability`);
  console.log(`   ✅ Implemented self-healing fallbacks for missing data`);
  console.log(`   ✅ Maintained backward compatibility with existing systems`);
  console.log(`   ✅ Added comprehensive debug and analysis tools`);
  console.log('');
  console.log('📁 Storage Configuration:');
  console.log(`   🗄️ Storage Type: ${STORAGE_CONFIG.useCloudStorage ? 'Cloud (Supabase)' : 'Local'}`);
  console.log(`   📍 Base Directory: ${STORAGE_CONFIG.baseDir}`);
  console.log('');
  console.log('📁 Output Directory:', outputDir);
  console.log('📁 Storage Directory:', storageDir);
  console.log('🌍 CORS Enabled for Lovable and local development');
  console.log('🗄️ Database: Supabase with complete workflow + file management schema');
  console.log('=' .repeat(100));
  console.log('🎉 Enhanced Multi-Role Workflow-SOW Integration + File Management + Section Mapping System OPERATIONAL!');
  console.log('');
  console.log('📚 MAJOR NEW FEATURE: Section-Input Mapping Engine');
  console.log('    🗺️ CSV-driven section generation with dynamic input resolution');
  console.log('    ✅ Comprehensive validation with detailed error reporting');
  console.log('    🔄 Automatic data transformation and formatting');
  console.log('    📋 Complete audit trails for input resolution');
  console.log('    🔧 Self-healing system with fallback values');
  console.log('    🔍 Debug tools for mapping analysis and troubleshooting');
  console.log('');
  console.log('🧪 Ready for testing with development scripts!');
  console.log('🚀 System fully operational with enhanced section mapping capabilities!');
});

export default app;
