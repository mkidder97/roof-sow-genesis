// Config-driven Wind Uplift Calculation Engine
// Refactored to use Supabase config tables instead of hard-coded values

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables for uplift calculations');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory cache for config data
let gcpConfigCache = null;
let asceParamsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load GCP pressure coefficient configuration from Supabase
 * @returns {Promise<Object>} GCP configuration lookup table
 */
async function loadGCpConfig() {
  // Check cache validity
  if (gcpConfigCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return gcpConfigCache;
  }

  try {
    const { data: gcpRows, error } = await supabase
      .from('gcp_config')
      .select('roof_type,zone,gc_p_value');

    if (error) {
      throw new Error(`Failed to fetch GCP config: ${error.message}`);
    }

    if (!gcpRows || gcpRows.length === 0) {
      throw new Error('No GCP configuration data found in database');
    }

    // Build nested lookup table: GCpTable[roof_type][zone] = gc_p_value
    const GCpTable = gcpRows.reduce((table, row) => {
      if (!table[row.roof_type]) {
        table[row.roof_type] = {};
      }
      table[row.roof_type][row.zone] = row.gc_p_value;
      return table;
    }, {});

    gcpConfigCache = GCpTable;
    cacheTimestamp = Date.now();

    console.log(`✅ Loaded ${gcpRows.length} GCP config entries from database`);
    return GCpTable;
  } catch (error) {
    console.error('❌ Error loading GCP config:', error.message);
    throw error;
  }
}

/**
 * Load ASCE parameters from Supabase
 * @returns {Promise<Object>} ASCE parameters lookup object
 */
