// File Management API Routes for Multi-Role Workflow
// Handles photo uploads, document management, and versioning

import express from 'express';
import { createClient } from '@supabase/supabase-js';
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

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! || process.env.SUPABASE_ANON_KEY!
);

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

// Upload multiple files at once
router.post('/upload-batch', authenticateUser, upload.array('files', 10), async (req: FileRequest, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided',
        details: 'Include files in multipart form data with key "files"'
      });
    }

    const { project_id, stage, file_type, description } = req.body;

    // Validate required fields
    if (!project_id || !stage || !file_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'project_id, stage, and file_type are required'
      });
    }

    console.log(`📁 Processing batch upload: ${req.files.length} files`);

    const results = [];
    const errors = [];

    // Process each file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        const uploadRequest: FileUploadRequest = {
          projectId: project_id,
          userId: req.user!.id,
          userRole: req.user!.profile.role,
          stage,
          fileType: file_type,
          description: description ? `${description} (${i + 1}/${req.files.length})` : undefined,
          tags: []
        };

        const processedFile = await uploadWorkflowFile(file, uploadRequest);
        
        results.push({
          success: true,
          file: {
            id: processedFile.id,
            filename: processedFile.filename,
            originalName: processedFile.originalName,
            size: processedFile.size,
            hasGPS: !!processedFile.metadata.gpsCoordinates
          }
        });

      } catch (error) {
        console.error(`❌ Failed to process file ${file.originalname}:`, error);
        errors.push({
          filename: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({
      success: errors.length === 0,
      message: `Processed ${results.length} of ${req.files.length} files successfully`,
      results,
      errors,
      summary: {
        total: req.files.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('❌ Batch upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch upload failed'
    });
  }
});

// ======================
// FILE RETRIEVAL ENDPOINTS
// ======================

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

// Get specific file details
router.get('/:fileId', authenticateUser, async (req: FileRequest, res) => {
  try {
    const { fileId } = req.params;

    const { data: file, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error || !file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check project access
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', file.project_id)
      .single();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Associated project not found'
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

    res.json({
      success: true,
      file: {
        id: file.id,
        originalName: file.original_name,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        fileType: file.file_type,
        stage: file.stage,
        version: file.version,
        uploadedAt: file.uploaded_at,
        uploadedBy: file.user_id,
        userRole: file.user_role,
        tags: file.tags,
        description: file.description,
        metadata: file.metadata,
        securityChecks: file.security_checks,
        hasThumbnail: !!file.thumbnail_path
      }
    });

  } catch (error) {
    console.error('❌ Get file details error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file details'
    });
  }
});

// Get file versions
router.get('/:fileId/versions', authenticateUser, async (req: FileRequest, res) => {
  try {
    const { fileId } = req.params;

    // Check file access (simplified - could be more granular)
    const { data: file } = await supabase
      .from('project_files')
      .select('project_id')
      .eq('id', fileId)
      .single();

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    const versions = await getFileVersions(fileId);

    res.json({
      success: true,
      fileId,
      versions: versions.map(version => ({
        id: version.id,
        version: version.version,
        filename: version.filename,
        changes: version.changes,
        uploadedBy: version.uploadedBy,
        uploadedAt: version.uploadedAt,
        metadata: version.metadata
      }))
    });

  } catch (error) {
    console.error('❌ Get file versions error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file versions'
    });
  }
});

// ======================
// FILE DOWNLOAD ENDPOINTS
// ======================

// Download file
router.get('/:fileId/download', authenticateUser, async (req: FileRequest, res) => {
  try {
    const { fileId } = req.params;

    const { data: file, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error || !file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check access (simplified)
    // TODO: Add proper project access check

    try {
      await fs.access(file.upload_path);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.setHeader('Content-Type', file.mimetype);
    
    res.sendFile(path.resolve(file.upload_path));

  } catch (error) {
    console.error('❌ File download error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'File download failed'
    });
  }
});

// Get thumbnail
router.get('/:fileId/thumbnail', authenticateUser, async (req: FileRequest, res) => {
  try {
    const { fileId } = req.params;
    const { size = 'medium' } = req.query;

    const { data: file, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error || !file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    if (!file.thumbnail_path) {
      return res.status(404).json({
        success: false,
        error: 'Thumbnail not available'
      });
    }

    // Construct thumbnail path based on size
    const thumbnailDir = path.dirname(file.thumbnail_path);
    const baseFilename = path.parse(file.filename).name;
    const thumbnailPath = path.join(thumbnailDir, `${baseFilename}_${size}.webp`);

    try {
      await fs.access(thumbnailPath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Thumbnail not found on disk'
      });
    }

    res.setHeader('Content-Type', 'image/webp');
    res.sendFile(path.resolve(thumbnailPath));

  } catch (error) {
    console.error('❌ Thumbnail error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Thumbnail retrieval failed'
    });
  }
});

// ======================
// FILE MANAGEMENT ENDPOINTS
// ======================

// Delete file
router.delete('/:fileId', authenticateUser, async (req: FileRequest, res) => {
  try {
    const { fileId } = req.params;

    await deleteFile(fileId, req.user!.id, req.user!.profile.role);

    res.json({
      success: true,
      message: 'File deleted successfully',
      fileId
    });

  } catch (error) {
    console.error('❌ File deletion error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'File deletion failed'
    });
  }
});

// Update file metadata
router.patch('/:fileId', authenticateUser, async (req: FileRequest, res) => {
  try {
    const { fileId } = req.params;
    const { description, tags } = req.body;

    // Get current file
    const { data: file, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error || !file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check permissions
    if (file.user_id !== req.user!.id && req.user!.profile.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Permission denied'
      });
    }

    // Update file metadata
    const updates: any = {};
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim());
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }

    const { error: updateError } = await supabase
      .from('project_files')
      .update(updates)
      .eq('id', fileId);

    if (updateError) {
      throw new Error(`Failed to update file: ${updateError.message}`);
    }

    res.json({
      success: true,
      message: 'File updated successfully',
      fileId,
      updates
    });

  } catch (error) {
    console.error('❌ File update error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'File update failed'
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

// Get storage statistics
router.get('/stats/project/:projectId', authenticateUser, async (req: FileRequest, res) => {
  try {
    const { projectId } = req.params;

    // Get file statistics
    const { data: files } = await supabase
      .from('project_files')
      .select('file_type, size, stage')
      .eq('project_id', projectId);

    if (!files) {
      return res.json({
        success: true,
        projectId,
        stats: {
          totalFiles: 0,
          totalSize: 0,
          byType: {},
          byStage: {}
        }
      });
    }

    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      byType: files.reduce((acc, file) => {
        acc[file.file_type] = (acc[file.file_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStage: files.reduce((acc, file) => {
        acc[file.stage] = (acc[file.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      success: true,
      projectId,
      stats
    });

  } catch (error) {
    console.error('❌ File stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file statistics'
    });
  }
});

export default router;
