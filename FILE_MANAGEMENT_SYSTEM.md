# Complete File Management System Integration

## Overview

The roof-sow-genesis system now includes a comprehensive file management system that handles photos, documents, and files through the multi-role workflow (Inspector → Consultant → Engineer). This system provides advanced features including GPS extraction, EXIF analysis, thumbnail generation, document versioning, security validation, and cloud storage integration.

## 🚀 Key Features

### 📸 Advanced Photo Processing
- **GPS Coordinate Extraction**: Automatically extracts location data from photo EXIF data
- **EXIF Metadata Preservation**: Maintains camera settings, timestamps, and technical details
- **Automatic Thumbnail Generation**: Creates multiple sized thumbnails (small, medium, large) in WebP format
- **Image Analysis**: Analyzes dimensions, color space, compression, and technical properties

### 📄 Document Management
- **Version Control**: Complete versioning system with change tracking and audit trails
- **Document Metadata**: Extracts document properties including page count, author, title
- **Content Analysis**: Basic text extraction and document type detection
- **Format Support**: PDFs, Word documents, Excel spreadsheets, text files, CSV, JSON

### 🔒 Security & Validation
- **Multi-layer Security Checks**: File type validation, content analysis, size verification
- **MIME Type Detection**: Validates actual file type vs declared type
- **Content Scanning**: Detects executable content and suspicious patterns
- **Virus Scanning**: Placeholder for integration with antivirus services
- **Role-based Access Control**: Stage-specific file organization with permission controls

### ☁️ Storage Options
- **Hybrid Storage**: Supports both local storage and Supabase Cloud Storage
- **Automatic Cloud Sync**: Files can be automatically backed up to cloud storage
- **CDN Integration**: Cloud-stored files served via CDN for optimal performance
- **Deduplication**: Intelligent duplicate detection using checksums and heuristics

### 🔄 Workflow Integration
- **Stage-based Organization**: Files organized by workflow stage (inspection, consultant_review, engineering, complete)
- **Role-specific Access**: Inspectors, consultants, and engineers can only access appropriate files
- **Handoff Validation**: Required files can be validated during workflow handoffs
- **Activity Tracking**: All file operations tracked in workflow activity logs

## 📋 API Endpoints

### File Upload
```
POST /api/files/upload
```
Upload a single file to a project workflow stage.

**Body (multipart/form-data):**
- `file`: The file to upload
- `project_id`: Project UUID
- `stage`: Workflow stage ('inspection', 'consultant_review', 'engineering', 'complete')
- `file_type`: Type of file ('photo', 'document', 'sow', 'report')
- `description`: Optional description
- `tags`: Optional comma-separated tags

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "uuid",
    "filename": "processed_filename.jpg",
    "originalName": "original_name.jpg",
    "fileType": "photo",
    "stage": "inspection",
    "size": 2048576,
    "version": 1,
    "hasGPS": true,
    "hasThumbnail": true,
    "uploadedAt": "2025-06-23T22:00:00Z"
  },
  "metadata": {
    "checksum": "sha256_hash",
    "gpsCoordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "securityPassed": true
  }
}
```

### Batch Upload
```
POST /api/files/upload-batch
```
Upload multiple files at once (max 10 files).

### Get Project Files
```
GET /api/files/project/:projectId
```
Get all files for a project with filtering options.

**Query Parameters:**
- `stage`: Filter by workflow stage
- `file_type`: Filter by file type
- `user_id`: Filter by uploader
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset

### File Details
```
GET /api/files/:fileId
```
Get detailed information about a specific file.

### Download File
```
GET /api/files/:fileId/download
```
Download the original file.

### Get Thumbnail
```
GET /api/files/:fileId/thumbnail?size=medium
```
Get photo thumbnail (sizes: small, medium, large).

### File Versions
```
GET /api/files/:fileId/versions
```
Get version history for a file.

### Update File Metadata
```
PATCH /api/files/:fileId
```
Update file description and tags.

### Delete File
```
DELETE /api/files/:fileId
```
Delete file and all versions (permission required).

### File Statistics
```
GET /api/files/stats/project/:projectId
```
Get file statistics for a project.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalFiles": 25,
    "totalSize": 52428800,
    "byType": {
      "photo": 15,
      "document": 8,
      "sow": 1,
      "report": 1
    },
    "byStage": {
      "inspection": 15,
      "consultant_review": 5,
      "engineering": 4,
      "complete": 1
    }
  }
}
```

### Configuration
```
GET /api/files/config
```
Get file management system configuration.

## 🛠 Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install
# New dependencies: sharp, exifreader, uuid, mime-types, file-type
```

### 2. Database Migration
Run the SQL migration to create file management tables:
```bash
# Apply the migration in Supabase dashboard or via CLI
supabase db push
```

### 3. Environment Configuration
Copy the environment template and configure:
```bash
cp .env.example .env
```

Key environment variables:
```env
# Storage configuration
USE_SUPABASE_STORAGE=false  # true for cloud, false for local
FILE_STORAGE_PATH=./storage
SUPABASE_STORAGE_BUCKET=roof-sow-files

