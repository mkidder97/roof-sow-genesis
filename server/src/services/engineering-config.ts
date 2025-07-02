import { supabase } from '../config/supabase';
import type {
  ConfigKey,
  ConfigValueMap,
  EngineeringConfigRecord,
  ConfigServiceResponse,
  TemplateCondition,
  TemplateRule
} from '../types/engineering-config';

/**
 * Engineering Configuration Service
 * Provides type-safe access to database-stored engineering constants and configuration values
 */
class EngineeringConfigService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 1000 * 60 * 15; // 15 minutes

  /**
   * Get configuration value by key with type safety
   */
  async getConfig<K extends ConfigKey>(key: K): Promise<ConfigServiceResponse<ConfigValueMap[K]>> {
    try {
      // Check cache first
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return {
          success: true,
          data: cached.data,
          cached: true
        };
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('engineering_config')
        .select('*')
        .eq('key', key)
        .single();

      if (error) {
        console.error(`Error fetching config for key ${key}:`, error);
        return {
          success: false,
          error: error.message
        };
      }

      if (!data) {
        return {
          success: false,
          error: `Configuration not found for key: ${key}`
        };
      }

      // Parse and cache the result
      const parsedValue = data.value as ConfigValueMap[K];
      this.cache.set(key, {
        data: parsedValue,
        timestamp: Date.now()
      });

      return {
        success: true,
        data: parsedValue,
        cached: false
      };
    } catch (error) {
      console.error(`Unexpected error fetching config for key ${key}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get multiple configuration values at once
   */
  async getConfigs<K extends ConfigKey>(keys: K[]): Promise<{
    [P in K]: ConfigServiceResponse<ConfigValueMap[P]>
  }> {
    const results = await Promise.all(
      keys.map(async (key) => ({
        key,
        result: await this.getConfig(key)
      }))
    );

    return results.reduce((acc, { key, result }) => {
      acc[key] = result;
      return acc;
    }, {} as any);
  }

  /**
   * Get all configuration values
   */
  async getAllConfigs(): Promise<ConfigServiceResponse<Record<string, any>>> {
    try {
      const { data, error } = await supabase
        .from('engineering_config')
        .select('*')
        .order('key');

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      const configs = data.reduce((acc, record) => {
        acc[record.key] = record.value;
        // Cache individual items
        this.cache.set(record.key, {
          data: record.value,
          timestamp: Date.now()
        });
        return acc;
      }, {} as Record<string, any>);

      return {
        success: true,
        data: configs
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find matching template based on project conditions
   */
  async findMatchingTemplate(conditions: TemplateCondition): Promise<ConfigServiceResponse<string>> {
    try {
      const rulesResponse = await this.getConfig('template_rules');
      
      if (!rulesResponse.success || !rulesResponse.data) {
        return {
          success: false,
          error: 'Failed to load template rules'
        };
      }

      const rules = rulesResponse.data;
      
      // Find the first rule that matches all provided conditions
      const matchingRule = rules.find((rule: TemplateRule) => {
        return Object.entries(conditions).every(([key, value]) => {
          const ruleValue = rule.condition[key as keyof TemplateCondition];
          return ruleValue === undefined || ruleValue === value;
        });
      });

      if (!matchingRule) {
        return {
          success: false,
          error: `No matching template found for conditions: ${JSON.stringify(conditions)}`
        };
      }

      return {
        success: true,
        data: matchingRule.template
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update configuration value (admin function)
   */
  async updateConfig<K extends ConfigKey>(
    key: K, 
    value: ConfigValueMap[K],
    description?: string
  ): Promise<ConfigServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('engineering_config')
        .upsert({
          key,
          value: value as any,
          description,
          updated_at: new Date().toISOString()
        });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Clear cache for this key
      this.cache.delete(key);

      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convenience methods for commonly used values
   */
  async getImportanceFactor(classification: 'standard' | 'essential' | 'emergency'): Promise<number> {
    const response = await this.getConfig('importance_factors');
    return response.success ? response.data![classification] : 1.0; // Default fallback
  }

  async getInternalPressureCoeff(enclosure: 'enclosed' | 'partially_enclosed' | 'open'): Promise<number> {
    const response = await this.getConfig('internal_pressure_coeffs');
    return response.success ? response.data![enclosure] : 0.18; // Default fallback
  }

  async getDirectivityFactor(): Promise<number> {
    const response = await this.getConfig('directivity_factor');
    return response.success ? response.data!.standard : 0.85; // Default fallback
  }
}

// Export singleton instance
export const engineeringConfig = new EngineeringConfigService();

// Export individual functions for convenience
export const getConfig = engineeringConfig.getConfig.bind(engineeringConfig);
export const getConfigs = engineeringConfig.getConfigs.bind(engineeringConfig);
export const getAllConfigs = engineeringConfig.getAllConfigs.bind(engineeringConfig);
export const findMatchingTemplate = engineeringConfig.findMatchingTemplate.bind(engineeringConfig);
export const getImportanceFactor = engineeringConfig.getImportanceFactor.bind(engineeringConfig);
export const getInternalPressureCoeff = engineeringConfig.getInternalPressureCoeff.bind(engineeringConfig);
export const getDirectivityFactor = engineeringConfig.getDirectivityFactor.bind(engineeringConfig);
