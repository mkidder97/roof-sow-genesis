# Complete SOW Generation API Integration

## Overview

The SOW Generation API has been fully integrated to connect the React frontend with the existing backend PDF generation system. This provides a seamless workflow from field inspections through SOW generation with complete database tracking and file management.

## 🎯 Integration Summary

### ✅ **FRONTEND READY** - The React components can now connect immediately to:
- **`POST /api/sow/generate`** - Main SOW generation endpoint
- **`GET /api/sow/download/:sowId`** - PDF download endpoint  
- **`GET /api/sow/status/:sowId`** - Generation status tracking
- **`GET /api/sow/list`** - List user SOWs with pagination
- **`DELETE /api/sow/:sowId`** - Delete SOW records

### 🔧 **BACKEND COMPLETE** - All endpoints fully implemented with:
- File upload processing (multipart/form-data)
- Database tracking in `sow_generations` table
- Integration with existing PDF generation system
- Comprehensive error handling and recovery
- Connection to field inspection workflow

### 📊 **DATABASE INTEGRATION** - Complete tracking system:
- SOW generation records with status tracking
- File upload metadata and extraction confidence
- Linking to field inspections
- User isolation and audit trails

## 🚀 Implementation Files

### Backend API Routes
```
server/routes/sow-generation-api.ts    # Main API implementation
server/lib/supabase.ts                 # Database client configuration
server/index.ts                        # Updated with new routes
```

### Frontend Integration
```
src/lib/api.ts                         # Updated API endpoints and functions
src/hooks/useSOWGeneration.ts          # Updated React hooks
```

### Database Schema
```
supabase/migrations/20250625_sow_generations.sql  # Complete schema
```

## 📋 API Endpoints

### 1. Generate SOW
**`POST /api/sow/generate`**

**Request Format:**
```typescript
// Multipart form data
{
  projectData: {
    projectName: string;
    address: string;
    customerName?: string;
    customerPhone?: string;
    buildingHeight?: number;
    squareFootage?: number;
    numberOfDrains?: number;
    numberOfPenetrations?: number;
    membraneType?: string;
    windSpeed?: number;
    exposureCategory?: string;
    projectType?: string;
    // ... additional fields
  };
  inspectionId?: string;
  file?: File; // Takeoff document
}
```

**Response Format:**
```typescript
{
  success: boolean;
  sowId?: string;
  downloadUrl?: string;
  generationStatus: 'processing' | 'complete' | 'failed';
  error?: string;
  estimatedCompletionTime?: number;
  data?: {
    sow?: string;
    pdf?: string;
    engineeringSummary?: any;
    templateUsed?: string;
  };
  metadata?: {
    generationTime?: number;
    fileProcessed?: boolean;
    extractionConfidence?: number;
  };
}
```

### 2. Download SOW
**`GET /api/sow/download/:sowId`**

Returns PDF file for download with proper headers.

### 3. Check Status
**`GET /api/sow/status/:sowId`**

Returns current generation status and metadata.

### 4. List SOWs
**`GET /api/sow/list?page=1&limit=10`**

Returns paginated list of user's SOWs.

### 5. Delete SOW
**`DELETE /api/sow/:sowId`**

Removes SOW record and associated files.

## 🔄 Frontend Usage Examples

### Basic SOW Generation
```typescript
import { useSOWGeneration } from '@/hooks/useSOWGeneration';

const { generateSOW, isGenerating, generationData, generationError } = useSOWGeneration({
  onSuccess: (data) => {
    console.log('SOW generated:', data.sowId);
    if (data.downloadUrl) {
      window.open(data.downloadUrl, '_blank');
    }
  },
  onError: (error) => {
    console.error('Generation failed:', error.message);
  }
});

// Generate SOW
const handleGenerateSOW = () => {
  generateSOW({
    projectData: {
      projectName: "Sample Project",
      address: "123 Main St",
      customerName: "John Doe",
      squareFootage: 10000,
      membraneType: "tpo",
      // ... other fields
    },
    file: takeoffFile // Optional file upload
  });
};
```

### From Field Inspection
```typescript
import { useSOWWorkflow } from '@/hooks/useSOWGeneration';

const { generateFromInspection, isGeneratingFromInspection } = useSOWWorkflow();

// Generate SOW from completed inspection
const handleGenerateFromInspection = (inspection) => {
  generateFromInspection({
    inspectionData: inspection,
    inspectionId: inspection.id
  });
};
```

### Download SOW
```typescript
const { downloadSOW, isDownloading } = useSOWGeneration();

// Download generated PDF
const handleDownload = (sowId) => {
  downloadSOW(sowId);
};
```

