import { supabase } from './supabase.js';

/**
 * Data access module for manufacturer approvals
 * Replaces hardcoded manufacturer specifications with database queries
 */

export interface ManufacturerApproval {
  id: string;
  manufacturer: string;
  product_type: string;
  fpa_number: string;
  mcrf_value: number;
  expiration_date?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ManufacturerSpec {
  manufacturer: string;
  productType: string;
  fpaNumber: string;
  mcrfValue: number;
  expirationDate?: Date;
  isExpired: boolean;
  notes?: string;
}

/**
 * Get manufacturer specifications for a specific manufacturer and product type
 * @param manufacturer - Manufacturer name (e.g., 'johns-manville', 'carlisle', 'gaf')
 * @param productType - Product type (e.g., 'tpo', 'epdm', 'modified-bitumen')
 * @returns Promise<ManufacturerSpec | null>
 */
export async function getManufacturerSpecs(
  manufacturer: string, 
  productType: string
): Promise<ManufacturerSpec | null> {
  try {
    console.log(`🔍 Querying manufacturer specs: ${manufacturer} - ${productType}`);
    
    const { data, error } = await supabase
      .from('active_manufacturer_approvals')
      .select('*')
      .eq('manufacturer', manufacturer.toLowerCase())
      .eq('product_type', productType.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`⚠️ No approval found for ${manufacturer} ${productType}`);
        return null;
      }
      throw error;
    }

    if (!data) {
      console.log(`⚠️ No data returned for ${manufacturer} ${productType}`);
      return null;
    }

    // Check if approval is expired
    const expirationDate = data.expiration_date ? new Date(data.expiration_date) : null;
    const isExpired = expirationDate ? expirationDate < new Date() : false;

    if (isExpired) {
      console.warn(`⚠️ Approval expired for ${manufacturer} ${productType}: ${expirationDate}`);
    }

    const spec: ManufacturerSpec = {
      manufacturer: data.manufacturer,
      productType: data.product_type,
      fpaNumber: data.fpa_number,
      mcrfValue: data.mcrf_value,
      expirationDate,
      isExpired,
      notes: data.notes
    };

    console.log(`✅ Found specs: ${spec.fpaNumber} (MCRF: ${spec.mcrfValue} lbf)`);
    return spec;

  } catch (error) {
    console.error(`❌ Error fetching manufacturer specs for ${manufacturer} ${productType}:`, error);
    throw new Error(`Failed to fetch manufacturer specifications: ${error.message}`);
  }
}

/**
 * Get all available manufacturers for a specific product type
 * @param productType - Product type (e.g., 'tpo', 'epdm')
 * @returns Promise<ManufacturerSpec[]>
 */
export async function getAvailableManufacturers(productType: string): Promise<ManufacturerSpec[]> {
  try {
    console.log(`🔍 Querying available manufacturers for: ${productType}`);
    
    const { data, error } = await supabase
      .from('active_manufacturer_approvals')
      .select('*')
      .eq('product_type', productType.toLowerCase())
      .eq('is_active', true)
      .order('manufacturer');

    if (error) {
      throw error;
    }

    const manufacturers = data.map(item => {
      const expirationDate = item.expiration_date ? new Date(item.expiration_date) : null;
      const isExpired = expirationDate ? expirationDate < new Date() : false;

      return {
        manufacturer: item.manufacturer,
        productType: item.product_type,
        fpaNumber: item.fpa_number,
        mcrfValue: item.mcrf_value,
        expirationDate,
        isExpired,
        notes: item.notes
      };
    });

    console.log(`✅ Found ${manufacturers.length} manufacturers for ${productType}`);
    return manufacturers;

  } catch (error) {
    console.error(`❌ Error fetching available manufacturers for ${productType}:`, error);
    throw new Error(`Failed to fetch available manufacturers: ${error.message}`);
  }
}

/**
 * Get all approvals for a specific manufacturer
 * @param manufacturer - Manufacturer name
 * @returns Promise<ManufacturerSpec[]>
 */
