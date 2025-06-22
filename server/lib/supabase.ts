import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase configuration missing. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

// Create Supabase client with service role key for server-side operations
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test Supabase connection
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}

// Health check function
export async function supabaseHealthCheck() {
  try {
    const { data, error } = await supabase.rpc('version');
    
    return {
      status: error ? 'error' : 'ok',
      connected: !error,
      error: error?.message,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

export default supabase;
