// Main Express Server
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { generateSOWWithSummary, healthCheck } from './routes/sow';

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

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SOW Generator server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API endpoint: http://localhost:${PORT}/api/generate-sow`);
});
