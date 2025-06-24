import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let initializationAttempted = false;
let initializationError: Error | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!initializationAttempted) {
    initializationAttempted = true;
    
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
      }
      
      supabaseClient = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase client initialized successfully');
      
    } catch (error) {
      initializationError = error as Error;
      console.warn('⚠️ Supabase initialization failed:', error);
    }
  }
  
  if (initializationError) {
    throw initializationError;
  }
  
  if (!supabaseClient) {
    throw new Error('Supabase client not available');
  }
  
  return supabaseClient;
}

export function isSupabaseAvailable(): boolean {
  return !initializationError && supabaseClient !== null;
}

export function getSupabaseStatus(): { available: boolean; error?: string } {
  if (!initializationAttempted) {
    return { available: false, error: 'Not initialized' };
  }
  
  return {
    available: isSupabaseAvailable(),
    error: initializationError?.message
  };
}
