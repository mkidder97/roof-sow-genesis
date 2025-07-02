import { describe, it, expect, vi } from 'vitest';
import { determineExposureCategory, createWindAnalysisSummary } from '../lib/wind-analysis';

// Mock the jurisdiction-mapping module
vi.mock('../lib/jurisdiction-mapping', () => ({
  getWindPressureCoefficients: vi.fn().mockResolvedValue({
    zone1Field: -0.90,
    zone1Perimeter: -1.70,
    zone2Perimeter: -2.30,
    zone3Corner: -3.20
  })
}));

describe('Wind Analysis', () => {
  describe('determineExposureCategory', () => {
    it('should return D for coastal areas', () => {
      const coordinates = { lat: 25.8, lng: -80.2 }; // Miami area
      const result = determineExposureCategory('', coordinates);
      expect(result).toBe('D');
    });

    it('should return B for urban areas', () => {
      const coordinates = { lat: 40.7, lng: -74.0 }; // NYC area
      const result = determineExposureCategory('', coordinates);
      expect(result).toBe('B');
    });

    it('should return C for open terrain', () => {
      const coordinates = { lat: 40.0, lng: -100.0 }; // Great Plains
      const result = determineExposureCategory('', coordinates);
      expect(result).toBe('C');
    });

    it('should return C as default when no coordinates provided', () => {
      const result = determineExposureCategory('Standard building');
      expect(result).toBe('C');
    });

    it('should handle edge cases with invalid coordinates', () => {
      const coordinates = { lat: 0, lng: 0 }; // Invalid/ocean coordinates
      const result = determineExposureCategory('', coordinates);
      expect(result).toBe('C'); // Should default to C
    });
  });

  describe('createWindAnalysisSummary', () => {
    it('should create correct wind analysis summary for ASCE 7-22', async () => {
      const params = {
        asceVersion: '7-22' as const,
        latitude: 25.8,
        longitude: -80.2,
        buildingHeight: 30,
        exposureCategory: 'C' as const,
        elevation: 10
      };

      const result = {
        designWindSpeed: 175,
        exposureCategory: 'C' as const,
        elevation: 10,
        zonePressures: {
          zone1Field: -70.5,
          zone1Perimeter: -122.8,
          zone2Perimeter: -162.0,
          zone3Corner: -220.9
        }
      };

      const summary = await createWindAnalysisSummary(params, result);

      expect(summary).toMatchObject({
        method: 'ASCE 7-22 Components and Cladding Wind Pressure Analysis',
        asceVersion: '7-22',
        windSpeed: 175,
        zonePressures: result.zonePressures
      });

      expect(summary.reasoning).toContain('7-22 methodology');
      expect(summary.reasoning).toContain('C exposure');
      expect(summary.reasoning).toContain('10ft elevation');

      // Check that calculation factors are present and properly formatted
      expect(typeof summary.calculationFactors.Kh).toBe('number');
      expect(typeof summary.calculationFactors.Kzt).toBe('number');
      expect(typeof summary.calculationFactors.Kd).toBe('number');
      expect(typeof summary.calculationFactors.qh).toBe('number');
      expect(summary.calculationFactors.Kd).toBe(0.85); // ASCE 7-22 directionality factor
    });

    it('should handle different ASCE versions correctly', async () => {
      const params = {
        asceVersion: '7-16' as const,
        latitude: 32.8,
        longitude: -96.8,
        buildingHeight: 25,
        exposureCategory: 'B' as const,
        elevation: 500
      };

      const result = {
        designWindSpeed: 115,
        exposureCategory: 'B' as const,
        elevation: 500,
        zonePressures: {
          zone1Field: -45.2,
          zone1Perimeter: -78.5,
          zone2Perimeter: -95.8,
          zone3Corner: -125.4
        }
      };

      const summary = await createWindAnalysisSummary(params, result);

      expect(summary.method).toContain('ASCE 7-16');
      expect(summary.asceVersion).toBe('7-16');
      expect(summary.windSpeed).toBe(115);
    });

    it('should calculate factors for high elevation correctly', async () => {
      const params = {
        asceVersion: '7-22' as const,
        latitude: 39.0,
        longitude: -105.5, // Denver area
        buildingHeight: 40,
        exposureCategory: 'C' as const,
        elevation: 3500 // High elevation
      };

      const result = {
        designWindSpeed: 120,
        exposureCategory: 'C' as const,
        elevation: 3500,
        zonePressures: {
          zone1Field: -60.0,
          zone1Perimeter: -105.0,
          zone2Perimeter: -135.0,
          zone3Corner: -180.0
        }
      };

      const summary = await createWindAnalysisSummary(params, result);

      // High elevation should result in Kzt > 1.0
      expect(summary.calculationFactors.Kzt).toBeGreaterThan(1.0);
      expect(summary.reasoning).toContain('3500ft elevation');
    });
  });
});
