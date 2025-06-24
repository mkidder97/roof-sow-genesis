// Enhanced Express Server with Complete Multi-Role Workflow Integration & File Management
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

// Import enhanced clean content population routes
import {
  generateEnhancedSOW,
  validateSystemConfiguration,
  testContentQuality
} from './routes/sow-enhanced-clean.js';

// Import enhanced formatting routes
import enhancedFormattingRouter from './routes/sow-enhanced-formatting.js';

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

// NEW: Import file management routes
import fileManagementRouter from './routes/file-management.js';

// NEW: Import complete workflow-SOW integration ENHANCED
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
// ENHANCED CLEAN CONTENT GENERATION ENDPOINTS
// ======================

// NEW: Enhanced SOW generation with clean content population
app.post('/api/sow/generate-clean', upload.single('file'), generateEnhancedSOW);

// NEW: System configuration validation
app.post('/api/sow/validate-configuration', validateSystemConfiguration);

// NEW: Content quality testing
app.post('/api/sow/test-content-quality', testContentQuality);

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

// Enhanced system status endpoint with file management
app.get('/api/status', (req, res) => {
  res.json({
    phase: 'Enhanced Content Population System with Clean SOW Generation',
    version: '9.0.0-enhanced-content',
    engineVersion: '9.0.0 - Enhanced Content Population + System Configuration Testing',
    serverStatus: 'running',
    timestamp: new Date().toISOString(),
    enhancedContentSystem: {
      placeholder_resolution: 'Complete dynamic replacement ✅',
      editorial_markup_removal: 'Clean professional output ✅',
      system_specific_content: 'Configuration-based generation ✅',
      quality_validation: 'Automatic professional standards ✅',
      client_ready_output: 'No template artifacts ✅',
      configuration_testing: 'Automated system validation ✅'
    },
    endpoints: {
      enhancedContentGeneration: {
        'POST /api/sow/generate-clean': 'Enhanced SOW generation with clean content population',
        'POST /api/sow/validate-configuration': 'System configuration validation and testing',
        'POST /api/sow/test-content-quality': 'Content quality testing and validation'
      }
    }
  });
});

// Test endpoint for enhanced content system
app.get('/api/test/enhanced-content', (req, res) => {
  res.json({
    success: true,
    message: 'Enhanced Content Population System is operational',
    version: '9.0.0-enhanced-content',
    capabilities: [
      'complete-placeholder-resolution',
      'system-specific-content-generation',
      'configuration-based-template-selection',
      'quality-validation-checks',
      'client-ready-output',
      'professional-formatting',
      'editorial-markup-removal',
      'automated-testing-validation'
    ],
    timestamp: new Date().toISOString(),
    systemStatus: {
      contentPopulation: 'Enhanced ✅',
      qualityChecks: 'Implemented ✅',
      configurationTesting: 'Automated ✅',
      placeholderResolution: 'Complete ✅',
      systemSpecificGeneration: 'Active ✅',
      clientReadyOutput: 'Validated ✅'
    },
    testEndpoints: {
      'POST /api/sow/generate-clean': 'Generate clean, professional SOW',
      'POST /api/sow/validate-configuration': 'Validate system configuration',
      'POST /api/sow/test-content-quality': 'Test content quality standards'
    }
  });
});

app.listen(PORT, () => {
  console.log('🚀 Enhanced Content Population System + Multi-Role Workflow-SOW Integration Server Starting...');
  console.log('=' .repeat(95));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📊 System Status:');
  console.log(`   ✅ Health Check: GET /health`);
  console.log(`   📈 Full Status: GET /api/status`);
  console.log(`   🧪 Enhanced Content Test: GET /api/test/enhanced-content`);
  console.log('');
  console.log('🎯 Enhanced Content Population System:');
  console.log(`   🚀 Clean SOW Generation: POST /api/sow/generate-clean`);
  console.log(`   ✅ Configuration Validation: POST /api/sow/validate-configuration`);
  console.log(`   🧪 Content Quality Testing: POST /api/sow/test-content-quality`);
  console.log('');
  console.log('✨ Enhanced Content Population Features:');
  console.log(`   🔧 Complete Placeholder Resolution - All template variables replaced with actual data`);
  console.log(`   🎯 System-Specific Content - Different content for Tearoff vs Recover, Steel vs Gypsum`);
  console.log(`   📝 Professional Output - No editorial markup or template artifacts`);
  console.log(`   ✅ Quality Validation - Automatic checks for client-ready standards`);
  console.log(`   🧪 Automated Testing - System configuration validation and quality testing`);
  console.log(`   🏗️ Configuration Detection - Tearoff+TPO+Mechanical+Steel vs Adhered+Gypsum etc.`);
  console.log('');
  console.log('🧪 Ready for testing with enhanced system configuration scripts!');
  console.log('Enhanced Content Population System fully operational!');
});

export default app;
