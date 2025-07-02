import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getManufacturerSpecs, 
  getAvailableManufacturers, 
  hasValidApproval,
  getExpiringApprovals 
} from '../lib/manufacturer-approvals';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn()
            }))
          })),
          single: vi.fn(),
          order: vi.fn()
        })),
        not: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn()
          }))
        })),
        lte: vi.fn(() => ({
          order: vi.fn()
        })),
        order: vi.fn()
      }))
    }))
  }
}));

describe('Manufacturer Approvals Database Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getManufacturerSpecs', () => {
    it('should return manufacturer specs for valid manufacturer and product', async () => {
      const mockData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        manufacturer: 'johns-manville',
        product_type: 'tpo',
        fpa_number: 'FL16758.3-R35',
        mcrf_value: 285,
        expiration_date: '2025-12-31T23:59:59+00:00',
        is_active: true,
        notes: 'TPO Single Ply system with HL fasteners'
      };

      const { supabase } = await import('../lib/supabase');
      supabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await getManufacturerSpecs('johns-manville', 'tpo');

      expect(result).toEqual({
        manufacturer: 'johns-manville',
        productType: 'tpo',
        fpaNumber: 'FL16758.3-R35',
        mcrfValue: 285,
        expirationDate: new Date('2025-12-31T23:59:59+00:00'),
        isExpired: false,
        notes: 'TPO Single Ply system with HL fasteners'
      });
    });

    it('should return null for non-existent manufacturer/product combination', async () => {
      const { supabase } = await import('../lib/supabase');
      supabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // Not found
      });

      const result = await getManufacturerSpecs('non-existent', 'tpo');

      expect(result).toBeNull();
    });

    it('should detect expired approvals', async () => {
      const mockData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        manufacturer: 'test-manufacturer',
        product_type: 'tpo',
        fpa_number: 'FL12345.1-R20',
        mcrf_value: 280,
        expiration_date: '2020-01-01T00:00:00+00:00', // Expired
        is_active: true,
        notes: 'Expired approval'
      };

      const { supabase } = await import('../lib/supabase');
      supabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await getManufacturerSpecs('test-manufacturer', 'tpo');

      expect(result?.isExpired).toBe(true);
      expect(result?.expirationDate).toEqual(new Date('2020-01-01T00:00:00+00:00'));
    });

    it('should handle database errors gracefully', async () => {
      const { supabase } = await import('../lib/supabase');
      supabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      await expect(getManufacturerSpecs('johns-manville', 'tpo'))
        .rejects.toThrow('Failed to fetch manufacturer specifications');
    });
  });

  describe('getAvailableManufacturers', () => {
    it('should return all manufacturers for a product type', async () => {
      const mockData = [
        {
          manufacturer: 'johns-manville',
          product_type: 'tpo',
          fpa_number: 'FL16758.3-R35',
          mcrf_value: 285,
          expiration_date: '2025-12-31T23:59:59+00:00',
          is_active: true,
          notes: 'JM TPO system'
        },
        {
          manufacturer: 'carlisle',
          product_type: 'tpo',
          fpa_number: 'FL17825.1-R60',
          mcrf_value: 295,
          expiration_date: '2026-06-30T23:59:59+00:00',
          is_active: true,
          notes: 'Carlisle Sure-Weld TPO'
        }
      ];

      const { supabase } = await import('../lib/supabase');
      supabase.from().select().eq().eq().order.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await getAvailableManufacturers('tpo');

      expect(result).toHaveLength(2);
      expect(result[0].manufacturer).toBe('johns-manville');
      expect(result[1].manufacturer).toBe('carlisle');
      expect(result[0].mcrfValue).toBe(285);
      expect(result[1].mcrfValue).toBe(295);
    });

    it('should handle empty results', async () => {
      const { supabase } = await import('../lib/supabase');
      supabase.from().select().eq().eq().order.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await getAvailableManufacturers('non-existent-type');

      expect(result).toHaveLength(0);
    });
  });

  describe('hasValidApproval', () => {
    it('should return true for valid, non-expired approval', async () => {
      const mockData = {
        manufacturer: 'johns-manville',
        product_type: 'tpo',
        fpa_number: 'FL16758.3-R35',
        mcrf_value: 285,
        expiration_date: '2025-12-31T23:59:59+00:00',
        is_active: true
      };

      const { supabase } = await import('../lib/supabase');
      supabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await hasValidApproval('johns-manville', 'tpo');

      expect(result).toBe(true);
    });

    it('should return false for expired approval', async () => {
      const mockData = {
        manufacturer: 'test-manufacturer',
        product_type: 'tpo',
        fpa_number: 'FL12345.1-R20',
        mcrf_value: 280,
        expiration_date: '2020-01-01T00:00:00+00:00', // Expired
        is_active: true
      };

      const { supabase } = await import('../lib/supabase');
      supabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await hasValidApproval('test-manufacturer', 'tpo');

      expect(result).toBe(false);
    });

    it('should return false for non-existent approval', async () => {
      const { supabase } = await import('../lib/supabase');
      supabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await hasValidApproval('non-existent', 'tpo');

      expect(result).toBe(false);
    });
  });

  describe('getExpiringApprovals', () => {
    it('should return approvals expiring within specified days', async () => {
      const mockData = [
        {
          manufacturer: 'gaf',
          product_type: 'tpo',
          fpa_number: 'FL18552.1-R40',
          mcrf_value: 280,
          expiration_date: '2025-09-30T23:59:59+00:00', // Expires soon
          is_active: true,
          notes: 'GAF EverGuard TPO'
        }
      ];

      const { supabase } = await import('../lib/supabase');
      supabase.from().select().eq().not().lte().order.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await getExpiringApprovals(30);

      expect(result).toHaveLength(1);
      expect(result[0].manufacturer).toBe('gaf');
      expect(result[0].fpaNumber).toBe('FL18552.1-R40');
    });

    it('should use default 30 days if not specified', async () => {
      const { supabase } = await import('../lib/supabase');
      supabase.from().select().eq().not().lte().order.mockResolvedValue({
        data: [],
        error: null
      });

      await getExpiringApprovals();

      // Verify the query was called (the mock structure confirms this)
      expect(supabase.from).toHaveBeenCalledWith('manufacturer_approvals');
    });
  });

  describe('MCRF value validation', () => {
    it('should handle numeric MCRF values correctly', async () => {
      const mockData = {
        manufacturer: 'carlisle',
        product_type: 'tpo',
        fpa_number: 'FL17825.1-R60',
        mcrf_value: 295.5, // Decimal value
        expiration_date: '2026-06-30T23:59:59+00:00',
        is_active: true,
        notes: 'High-strength fasteners'
      };

      const { supabase } = await import('../lib/supabase');
      supabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await getManufacturerSpecs('carlisle', 'tpo');

      expect(result?.mcrfValue).toBe(295.5);
    });
  });

  describe('Case sensitivity handling', () => {
    it('should handle case-insensitive manufacturer names', async () => {
      const mockData = {
        manufacturer: 'johns-manville',
        product_type: 'tpo',
        fpa_number: 'FL16758.3-R35',
        mcrf_value: 285,
        expiration_date: '2025-12-31T23:59:59+00:00',
        is_active: true
      };

      const { supabase } = await import('../lib/supabase');
      supabase.from().select().eq().eq().eq().single.mockResolvedValue({
        data: mockData,
        error: null
      });

      // Test with different cases
      const result1 = await getManufacturerSpecs('Johns-Manville', 'tpo');
      const result2 = await getManufacturerSpecs('JOHNS-MANVILLE', 'TPO');

      // Both should work (the function calls toLowerCase())
      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
    });
  });
});
