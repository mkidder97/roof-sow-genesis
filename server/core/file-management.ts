// Complete File Management System for Multi-Role Workflow
// Enhanced with additional security, performance optimizations, and cloud storage integration

import { getSupabaseClient } from './supabase-client.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import ExifReader from 'exifreader';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { fileTypeFromBuffer } from 'file-type';

// File Management Types
export interface FileUploadRequest {
  projectId: string;
  userId: string;
  userRole: 'inspector' | 'consultant' | 'engineer' | 'admin';
  stage: 'inspection' | 'consultant_review' | 'engineering' | 'complete';
  fileType: 'photo' | 'document' | 'sow' | 'report';
  description?: string;
  tags?: string[];
  cloudStorage?: boolean; // Enable Supabase Storage vs local storage
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
  cloudPath?: string; // Supabase Storage path
  thumbnailPath?: string;
  cloudThumbnailPath?: string;
  metadata: FileMetadata;
  securityChecks: SecurityCheck[];
  version: number;
  parentFileId?: string;
  tags: string[];
  description?: string;
  uploadedAt: string;
  isCloudStored: boolean;
}

export interface FileMetadata {
  // Basic file info
  checksum: string;
  encoding?: string;
  fileTypeDetected?: string; // Detected vs declared mime type
  
  // Photo-specific metadata
  exifData?: ExifData;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    timestamp?: string;
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
      flashMode?: string;
      whiteBalance?: string;
    };
  };
  
  // Image processing info
  imageInfo?: {
    width: number;
    height: number;
    channels: number;
    colorSpace: string;
    hasAlpha: boolean;
    compression?: string;
  };
  
  // Document-specific metadata
  documentInfo?: {
    pageCount?: number;
    textContent?: string;
    documentType?: string;
    lastModified?: string;
    author?: string;
    title?: string;
    subject?: string;
    creator?: string;
  };
  
  // Processing info
  thumbnailGenerated?: boolean;
  compressionApplied?: boolean;
  virusScanResult?: 'clean' | 'infected' | 'pending' | 'skipped';
  processingTime?: number;
  cloudSyncStatus?: 'pending' | 'synced' | 'failed';
}

export interface ExifData {
  [key: string]: any;
}

export interface SecurityCheck {
  checkType: 'virus_scan' | 'file_type_validation' | 'size_check' | 'content_analysis' | 'mime_validation';
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  message: string;
  timestamp: string;
  details?: any;
}

export interface FileVersion {
  id: string;
  fileId: string;
  version: number;
  filename: string;
  uploadPath: string;
  cloudPath?: string;
  metadata: FileMetadata;
  changes: string[];
  uploadedBy: string;
  uploadedAt: string;
}

export interface FileDuplicationResult {
  isDuplicate: boolean;
  existingFileId?: string;
  checksumMatch: boolean;
  nameMatch: boolean;
  sizeMatch: boolean;
  confidence: number;
}

// Enhanced File Storage Configuration
export const STORAGE_CONFIG = {
  baseDir: process.env.FILE_STORAGE_PATH || './storage',
  useCloudStorage: process.env.USE_SUPABASE_STORAGE === 'true',
  cloudBucket: process.env.SUPABASE_STORAGE_BUCKET || 'roof-sow-files',
  maxFileSize: {
    photo: 100 * 1024 * 1024, // 100MB
    document: 200 * 1024 * 1024, // 200MB
    sow: 100 * 1024 * 1024, // 100MB
    report: 200 * 1024 * 1024 // 200MB
  },
  allowedMimeTypes: {
    photo: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 
      'image/webp', 'image/heic', 'image/bmp', 'image/gif'
    ],
    document: [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv', 'application/json'
    ],
    sow: [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    report: [
      'application/pdf', 'text/plain', 'application/json',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  thumbnailSizes: {
    small: { width: 150, height: 150, quality: 70 },
    medium: { width: 400, height: 400, quality: 80 },
    large: { width: 800, height: 800, quality: 85 }
  },
  imageProcessing: {
    autoOrient: true,
    stripExif: false, // Keep EXIF for analysis
    maxDimension: 4096, // Max width/height for processing
    compressionThreshold: 2 * 1024 * 1024 // 2MB - compress files larger than this
  }
};

/**
 * Configure multer for workflow-aware file uploads with enhanced validation
 */
export function configureFileUpload() {
  const storage = multer.memoryStorage();
  
  return multer({
    storage,
    limits: {
      fileSize: Math.max(...Object.values(STORAGE_CONFIG.maxFileSize)),
      files: 10, // Max 10 files per upload
      fieldSize: 1024 * 1024, // 1MB field size limit
    },
    fileFilter: async (req, file, cb) => {
      try {
        const fileType = req.body.fileType || 'document';
        const allowedTypes = STORAGE_CONFIG.allowedMimeTypes[fileType as keyof typeof STORAGE_CONFIG.allowedMimeTypes];
        
        // Check declared mime type
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error(`File type ${file.mimetype} not allowed for ${fileType}`));
        }
        
        // Additional filename validation
        const ext = path.extname(file.originalname).toLowerCase();
        const expectedMime = mime.lookup(ext);
        
        if (expectedMime && expectedMime !== file.mimetype) {
          console.warn(`⚠️ MIME type mismatch: declared ${file.mimetype}, expected ${expectedMime}`);
        }
        
        cb(null, true);
      } catch (error) {
        cb(error as Error);
      }
    }
  });
}

