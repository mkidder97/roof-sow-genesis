import { RoofLayer } from '@/types/roofingTypes';

// Template-Assembly Mapping Engine for Phase 2
export class AssemblyTemplateEngine {
  
  /**
   * Generate assembly layers from template selection
   * Template → Assembly direction
   */
  static getTemplateAssembly(
    membraneType?: string, 
    insulationType?: string, 
    deckType?: string,
    projectType: 'recover' | 'tearoff' | 'new' = 'tearoff'
  ): RoofLayer[] {
    const layers: RoofLayer[] = [];
    let layerId = 1;

    // Helper function to create layer
    const createLayer = (
      type: RoofLayer['type'], 
      material: string, 
      thickness: string, 
      attachment: RoofLayer['attachment'],
      description?: string
    ): RoofLayer => ({
      id: `layer_${layerId++}`,
      type,
      description: description || `${material} ${type}`,
      attachment,
      thickness,
      material
    });

    // 1. Always start with deck (bottom layer)
    if (deckType) {
      const deckAttachment = 'mechanically_attached';
      let deckDescription = '';
      let deckThickness = '';
      
      switch (deckType) {
        case 'steel':
          deckDescription = 'Steel Deck';
          deckThickness = '22GA';
          break;
        case 'concrete':
          deckDescription = 'Concrete Deck';
          deckThickness = '4"';
          break;
        case 'wood':
          deckDescription = 'Wood Deck';
          deckThickness = '5/8"';
          break;
        case 'gypsum':
          deckDescription = 'Gypsum Deck';
          deckThickness = '2"';
          break;
        default:
          deckDescription = 'Steel Deck';
          deckThickness = '22GA';
      }
      
      layers.push(createLayer('deck', deckType, deckThickness, deckAttachment, deckDescription));
    }

    // 2. Add insulation layer
    if (insulationType) {
      let insulationThickness = '4.5"';
      let insulationAttachment: RoofLayer['attachment'] = 'mechanically_attached';
      let insulationDescription = '';

      switch (insulationType) {
        case 'polyiso':
          insulationDescription = 'Polyisocyanurate Insulation';
          insulationThickness = '4.5" (R-25)';
          break;
        case 'eps':
          insulationDescription = 'EPS Insulation';
          insulationThickness = '6" (R-24)';
          break;
        case 'xps':
          insulationDescription = 'XPS Insulation';
          insulationThickness = '5" (R-25)';
          break;
        case 'mineral-wool':
          insulationDescription = 'Mineral Wool Insulation';
          insulationThickness = '6" (R-24)';
          break;
        default:
          insulationDescription = 'Polyisocyanurate Insulation';
      }

      // Special case: Gypsum deck requires adhered insulation
      if (deckType === 'gypsum') {
        insulationAttachment = 'adhered';
      }

      layers.push(createLayer('insulation', insulationType, insulationThickness, insulationAttachment, insulationDescription));
    }

    // 3. Add cover board for certain combinations
    if (membraneType === 'tpo' && deckType === 'steel') {
      layers.push(createLayer('coverboard', 'Gypsum', '1/4"', 'mechanically_attached', 'Gypsum Cover Board'));
    }

    // 4. Add membrane layer (top)
    if (membraneType) {
      let membraneThickness = '60-mil';
      let membraneAttachment: RoofLayer['attachment'] = 'mechanically_attached';
      let membraneDescription = '';

      switch (membraneType) {
        case 'tpo':
          membraneDescription = 'TPO Membrane';
          membraneThickness = '60-mil';
          membraneAttachment = deckType === 'gypsum' ? 'adhered' : 'mechanically_attached';
          break;
        case 'epdm':
          membraneDescription = 'EPDM Membrane';
          membraneThickness = '60-mil';
          membraneAttachment = 'adhered';
          break;
        case 'epdm-ballasted':
          membraneDescription = 'Ballasted EPDM Membrane';
          membraneThickness = '45-mil';
          membraneAttachment = 'ballasted';
          break;
        case 'pvc':
          membraneDescription = 'PVC Membrane';
          membraneThickness = '60-mil';
          membraneAttachment = 'mechanically_attached';
          break;
        case 'modified-bitumen':
          membraneDescription = 'Modified Bitumen';
          membraneThickness = '160-mil';
          membraneAttachment = 'adhered';
          break;
        case 'bur':
          membraneDescription = 'Built-Up Roofing';
          membraneThickness = '4-ply';
          membraneAttachment = 'adhered';
          break;
        default:
          membraneDescription = 'TPO Membrane';
      }

      layers.push(createLayer('membrane', membraneType, membraneThickness, membraneAttachment, membraneDescription));
    }

    return layers;
  }

