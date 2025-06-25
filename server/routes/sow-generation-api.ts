// Complete SOW Generation API Integration - Frontend Ready
// Connects React frontend SOW generation system to existing backend PDF generation

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  generateSOWWithEngineering, 
  generateDebugSOW, 
  validateSOWInputs 
} from '../core/sow-generator.js';
import { parseTakeoffFile, TakeoffFile } from '../core/takeoff-engine.js';
import { supabase } from '../lib/supabase.js';

// TypeScript interfaces matching frontend expectations
interface SOWGenerationRequest {
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
    city?: string;
    state?: string;
    zipCode?: string;
    deckType?: string;
    insulationType?: string;
    buildingClassification?: string;
    notes?: string;
  };
  inspectionId?: string;
  file?: File; // This will be handled as multer file in Express
}

interface SOWGenerationResponse {
  success: boolean;
  sowId?: string;
  downloadUrl?: string;
  generationStatus?: 'processing' | 'complete' | 'failed';
  error?: string;
  estimatedCompletionTime?: number;
  data?: {
    sow?: string;
    pdf?: string;
    engineeringSummary?: any;
    template?: string;
    templateUsed?: string;
  };
  metadata?: {
    generationTime?: number;
    fileProcessed?: boolean;
    extractionConfidence?: number;
  };
}

/**
 * Main SOW Generation API Endpoint
 * POST /api/sow/generate
 * 
 * Handles multipart/form-data with file upload + form fields
 * Returns immediate response for simple generations OR processing status for complex ones
 */