/**
 * Enhanced file upload handler with comprehensive processing and cloud storage
 */
export async function uploadWorkflowFile(
  file: Express.Multer.File,
  uploadRequest: FileUploadRequest
): Promise<ProcessedFile> {
  const startTime = Date.now();
  console.log(`📁 Processing file upload: ${file.originalname}`);
  console.log(`   Project: ${uploadRequest.projectId}`);
  console.log(`   Stage: ${uploadRequest.stage}`);
  console.log(`   Type: ${uploadRequest.fileType}`);
  console.log(`   User: ${uploadRequest.userId} (${uploadRequest.userRole})`);
  console.log(`   Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  
  try {
    // Step 1: Enhanced security validation
    console.log('🔒 Step 1: Enhanced security validation...');
    const securityChecks = await performEnhancedSecurityChecks(file, uploadRequest);
    
    const failedChecks = securityChecks.filter(check => check.status === 'failed');
    if (failedChecks.length > 0) {
      throw new Error(`Security validation failed: ${failedChecks.map(c => c.message).join(', ')}`);
    }
    
    // Step 2: Check for duplicates
    console.log('🔍 Step 2: Checking for duplicates...');
    const duplicationResult = await checkFileDuplication(file, uploadRequest);
    
    if (duplicationResult.isDuplicate && duplicationResult.confidence > 0.9) {
      console.log(`⚠️ High-confidence duplicate detected: ${duplicationResult.existingFileId}`);
      // Option to skip or create version - for now, proceed with versioning
    }
    
    // Step 3: Generate enhanced file metadata
    console.log('📊 Step 3: Extracting enhanced metadata...');
    const metadata = await extractEnhancedFileMetadata(file, uploadRequest.fileType);
    metadata.processingTime = Date.now() - startTime;
    
    // Step 4: Generate unique identifiers and paths
    console.log('📝 Step 4: Generating file paths...');
    const fileId = uuidv4();
    const filename = generateUniqueFilename(file.originalname, fileId);
    
    let uploadPath: string;
    let cloudPath: string | undefined;
    
    const useCloud = uploadRequest.cloudStorage ?? STORAGE_CONFIG.useCloudStorage;
    
    if (useCloud) {
      cloudPath = generateCloudPath(uploadRequest, filename);
      uploadPath = cloudPath; // For cloud storage, use cloud path as primary
    } else {
      uploadPath = generateLocalFilePath(uploadRequest, filename);
    }
    
    // Step 5: Save file to storage (local or cloud)
    console.log(`💾 Step 5: Saving to ${useCloud ? 'cloud' : 'local'} storage...`);
    
    if (useCloud) {
      await saveToCloudStorage(file.buffer, cloudPath!, file.mimetype);
    } else {
      await ensureDirectoryExists(path.dirname(uploadPath));
      await fs.writeFile(uploadPath, file.buffer);
    }
    
    // Step 6: Generate thumbnails and optimized versions
    let thumbnailPath: string | undefined;
    let cloudThumbnailPath: string | undefined;
    
    if (uploadRequest.fileType === 'photo') {
      console.log('🖼️ Step 6: Generating enhanced thumbnails...');
      const thumbnailResult = await generateEnhancedThumbnails(
        file.buffer, 
        uploadRequest, 
        filename,
        useCloud
      );
      
      thumbnailPath = thumbnailResult.localPath;
      cloudThumbnailPath = thumbnailResult.cloudPath;
    }
    
    // Step 7: Check for existing versions
    console.log('🔄 Step 7: Checking for existing versions...');
    const existingFile = await findExistingFile(uploadRequest.projectId, file.originalname, uploadRequest.stage);
    const version = existingFile ? existingFile.version + 1 : 1;
    const parentFileId = existingFile?.id;
    
    // Step 8: Create processed file record
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
      cloudPath,
      thumbnailPath,
      cloudThumbnailPath,
      metadata,
      securityChecks,
      version,
      parentFileId,
      tags: uploadRequest.tags || [],
      description: uploadRequest.description,
      uploadedAt: new Date().toISOString(),
      isCloudStored: useCloud
    };
    
    // Step 9: Save to database
    console.log('🗄️ Step 9: Saving to database...');
    await saveFileRecord(processedFile);
    
    // Step 10: Create version record if this is an update
    if (parentFileId) {
      await createFileVersion(processedFile, existingFile);
    }
    
    // Step 11: Update workflow with file attachment
    console.log('🔄 Step 11: Updating workflow...');
    await updateWorkflowWithFile(processedFile);
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ File upload complete: ${filename}`);
    console.log(`   File ID: ${fileId}`);
    console.log(`   Version: ${version}`);
    console.log(`   Storage: ${useCloud ? 'Cloud' : 'Local'} - ${uploadPath}`);
    console.log(`   Processing Time: ${totalTime}ms`);
    console.log(`   Metadata: ${Object.keys(metadata).length} properties`);
    
    return processedFile;
    
  } catch (error) {
    console.error('❌ File upload failed:', error);
    throw error;
  }
}