export async function getManufacturerProducts(manufacturer: string): Promise<ManufacturerSpec[]> {
  try {
    console.log(`🔍 Querying products for manufacturer: ${manufacturer}`);
    
    const { data, error } = await supabase
      .from('active_manufacturer_approvals')
      .select('*')
      .eq('manufacturer', manufacturer.toLowerCase())
      .eq('is_active', true)
      .order('product_type');

    if (error) {
      throw error;
    }

    const products = data.map(item => {
      const expirationDate = item.expiration_date ? new Date(item.expiration_date) : null;
      const isExpired = expirationDate ? expirationDate < new Date() : false;

      return {
        manufacturer: item.manufacturer,
        productType: item.product_type,
        fpaNumber: item.fpa_number,
        mcrfValue: item.mcrf_value,
        expirationDate,
        isExpired,
        notes: item.notes
      };
    });

    console.log(`✅ Found ${products.length} products for ${manufacturer}`);
    return products;

  } catch (error) {
    console.error(`❌ Error fetching products for ${manufacturer}:`, error);
    throw new Error(`Failed to fetch manufacturer products: ${error.message}`);
  }
}

/**
 * Check if a manufacturer/product combination has valid approval
 * @param manufacturer - Manufacturer name
 * @param productType - Product type
 * @returns Promise<boolean>
 */
export async function hasValidApproval(manufacturer: string, productType: string): Promise<boolean> {
  try {
    const spec = await getManufacturerSpecs(manufacturer, productType);
    return spec !== null && !spec.isExpired;
  } catch (error) {
    console.error(`❌ Error checking approval validity:`, error);
    return false;
  }
}

/**
 * Get all expiring approvals within a specified number of days
 * @param daysUntilExpiration - Number of days to look ahead (default: 30)
 * @returns Promise<ManufacturerSpec[]>
 */
export async function getExpiringApprovals(daysUntilExpiration: number = 30): Promise<ManufacturerSpec[]> {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysUntilExpiration);

    console.log(`🔍 Querying approvals expiring before: ${futureDate.toISOString()}`);
    
    const { data, error } = await supabase
      .from('manufacturer_approvals')
      .select('*')
      .eq('is_active', true)
      .not('expiration_date', 'is', null)
      .lte('expiration_date', futureDate.toISOString())
      .order('expiration_date');

    if (error) {
      throw error;
    }

    const expiringApprovals = data.map(item => {
      const expirationDate = new Date(item.expiration_date);
      const isExpired = expirationDate < new Date();

      return {
        manufacturer: item.manufacturer,
        productType: item.product_type,
        fpaNumber: item.fpa_number,
        mcrfValue: item.mcrf_value,
        expirationDate,
        isExpired,
        notes: item.notes
      };
    });

    console.log(`⚠️ Found ${expiringApprovals.length} approvals expiring within ${daysUntilExpiration} days`);
    return expiringApprovals;

  } catch (error) {
    console.error(`❌ Error fetching expiring approvals:`, error);
    throw new Error(`Failed to fetch expiring approvals: ${error.message}`);
  }
}

/**
 * Legacy compatibility function - maps to new database structure
 * @deprecated Use getManufacturerSpecs() instead
 */
export async function getManufacturerData(manufacturer: string): Promise<any> {
  console.warn(`⚠️ getManufacturerData() is deprecated. Use getManufacturerSpecs() instead.`);
  
  try {
    const products = await getManufacturerProducts(manufacturer);
    
    // Convert to legacy format for backward compatibility
    const legacy = {
      hvhzCapable: true, // Assume all current manufacturers are HVHZ capable
      products: {}
    };

    products.forEach(product => {
      legacy.products[product.productType] = {
        fpa: product.fpaNumber,
        mcrf: product.mcrfValue,
        expiration: product.expirationDate,
        isExpired: product.isExpired
      };
    });

    return legacy;
  } catch (error) {
    console.error(`❌ Error in legacy getManufacturerData:`, error);
    throw error;
  }
}
