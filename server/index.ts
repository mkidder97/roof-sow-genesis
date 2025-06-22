// Main Express Server with Phase 1 Enhancements
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { generateSOWWithSummary, healthCheck, debugSOW } from './routes/sow';

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

// NEW: Debug endpoint for testing Phase 1 logic
app.post('/api/debug-sow', debugSOW);

// NEW: System status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    phase: 'Phase 1 Complete',
    features: {
      windPressureCalculations: 'ASCE 7-16/22 dynamic formulas',
      manufacturerPatterns: 'Live fastening pattern selection',
      takeoffLogic: 'Smart section injection based on takeoff data',
      geocoding: 'OpenCage with fallback support',
      jurisdictionMapping: 'HVHZ and building code detection',
      pdfGeneration: 'Professional SOW documents'
    },
    dataStructure: {
      windUpliftPressures: 'zone1Field, zone1Perimeter, zone2Perimeter, zone3Corner (PSF)',
      fasteningSpecifications: 'fieldSpacing, perimeterSpacing, cornerSpacing, penetrationDepth',
      takeoffDiagnostics: 'drainOverflowRequired, highPenetrationDensity, etc.',
      asceVersion: 'Dynamic based on jurisdiction mapping',
      hvhz: 'Auto-determined from county/state'
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
  console.log(`🚀 SOW Generator Phase 1 server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Main API: http://localhost:${PORT}/api/generate-sow`);
  console.log(`🧪 Debug API: http://localhost:${PORT}/api/debug-sow`);
  console.log(`📊 Status: http://localhost:${PORT}/api/status`);
  console.log(`\n✅ Phase 1 Features Active:`);
  console.log(`   - Dynamic ASCE Wind Pressure Calculations`);
  console.log(`   - Live Manufacturer Fastening Pattern Selection`);
  console.log(`   - Smart Takeoff-Based Section Logic Injection`);
});