### Status Monitoring
```typescript
import { useSOWStatusMonitor } from '@/hooks/useSOWGeneration';

const { status, isMonitoring, startMonitoring } = useSOWStatusMonitor(sowId);

// Start monitoring status for async generation
useEffect(() => {
  if (sowId) {
    startMonitoring();
  }
}, [sowId]);
```

## 🗄️ Database Schema

### SOW Generations Table
```sql
CREATE TABLE sow_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Project Information
  project_name TEXT NOT NULL,
  project_address TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  
  -- Generation Status
  status TEXT NOT NULL DEFAULT 'processing',
  error_message TEXT,
  
  -- Request Data
  request_data JSONB NOT NULL,
  inspection_id UUID REFERENCES field_inspections(id),
  
  -- File Processing
  file_uploaded BOOLEAN DEFAULT FALSE,
  file_name TEXT,
  extraction_confidence REAL,
  
  -- Generated Content
  pdf_url TEXT,
  pdf_data TEXT, -- Base64 encoded PDF
  engineering_summary JSONB,
  template_used TEXT,
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  generation_time_ms INTEGER,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Field Inspections Integration
```sql
-- Added columns to field_inspections table
ALTER TABLE field_inspections 
ADD COLUMN sow_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN sow_generation_id UUID REFERENCES sow_generations(id);
```

## 🔧 Configuration

### Environment Variables (Server)
```bash
# Required for database tracking
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional for development
NODE_ENV=development
PORT=3001
```

### Environment Variables (Frontend)
```bash
# Production API URL
VITE_API_URL=https://your-production-backend.com

# Development uses http://localhost:3001 by default
```

## 🛠️ Integration Features

### ✅ **File Upload Processing**
- Multipart form data handling
- Takeoff document parsing and data extraction
- File metadata storage and tracking
- Error handling for processing failures

### ✅ **Database Integration**
- Complete SOW generation tracking
- Status updates throughout generation process
- User isolation with Row Level Security
- Audit trails and metadata storage

### ✅ **Field Inspection Workflow**
- Seamless integration with inspection system
- Automatic data transformation from inspections
- Status updates on parent inspection records
- Complete workflow tracking

### ✅ **Error Handling**
- Comprehensive validation of input data
- Graceful degradation when services fail
- Detailed error messages and recovery guidance
- Fallback mechanisms for external dependencies

### ✅ **Performance Optimization**
- Efficient database queries with proper indexing
- File streaming for large PDF downloads
- Memory management for file processing
- Async processing for complex generations

## 🧪 Testing

### Backend Health Check
```bash
curl http://localhost:3001/health
```

### API Status
```bash
curl http://localhost:3001/api/status
```

### Generate Test SOW
```bash
curl -X POST http://localhost:3001/api/sow/generate \
  -F 'projectData={"projectName":"Test Project","address":"123 Test St"}' \
  -F 'file=@test-takeoff.pdf'
```

## 🚀 Deployment

### Database Migration
1. Run the migration to create the `sow_generations` table:
```sql
-- Apply supabase/migrations/20250625_sow_generations.sql
```

### Server Deployment
1. Ensure environment variables are set
2. Install dependencies: `npm install`
3. Start server: `npm start`

### Frontend Integration
1. Update `VITE_API_URL` for production
2. Build and deploy frontend
3. Test SOW generation flow

## 📈 Monitoring

### Database Queries
```sql
-- Check SOW generation status
SELECT status, COUNT(*) FROM sow_generations GROUP BY status;

-- Recent generations
SELECT project_name, status, created_at 
FROM sow_generations 
ORDER BY created_at DESC 
LIMIT 10;

-- Generation performance
SELECT 
  AVG(generation_time_ms) as avg_time,
  MAX(generation_time_ms) as max_time,
  COUNT(*) as total_generations
FROM sow_generations 
WHERE status = 'complete';
```

### Health Monitoring
- Monitor `/health` endpoint for server status
- Check Supabase connection status via `/api/status`
- Track generation success rates and performance metrics

## 🔗 Integration Points

### EngineerDashboard.tsx
The `handleGenerateSOW` function already transforms field inspection data and navigates to SOW generation. This now connects seamlessly to the new API.

### useSOWGeneration Hook
Updated to use the new API endpoints with proper TypeScript interfaces and comprehensive error handling.

### API Configuration
All endpoints updated to point to the new SOW generation API while maintaining backward compatibility.

## 🎉 Result

**The frontend SOW generation system is now fully connected to the backend with:**
- ✅ Complete API integration
- ✅ Database tracking and status monitoring  
- ✅ File upload and processing
- ✅ Error handling and recovery
- ✅ Field inspection workflow integration
- ✅ TypeScript type safety throughout
- ✅ Production-ready configuration

**The system is ready for immediate use and testing!**
