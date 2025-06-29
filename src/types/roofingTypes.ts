// types/roofingTypes.ts
// Centralized type definitions for membrane and insulation types

export interface MembraneType {
  value: string;
  label: string;
  description: string;
  templateCategory: 'single-ply' | 'bur' | 'ballasted' | 'modified-bitumen';
  requiresBallast?: boolean;
  typicalThickness?: string;
}

export interface InsulationType {
  value: string;
  label: string;
  description: string;
  rValue: string;
  compressiveStrength?: string;
  moistureResistance: 'excellent' | 'good' | 'fair' | 'poor';
  fireRating?: string;
}

// ✅ FIX: Add RoofLayer interface to match component expectations
export interface RoofLayer {
  id: string;
  type: 'membrane' | 'insulation' | 'deck' | 'barrier' | 'coverboard';
  description: string;
  attachment: 'mechanically_attached' | 'adhered' | 'ballasted' | 'welded';
  thickness: string;
  material?: string;
}

// Enhanced membrane types with template logic integration
export const MEMBRANE_TYPES: MembraneType[] = [
  {
    value: 'tpo',
    label: 'TPO',
    description: 'Thermoplastic Polyolefin - Single ply membrane',
    templateCategory: 'single-ply',
    typicalThickness: '45-80 mil'
  },
  {
    value: 'epdm',
    label: 'EPDM',
    description: 'Ethylene Propylene Diene Monomer - Rubber membrane',
    templateCategory: 'single-ply',
    typicalThickness: '45-90 mil'
  },
  {
    value: 'epdm-ballasted',
    label: 'Ballasted EPDM',
    description: 'EPDM with ballast system (gravel/pavers)',
    templateCategory: 'ballasted',
    requiresBallast: true,
    typicalThickness: '45-60 mil'
  },
  {
    value: 'pvc',
    label: 'PVC',
    description: 'Polyvinyl Chloride - Chemical resistant membrane',
    templateCategory: 'single-ply',
    typicalThickness: '45-80 mil'
  },
  {
    value: 'modified-bitumen',
    label: 'Modified Bitumen',
    description: 'APP or SBS modified bitumen',
    templateCategory: 'modified-bitumen',
    typicalThickness: '90-160 mil'
  },
  {
    value: 'bur',
    label: 'BUR',
    description: 'Built-Up Roofing - Multiple ply system',
    templateCategory: 'bur',
    typicalThickness: '3-5 plies'
  },
  {
    value: 'bur-gravel',
    label: 'BUR with Gravel',
    description: 'Built-up roof with gravel surface',
    templateCategory: 'bur',
    requiresBallast: true,
    typicalThickness: '3-5 plies + gravel'
  }
];

// Enhanced insulation types with comprehensive specifications
export const INSULATION_TYPES: InsulationType[] = [
  {
    value: 'polyiso',
    label: 'Polyisocyanurate (Polyiso)',
    description: 'High R-value, most common commercial insulation',
    rValue: 'R-6 to R-8 per inch',
    compressiveStrength: '20-25 psi',
    moistureResistance: 'good',
    fireRating: 'Class A'
  },
  {
    value: 'eps',
    label: 'Expanded Polystyrene (EPS)',
    description: 'Lightweight, moisture resistant',
    rValue: 'R-3.6 to R-4.2 per inch',
    compressiveStrength: '10-15 psi',
    moistureResistance: 'excellent',
    fireRating: 'Class A'
  },
  {
    value: 'xps',
    label: 'Extruded Polystyrene (XPS)',
    description: 'High compressive strength, moisture resistant',
    rValue: 'R-5 per inch',
    compressiveStrength: '15-60 psi',
    moistureResistance: 'excellent',
    fireRating: 'Class A'
  },
  {
    value: 'fiberglass',
    label: 'Yellow Fiberglass',
    description: 'Traditional glass fiber insulation boards',
    rValue: 'R-2.9 to R-3.8 per inch',
    compressiveStrength: '5-10 psi',
    moistureResistance: 'poor',
    fireRating: 'Class A'
  },
  {
    value: 'wood-fiber-board',
    label: 'Wood Fiber Board',
    description: 'Sustainable, breathable insulation',
    rValue: 'R-2.5 per inch',
    compressiveStrength: '8-12 psi',
    moistureResistance: 'fair',
    fireRating: 'Class A'
  },
  {
    value: 'lightweight-concrete',
    label: 'Lightweight Concrete',
    description: 'Structural insulating concrete',
    rValue: 'R-0.2 to R-0.6 per inch',
    compressiveStrength: '250-1000 psi',
    moistureResistance: 'good',
    fireRating: 'Class A'
  },
  {
    value: 'perlite',
    label: 'Perlite',
    description: 'Expanded volcanic glass insulation',
    rValue: 'R-2.7 per inch',
    compressiveStrength: '8-15 psi',
    moistureResistance: 'good',
    fireRating: 'Class A'
  },
  {
    value: 'mineral-wool',
    label: 'Mineral Wool',
    description: 'Fire resistant, high-temperature insulation',
    rValue: 'R-3.1 to R-4.3 per inch',
    compressiveStrength: '10-25 psi',
    moistureResistance: 'fair',
    fireRating: 'Class A'
  }
];

// Template mapping for SOW generation logic
export const getTemplateCategory = (membraneType: string): string => {
  const membrane = MEMBRANE_TYPES.find(m => m.value === membraneType);
  return membrane?.templateCategory || 'single-ply';
};

// Helper function to check if membrane requires ballast
export const requiresBallast = (membraneType: string): boolean => {
  const membrane = MEMBRANE_TYPES.find(m => m.value === membraneType);
  return membrane?.requiresBallast || false;
};

// Legacy value mapping for backward compatibility
export const LEGACY_MEMBRANE_MAPPING: Record<string, string> = {
  'TPO': 'tpo',
  'EPDM': 'epdm',
  'PVC': 'pvc',
  'Modified Bitumen': 'modified-bitumen',
  'BUR': 'bur',
  'Ballasted EPDM': 'epdm-ballasted',
  'BUR with Gravel': 'bur-gravel'
};

export const LEGACY_INSULATION_MAPPING: Record<string, string> = {
  'Polyisocyanurate': 'polyiso',
  'EPS': 'eps',
  'XPS': 'xps',
  'Fiberglass': 'fiberglass',
  'Wood Fiber Board': 'wood-fiber-board',
  'Lightweight Concrete': 'lightweight-concrete',
  'Perlite': 'perlite',
  'Mineral Wool': 'mineral-wool'
};
