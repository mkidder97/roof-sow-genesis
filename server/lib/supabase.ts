// Supabase Client Configuration for SOW Generation API
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase configuration missing. SOW tracking will be disabled.');
  console.warn('Required environment variables:');
  console.warn('- SUPABASE_URL');
  console.warn('- SUPABASE_SERVICE_ROLE_KEY');
}

// Create Supabase client with service role key for server-side operations
export const supabase = supabaseUrl && supabaseServiceKey ? createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null;

// Type definitions for database tables
export interface SOWGenerationRecord {
  id: string;
  project_name: string;
  project_address: string;
  customer_name?: string;
  customer_phone?: string;
  status: 'processing' | 'complete' | 'failed';
  error_message?: string;
  request_data: any;
  inspection_id?: string;
  file_uploaded: boolean;
  file_name?: string;
  extraction_confidence?: number;
  pdf_url?: string;
  pdf_data?: string;
  engineering_summary?: any;
  template_used?: string;
  created_at: string;
  completed_at?: string;
  generation_time_ms?: number;
  created_by?: string;
  updated_at: string;
}

export interface FieldInspectionRecord {
  id: string;
  project_name: string;
  project_address: string;
  status: string;
  sow_generated: boolean;
  sow_generation_id?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any; // Allow additional fields
}

// Helper functions for database operations
export async function createSOWRecord(data: Partial<SOWGenerationRecord>) {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured, skipping database operation');
    return { data: null, error: 'Supabase not configured' };
  }
  
  return await supabase
    .from('sow_generations')
    .insert(data)
    .select()
    .single();
}

export async function updateSOWRecord(id: string, data: Partial<SOWGenerationRecord>) {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured, skipping database operation');
    return { data: null, error: 'Supabase not configured' };
  }
  
  return await supabase
    .from('sow_generations')
    .update(data)
    .eq('id', id)
    .select()
    .single();
}

export async function getSOWRecord(id: string) {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured, skipping database operation');
    return { data: null, error: 'Supabase not configured' };
  }
  
  return await supabase
    .from('sow_generations')
    .select('*')
    .eq('id', id)
    .single();
}

export async function updateInspectionSOWStatus(inspectionId: string, sowGenerationId: string) {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured, skipping database operation');
    return { data: null, error: 'Supabase not configured' };
  }
  
  return await supabase
    .from('field_inspections')
    .update({ 
      sow_generated: true,
      sow_generation_id: sowGenerationId,
      updated_at: new Date().toISOString()
    })
    .eq('id', inspectionId);
}

// Health check function
export async function checkSupabaseConnection() {
  if (!supabase) {
    return { connected: false, error: 'Supabase not configured' };
  }
  
  try {
    const { data, error } = await supabase
      .from('sow_generations')
      .select('count(*)')
      .limit(1);
      
    if (error) {
      return { connected: false, error: error.message };
    }
    
    return { connected: true, data };
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export default supabase;
