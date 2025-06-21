
export interface ProjectMetadata {
  projectName: string;
  companyName: string;
  address: string;
  squareFootage: number;
  projectType: 'Recover' | 'Tear-Off' | 'Replacement';
  deckType: 'Steel' | 'Wood' | 'Concrete';
  buildingHeight: number;
  length: number;
  width: number;
}

export interface Environmental {
  city: string;
  state: string;
  zip: string;
  jurisdiction: string;
  elevation: number;
  exposureCategory: 'B' | 'C' | 'D';
  asceVersion: '7-10' | '7-16' | '7-22';
  hvhzZone: boolean;
}

export interface WindParameters {
  basicWindSpeed: number;
  designPressures: {
    zone1: number;
    zone2: number;
    zone3: number;
  };
}

export interface Membrane {
  manufacturer: string;
  productName: string;
  membraneType: 'TPO' | 'PVC';
  thickness: 45 | 60 | 80 | 115;
  attachmentMethod: 'Induction Welded' | 'Fully Adhered' | 'Mechanically Attached';
  warrantyTerm: 20 | 25 | 30;
}

export interface Insulation {
  type: 'Polyiso' | 'EPS' | 'HD Composite';
  rValue: number;
  coverboardRequired: boolean;
}

export interface Takeoff {
  drains: number;
  pipePenetrations: number;
  curbs: number;
  hvacUnits: number;
  skylights: number;
  expansionJoints: boolean;
  scuppers: number;
}

export interface Notes {
  addendaNotes: string;
  warrantyNotes: string;
  contractorName: string;
}

export interface SOWData {
  projectMetadata: ProjectMetadata;
  environmental: Environmental;
  windParameters: WindParameters;
  membrane: Membrane;
  insulation: Insulation;
  takeoff: Takeoff;
  notes: Notes;
}