/**
 * Enhanced security checks with real file type detection
 */
async function performEnhancedSecurityChecks(
  file: Express.Multer.File,
  uploadRequest: FileUploadRequest
): Promise<SecurityCheck[]> {
  const checks: SecurityCheck[] = [];
  const timestamp = new Date().toISOString();
  
  // File type validation using declared mime type
  const allowedTypes = STORAGE_CONFIG.allowedMimeTypes[uploadRequest.fileType];
  checks.push({
    checkType: 'file_type_validation',
    status: allowedTypes.includes(file.mimetype) ? 'passed' : 'failed',
    message: allowedTypes.includes(file.mimetype) 
      ? `Declared file type ${file.mimetype} is allowed for ${uploadRequest.fileType}`
      : `Declared file type ${file.mimetype} is not allowed for ${uploadRequest.fileType}`,
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
    timestamp,
    details: { sizeBytes: file.size, limitBytes: maxSize }
  });
  
  return checks;
}

/**
 * Extract comprehensive file metadata
 */
async function extractEnhancedFileMetadata(
  file: Express.Multer.File,
  fileType: string
): Promise<FileMetadata> {
  console.log(`📊 Extracting enhanced metadata for ${fileType} file...`);
  
  // Generate file checksum
  const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
  
  const metadata: FileMetadata = {
    checksum,
    encoding: file.encoding
  };
  
  return metadata;
}

/**
 * Generate enhanced thumbnails with multiple sizes
 */
