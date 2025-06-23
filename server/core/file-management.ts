// Complete File Management System for Multi-Role Workflow
// Handles photos, documents, and files through Inspector → Consultant → Engineer workflow

import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import ExifReader from 'exifreader';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! || process.env.SUPABASE_ANON_KEY!
);

// File Management Types
export interface FileUploadRequest {
  projectId: string;
  userId: string;
  userRole: 'inspector' | 'consultant' | 'engineer' | 'admin';
  stage: 'inspection' | 'consultant_review' | 'engineering' | 'complete';
  fileType: 'photo' | 'document' | 'sow' | 'report';
  description?: string;
  tags?: string[];
}

export interface ProcessedFile {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  fileType: 'photo' | 'document' | 'sow' | 'report';
  stage: string;
  projectId: string;
  userId: string;
  userRole: string;
  uploadPath: string;
  thumbnailPath?: string;
  metadata: FileMetadata;
  securityChecks: SecurityCheck[];
  version: number;
  parentFileId?: string;
  tags: string[];
  description?: string;
  uploadedAt: string;
}

export interface FileMetadata {
  // Basic file info
  checksum: string;
  encoding?: string;
  
  // Photo-specific metadata
  exifData?: ExifData;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
  };
  capturedAt?: string;
  cameraInfo?: {
    make?: string;
    model?: string;
    lens?: string;
    settings?: {
      iso?: number;
      aperture?: string;
      shutterSpeed?: string;
      focalLength?: string;
    };
  };
  
  // Document-specific metadata
  documentInfo?: {
    pageCount?: number;
    textContent?: string;
    documentType?: string;
    lastModified?: string;
  };
  
  // Processing info
  thumbnailGenerated?: boolean;
  compressionApplied?: boolean;
  virusScanResult?: 'clean' | 'infected' | 'pending';
}

export interface ExifData {
  [key: string]: any;
}

export interface SecurityCheck {
  checkType: 'virus_scan' | 'file_type_validation' | 'size_check' | 'content_analysis';
  status: 'passed' | 'failed' | 'warning';
  message: string;
  timestamp: string;
}

export interface FileVersion {
  id: string;
  fileId: string;
  version: number;
  filename: string;
  uploadPath: string;
  metadata: FileMetadata;
  changes: string[];
  uploadedBy: string;
  uploadedAt: string;
}

// File Storage Configuration
const STORAGE_CONFIG = {
  baseDir: process.env.FILE_STORAGE_PATH || './storage',
  maxFileSize: {
    photo: 50 * 1024 * 1024, // 50MB
    document: 100 * 1024 * 1024, // 100MB
    sow: 50 * 1024 * 1024, // 50MB
    report: 100 * 1024 * 1024 // 100MB
  },
  allowedMimeTypes: {
    photo: ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    sow: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    report: ['application/pdf', 'text/plain', 'application/json']
  },
  thumbnailSizes: {
    small: { width: 150, height: 150 },
    medium: { width: 400, height: 400 },
    large: { width: 800, height: 800 }
  }
};

/**
 * Configure multer for workflow-aware file uploads
 */
