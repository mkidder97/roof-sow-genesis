import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('Utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-2 py-1', 'bg-blue-500');
      expect(result).toBe('px-2 py-1 bg-blue-500');
    });

    it('should handle conditional class names', () => {
      const result = cn('base-class', true && 'active-class', false && 'inactive-class');
      expect(result).toBe('base-class active-class');
    });

    it('should handle Tailwind merge conflicts', () => {
      const result = cn('px-2', 'px-4');
      expect(result).toBe('px-4');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'another-class');
      expect(result).toBe('base-class another-class');
    });
  });
});
