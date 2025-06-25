// server/routes/draft-management.ts
// Draft Management for Field Inspection Forms

import { Request, Response } from 'express';

interface InspectionDraft {
  id: string;
  userId: string;
  projectName?: string;
  address?: string;
  buildingHeight?: number;
  buildingLength?: number;
  buildingWidth?: number;
  squareFootage?: number;
  numberOfStories?: string;
  roofSlope?: string;
  deckType?: string;
  insulationLayers?: Array<{
    type: string;
    thickness: number;
  }>;
  coverBoard?: string;
  timestamp: string;
  lastModified: string;
}

// In-memory storage for development (replace with database in production)
const drafts = new Map<string, InspectionDraft>();

// Calculate square footage with proper validation
function calculateSquareFootage(length: number, width: number): number {
  // Ensure we have valid numbers
  const validLength = Number(length) || 0;
  const validWidth = Number(width) || 0;
  
  // Return 0 if either dimension is invalid
  if (validLength <= 0 || validWidth <= 0) {
    return 0;
  }
  
  // Calculate and round to nearest whole number
  return Math.round(validLength * validWidth);
}

// Save draft endpoint
export const saveDraft = async (req: Request, res: Response) => {
  try {
    const draftData = req.body;
    const userId = req.headers['user-id'] as string || 'anonymous';
    
    // Generate unique ID if not provided
    const draftId = draftData.id || `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Auto-calculate square footage if dimensions provided
    if (draftData.buildingLength && draftData.buildingWidth) {
      draftData.squareFootage = calculateSquareFootage(
        draftData.buildingLength, 
        draftData.buildingWidth
      );
    }
    
    const draft: InspectionDraft = {
      ...draftData,
      id: draftId,
      userId,
      timestamp: draftData.timestamp || new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    // Save to storage
    drafts.set(draftId, draft);
    
    console.log(`✅ Draft saved: ${draftId} for user: ${userId}`);
    console.log(`📊 Square footage calculated: ${draft.squareFootage} sq ft`);
    
    res.json({
      success: true,
      draftId,
      draft,
      message: 'Draft saved successfully',
      squareFootage: draft.squareFootage
    });
    
  } catch (error) {
    console.error('❌ Error saving draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save draft',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Load draft endpoint
export const loadDraft = async (req: Request, res: Response) => {
  try {
    const { draftId } = req.params;
    const userId = req.headers['user-id'] as string || 'anonymous';
    
    const draft = drafts.get(draftId);
    
    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found',
        draftId
      });
    }
    
    // Verify user ownership (in development, allow any user)
    if (process.env.NODE_ENV === 'production' && draft.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    console.log(`📖 Draft loaded: ${draftId} for user: ${userId}`);
    
    res.json({
      success: true,
      draft,
      message: 'Draft loaded successfully'
    });
    
  } catch (error) {
    console.error('❌ Error loading draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load draft',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// List user drafts endpoint
export const listDrafts = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string || 'anonymous';
    
    const userDrafts = Array.from(drafts.values())
      .filter(draft => draft.userId === userId)
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    
    console.log(`📋 Listed ${userDrafts.length} drafts for user: ${userId}`);
    
    res.json({
      success: true,
      drafts: userDrafts,
      count: userDrafts.length
    });
    
  } catch (error) {
    console.error('❌ Error listing drafts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list drafts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete draft endpoint
export const deleteDraft = async (req: Request, res: Response) => {
  try {
    const { draftId } = req.params;
    const userId = req.headers['user-id'] as string || 'anonymous';
    
    const draft = drafts.get(draftId);
    
    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }
    
    // Verify user ownership
    if (process.env.NODE_ENV === 'production' && draft.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    drafts.delete(draftId);
    
    console.log(`🗑️ Draft deleted: ${draftId} for user: ${userId}`);
    
    res.json({
      success: true,
      message: 'Draft deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete draft',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Calculate square footage endpoint (utility)
export const calculateSquareFootageEndpoint = async (req: Request, res: Response) => {
  try {
    const { length, width } = req.body;
    
    const squareFootage = calculateSquareFootage(length, width);
    
    res.json({
      success: true,
      length: Number(length),
      width: Number(width),
      squareFootage,
      calculation: `${length} × ${width} = ${squareFootage}`
    });
    
  } catch (error) {
    console.error('❌ Error calculating square footage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate square footage',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Health check for draft system
export const draftSystemHealth = async (req: Request, res: Response) => {
  try {
    const totalDrafts = drafts.size;
    const recentDrafts = Array.from(drafts.values())
      .filter(draft => {
        const draftTime = new Date(draft.lastModified).getTime();
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        return draftTime > oneHourAgo;
      }).length;
    
    res.json({
      success: true,
      status: 'healthy',
      statistics: {
        totalDrafts,
        recentDrafts,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      },
      endpoints: {
        'POST /api/drafts/save': 'Save inspection draft',
        'GET /api/drafts/:draftId': 'Load specific draft', 
        'GET /api/drafts/list': 'List user drafts',
        'DELETE /api/drafts/:draftId': 'Delete draft',
        'POST /api/drafts/calculate-sqft': 'Calculate square footage'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Draft system health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};