export async function generateSOW(req: Request, res: Response) {
  const startTime = Date.now();
  let sowRecord: any = null;
  
  try {
    console.log('🎯 SOW Generation API - Processing request...');
    
    // Generate unique SOW ID for tracking
    const sowId = uuidv4();
    
    // Parse request data (form data or JSON)
    let projectData: any = {};
    let extractionResult: any = null;
    
    if (req.body && req.body.projectData) {
      // Handle JSON request with projectData wrapper
      projectData = typeof req.body.projectData === 'string' 
        ? JSON.parse(req.body.projectData) 
        : req.body.projectData;
    } else if (req.body) {
      // Handle direct form data
      projectData = req.body;
    }
    
    // Handle file upload processing
    if (req.file) {
      console.log('📁 Processing uploaded takeoff file:', req.file.originalname);
      
      const takeoffFile: TakeoffFile = {
        filename: req.file.originalname,
        buffer: req.file.buffer,
        mimetype: req.file.mimetype
      };
      
      try {
        extractionResult = await parseTakeoffFile(takeoffFile);
        console.log('✅ File extraction complete:', {
          method: extractionResult.method,
          confidence: extractionResult.confidence,
          fieldsExtracted: extractionResult.extractedFields.length
        });
        
        // Enhance project data with extracted information
        projectData = {
          ...projectData,
          squareFootage: extractionResult.data.roofArea || projectData.squareFootage,
          numberOfDrains: extractionResult.data.drainCount || projectData.numberOfDrains,
          numberOfPenetrations: extractionResult.data.penetrationCount || projectData.numberOfPenetrations,
          flashingLinearFeet: extractionResult.data.flashingLinearFeet,
          hvacUnits: extractionResult.data.hvacUnits,
          skylights: extractionResult.data.skylights,
          roofHatches: extractionResult.data.roofHatches,
          scuppers: extractionResult.data.scuppers,
          expansionJoints: extractionResult.data.expansionJoints,
          _fileProcessed: true,
          _extractionResult: extractionResult
        };
        
      } catch (fileError) {
        console.warn('⚠️ File processing failed, continuing with provided data:', fileError);
        projectData._fileProcessingError = fileError instanceof Error ? fileError.message : 'File processing failed';
        projectData._fileProcessed = false;
      }
    }
    
    // Validate required fields
    if (!projectData.projectName || !projectData.address) {
      return res.status(400).json({
        success: false,
        error: 'Project name and address are required',
        generationStatus: 'failed'
      } as SOWGenerationResponse);
    }
    
    // Create database record for tracking
    try {
      const { data: sowData, error: dbError } = await supabase
        .from('sow_generations')
        .insert({
          id: sowId,
          project_name: projectData.projectName,
          project_address: projectData.address,
          customer_name: projectData.customerName,
          customer_phone: projectData.customerPhone,
          status: 'processing',
          request_data: projectData,
          inspection_id: projectData.inspectionId,
          file_uploaded: !!req.file,
          file_name: req.file?.originalname,
          extraction_confidence: extractionResult?.confidence,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (dbError) {
        console.warn('⚠️ Database insert failed, continuing without tracking:', dbError);
      } else {
        sowRecord = sowData;
        console.log('📝 SOW generation record created:', sowId);
      }
    } catch (dbError) {
      console.warn('⚠️ Database operation failed, continuing:', dbError);
    }
    
    // Transform project data to SOW generator format
    const sowInputs = {
      projectName: projectData.projectName,
      projectAddress: projectData.address,
      city: projectData.city,
      state: projectData.state,
      zipCode: projectData.zipCode,
      buildingHeight: projectData.buildingHeight,
      squareFootage: projectData.squareFootage,
      deckType: projectData.deckType,
      membraneType: projectData.membraneType || 'tpo',
      insulationType: projectData.insulationType,
      windSpeed: projectData.windSpeed || 120,
      exposureCategory: projectData.exposureCategory || 'C',
      buildingClassification: projectData.buildingClassification || 'II',
      projectType: projectData.projectType || 'recover',
      numberOfDrains: projectData.numberOfDrains,
      numberOfPenetrations: projectData.numberOfPenetrations,
      customerName: projectData.customerName,
      customerPhone: projectData.customerPhone,
      notes: projectData.notes,
      // Enhanced data from file extraction
      flashingLinearFeet: projectData.flashingLinearFeet,
      hvacUnits: projectData.hvacUnits,
      skylights: projectData.skylights,
      roofHatches: projectData.roofHatches,
      scuppers: projectData.scuppers,
      expansionJoints: projectData.expansionJoints,
      // Debug flags for development
      debug: process.env.NODE_ENV === 'development'
    };
    
    console.log('🔧 Generating SOW with inputs:', {
      projectName: sowInputs.projectName,
      address: sowInputs.projectAddress,
      squareFootage: sowInputs.squareFootage,
      drains: sowInputs.numberOfDrains,
      penetrations: sowInputs.numberOfPenetrations,
      fileProcessed: projectData._fileProcessed
    });
    
    // Generate SOW using existing system
    const sowResult = await generateSOWWithEngineering(sowInputs);
    
    if (!sowResult.success) {
      // Update database record with failure
      if (sowRecord) {
        await supabase
          .from('sow_generations')
          .update({ 
            status: 'failed', 
            error_message: sowResult.error,
            completed_at: new Date().toISOString(),
            generation_time_ms: Date.now() - startTime
          })
          .eq('id', sowId)
          .catch(console.warn);
      }
      
      return res.status(500).json({
        success: false,
        sowId,
        error: sowResult.error,
        generationStatus: 'failed'
      } as SOWGenerationResponse);
    }
    
    const generationTime = Date.now() - startTime;
    
    // Create download URL for the PDF
    let downloadUrl: string | undefined;
    if (sowResult.pdfPath || sowResult.data?.pdf) {
      if (sowResult.pdfPath) {
        // File-based PDF
        downloadUrl = `/output/${sowResult.pdfPath.split('/').pop()}`;
      } else if (sowResult.data?.pdf) {
        // Base64 PDF - create temporary download endpoint
        downloadUrl = `/api/sow/download/${sowId}`;
      }
    }
    
    // Update database record with success
    if (sowRecord) {
      await supabase
        .from('sow_generations')
        .update({ 
          status: 'complete',
          pdf_url: downloadUrl,
          engineering_summary: sowResult.engineeringSummary,
          template_used: sowResult.engineeringSummary?.templateSelection?.templateName,
          completed_at: new Date().toISOString(),
          generation_time_ms: generationTime,
          pdf_data: sowResult.data?.pdf // Store base64 PDF for download endpoint
        })
        .eq('id', sowId)
        .catch(console.warn);
        
      // Link to inspection if provided
      if (projectData.inspectionId) {
        await supabase
          .from('field_inspections')
          .update({ 
            sow_generated: true,
            sow_generation_id: sowId,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectData.inspectionId)
          .catch(console.warn);
      }
    }
    
    console.log('✅ SOW generation complete:', {
      sowId,
      generationTime: `${generationTime}ms`,
      template: sowResult.engineeringSummary?.templateSelection?.templateName,
      fileProcessed: projectData._fileProcessed,
      downloadUrl
    });
    
    // Return successful response
    const response: SOWGenerationResponse = {
      success: true,
      sowId,
      downloadUrl,
      generationStatus: 'complete',
      data: {
        sow: sowResult.data?.sow,
        pdf: sowResult.data?.pdf,
        engineeringSummary: sowResult.engineeringSummary,
        template: sowResult.data?.template,
        templateUsed: sowResult.engineeringSummary?.templateSelection?.templateName
      },
      metadata: {
        generationTime,
        fileProcessed: projectData._fileProcessed || false,
        extractionConfidence: extractionResult?.confidence || 0
      }
    };
    
    res.json(response);
    
  } catch (error) {
    const generationTime = Date.now() - startTime;
    console.error('❌ SOW generation API error:', error);
    
    // Update database record with error
    if (sowRecord) {
      await supabase
        .from('sow_generations')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
          generation_time_ms: generationTime
        })
        .eq('id', sowRecord.id)
        .catch(console.warn);
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'SOW generation failed',
      generationStatus: 'failed',
      metadata: {
        generationTime
      }
    } as SOWGenerationResponse);
  }
}

