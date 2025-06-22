/**
 * SUPABASE CLIENT SETUP
 * Database integration for storing project inputs and SOW outputs
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not found - database features will be disabled');
  console.warn('Please set SUPABASE_URL and SUPABASE_KEY environment variables');
}

// Create Supabase client
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Database table interfaces matching Lovable's schema
export interface ProjectRecord {
  id?: string;
  user_id?: string;
  project_name: string;
  address: string;
  company_name: string;
  square_footage: number;
  building_height: number;
  length?: number;
  width?: number;
  project_type: string;
  membrane_thickness?: string;
  membrane_color?: string;
  created_at?: string;
}

export interface SOWOutputRecord {
  id?: string;
  project_id: string;
  template_name: string;
  rationale?: string;
  asce_version: string;
  wind_speed: number;
  hvhz: boolean;
  zone1_field?: number;
  zone2_perimeter?: number;
  zone3_corner?: number;
  manufacturer?: string;
  spacing_corner?: string;
  spacing_field?: string;
  penetration_depth?: string;
  takeoff_risk?: string;
  key_issues?: string;
  generation_time_ms: number;
  file_url?: string;
  created_at?: string;
}

/**
 * Check if Supabase is available
 */
export function isSupabaseAvailable(): boolean {
  return supabase !== null;
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    const { error } = await supabase.from('projects').select('id').limit(1);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}

/**
 * Save project inputs to database
 */
export async function saveProject(projectData: ProjectRecord): Promise<{ success: boolean; projectId?: string; error?: string }> {
  if (!supabase) {
    console.warn('Database not available - skipping project save');
    return { success: false, error: 'Database not configured' };
  }

  try {
    console.log('💾 Saving project to database:', projectData.project_name);
    
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Failed to save project:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ Project saved successfully:', data.id);
    return { success: true, projectId: data.id };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Project save error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Save SOW output metadata to database
 */
export async function saveSOWOutput(sowData: SOWOutputRecord): Promise<{ success: boolean; sowId?: string; error?: string }> {
  if (!supabase) {
    console.warn('Database not available - skipping SOW output save');
    return { success: false, error: 'Database not configured' };
  }

  try {
    console.log('💾 Saving SOW output to database for project:', sowData.project_id);
    
    const { data, error } = await supabase
      .from('sow_outputs')
      .insert(sowData)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Failed to save SOW output:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ SOW output saved successfully:', data.id);
    return { success: true, sowId: data.id };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ SOW output save error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get project history for a user
 */
export async function getProjectHistory(userId?: string): Promise<{ success: boolean; projects?: any[]; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    let query = supabase
      .from('projects')
      .select(`
        *,
        sow_outputs (*)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, projects: data };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get SOW outputs for a specific project
 */
export async function getProjectSOWs(projectId: string): Promise<{ success: boolean; sows?: any[]; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('sow_outputs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, sows: data };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

export default supabase;
