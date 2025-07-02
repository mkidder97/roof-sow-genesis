import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { engineeringConfig, getConfig, findMatchingTemplate } from '../services/engineering-config';
import type { TemplateCondition } from '../types/engineering-config';

// Mock Supabase for testing
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        })),
        order: jest.fn()
      }))
    }))
  }
}));

const mockSupabase = require('../config/supabase').supabase;

describe('Engineering Configuration Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    engineeringConfig.clearCache();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getConfig', () => {
    it('should successfully fetch importance factors', async () => {
      const mockData = {
        key: 'importance_factors',
        value: { standard: 1.0, essential: 1.15, emergency: 1.5 },
        description: 'Importance factors for building classifications'
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await getConfig('importance_factors');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData.value);
      expect(result.cached).toBe(false);
    });

    it('should return cached data on subsequent calls', async () => {
      const mockData = {
        key: 'importance_factors',
        value: { standard: 1.0, essential: 1.15, emergency: 1.5 }
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      // First call
      await getConfig('importance_factors');
      
      // Second call should use cache
      const result = await getConfig('importance_factors');

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const result = await getConfig('importance_factors');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    it('should handle missing configuration', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await getConfig('importance_factors');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Configuration not found');
    });
  });

  describe('Internal Pressure Coefficients', () => {
    it('should fetch internal pressure coefficients correctly', async () => {
      const mockData = {
        key: 'internal_pressure_coeffs',
        value: { enclosed: 0.18, partially_enclosed: 0.55, open: 0.0 }
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await getConfig('internal_pressure_coeffs');

      expect(result.success).toBe(true);
      expect(result.data?.enclosed).toBe(0.18);
      expect(result.data?.partially_enclosed).toBe(0.55);
      expect(result.data?.open).toBe(0.0);
    });

    it('should provide convenience method for internal pressure coefficients', async () => {
      const mockData = {
        key: 'internal_pressure_coeffs',
        value: { enclosed: 0.18, partially_enclosed: 0.55, open: 0.0 }
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const enclosedCoeff = await engineeringConfig.getInternalPressureCoeff('enclosed');
      const partiallyEnclosedCoeff = await engineeringConfig.getInternalPressureCoeff('partially_enclosed');
      const openCoeff = await engineeringConfig.getInternalPressureCoeff('open');

      expect(enclosedCoeff).toBe(0.18);
      expect(partiallyEnclosedCoeff).toBe(0.55);
      expect(openCoeff).toBe(0.0);
    });
  });

  describe('Directivity Factor', () => {
    it('should fetch directivity factor correctly', async () => {
      const mockData = {
        key: 'directivity_factor',
        value: { standard: 0.85 }
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await getConfig('directivity_factor');

      expect(result.success).toBe(true);
      expect(result.data?.standard).toBe(0.85);
    });

    it('should provide convenience method for directivity factor', async () => {
      const mockData = {
        key: 'directivity_factor',
        value: { standard: 0.85 }
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const factor = await engineeringConfig.getDirectivityFactor();

      expect(factor).toBe(0.85);
    });

    it('should return default value when database fails', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' }
      });

      const factor = await engineeringConfig.getDirectivityFactor();

      expect(factor).toBe(0.85); // Default fallback value
    });
  });

  describe('Template Matching', () => {
    const mockTemplateRules = [
      {
        condition: {
          roofType: 'tearoff',
          deckType: 'steel',
          membraneType: 'TPO',
          attachmentType: 'mechanically_attached',
          hasInsulation: true
        },
        template: 'T6-Tearoff-TPO(MA)-insul-steel',
        description: 'Tearoff TPO mechanically attached with insulation over steel deck'
      },
      {
        condition: {
          roofType: 'tearoff',
          deckType: 'gypsum',
          membraneType: 'TPO',
          attachmentType: 'adhered',
          hasInsulation: true,
          insulationAttachment: 'adhered'
        },
        template: 'T8-Tearoff-TPO(adhered)-insul(adhered)-gypsum',
        description: 'Tearoff TPO fully adhered with adhered insulation over gypsum deck'
      },
      {
        condition: {
          roofType: 'recover',
          deckType: 'steel',
          membraneType: 'TPO',
          attachmentType: 'mechanically_attached',
          hasCoverBoard: true,
          existingSystem: 'BUR',
          hasInsulation: true
        },
        template: 'T1-Recover-TPO(MA)-cvr bd-BUR-insul-steel',
        description: 'Recover TPO mechanically attached with cover board over BUR'
      }
    ];

    beforeEach(() => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          key: 'template_rules',
          value: mockTemplateRules
        },
        error: null
      });
    });

    it('should find exact matching template', async () => {
      const conditions: TemplateCondition = {
        roofType: 'tearoff',
        deckType: 'steel',
        membraneType: 'TPO',
        attachmentType: 'mechanically_attached',
        hasInsulation: true
      };

      const result = await findMatchingTemplate(conditions);

      expect(result.success).toBe(true);
      expect(result.data).toBe('T6-Tearoff-TPO(MA)-insul-steel');
    });

    it('should find partial matching template', async () => {
      const conditions: TemplateCondition = {
        roofType: 'tearoff',
        deckType: 'steel',
        membraneType: 'TPO'
      };

      const result = await findMatchingTemplate(conditions);

      expect(result.success).toBe(true);
      expect(result.data).toBe('T6-Tearoff-TPO(MA)-insul-steel');
    });

    it('should find gypsum deck template', async () => {
      const conditions: TemplateCondition = {
        roofType: 'tearoff',
        deckType: 'gypsum',
        membraneType: 'TPO',
        attachmentType: 'adhered',
        hasInsulation: true,
        insulationAttachment: 'adhered'
      };

      const result = await findMatchingTemplate(conditions);

      expect(result.success).toBe(true);
      expect(result.data).toBe('T8-Tearoff-TPO(adhered)-insul(adhered)-gypsum');
    });

    it('should find recover template', async () => {
      const conditions: TemplateCondition = {
        roofType: 'recover',
        deckType: 'steel',
        membraneType: 'TPO',
        attachmentType: 'mechanically_attached',
        hasCoverBoard: true,
        existingSystem: 'BUR',
        hasInsulation: true
      };

      const result = await findMatchingTemplate(conditions);

      expect(result.success).toBe(true);
      expect(result.data).toBe('T1-Recover-TPO(MA)-cvr bd-BUR-insul-steel');
    });

    it('should return error for non-matching conditions', async () => {
      const conditions: TemplateCondition = {
        roofType: 'unknown',
        deckType: 'concrete',
        membraneType: 'EPDM'
      };

      const result = await findMatchingTemplate(conditions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No matching template found');
    });

    it('should handle database error for template rules', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Template rules not found' }
      });

      const conditions: TemplateCondition = {
        roofType: 'tearoff',
        deckType: 'steel'
      };

      const result = await findMatchingTemplate(conditions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load template rules');
    });
  });

  describe('Convenience Methods', () => {
    it('should return correct importance factors', async () => {
      const mockData = {
        key: 'importance_factors',
        value: { standard: 1.0, essential: 1.15, emergency: 1.5 }
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const standardFactor = await engineeringConfig.getImportanceFactor('standard');
      const essentialFactor = await engineeringConfig.getImportanceFactor('essential');
      const emergencyFactor = await engineeringConfig.getImportanceFactor('emergency');

      expect(standardFactor).toBe(1.0);
      expect(essentialFactor).toBe(1.15);
      expect(emergencyFactor).toBe(1.5);
    });

    it('should return default values when database fails', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const standardFactor = await engineeringConfig.getImportanceFactor('standard');
      const internalPressure = await engineeringConfig.getInternalPressureCoeff('enclosed');
      const directivity = await engineeringConfig.getDirectivityFactor();

      expect(standardFactor).toBe(1.0); // Default fallback
      expect(internalPressure).toBe(0.18); // Default fallback
      expect(directivity).toBe(0.85); // Default fallback
    });
  });

  describe('Cache Management', () => {
    it('should clear cache properly', async () => {
      const mockData = {
        key: 'importance_factors',
        value: { standard: 1.0, essential: 1.15, emergency: 1.5 }
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      // First call to populate cache
      await getConfig('importance_factors');
      
      // Clear cache
      engineeringConfig.clearCache();
      
      // Second call should hit database again
      const result = await getConfig('importance_factors');

      expect(result.success).toBe(true);
      expect(result.cached).toBe(false);
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const result = await getConfig('importance_factors');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected database error');
    });

    it('should handle network timeouts', async () => {
      mockSupabase.from().select().eq().single.mockRejectedValue(
        new Error('Network timeout')
      );

      const result = await getConfig('importance_factors');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
    });
  });
});