async function loadAsceParams() {
  // Check cache validity
  if (asceParamsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return asceParamsCache;
  }

  try {
    const { data: asceRows, error } = await supabase
      .from('asce_params')
      .select('param_name,param_value')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch ASCE params: ${error.message}`);
    }

    if (!asceRows || asceRows.length === 0) {
      throw new Error('No ASCE parameters found in database');
    }

    // Build parameter lookup: params[param_name] = param_value
    const params = Object.fromEntries(
      asceRows.map(row => [row.param_name, row.param_value])
    );

    asceParamsCache = params;
    cacheTimestamp = Date.now();

    console.log(`✅ Loaded ${asceRows.length} ASCE parameters from database`);
    return params;
  } catch (error) {
    console.error('❌ Error loading ASCE params:', error.message);
    throw error;
  }
}

/**
 * Calculate wind uplift pressures using config-driven approach
 * @param {Object} inputs - Calculation inputs
 * @param {string} inputs.roofType - Type of roof system
 * @param {string} inputs.zone - Wind zone designation
 * @param {string} inputs.riskCategory - Building risk category (I, II, III, IV)
 * @param {number} inputs.windSpeed - Basic wind speed in mph
 * @param {number} inputs.height - Building height in feet
 * @param {string} inputs.exposure - Exposure category (B, C, D)
 * @returns {Promise<Object>} Calculated wind pressures and factors
 */
export async function calculateUpliftPressures(inputs) {
  const { roofType, zone, riskCategory = 'II', windSpeed, height, exposure = 'C' } = inputs;

  // Validate required inputs
  if (!roofType) throw new Error('Roof type is required for uplift calculation');
  if (!zone) throw new Error('Zone designation is required for uplift calculation');
  if (!windSpeed || windSpeed <= 0) throw new Error('Valid wind speed is required');
  if (!height || height <= 0) throw new Error('Valid building height is required');

  try {
    // Load configuration data from Supabase
    const [GCpTable, asceParams] = await Promise.all([
      loadGCpConfig(),
      loadAsceParams()
    ]);

    // Get GCP pressure coefficient
    if (!GCpTable[roofType]) {
      throw new Error(`Roof type '${roofType}' not found in GCP configuration`);
    }
    if (!GCpTable[roofType][zone]) {
      throw new Error(`Zone '${zone}' not found for roof type '${roofType}' in GCP configuration`);
    }
    const gcpValue = GCpTable[roofType][zone];

    // Get wind directionality factor (Kd)
    const Kd = asceParams['Kd'];
    if (!Kd) {
      throw new Error('Kd (directionality factor) not found in ASCE parameters');
    }

    // Get importance factor based on risk category
    const importanceKey = `I_${riskCategory}`;
    let importance = asceParams[importanceKey] || asceParams['I']; // Fallback to generic I
    
    if (!importance) {
      // Fallback importance factor mapping if not in database
      const importanceMap = { 'I': 0.87, 'II': 1.00, 'III': 1.15, 'IV': 1.15 };
      importance = importanceMap[riskCategory];
      if (!importance) {
        throw new Error(`Invalid risk category '${riskCategory}' and no fallback importance factor found`);
      }
      console.warn(`⚠️  Using fallback importance factor for risk category ${riskCategory}`);
    }

    // Calculate velocity pressure exposure coefficient (Kh)
    const Kh = calculateVelocityPressureCoefficient(height, exposure);

    // Get other factors (simplified for this implementation)
    const Kzt = 1.0; // Topographic factor (flat terrain)
    const Ke = 1.0;  // Ground elevation factor
    const GCpi = 0.18; // Internal pressure coefficient

    // Calculate velocity pressure: qh = 0.00256 * Kh * Kzt * Kd * Ke * I * V²
    const qh = 0.00256 * Kh * Kzt * Kd * Ke * importance * Math.pow(windSpeed, 2);

    // Calculate net uplift pressure: p = qh * (GCp - GCpi)
    const upliftPressure = qh * (gcpValue - GCpi);

    const result = {
      upliftPressure: Math.abs(upliftPressure), // Return as positive value
      pressurePsf: upliftPressure,
      calculationFactors: {
        Kd,
        Kh,
        Kzt,
        Ke,
        I: importance,
        qh,
        GCp: gcpValue,
        GCpi
      },
      inputs: {
        roofType,
        zone,
        riskCategory,
        windSpeed,
        height,
        exposure
      },
      metadata: {
        calculationMethod: 'ASCE 7 Components and Cladding',
        configSource: 'Supabase database',
        timestamp: new Date().toISOString()
      }
    };

    console.log(`💨 Uplift calculated: ${result.upliftPressure.toFixed(2)} psf for ${roofType} zone ${zone}`);
    return result;

  } catch (error) {
    console.error('❌ Uplift calculation failed:', error.message);
    throw error;
  }
}

/**
 * Calculate velocity pressure exposure coefficient
 * @private
 */
function calculateVelocityPressureCoefficient(height, exposure) {
  const exposureParams = {
    'B': { alpha: 7.0, zg: 1200, Kh15: 0.57 },
    'C': { alpha: 9.5, zg: 900, Kh15: 0.85 },
    'D': { alpha: 11.5, zg: 700, Kh15: 1.03 }
  };
  
  const params = exposureParams[exposure];
  if (!params) {
    throw new Error(`Invalid exposure category: ${exposure}`);
  }
  
  const z = Math.max(height, 15); // Minimum 15 ft
  
  if (z <= 15) {
    return params.Kh15;
  }
  
  // Power law formula
  const exponent = (2 * params.alpha) / params.zg;
  return params.Kh15 * Math.pow(z / 15, exponent);
}

/**
 * Clear configuration cache (useful for testing or forced refresh)
 */
export function clearConfigCache() {
  gcpConfigCache = null;
  asceParamsCache = null;
  cacheTimestamp = null;
  console.log('🔄 Configuration cache cleared');
}

/**
 * Get current cache status
 */
export function getCacheStatus() {
  return {
    gcpCached: !!gcpConfigCache,
    asceCached: !!asceParamsCache,
    cacheAge: cacheTimestamp ? Date.now() - cacheTimestamp : null,
    isValid: cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)
  };
}
