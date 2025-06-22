
// Local types for engineering summary and self-healing actions
export interface SelfHealingAction {
  type: 'missing_field' | 'low_confidence' | 'fallback_selection' | 'auto_correction';
  field: string;
  originalValue?: any;
  correctedValue: any;
  reason: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  reviewRequired?: boolean;
}

export interface SectionOutput {
  id: string;
  title: string;
  included: boolean;
  rationale: string;
  content?: string;
  priority?: number;
  dependencies?: string[];
  warnings?: string[];
}

export interface SectionAnalysis {
  includedSections: SectionOutput[];
  excludedSections: SectionOutput[];
  reasoningMap: Record<string, string>;
  selfHealingActions: SelfHealingAction[];
  confidenceScore: number;
}

export interface EngineeringSummaryData {
  jurisdiction: {
    city: string;
    county: string;
    state: string;
    codeCycle: string;
    asceVersion: string;
    hvhz: boolean;
  };
  windAnalysis: {
    windSpeed: string;
    exposure: string;
    elevation: string;
    zonePressures: {
      zone1Field: string;
      zone1Perimeter: string;
      zone2Perimeter: string;
      zone3Corner: string;
    };
  };
  systemSelection: {
    selectedTemplate: string;
    rationale: string;
    rejectedManufacturers: string[];
    approvalSource: string[];
  };
  attachmentSpec: {
    fieldSpacing: string;
    perimeterSpacing: string;
    cornerSpacing: string;
    penetrationDepth: string;
    notes: string;
  };
  selfHealingActions?: SelfHealingAction[];
  sectionAnalysis?: SectionAnalysis;
  filename?: string;
  fileUrl?: string;
  generationTime?: number;
  fileSize?: number;
}
