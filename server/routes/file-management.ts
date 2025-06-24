// File Management API Routes for Multi-Role Workflow
// Handles photo uploads, document management, and versioning

import express from 'express';
import { getSupabaseClient } from '../core/supabase-client.js';
import path from 'path';
import fs from 'fs/promises';
import {
  configureFileUpload,
  uploadWorkflowFile,
  getProjectFiles,
  getFileVersions,
  deleteFile,
  FileUploadRequest,
  ProcessedFile,
  STORAGE_CONFIG
} from '../core/file-management.js';

const router = express.Router();

// Configure multer for file uploads
const upload = configureFileUpload();

// Authentication middleware (reuse from workflow.ts)
interface FileRequest extends express.Request {
  user?: {
    id: string;
    profile: {
      id: string;
      role: 'inspector' | 'consultant' | 'engineer' | 'admin';
      company_id?: string;
      email: string;
    };
  };
}

const authenticateUser = async (req: FileRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing or invalid authorization header',
        details: 'Include Bearer token in Authorization header'
      });
    }

    const token = authHeader.substring(7);
    
    // Get Supabase client lazily
    const supabase = getSupabaseClient();
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        details: authError?.message || 'Token verification failed'
      });
    }

    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ 
        error: 'User profile not found',
        details: 'User profile may not be set up correctly'
      });
    }

    req.user = {
      id: user.id,
      profile: profile as any
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      details: 'Internal authentication error'
    });
  }
};

// ======================
// FILE UPLOAD ENDPOINTS
// ======================

// Upload file to project workflow stage
router.post('/upload', authenticateUser, upload.single('file'), async (req: FileRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        details: 'Include file in multipart form data with key "file"'
      });
    }

    const { 
      project_id, 
      stage, 
      file_type, 
      description, 
      tags 
    } = req.body;

    // Validate required fields
    if (!project_id || !stage || !file_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'project_id, stage, and file_type are required'
      });
    }

    // Validate stage and file_type
    const validStages = ['inspection', 'consultant_review', 'engineering', 'complete'];
    const validFileTypes = ['photo', 'document', 'sow', 'report'];

    if (!validStages.includes(stage)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stage',
        details: `Stage must be one of: ${validStages.join(', ')}`
      });
    }

    if (!validFileTypes.includes(file_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        details: `File type must be one of: ${validFileTypes.join(', ')}`
      });
    }

    const supabase = getSupabaseClient();

    // Check user access to project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        details: 'Project does not exist or access denied'
      });
    }

    // Verify user has access to project
    const hasAccess = 
      project.user_id === req.user!.id ||
      project.assigned_inspector === req.user!.id ||
      project.assigned_consultant === req.user!.id ||
      project.assigned_engineer === req.user!.id ||
      req.user!.profile.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        details: 'You do not have permission to upload files to this project'
      });
    }

    // Create upload request
    const uploadRequest: FileUploadRequest = {
      projectId: project_id,
      userId: req.user!.id,
      userRole: req.user!.profile.role,
      stage,
      fileType: file_type,
      description,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : []
    };

    console.log(`📁 Processing file upload for project ${project_id}`);
    console.log(`   File: ${req.file.originalname} (${req.file.size} bytes)`);
    console.log(`   Type: ${file_type}, Stage: ${stage}`);
    console.log(`   User: ${req.user!.profile.role} (${req.user!.id})`);

    // Process file upload
    const processedFile = await uploadWorkflowFile(req.file, uploadRequest);

    // Return success response
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: processedFile.id,
        filename: processedFile.filename,
        originalName: processedFile.originalName,
        fileType: processedFile.fileType,
        stage: processedFile.stage,
        size: processedFile.size,
        version: processedFile.version,
        uploadedAt: processedFile.uploadedAt,
        hasGPS: !!processedFile.metadata.gpsCoordinates,
        hasThumbnail: !!processedFile.thumbnailPath,
        tags: processedFile.tags,
        description: processedFile.description
      },
      metadata: {
        checksum: processedFile.metadata.checksum,
        gpsCoordinates: processedFile.metadata.gpsCoordinates,
        capturedAt: processedFile.metadata.capturedAt,
        cameraInfo: processedFile.metadata.cameraInfo,
        securityChecks: processedFile.securityChecks.length,
        securityPassed: processedFile.securityChecks.every(check => check.status !== 'failed')
      }
    });

  } catch (error) {
    console.error('❌ File upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'File upload failed',
      details: 'Internal server error during file processing'
    });
  }
});

// Get files for a project
router.get('/project/:projectId', authenticateUser, async (req: FileRequest, res) => {
  try {
    const { projectId } = req.params;
    const { 
      stage, 
      file_type, 
      user_id, 
      limit = '50', 
      offset = '0' 
    } = req.query;

    const supabase = getSupabaseClient();

    // Check user access to project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Verify access
    const hasAccess = 
      project.user_id === req.user!.id ||
      project.assigned_inspector === req.user!.id ||
      project.assigned_consultant === req.user!.id ||
      project.assigned_engineer === req.user!.id ||
      req.user!.profile.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get files
    const { files, total } = await getProjectFiles(projectId, {
      stage: stage as string,
      fileType: file_type as string,
      userId: user_id as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    // Group files by stage and type for easier frontend consumption
    const groupedFiles = files.reduce((acc, file) => {
      if (!acc[file.stage]) acc[file.stage] = {};
      if (!acc[file.stage][file.fileType]) acc[file.stage][file.fileType] = [];
      acc[file.stage][file.fileType].push({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        version: file.version,
        uploadedAt: file.uploadedAt,
        uploadedBy: file.userId,
        userRole: file.userRole,
        hasGPS: !!file.metadata.gpsCoordinates,
        hasThumbnail: !!file.thumbnailPath,
        tags: file.tags,
        description: file.description
      });
      return acc;
    }, {} as any);

    res.json({
      success: true,
      projectId,
      files: groupedFiles,
      metadata: {
        total,
        returned: files.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error) {
    console.error('❌ Get project files error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get project files'
    });
  }
});

// ======================
// UTILITY ENDPOINTS
// ======================

// Get file management configuration
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      maxFileSize: STORAGE_CONFIG.maxFileSize,
      allowedMimeTypes: STORAGE_CONFIG.allowedMimeTypes,
      thumbnailSizes: STORAGE_CONFIG.thumbnailSizes,
      supportedStages: ['inspection', 'consultant_review', 'engineering', 'complete'],
      supportedFileTypes: ['photo', 'document', 'sow', 'report']
    }
  });
});

export default router;