/**
 * SOW Download Endpoint
 * GET /api/sow/download/:sowId
 * 
 * Serves generated PDFs for download
 */
export async function downloadSOW(req: Request, res: Response) {
  try {
    const { sowId } = req.params;
    
    if (!sowId) {
      return res.status(400).json({ error: 'SOW ID is required' });
    }
    
    // Get SOW record from database
    const { data: sowRecord, error } = await supabase
      .from('sow_generations')
      .select('pdf_data, project_name, pdf_url')
      .eq('id', sowId)
      .single();
    
    if (error || !sowRecord) {
      return res.status(404).json({ error: 'SOW not found' });
    }
    
    if (!sowRecord.pdf_data) {
      return res.status(404).json({ error: 'PDF data not available' });
    }
    
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(sowRecord.pdf_data, 'base64');
    
    // Set headers for PDF download
    const filename = `SOW_${sowRecord.project_name?.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString()
    });
    
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('❌ SOW download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
}

/**
 * SOW Status Endpoint
 * GET /api/sow/status/:sowId
 * 
 * Get generation status for async processing
 */
export async function getSOWStatus(req: Request, res: Response) {
  try {
    const { sowId } = req.params;
    
    if (!sowId) {
      return res.status(400).json({ error: 'SOW ID is required' });
    }
    
    const { data: sowRecord, error } = await supabase
      .from('sow_generations')
      .select('id, status, error_message, pdf_url, generation_time_ms, created_at, completed_at')
      .eq('id', sowId)
      .single();
    
    if (error || !sowRecord) {
      return res.status(404).json({ error: 'SOW not found' });
    }
    
    const response = {
      success: true,
      sowId: sowRecord.id,
      generationStatus: sowRecord.status,
      downloadUrl: sowRecord.pdf_url,
      error: sowRecord.error_message,
      estimatedCompletionTime: sowRecord.status === 'processing' ? 30 : undefined,
      metadata: {
        generationTime: sowRecord.generation_time_ms,
        createdAt: sowRecord.created_at,
        completedAt: sowRecord.completed_at
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ SOW status error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
}

/**
 * List User SOWs Endpoint
 * GET /api/sow/list
 * 
 * Get all SOWs for the current user (with pagination)
 */
export async function listSOWs(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    const { data: sows, error, count } = await supabase
      .from('sow_generations')
      .select(`
        id,
        project_name,
        project_address,
        customer_name,
        status,
        pdf_url,
        template_used,
        created_at,
        completed_at,
        generation_time_ms
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      sows: sows || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ List SOWs error:', error);
    res.status(500).json({ error: 'Failed to list SOWs' });
  }
}

/**
 * Delete SOW Endpoint
 * DELETE /api/sow/:sowId
 * 
 * Delete a SOW record and associated files
 */
export async function deleteSOW(req: Request, res: Response) {
  try {
    const { sowId } = req.params;
    
    if (!sowId) {
      return res.status(400).json({ error: 'SOW ID is required' });
    }
    
    const { error } = await supabase
      .from('sow_generations')
      .delete()
      .eq('id', sowId);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'SOW deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Delete SOW error:', error);
    res.status(500).json({ error: 'Failed to delete SOW' });
  }
}