# File processing
AUTO_GENERATE_THUMBNAILS=true
PRESERVE_EXIF_DATA=true
MAX_IMAGE_DIMENSION=4096
```

### 4. Storage Setup

#### Local Storage (Default)
Files stored in `./storage` directory with organized structure:
```
storage/
├── projects/
│   ├── project-uuid-1/
│   │   ├── inspection/
│   │   │   ├── photo/
│   │   │   └── document/
│   │   ├── consultant_review/
│   │   └── engineering/
│   └── project-uuid-2/
└── thumbnails/
```

#### Cloud Storage (Supabase)
1. Create storage bucket in Supabase dashboard
2. Set `USE_SUPABASE_STORAGE=true`
3. Configure bucket policies for authenticated access

### 5. Start Server
```bash
npm run dev
```

## 📊 Database Schema

### project_files Table
```sql
CREATE TABLE project_files (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    user_id UUID REFERENCES user_profiles(id),
    user_role user_role_enum,
    original_name TEXT,
    filename TEXT,
    mimetype TEXT,
    size BIGINT,
    file_type file_type_enum,
    stage workflow_stage_enum,
    upload_path TEXT,
    cloud_path TEXT,
    thumbnail_path TEXT,
    cloud_thumbnail_path TEXT,
    metadata JSONB,
    security_checks JSONB,
    version INTEGER DEFAULT 1,
    parent_file_id UUID REFERENCES project_files(id),
    tags TEXT[],
    description TEXT,
    is_cloud_stored BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### file_versions Table
```sql
CREATE TABLE file_versions (
    id UUID PRIMARY KEY,
    file_id UUID REFERENCES project_files(id),
    version INTEGER,
    filename TEXT,
    upload_path TEXT,
    cloud_path TEXT,
    metadata JSONB,
    changes TEXT[],
    uploaded_by UUID REFERENCES user_profiles(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 File Processing Pipeline

### 1. Upload Validation
- Security checks (file type, size, content analysis)
- MIME type validation
- Malware scanning (placeholder)

### 2. Metadata Extraction
- **Photos**: EXIF data, GPS coordinates, camera info
- **Documents**: Page count, author, title, creation date
- **All Files**: Checksum, file type detection

### 3. Processing
- **Photos**: Thumbnail generation, image optimization
- **Documents**: Text extraction (future), preview generation
- **Versioning**: Duplicate detection, version management

### 4. Storage
- Save to local or cloud storage
- Database record creation
- Activity logging

### 5. Background Tasks
- Additional thumbnail sizes
- Cloud synchronization
- Search indexing
- Cleanup operations

## 🚦 Usage Examples

### Frontend Integration
```typescript
// Upload file with metadata
const formData = new FormData();
formData.append('file', selectedFile);
formData.append('project_id', projectId);
formData.append('stage', 'inspection');
formData.append('file_type', 'photo');
formData.append('description', 'Roof condition photo');
formData.append('tags', 'damage,leak,priority');

const response = await fetch('/api/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
```

### Get Files with GPS
```typescript
const response = await fetch(`/api/files/project/${projectId}?hasGPS=true`);
const { files } = await response.json();

// Display on map
files.forEach(file => {
  if (file.metadata.gpsCoordinates) {
    addMapMarker(
      file.metadata.gpsCoordinates.latitude,
      file.metadata.gpsCoordinates.longitude,
      file.originalName
    );
  }
});
```

### Display Thumbnails
```typescript
// Get thumbnail URL
const thumbnailUrl = `/api/files/${fileId}/thumbnail?size=medium`;

// React component
<img 
  src={thumbnailUrl} 
  alt={file.originalName}
  className="w-32 h-32 object-cover rounded"
/>
```

## 📈 Performance Considerations

### Optimization
- Thumbnail generation uses WebP format for optimal size
- Database indexes on common query patterns
- Materialized views for statistics
- Background processing for non-critical tasks

### Scaling
- Horizontal scaling via cloud storage
- CDN integration for global file delivery
- Database connection pooling
- File compression and optimization

### Monitoring
- File operation tracking in workflow activities
- Storage usage monitoring
- Performance metrics collection
- Error logging and alerting

## 🔐 Security Features

### Access Control
- Row Level Security (RLS) policies
- Role-based file access
- Project-based isolation
- Admin override capabilities

### File Validation
- Multi-layer security checks
- Content analysis for malicious files
- File type verification
- Size limit enforcement

### Data Protection
- Encrypted storage (when using cloud)
- Secure file URLs
- EXIF data preservation/stripping options
- Audit trail for all operations

## 🧪 Testing

### Test File Upload
```bash
# Test basic upload
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-image.jpg" \
  -F "project_id=$PROJECT_ID" \
  -F "stage=inspection" \
  -F "file_type=photo" \
  http://localhost:3001/api/files/upload

# Test system health
curl http://localhost:3001/api/test/file-management
```

### Verify GPS Extraction
Upload a photo with GPS data and verify the coordinates are extracted correctly in the response metadata.

## 🚀 Next Steps

The file management system is now fully integrated and operational. Key integration points:

1. **Workflow Integration**: Files are automatically organized by project stage
2. **SOW Generation**: Files can be referenced and included in SOW documents
3. **Role-based Access**: Users only see files from projects they're assigned to
4. **Version Control**: Complete audit trail for document changes
5. **Cloud Ready**: Hybrid storage system supports scaling

The system provides a solid foundation for managing files throughout the roofing project lifecycle while maintaining security, performance, and ease of use.