  /**
   * Get compatible templates from assembly layers
   * Assembly → Template direction
   */
  static getCompatibleTemplates(layers: RoofLayer[]): TemplateCompatibility {
    const compatibility: TemplateCompatibility = {
      recommendedTemplate: 'T6-Tearoff-TPO(MA)-insul-steel',
      compatibleTemplates: [],
      warnings: [],
      confidence: 100
    };

    // Extract key components from assembly
    const membrane = layers.find(l => l.type === 'membrane');
    const insulation = layers.find(l => l.type === 'insulation');
    const deck = layers.find(l => l.type === 'deck');

    // Template matching logic
    if (membrane && deck) {
      const membraneType = membrane.material?.toLowerCase() || '';
      const deckType = deck.material?.toLowerCase() || '';
      const isAdhered = membrane.attachment === 'adhered';

      // Determine best template match
      if (membraneType.includes('tpo')) {
        if (deckType.includes('gypsum') && isAdhered) {
          compatibility.recommendedTemplate = 'T8-Tearoff-TPO(adhered)-insul(adhered)-gypsum';
        } else if (deckType.includes('lightweight') || deckType.includes('concrete')) {
          compatibility.recommendedTemplate = 'T7-Tearoff-TPO(MA)-insul-lwc-steel';
        } else {
          compatibility.recommendedTemplate = 'T6-Tearoff-TPO(MA)-insul-steel';
        }
      } else if (membraneType.includes('epdm')) {
        if (membrane.attachment === 'ballasted') {
          compatibility.recommendedTemplate = 'EPDM-Ballasted-System';
        } else {
          compatibility.recommendedTemplate = 'EPDM-Adhered-System';
        }
      } else if (membraneType.includes('pvc')) {
        compatibility.recommendedTemplate = 'PVC-Mechanically-Attached';
      }

      // Build compatible templates list
      compatibility.compatibleTemplates = [
        compatibility.recommendedTemplate,
        'T6-Tearoff-TPO(MA)-insul-steel',
        'T5-Recover-TPO(Rhino)-iso-EPS flute fill-SSR'
      ];

      // Add warnings for unusual combinations
      if (deckType.includes('gypsum') && !isAdhered) {
        compatibility.warnings.push('Gypsum deck typically requires adhered membrane');
        compatibility.confidence = 75;
      }

      if (membraneType.includes('epdm') && membrane.attachment === 'mechanically_attached') {
        compatibility.warnings.push('EPDM is typically adhered, not mechanically attached');
        compatibility.confidence = 60;
      }
    }

    return compatibility;
  }

  /**
   * Validate assembly for engineering requirements
   */
  static validateAssembly(layers: RoofLayer[]): AssemblyValidation {
    const validation: AssemblyValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check for required layers
    const hasDeck = layers.some(l => l.type === 'deck');
    const hasInsulation = layers.some(l => l.type === 'insulation');
    const hasMembrane = layers.some(l => l.type === 'membrane');

    if (!hasDeck) {
      validation.errors.push('Deck layer is required');
      validation.isValid = false;
    }

    if (!hasMembrane) {
      validation.errors.push('Membrane layer is required');
      validation.isValid = false;
    }

    if (!hasInsulation) {
      validation.warnings.push('Insulation layer recommended for energy efficiency');
    }

    // Check layer order (deck should be first, membrane should be last)
    if (layers.length > 1) {
      const firstLayer = layers[0];
      const lastLayer = layers[layers.length - 1];

      if (firstLayer.type !== 'deck') {
        validation.warnings.push('Deck layer should typically be the bottom layer');
      }

      if (lastLayer.type !== 'membrane') {
        validation.warnings.push('Membrane layer should typically be the top layer');
      }
    }

    // Check attachment compatibility
    const membrane = layers.find(l => l.type === 'membrane');
    const deck = layers.find(l => l.type === 'deck');

    if (membrane && deck) {
      if (deck.material?.toLowerCase().includes('gypsum') && membrane.attachment !== 'adhered') {
        validation.warnings.push('Gypsum deck typically requires adhered membrane attachment');
      }

      if (membrane.material?.toLowerCase().includes('epdm') && membrane.attachment === 'mechanically_attached') {
        validation.suggestions.push('Consider adhered attachment for EPDM membrane');
      }
    }

    return validation;
  }

  /**
   * Get smart suggestions for improving assembly
   */
  static getAssemblySuggestions(layers: RoofLayer[]): string[] {
    const suggestions: string[] = [];

    const membrane = layers.find(l => l.type === 'membrane');
    const insulation = layers.find(l => l.type === 'insulation');
    const deck = layers.find(l => l.type === 'deck');

    // Performance suggestions
    if (insulation && insulation.thickness) {
      const rValue = parseFloat(insulation.thickness.match(/R-(\d+)/)?.[1] || '0');
      if (rValue < 20) {
        suggestions.push('Consider increasing insulation R-value to R-25 or higher for better energy efficiency');
      }
    }

    // Compatibility suggestions
    if (membrane?.material?.toLowerCase().includes('tpo') && !layers.some(l => l.type === 'coverboard')) {
      suggestions.push('Consider adding gypsum cover board for enhanced puncture resistance');
    }

    return suggestions;
  }
}

// Supporting interfaces
export interface TemplateCompatibility {
  recommendedTemplate: string;
  compatibleTemplates: string[];
  warnings: string[];
  confidence: number; // 0-100%
}

export interface AssemblyValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Template definitions
export const TEMPLATE_DEFINITIONS = {
  'T6-Tearoff-TPO(MA)-insul-steel': {
    name: 'T6 Tearoff TPO Mechanically Attached',
    description: 'TPO mechanically attached over insulation on steel deck',
    membraneType: 'tpo',
    deckType: 'steel',
    attachmentMethod: 'mechanically_attached'
  },
  'T7-Tearoff-TPO(MA)-insul-lwc-steel': {
    name: 'T7 Tearoff TPO over Lightweight Concrete',
    description: 'TPO mechanically attached over insulation on lightweight concrete over steel',
    membraneType: 'tpo',
    deckType: 'lightweight_concrete',
    attachmentMethod: 'mechanically_attached'
  },
  'T8-Tearoff-TPO(adhered)-insul(adhered)-gypsum': {
    name: 'T8 Tearoff TPO Adhered over Gypsum',
    description: 'TPO adhered over adhered insulation on gypsum deck',
    membraneType: 'tpo',
    deckType: 'gypsum',
    attachmentMethod: 'adhered'
  },
  'T5-Recover-TPO(Rhino)-iso-EPS flute fill-SSR': {
    name: 'T5 Recover TPO with EPS Fill',
    description: 'TPO recover system with EPS flute fill over structural standing seam',
    membraneType: 'tpo',
    deckType: 'steel',
    attachmentMethod: 'mechanically_attached',
    isRecover: true
  }
};