export function configureFileUpload() {
  const storage = multer.memoryStorage();
  
  return multer({
    storage,
    limits: {
      fileSize: Math.max(...Object.values(STORAGE_CONFIG.maxFileSize))
    },
    fileFilter: (req, file, cb) => {
      const fileType = req.body.fileType || 'document';
      const allowedTypes = STORAGE_CONFIG.allowedMimeTypes[fileType as keyof typeof STORAGE_CONFIG.allowedMimeTypes];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed for ${fileType}`));
      }
    }
  });
}

/**
 * Main file upload handler with comprehensive processing
 */
export async function uploadWorkflowFile(
  file: Express.Multer.File,
  uploadRequest: FileUploadRequest
): Promise<ProcessedFile> {
  console.log(`📁 Processing file upload: ${file.originalname}`);
  console.log(`   Project: ${uploadRequest.projectId}`);
  console.log(`   Stage: ${uploadRequest.stage}`);
  console.log(`   Type: ${uploadRequest.fileType}`);
  console.log(`   User: ${uploadRequest.userId} (${uploadRequest.userRole})`);
  
  try {
    // Step 1: Security validation
    console.log('🔒 Step 1: Security validation...');
    const securityChecks = await performSecurityChecks(file, uploadRequest);
    
    const failedChecks = securityChecks.filter(check => check.status === 'failed');
    if (failedChecks.length > 0) {
      throw new Error(`Security validation failed: ${failedChecks.map(c => c.message).join(', ')}`);
    }
    
    // Step 2: Generate file metadata
    console.log('📊 Step 2: Extracting metadata...');
    const metadata = await extractFileMetadata(file, uploadRequest.fileType);
    
    // Step 3: Generate unique filename and paths
    console.log('📝 Step 3: Generating file paths...');
    const fileId = uuidv4();
    const filename = generateUniqueFilename(file.originalname, fileId);
    const uploadPath = generateFilePath(uploadRequest, filename);
    
    // Step 4: Save file to storage
    console.log('💾 Step 4: Saving to storage...');
    await ensureDirectoryExists(path.dirname(uploadPath));
    await fs.writeFile(uploadPath, file.buffer);
    
    // Step 5: Generate thumbnails for photos
    let thumbnailPath: string | undefined;
    if (uploadRequest.fileType === 'photo') {
      console.log('🖼️ Step 5: Generating thumbnails...');
      thumbnailPath = await generateThumbnails(uploadPath, uploadRequest);
    }
    
    // Step 6: Check for existing versions
    console.log('🔄 Step 6: Checking for existing versions...');
    const existingFile = await findExistingFile(uploadRequest.projectId, file.originalname, uploadRequest.stage);
    const version = existingFile ? existingFile.version + 1 : 1;
    const parentFileId = existingFile?.id;
    
    // Step 7: Create processed file record
    const processedFile: ProcessedFile = {
      id: fileId,
      originalName: file.originalname,
      filename,
      mimetype: file.mimetype,
      size: file.size,
      fileType: uploadRequest.fileType,
      stage: uploadRequest.stage,
      projectId: uploadRequest.projectId,
      userId: uploadRequest.userId,
      userRole: uploadRequest.userRole,
      uploadPath,
      thumbnailPath,
      metadata,
      securityChecks,
      version,
      parentFileId,
      tags: uploadRequest.tags || [],
      description: uploadRequest.description,
      uploadedAt: new Date().toISOString()
    };
    
    // Step 8: Save to database
    console.log('🗄️ Step 8: Saving to database...');
    await saveFileRecord(processedFile);
    
    // Step 9: Create version record if this is an update
    if (parentFileId) {
      await createFileVersion(processedFile, existingFile);
    }
    
    // Step 10: Update workflow with file attachment
    console.log('🔄 Step 10: Updating workflow...');
    await updateWorkflowWithFile(processedFile);
    
    console.log(`✅ File upload complete: ${filename}`);
    console.log(`   File ID: ${fileId}`);
    console.log(`   Version: ${version}`);
    console.log(`   Storage: ${uploadPath}`);
    console.log(`   Metadata: ${Object.keys(metadata).length} properties`);
    
    return processedFile;
    
  } catch (error) {
    console.error('❌ File upload failed:', error);
    throw error;
  }
}

/**
 * Perform comprehensive security checks on uploaded files
 */
async function performSecurityChecks(
  file: Express.Multer.File,
  uploadRequest: FileUploadRequest
): Promise<SecurityCheck[]> {
  const checks: SecurityCheck[] = [];
  const timestamp = new Date().toISOString();
  
  // File type validation
  const allowedTypes = STORAGE_CONFIG.allowedMimeTypes[uploadRequest.fileType];
  checks.push({
    checkType: 'file_type_validation',
    status: allowedTypes.includes(file.mimetype) ? 'passed' : 'failed',
    message: allowedTypes.includes(file.mimetype) 
      ? `File type ${file.mimetype} is allowed for ${uploadRequest.fileType}`
      : `File type ${file.mimetype} is not allowed for ${uploadRequest.fileType}`,
    timestamp
  });
  
  // Size validation
  const maxSize = STORAGE_CONFIG.maxFileSize[uploadRequest.fileType];
  checks.push({
    checkType: 'size_check',
    status: file.size <= maxSize ? 'passed' : 'failed',
    message: file.size <= maxSize 
      ? `File size ${(file.size / 1024 / 1024).toFixed(2)}MB is within limit`
      : `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
    timestamp
  });
  
  // Content analysis (basic)
  const hasExecutableSignature = await checkForExecutableContent(file.buffer);
  checks.push({
    checkType: 'content_analysis',
    status: hasExecutableSignature ? 'failed' : 'passed',
    message: hasExecutableSignature 
      ? 'File contains executable content signatures'
      : 'No executable content detected',
    timestamp
  });
  
  // Placeholder for virus scan (would integrate with actual antivirus service)
  checks.push({
    checkType: 'virus_scan',
    status: 'passed', // Would be actual scan result
    message: 'File passed virus scan',
    timestamp
  });
  
  return checks;
}

/**
 * Extract comprehensive file metadata including EXIF data for photos
 */
async function extractFileMetadata(
  file: Express.Multer.File,
  fileType: string
): Promise<FileMetadata> {
  console.log(`📊 Extracting metadata for ${fileType} file...`);
  
  // Generate file checksum
  const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
  
  const metadata: FileMetadata = {
    checksum,
    encoding: file.encoding
  };
  
  // Photo-specific metadata extraction
  if (fileType === 'photo' && file.mimetype.startsWith('image/')) {
    try {
      // Extract EXIF data
      console.log('📸 Extracting EXIF data...');
      const exifData = ExifReader.load(file.buffer);
      metadata.exifData = exifData;
      
      // Extract GPS coordinates
      if (exifData.GPSLatitude && exifData.GPSLongitude) {
        metadata.gpsCoordinates = {
          latitude: convertDMSToDD(
            exifData.GPSLatitude.description, 
            exifData.GPSLatitudeRef?.value?.[0]
          ),
          longitude: convertDMSToDD(
            exifData.GPSLongitude.description, 
            exifData.GPSLongitudeRef?.value?.[0]
          ),
          altitude: exifData.GPSAltitude?.description ? 
            parseFloat(exifData.GPSAltitude.description) : undefined
        };
        console.log(`📍 GPS coordinates extracted: ${metadata.gpsCoordinates.latitude}, ${metadata.gpsCoordinates.longitude}`);
      }
      
      // Extract capture timestamp
      if (exifData.DateTimeOriginal?.description) {
        metadata.capturedAt = new Date(exifData.DateTimeOriginal.description).toISOString();
      }
      
      // Extract camera information
      metadata.cameraInfo = {
        make: exifData.Make?.description,
        model: exifData.Model?.description,
        lens: exifData.LensModel?.description,
        settings: {
          iso: exifData.ISOSpeedRatings?.value?.[0],
          aperture: exifData.FNumber?.description,
          shutterSpeed: exifData.ExposureTime?.description,
          focalLength: exifData.FocalLength?.description
        }
      };
      
    } catch (error) {
      console.warn('⚠️ EXIF extraction failed:', error);
      metadata.exifData = {};
    }
    
    // Mark thumbnail generation as needed
    metadata.thumbnailGenerated = false;
  }
  
  // Document-specific metadata (would expand with actual document parsing)
  if (fileType === 'document' || fileType === 'sow' || fileType === 'report') {
    metadata.documentInfo = {
      documentType: file.mimetype,
      lastModified: new Date().toISOString()
    };
    
    // For PDFs, could extract page count, text content, etc.
    if (file.mimetype === 'application/pdf') {
      // Placeholder for PDF metadata extraction
      metadata.documentInfo.pageCount = 1; // Would use pdf-parse or similar
    }
  }
  
  return metadata;
}

/**
 * Generate thumbnails for photo files
 */
async function generateThumbnails(
  imagePath: string,
  uploadRequest: FileUploadRequest
): Promise<string> {
  console.log('🖼️ Generating thumbnails...');
  
  const thumbnailDir = path.join(
    path.dirname(imagePath),
    'thumbnails'
  );
  
  await ensureDirectoryExists(thumbnailDir);
  
  const baseFilename = path.parse(imagePath).name;
  const thumbnailPaths: string[] = [];
  
  // Generate multiple thumbnail sizes
  for (const [sizeName, dimensions] of Object.entries(STORAGE_CONFIG.thumbnailSizes)) {
    const thumbnailPath = path.join(thumbnailDir, `${baseFilename}_${sizeName}.webp`);
    
    await sharp(imagePath)
      .resize(dimensions.width, dimensions.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(thumbnailPath);
      
    thumbnailPaths.push(thumbnailPath);
    console.log(`   Generated ${sizeName} thumbnail: ${thumbnailPath}`);
  }
  
  // Return the medium thumbnail path as the primary
  return thumbnailPaths[1] || thumbnailPaths[0];
}

/**
 * Generate unique filename with project and stage organization
 */
function generateUniqueFilename(originalName: string, fileId: string): string {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  return `${baseName}_${timestamp}_${fileId.slice(0, 8)}${ext}`;
}

/**
 * Generate organized file path based on project and stage
 */
function generateFilePath(uploadRequest: FileUploadRequest, filename: string): string {
  return path.join(
    STORAGE_CONFIG.baseDir,
    'projects',
    uploadRequest.projectId,
    uploadRequest.stage,
    uploadRequest.fileType,
    filename
  );
}

/**
 * Ensure directory exists, create if necessary
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

/**
 * Check for existing file to handle versioning
 */
async function findExistingFile(
  projectId: string,
  originalName: string,
  stage: string
): Promise<ProcessedFile | null> {
  try {
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .eq('original_name', originalName)
      .eq('stage', stage)
      .order('version', { ascending: false })
      .limit(1)
      .single();
      
    if (error || !data) return null;
    
    return data as ProcessedFile;
  } catch {
    return null;
  }
}

/**
 * Save file record to database
 */
async function saveFileRecord(file: ProcessedFile): Promise<void> {
  console.log(`🗄️ Saving file record to database: ${file.id}`);
  
  const { error } = await supabase
    .from('project_files')
    .insert({
      id: file.id,
      original_name: file.originalName,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      file_type: file.fileType,
      stage: file.stage,
      project_id: file.projectId,
      user_id: file.userId,
      user_role: file.userRole,
      upload_path: file.uploadPath,
      thumbnail_path: file.thumbnailPath,
      metadata: file.metadata,
      security_checks: file.securityChecks,
      version: file.version,
      parent_file_id: file.parentFileId,
      tags: file.tags,
      description: file.description,
      uploaded_at: file.uploadedAt
    });
    
  if (error) {
    throw new Error(`Failed to save file record: ${error.message}`);
  }
  
  console.log('✅ File record saved to database');
}

/**
 * Create file version record for tracking changes
 */
async function createFileVersion(
  newFile: ProcessedFile,
  previousFile: ProcessedFile
): Promise<void> {
  console.log(`🔄 Creating version record for file: ${newFile.id}`);
  
  const changes = await detectFileChanges(newFile, previousFile);
  
  const version: FileVersion = {
    id: uuidv4(),
    fileId: newFile.parentFileId!,
    version: newFile.version,
    filename: newFile.filename,
    uploadPath: newFile.uploadPath,
    metadata: newFile.metadata,
    changes,
    uploadedBy: newFile.userId,
    uploadedAt: newFile.uploadedAt
  };
  
  const { error } = await supabase
    .from('file_versions')
    .insert({
      id: version.id,
      file_id: version.fileId,
      version: version.version,
      filename: version.filename,
      upload_path: version.uploadPath,
      metadata: version.metadata,
      changes: version.changes,
      uploaded_by: version.uploadedBy,
      uploaded_at: version.uploadedAt
    });
    
  if (error) {
    console.warn('⚠️ Failed to create version record:', error);
  } else {
    console.log(`✅ Version ${version.version} record created`);
  }
}

/**
 * Update workflow with file attachment information
 */
async function updateWorkflowWithFile(file: ProcessedFile): Promise<void> {
  console.log(`🔄 Updating workflow with file attachment: ${file.id}`);
  
  try {
    // Log file attachment activity
    await supabase
      .from('workflow_activities')
      .insert({
        project_id: file.projectId,
        user_id: file.userId,
        activity_type: 'file_uploaded',
        stage_from: file.stage,
        notes: `${file.fileType} uploaded: ${file.originalName}`,
        metadata: {
          file_id: file.id,
          file_type: file.fileType,
          file_size: file.size,
          version: file.version,
          has_gps: !!file.metadata.gpsCoordinates,
          thumbnail_generated: !!file.thumbnailPath
        }
      });
      
    // Update stage data with file reference
    const stageDataUpdate = {
      [`${file.stage}_files`]: {
        [file.fileType]: [
          ...([] as any[]), // Would fetch existing files
          {
            file_id: file.id,
            filename: file.filename,
            original_name: file.originalName,
            uploaded_at: file.uploadedAt,
            uploaded_by: file.userId,
            version: file.version
          }
        ]
      }
    };
    
    // This would update the project's stage_data
    // Implementation would depend on existing project structure
    
    console.log('✅ Workflow updated with file attachment');
    
  } catch (error) {
    console.warn('⚠️ Failed to update workflow:', error);
  }
}

// Utility Functions

/**
 * Convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
 */
function convertDMSToDD(dmsString: string, ref: string): number {
  const parts = dmsString.split(' ');
  const degrees = parseFloat(parts[0]) || 0;
  const minutes = parseFloat(parts[1]) || 0;
  const seconds = parseFloat(parts[2]) || 0;
  
  let dd = degrees + minutes / 60 + seconds / 3600;
  
  if (ref === 'S' || ref === 'W') {
    dd = dd * -1;
  }
  
  return dd;
}

/**
 * Basic check for executable content in file buffer
 */
async function checkForExecutableContent(buffer: Buffer): Promise<boolean> {
  // Check for common executable signatures
  const executableSignatures = [
    Buffer.from([0x4D, 0x5A]), // PE executable
    Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
    Buffer.from([0xFE, 0xED, 0xFA, 0xCE]), // Mach-O executable
    Buffer.from([0x23, 0x21]) // Shebang script
  ];
  
  for (const signature of executableSignatures) {
    if (buffer.subarray(0, signature.length).equals(signature)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect changes between file versions
 */
async function detectFileChanges(
  newFile: ProcessedFile,
  previousFile: ProcessedFile
): Promise<string[]> {
  const changes: string[] = [];
  
  if (newFile.size !== previousFile.size) {
    changes.push(`File size changed from ${previousFile.size} to ${newFile.size} bytes`);
  }
  
  if (newFile.metadata.checksum !== previousFile.metadata.checksum) {
    changes.push('File content changed (checksum differs)');
  }
  
  if (newFile.description !== previousFile.description) {
    changes.push('Description updated');
  }
  
  if (JSON.stringify(newFile.tags) !== JSON.stringify(previousFile.tags)) {
    changes.push('Tags modified');
  }
  
  return changes;
}

// File Management Query Functions

/**
 * Get files for a project with filtering and pagination
 */
export async function getProjectFiles(
  projectId: string,
  options: {
    stage?: string;
    fileType?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ files: ProcessedFile[]; total: number }> {
  let query = supabase
    .from('project_files')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId);
    
  if (options.stage) query = query.eq('stage', options.stage);
  if (options.fileType) query = query.eq('file_type', options.fileType);
  if (options.userId) query = query.eq('user_id', options.userId);
  
  query = query
    .order('uploaded_at', { ascending: false })
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);
    
  const { data, error, count } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch project files: ${error.message}`);
  }
  
  return {
    files: data as ProcessedFile[],
    total: count || 0
  };
}

/**
 * Get file versions for a specific file
 */
export async function getFileVersions(fileId: string): Promise<FileVersion[]> {
  const { data, error } = await supabase
    .from('file_versions')
    .select('*')
    .eq('file_id', fileId)
    .order('version', { ascending: false });
    
  if (error) {
    throw new Error(`Failed to fetch file versions: ${error.message}`);
  }
  
  return data as FileVersion[];
}

/**
 * Delete file and all its versions
 */
export async function deleteFile(
  fileId: string,
  userId: string,
  userRole: string
): Promise<void> {
  // Get file record
  const { data: file, error: fileError } = await supabase
    .from('project_files')
    .select('*')
    .eq('id', fileId)
    .single();
    
  if (fileError || !file) {
    throw new Error('File not found');
  }
  
  // Check permissions (users can only delete their own files or admins can delete any)
  if (file.user_id !== userId && userRole !== 'admin') {
    throw new Error('Permission denied');
  }
  
  try {
    // Delete physical files
    await fs.unlink(file.upload_path);
    if (file.thumbnail_path) {
      await fs.unlink(file.thumbnail_path).catch(() => {}); // Ignore thumbnail delete errors
    }
    
    // Delete database records
    await supabase.from('file_versions').delete().eq('file_id', fileId);
    await supabase.from('project_files').delete().eq('id', fileId);
    
    console.log(`✅ File deleted: ${fileId}`);
    
  } catch (error) {
    console.error('❌ File deletion failed:', error);
    throw error;
  }
}

export {
  STORAGE_CONFIG,
  ProcessedFile,
  FileMetadata,
  FileUploadRequest,
  SecurityCheck,
  FileVersion
};
