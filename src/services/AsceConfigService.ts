/**
 * ASCE Configuration Service
 * 
 * This service provides cached access to ASCE parameters and GCP configuration
 * stored in Supabase tables, enabling config-driven wind calculations.
 */

import { supabase } from '../lib/supabase';

// Type definitions
export interface GCpConfigRow {
  roof_type: string;
  zone: string;
  gc_p_value: number;
}

export interface AsceParamRow {
  param_name: string;
  param_value: number;
  description?: string;
  unit?: string;
  category?: string;
  is_active: boolean;
}

export interface GCpLookupTable {
  [roofType: string]: {
    [zone: string]: number;
  };
}

export interface AsceParamLookup {
  [paramName: string]: number;
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let gcpConfigCache: GCpLookupTable | null = null;
let asceParamsCache: AsceParamLookup | null = null;
let gcpCacheTimestamp: number | null = null;
let asceCacheTimestamp: number | null = null;

/**
 * Load GCP (pressure coefficient) configuration from Supabase
 * 
 * Fetches roof type and zone-specific pressure coefficients from the gcp_config table
 * and builds a nested lookup structure for fast access during calculations.
 * Results are cached in memory for 5 minutes to improve performance.
 * 
 * @returns {Promise<GCpLookupTable>} Nested object where GCpTable[roof_type][zone] = gc_p_value
 * @throws {Error} If database fetch fails or no data is found
 * 
 * @example
 * const gcpConfig = await loadGCpConfig();
 * const pressure = gcpConfig['membrane']['zone1']; // Returns numeric pressure coefficient
 */
export async function loadGCpConfig(): Promise<GCpLookupTable> {
  // Return cached data if still valid
  if (gcpConfigCache && gcpCacheTimestamp && (Date.now() - gcpCacheTimestamp < CACHE_DURATION)) {
    return gcpConfigCache;
  }

  try {
    const { data: gcpRows, error } = await supabase
      .from('gcp_config')
      .select('roof_type, zone, gc_p_value')
      .order('roof_type, zone');

    if (error) {
      throw new Error(`Failed to fetch GCP configuration: ${error.message}`);
    }

    if (!gcpRows || gcpRows.length === 0) {
      throw new Error('No GCP configuration data found in database. Please ensure gcp_config table is populated.');
    }

    // Build nested lookup table for fast access
    const gcpTable: GCpLookupTable = gcpRows.reduce((table, row) => {
      if (!table[row.roof_type]) {
        table[row.roof_type] = {};
      }
      table[row.roof_type][row.zone] = row.gc_p_value;
      return table;
    }, {} as GCpLookupTable);

    // Update cache
    gcpConfigCache = gcpTable;
    gcpCacheTimestamp = Date.now();

    console.log(`✅ AsceConfigService: Loaded ${gcpRows.length} GCP configuration entries`);
    return gcpTable;

  } catch (error) {
    console.error('❌ AsceConfigService: Failed to load GCP config:', error);
    throw new Error(`GCP configuration load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load ASCE parameters from Supabase
 * 
 * Fetches active ASCE calculation parameters from the asce_params table
 * and builds a flat lookup object for quick parameter access.
 * Results are cached in memory for 5 minutes to improve performance.
 * 
 * @returns {Promise<AsceParamLookup>} Object where params[param_name] = param_value
 * @throws {Error} If database fetch fails or no active parameters are found
 * 
 * @example
 * const asceParams = await loadAsceParams();
 * const Kd = asceParams['Kd']; // Returns directionality factor
 * const importance = asceParams['I']; // Returns importance factor
 */
export async function loadAsceParams(): Promise<AsceParamLookup> {
  // Return cached data if still valid
  if (asceParamsCache && asceCacheTimestamp && (Date.now() - asceCacheTimestamp < CACHE_DURATION)) {
    return asceParamsCache;
  }

  try {
    const { data: asceRows, error } = await supabase
      .from('asce_params')
      .select('param_name, param_value, description, unit, category, is_active')
      .eq('is_active', true)
      .order('category, param_name');

    if (error) {
      throw new Error(`Failed to fetch ASCE parameters: ${error.message}`);
    }

    if (!asceRows || asceRows.length === 0) {
      throw new Error('No active ASCE parameters found in database. Please ensure asce_params table is populated with active parameters.');
    }

    // Build flat lookup object for fast parameter access
    const paramLookup: AsceParamLookup = Object.fromEntries(
      asceRows.map(row => [row.param_name, row.param_value])
    );

    // Update cache
    asceParamsCache = paramLookup;
    asceCacheTimestamp = Date.now();

    console.log(`✅ AsceConfigService: Loaded ${asceRows.length} ASCE parameters`);
    return paramLookup;

  } catch (error) {
    console.error('❌ AsceConfigService: Failed to load ASCE params:', error);
    throw new Error(`ASCE parameters load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a specific GCP pressure coefficient value
 * 
 * Convenience method to get a single pressure coefficient value for a specific
 * roof type and zone combination. Loads the full configuration if not cached.
 * 
 * @param {string} roofType - Type of roof system (e.g., 'membrane', 'metal', 'tile')
 * @param {string} zone - Wind zone designation (e.g., 'zone1', 'zone2', 'corner')
 * @returns {Promise<number>} The pressure coefficient value
 * @throws {Error} If roof type or zone not found in configuration
 * 
 * @example
 * const gcpValue = await getGCpValue('membrane', 'zone1');
 */
export async function getGCpValue(roofType: string, zone: string): Promise<number> {
  const gcpConfig = await loadGCpConfig();
  
  if (!gcpConfig[roofType]) {
    throw new Error(`Roof type '${roofType}' not found in GCP configuration. Available types: ${Object.keys(gcpConfig).join(', ')}`);
  }
  
  if (!gcpConfig[roofType][zone]) {
    throw new Error(`Zone '${zone}' not found for roof type '${roofType}'. Available zones: ${Object.keys(gcpConfig[roofType]).join(', ')}`);
  }
  
  return gcpConfig[roofType][zone];
}

/**
 * Get a specific ASCE parameter value
 * 
 * Convenience method to get a single ASCE parameter value by name.
 * Loads the full parameter set if not cached.
 * 
 * @param {string} paramName - Name of the parameter (e.g., 'Kd', 'I', 'Kh_15')
 * @returns {Promise<number>} The parameter value
 * @throws {Error} If parameter not found in configuration
 * 
 * @example
 * const Kd = await getAsceParam('Kd');
 * const importance = await getAsceParam('I');
 */
export async function getAsceParam(paramName: string): Promise<number> {
  const asceParams = await loadAsceParams();
  
  if (!(paramName in asceParams)) {
    throw new Error(`ASCE parameter '${paramName}' not found. Available parameters: ${Object.keys(asceParams).join(', ')}`);
  }
  
  return asceParams[paramName];
}

/**
 * Clear all configuration caches
 * 
 * Forces the next configuration load to fetch fresh data from the database.
 * Useful for testing or when configuration updates are made.
 * 
 * @example
 * clearConfigCache(); // Next loadGCpConfig() will fetch from database
 */
export function clearConfigCache(): void {
  gcpConfigCache = null;
  asceParamsCache = null;
  gcpCacheTimestamp = null;
  asceCacheTimestamp = null;
  console.log('🔄 AsceConfigService: Configuration cache cleared');
}

/**
 * Get cache status information
 * 
 * Returns information about the current cache state for debugging and monitoring.
 * 
 * @returns {Object} Cache status information
 * 
 * @example
 * const status = getCacheStatus();
 * console.log(`GCP cache age: ${status.gcpCacheAge}ms`);
 */
export function getCacheStatus() {
  const now = Date.now();
  
  return {
    gcpConfig: {
      cached: !!gcpConfigCache,
      timestamp: gcpCacheTimestamp,
      age: gcpCacheTimestamp ? now - gcpCacheTimestamp : null,
      valid: gcpCacheTimestamp && (now - gcpCacheTimestamp < CACHE_DURATION),
      entriesCount: gcpConfigCache ? Object.keys(gcpConfigCache).length : 0
    },
    asceParams: {
      cached: !!asceParamsCache,
      timestamp: asceCacheTimestamp,
      age: asceCacheTimestamp ? now - asceCacheTimestamp : null,
      valid: asceCacheTimestamp && (now - asceCacheTimestamp < CACHE_DURATION),
      entriesCount: asceParamsCache ? Object.keys(asceParamsCache).length : 0
    },
    cacheDuration: CACHE_DURATION
  };
}

/**
 * Preload all configuration data
 * 
 * Loads both GCP config and ASCE parameters in parallel to warm the cache.
 * Useful for application initialization or before performing multiple calculations.
 * 
 * @returns {Promise<{gcpConfig: GCpLookupTable, asceParams: AsceParamLookup}>} Both configuration objects
 * 
 * @example
 * // Warm cache during app startup
 * await preloadConfig();
 */
export async function preloadConfig(): Promise<{
  gcpConfig: GCpLookupTable;
  asceParams: AsceParamLookup;
}> {
  const [gcpConfig, asceParams] = await Promise.all([
    loadGCpConfig(),
    loadAsceParams()
  ]);
  
  console.log('✅ AsceConfigService: Configuration preloaded');
  
  return { gcpConfig, asceParams };
}