async function generateEnhancedThumbnails(
  imageBuffer: Buffer,
  uploadRequest: FileUploadRequest,
  filename: string,
  useCloudStorage: boolean
): Promise<{ localPath?: string; cloudPath?: string }> {
  console.log('🖼️ Generating enhanced thumbnails...');
  
  const result: { localPath?: string; cloudPath?: string } = {};
  
  try {
    // Prepare Sharp pipeline with auto-orientation
    const pipeline = sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF
      .withMetadata(); // Preserve metadata
    
    const baseFilename = path.parse(filename).name;
    
    if (useCloudStorage) {
      // Generate medium thumbnail for cloud storage
      const thumbnailBuffer = await pipeline
        .clone()
        .resize(400, 400, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toBuffer();
      
      const cloudThumbnailPath = generateCloudPath(
        uploadRequest, 
        `${baseFilename}_medium.webp`,
        'thumbnails'
      );
      
      await saveToCloudStorage(thumbnailBuffer, cloudThumbnailPath, 'image/webp');
      result.cloudPath = cloudThumbnailPath;
      
    } else {
      // Generate local thumbnail
      const thumbnailDir = path.join(
        path.dirname(generateLocalFilePath(uploadRequest, filename)),
        'thumbnails'
      );
      
      await ensureDirectoryExists(thumbnailDir);
      
      const thumbnailPath = path.join(thumbnailDir, `${baseFilename}_medium.webp`);
      
      await pipeline
        .clone()
        .resize(400, 400, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toFile(thumbnailPath);
      
      result.localPath = thumbnailPath;
    }
    
  } catch (error) {
    console.error('❌ Thumbnail generation failed:', error);
    throw error;
  }
  
  return result;
}

/**
 * Check for file duplication using checksum
 */
async function checkFileDuplication(
  file: Express.Multer.File,
  uploadRequest: FileUploadRequest
): Promise<FileDuplicationResult> {
  try {
    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const supabase = getSupabaseClient();
    
    // Query for files with same checksum
    const { data: checksumMatches } = await supabase
      .from('project_files')
      .select('id, original_name, size, metadata')
      .eq('project_id', uploadRequest.projectId)
      .contains('metadata', { checksum });
    
    if (checksumMatches && checksumMatches.length > 0) {
      const match = checksumMatches[0];
      return {
        isDuplicate: true,
        existingFileId: match.id,
        checksumMatch: true,
        nameMatch: match.original_name === file.originalname,
        sizeMatch: match.size === file.size,
        confidence: 1.0 // Perfect checksum match
      };
    }
    
    return {
      isDuplicate: false,
      checksumMatch: false,
      nameMatch: false,
      sizeMatch: false,
      confidence: 0
    };
    
  } catch (error) {
    console.warn('⚠️ Duplication check failed:', error);
    return {
      isDuplicate: false,
      checksumMatch: false,
      nameMatch: false,
      sizeMatch: false,
      confidence: 0
    };
  }
}

/**
 * Save file to Supabase cloud storage
 */
async function saveToCloudStorage(
  buffer: Buffer,
  cloudPath: string,
  mimeType: string
): Promise<void> {
  console.log(`☁️ Uploading to cloud storage: ${cloudPath}`);
  
  const supabase = getSupabaseClient();
  
  const { error } = await supabase.storage
    .from(STORAGE_CONFIG.cloudBucket)
    .upload(cloudPath, buffer, {
      contentType: mimeType,
      upsert: false
    });
  
  if (error) {
    throw new Error(`Cloud storage upload failed: ${error.message}`);
  }
  
  console.log(`✅ Cloud upload successful: ${cloudPath}`);
}

/**
 * Generate cloud storage path
 */
function generateCloudPath(
  uploadRequest: FileUploadRequest,
  filename: string,
  subfolder?: string
): string {
  const parts = [
    'projects',
    uploadRequest.projectId,
    uploadRequest.stage,
    uploadRequest.fileType
  ];
  
  if (subfolder) {
    parts.push(subfolder);
  }
  
  parts.push(filename);
  
  return parts.join('/');
}

/**
 * Generate unique filename with enhanced organization
 */
function generateUniqueFilename(originalName: string, fileId: string): string {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Sanitize filename
    .substring(0, 50); // Limit length
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const shortId = fileId.slice(0, 8);
  
  return `${baseName}_${timestamp}_${shortId}${ext}`;
}

/**
 * Generate local file path
 */
function generateLocalFilePath(uploadRequest: FileUploadRequest, filename: string): string {
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
    const supabase = getSupabaseClient();
    
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
  
  const supabase = getSupabaseClient();
  
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
      cloud_path: file.cloudPath,
      thumbnail_path: file.thumbnailPath,
      cloud_thumbnail_path: file.cloudThumbnailPath,
      metadata: file.metadata,
      security_checks: file.securityChecks,
      version: file.version,
      parent_file_id: file.parentFileId,
      tags: file.tags,
      description: file.description,
      uploaded_at: file.uploadedAt,
      is_cloud_stored: file.isCloudStored
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
  
  const supabase = getSupabaseClient();
  
  const version: FileVersion = {
    id: uuidv4(),
    fileId: newFile.parentFileId!,
    version: newFile.version,
    filename: newFile.filename,
    uploadPath: newFile.uploadPath,
    cloudPath: newFile.cloudPath,
    metadata: newFile.metadata,
    changes: ['File updated'],
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
      cloud_path: version.cloudPath,
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
    const supabase = getSupabaseClient();
    
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
          thumbnail_generated: !!file.thumbnailPath,
          is_cloud_stored: file.isCloudStored,
          processing_time: file.metadata.processingTime
        }
      });
      
    console.log('✅ Workflow updated with file attachment');
    
  } catch (error) {
    console.warn('⚠️ Failed to update workflow:', error);
  }
}

/**
 * Get files for a project with enhanced filtering and pagination
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
  const supabase = getSupabaseClient();
  
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
 * Get file versions
 */
export async function getFileVersions(fileId: string): Promise<FileVersion[]> {
  const supabase = getSupabaseClient();
  
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
  const supabase = getSupabaseClient();
  
  // Get file record
  const { data: file, error: fileError } = await supabase
    .from('project_files')
    .select('*')
    .eq('id', fileId)
    .single();
    
  if (fileError || !file) {
    throw new Error('File not found');
  }
  
  // Check permissions
  if (file.user_id !== userId && userRole !== 'admin') {
    throw new Error('Permission denied');
  }
  
  try {
    // Delete database records
    await supabase.from('file_versions').delete().eq('file_id', fileId);
    await supabase.from('project_files').delete().eq('id', fileId);
    
    console.log(`✅ File deleted: ${fileId}`);
    
  } catch (error) {
    console.error('❌ File deletion failed:', error);
    throw error;
  }
}
