
import { supabase } from './supabase';

export interface ProjectInput {
  projectName: string;
  address: string;
  companyName?: string;
  squareFootage?: number;
  buildingHeight?: number;
  length?: number;
  width?: number;
  elevation?: number;
  projectType?: string;
  membraneThickness?: string;
  membraneColor?: string;
  deckType?: string;
  exposureCategory?: string;
  insulationType?: string;
  coverBoardType?: string;
  existingInsulationCondition?: string;
  insulationThickness?: number;
  insulationRValue?: number;
  coverBoardThickness?: number;
  hasExistingInsulation?: boolean;
  roofSlope?: number;
  numberOfDrains?: number;
  numberOfPenetrations?: number;
  skylights?: number;
  roofHatches?: number;
  drainTypes?: string[];
  penetrationTypes?: string[];
  hvacUnits?: number;
  walkwayPadRequested?: boolean;
  downspouts?: number;
  expansionJoints?: number;
  parapetHeight?: number;
  gutterType?: string;
  roofConfiguration?: string;
  documentAttachment?: {
    filename: string;
    type: string;
    data: string;
  };
  userId?: string;
}

export interface SOWGenerationRequest {
  projectName: string;
  projectAddress: string;
  customerName?: string;
  customerPhone?: string;
  buildingHeight?: number;
  squareFootage?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  deckType?: string;
  membraneType?: string;
  windSpeed?: number;
  exposureCategory?: string;
  buildingClassification?: string;
  projectType?: string;
  numberOfDrains?: number;
  numberOfPenetrations?: number;
  notes?: string;
  inspectionId?: string;
}

export interface SOWGenerationResponseData {
  success: boolean;
  sowId?: string;
  downloadUrl?: string;
  message?: string;
  error?: string;
  data?: {
    pdf?: string;
    sow?: string;
  };
}

// Enhanced SOWResponse with all required properties
export interface SOWResponse {
  success: boolean;
  sowId?: string;
  downloadUrl?: string;
  message?: string;
  error?: string;
  filename?: string;
  outputPath?: string;
  generationTime?: number;
  data?: {
    pdf?: string;
    sow?: string;
  };
}

// Complete API endpoints including all referenced endpoints
export const API_ENDPOINTS = {
  SOW_GENERATION: '/api/sow/generate',
  HEALTH_CHECK: '/api/health',
  PROJECTS: '/api/projects',
  health: '/api/health',
  status: '/api/status',
  docs: '/api/docs',
  templateMap: '/api/template-map'
};

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
};

export const createProject = async (projectData: ProjectInput): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const getProjects = async (userId?: string): Promise<any[]> => {
  try {
    let query = supabase.from('projects').select('*').order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const updateProject = async (id: string, updates: Partial<ProjectInput>): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

export const generateSOWAPI = async (request: SOWGenerationRequest): Promise<SOWGenerationResponseData> => {
  try {
    console.log('🚀 Starting SOW generation API call with:', request);

    // Basic validation
    if (!request.projectName?.trim()) {
      throw new Error('Project name is required');
    }
    if (!request.projectAddress?.trim()) {
      throw new Error('Project address is required');
    }

    // For now, return a mock success response since the actual SOW generation
    // backend is not connected. In production, this would call the real API.
    console.log('⚠️ Mock SOW generation - backend not connected');
    
    return {
      success: true,
      message: 'SOW generation completed successfully (mock)',
      sowId: `sow_${Date.now()}`,
      downloadUrl: '#mock-download-url',
      data: {
        pdf: 'mock-pdf-data',
        sow: 'mock-sow-content'
      }
    };

  } catch (error) {
    console.error('❌ SOW generation API failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SOW generation failed'
    };
  }
};

export const getProject = async (id: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
};

// Field inspection related API functions
export const getFieldInspections = async (userId?: string): Promise<any[]> => {
  try {
    let query = supabase.from('field_inspections').select('*').order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('inspector_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch field inspections: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching field inspections:', error);
    throw error;
  }
};

export const getFieldInspection = async (id: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('field_inspections')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch field inspection: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching field inspection:', error);
    throw error;
  }
};

export const saveFieldInspection = async (inspectionData: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('field_inspections')
      .upsert(inspectionData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to save field inspection: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error saving field inspection:', error);
    throw error;
  }
};
