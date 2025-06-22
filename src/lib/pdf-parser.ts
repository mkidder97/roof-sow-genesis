// Enhanced PDF parsing service for comprehensive roofing project data extraction
// Supports takeoff quantities, roof features, and detailed specifications

interface ExtractedData {
  // Basic project info
  projectName?: string;
  address?: string;
  companyName?: string;
  squareFootage?: number;
  buildingHeight?: number;
  buildingDimensions?: {
    length: number;
    width: number;
  };
  elevation?: number;
  
  // Roof system specifications
  membraneThickness?: string;
  membraneColor?: string;
  deckType?: string;
  roofSlope?: number;
  exposureCategory?: string;
  
  // Insulation specifications
  insulationType?: string;
  insulationThickness?: number;
  insulationRValue?: number;
  coverBoardType?: string;
  coverBoardThickness?: number;
  hasExistingInsulation?: boolean;
  existingInsulationCondition?: string;
  
  // Roof features and quantities (NEW)
  numberOfDrains?: number;
  drainTypes?: string[];
  numberOfPenetrations?: number;
  penetrationTypes?: string[];
  skylights?: number;
  roofHatches?: number;
  hvacUnits?: number;
  walkwayPadRequested?: boolean;
  gutterType?: string;
  downspouts?: number;
  expansionJoints?: number;
  parapetHeight?: number;
  roofConfiguration?: string;
  
  // Takeoff quantities (NEW)
  linearFootFlashing?: number;
  linearFootEdgeMetal?: number;
  linearFootGutter?: number;
  squareFootWalkwayPads?: number;
  
  confidence: number; // 0-1 score for extraction confidence
}

interface ParsedField {
  field: string;
  value: any;
  confidence: number;
  source: string; // The text snippet where this was found
}

export class PDFParsingService {
  private static patterns = {
    // Project identification patterns
    projectName: [
      /(?:project\s*(?:name)?:?\s*)([^\n\r]+)/i,
      /(?:job\s*(?:name)?:?\s*)([^\n\r]+)/i,
      /(?:site\s*(?:name)?:?\s*)([^\n\r]+)/i,
      /(?:building\s*(?:name)?:?\s*)([^\n\r]+)/i,
    ],
    
    // Address patterns
    address: [
      /(?:address:?\s*)([^\n\r]+(?:street|st|ave|avenue|rd|road|drive|dr|blvd|boulevard)[^\n\r]*)/i,
      /(?:location:?\s*)([^\n\r]+(?:street|st|ave|avenue|rd|road|drive|dr|blvd|boulevard)[^\n\r]*)/i,
      /(?:site\s*address:?\s*)([^\n\r]+)/i,
      /(\d+\s+[A-Za-z\s]+(?:street|st|ave|avenue|rd|road|drive|dr|blvd|boulevard)[^\n\r]*)/i,
    ],
    
    // Company name patterns
    companyName: [
      /(?:contractor:?\s*)([^\n\r]+)/i,
      /(?:company:?\s*)([^\n\r]+)/i,
      /(?:owner:?\s*)([^\n\r]+)/i,
      /(?:client:?\s*)([^\n\r]+)/i,
    ],
    
    // Square footage patterns
    squareFootage: [
      /(?:square\s*(?:feet|footage|ft):?\s*)([\d,]+)/i,
      /(?:area:?\s*)([\d,]+)\s*(?:square\s*(?:feet|ft)|sf)/i,
      /(?:total\s*area:?\s*)([\d,]+)/i,
      /([\d,]+)\s*(?:square\s*(?:feet|ft)|sf)/i,
    ],
    
    // Building height patterns
    buildingHeight: [
      /(?:building\s*height:?\s*)([\d.]+)\s*(?:feet|ft)/i,
      /(?:height:?\s*)([\d.]+)\s*(?:feet|ft)/i,
      /(?:roof\s*height:?\s*)([\d.]+)\s*(?:feet|ft)/i,
    ],
    
    // Building dimensions patterns
    buildingDimensions: [
      /(?:dimensions?:?\s*)([\d.]+)\s*(?:x|by|\*)\s*([\d.]+)/i,
      /(?:length:?\s*)([\d.]+)[\s\S]*?(?:width:?\s*)([\d.]+)/i,
      /([\d.]+)\s*(?:ft|feet)\s*(?:x|by|\*)\s*([\d.]+)\s*(?:ft|feet)/i,
    ],
    
    // Elevation patterns
    elevation: [
      /(?:elevation:?\s*)([\d.]+)\s*(?:feet|ft)/i,
      /(?:height\s*above\s*sea\s*level:?\s*)([\d.]+)/i,
      /(?:altitude:?\s*)([\d.]+)/i,
    ],
    
    // Membrane specifications
    membraneThickness: [
      /(?:membrane\s*thickness:?\s*)([\d.]+)\s*mil/i,
      /(?:TPO\s*thickness:?\s*)([\d.]+)/i,
      /([\d.]+)\s*mil\s*(?:membrane|TPO)/i,
    ],
    
    membraneColor: [
      /(?:membrane\s*color:?\s*)(\w+)/i,
      /(?:TPO\s*color:?\s*)(\w+)/i,
      /(?:color:?\s*)(\w+)\s*(?:membrane|TPO)/i,
    ],
    
    // Deck type patterns
    deckType: [
      /(?:deck\s*type:?\s*)(\w+)/i,
      /(?:roof\s*deck:?\s*)(\w+)/i,
      /(steel|wood|concrete)\s*deck/i,
    ],
    
    // Enhanced roof features patterns
    numberOfDrains: [
      /(?:roof\s*drains?:?\s*)([\d]+)/i,
      /(?:drains?:?\s*)([\d]+)/i,
      /(?:number\s*of\s*drains?:?\s*)([\d]+)/i,
      /([\d]+)\s*(?:roof\s*)?drains?/i,
      /(?:qty\.?\s*drains?:?\s*)([\d]+)/i,
    ],
    
    drainTypes: [
      /(?:drain\s*types?:?\s*)([^\n\r]+)/i,
      /(?:roof\s*drain\s*types?:?\s*)([^\n\r]+)/i,
      /(roof\s*drain|scupper|overflow\s*drain|area\s*drain)/gi,
    ],
    
    numberOfPenetrations: [
      /(?:penetrations?:?\s*)([\d]+)/i,
      /(?:roof\s*penetrations?:?\s*)([\d]+)/i,
      /(?:number\s*of\s*penetrations?:?\s*)([\d]+)/i,
      /([\d]+)\s*penetrations?/i,
      /(?:qty\.?\s*penetrations?:?\s*)([\d]+)/i,
    ],
    
    penetrationTypes: [
      /(?:penetration\s*types?:?\s*)([^\n\r]+)/i,
      /(hvac|plumbing\s*vent|electrical|gas\s*line|conduit)/gi,
    ],
    
    skylights: [
      /(?:skylights?:?\s*)([\d]+)/i,
      /(?:number\s*of\s*skylights?:?\s*)([\d]+)/i,
      /([\d]+)\s*skylights?/i,
      /(?:qty\.?\s*skylights?:?\s*)([\d]+)/i,
    ],
    
    roofHatches: [
      /(?:roof\s*hatches?:?\s*)([\d]+)/i,
      /(?:hatches?:?\s*)([\d]+)/i,
      /([\d]+)\s*(?:roof\s*)?hatches?/i,
      /(?:access\s*hatches?:?\s*)([\d]+)/i,
    ],
    
    hvacUnits: [
      /(?:hvac\s*units?:?\s*)([\d]+)/i,
      /(?:air\s*conditioning\s*units?:?\s*)([\d]+)/i,
      /(?:rtus?:?\s*)([\d]+)/i,
      /([\d]+)\s*hvac\s*units?/i,
      /(?:rooftop\s*units?:?\s*)([\d]+)/i,
    ],
    
    walkwayPadRequested: [
      /walkway\s*pads?\s*(?:required|requested|needed)/i,
      /(?:include|add)\s*walkway\s*pads?/i,
      /walkway\s*protection/i,
    ],
    
    gutterType: [
      /(?:gutter\s*type:?\s*)(\w+)/i,
      /(?:gutters?:?\s*)(\w+)/i,
      /(internal|external|box|k-style|half-round)\s*gutters?/i,
    ],
    
    downspouts: [
      /(?:downspouts?:?\s*)([\d]+)/i,
      /(?:number\s*of\s*downspouts?:?\s*)([\d]+)/i,
      /([\d]+)\s*downspouts?/i,
    ],
    
    expansionJoints: [
      /(?:expansion\s*joints?:?\s*)([\d]+)/i,
      /(?:number\s*of\s*expansion\s*joints?:?\s*)([\d]+)/i,
      /([\d]+)\s*expansion\s*joints?/i,
      /(?:movement\s*joints?:?\s*)([\d]+)/i,
    ],
    
    parapetHeight: [
      /(?:parapet\s*height:?\s*)([\d.]+)\s*(?:inches?|in|")/i,
      /(?:parapet:?\s*)([\d.]+)\s*(?:inches?|in|")/i,
      /([\d.]+)\s*(?:inches?|in|")\s*parapet/i,
    ],
    
    roofConfiguration: [
      /(?:roof\s*configuration:?\s*)(\w+)/i,
      /(?:roof\s*levels?:?\s*)(\w+)/i,
      /(single\s*level|multi[\-\s]?level|stepped)/i,
    ],
    
    // Insulation patterns
    insulationType: [
      /(?:insulation\s*type:?\s*)([^\n\r]+)/i,
      /(?:insulation:?\s*)([^\n\r]+)/i,
      /(polyisocyanurate|polyiso|eps|xps|mineral\s*wool|fiberglass)/i,
    ],
    
    insulationThickness: [
      /(?:insulation\s*thickness:?\s*)([\d.]+)\s*(?:inches?|in|")/i,
      /([\d.]+)\s*(?:inches?|in|")\s*insulation/i,
      /(?:R[\-\s]?)([\d.]+)\s*insulation/i,
    ],
    
    insulationRValue: [
      /(?:R[\-\s]?value:?\s*)([\d.]+)/i,
      /(?:thermal\s*resistance:?\s*)([\d.]+)/i,
      /R[\-\s]?([\d.]+)/i,
    ],
    
    coverBoardType: [
      /(?:cover\s*board\s*type:?\s*)([^\n\r]+)/i,
      /(?:cover\s*board:?\s*)([^\n\r]+)/i,
      /(gypsum|cement|wood\s*fiber|glass\s*mat)/i,
    ],
    
    coverBoardThickness: [
      /(?:cover\s*board\s*thickness:?\s*)([\d.]+)\s*(?:inches?|in|")/i,
      /([\d.]+)\s*(?:inches?|in|")\s*cover\s*board/i,
    ],
    
    hasExistingInsulation: [
      /existing\s*insulation/i,
      /remove\s*existing\s*insulation/i,
      /over\s*existing\s*insulation/i,
    ],
    
    existingInsulationCondition: [
      /(?:existing\s*insulation\s*condition:?\s*)(\w+)/i,
      /existing\s*insulation\s*(?:is\s*)?(good|fair|poor|damaged)/i,
    ],
    
    // Linear measurements for takeoffs
    linearFootFlashing: [
      /(?:flashing:?\s*)([\d,]+)\s*(?:linear\s*)?(?:feet|ft|lf)/i,
      /(?:linear\s*feet\s*flashing:?\s*)([\d,]+)/i,
      /([\d,]+)\s*(?:lf|linear\s*feet)\s*flashing/i,
    ],
    
    linearFootEdgeMetal: [
      /(?:edge\s*metal:?\s*)([\d,]+)\s*(?:linear\s*)?(?:feet|ft|lf)/i,
      /(?:perimeter\s*edge:?\s*)([\d,]+)\s*(?:linear\s*)?(?:feet|ft|lf)/i,
      /([\d,]+)\s*(?:lf|linear\s*feet)\s*edge\s*metal/i,
    ],
    
    linearFootGutter: [
      /(?:gutters?:?\s*)([\d,]+)\s*(?:linear\s*)?(?:feet|ft|lf)/i,
      /([\d,]+)\s*(?:lf|linear\s*feet)\s*gutters?/i,
    ],
    
    squareFootWalkwayPads: [
      /(?:walkway\s*pads?:?\s*)([\d,]+)\s*(?:square\s*)?(?:feet|ft|sf)/i,
      /([\d,]+)\s*(?:sf|square\s*feet)\s*walkway/i,
    ],
  };

  /**
   * Parse PDF file and extract roofing project data
   */
  static async parsePDF(file: File): Promise<ExtractedData> {
    try {
      // Convert file to text using a simple text extraction approach
      const text = await this.extractTextFromPDF(file);
      
      if (!text || text.trim().length === 0) {
        throw new Error('No text content found in PDF');
      }

      // Extract data using pattern matching
      const extractedData = this.extractDataFromText(text);
      
      return extractedData;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from PDF file
   * This is a simplified version - in production, you'd use pdf-parse or similar
   */
  private static async extractTextFromPDF(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // For now, we'll simulate PDF text extraction
          // In a real implementation, you'd use pdf-parse or pdfjs-dist here
          
          // This is a placeholder that would be replaced with actual PDF parsing
          const simulatedText = this.simulatePDFTextExtraction(file.name);
          resolve(simulatedText);
          
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Enhanced text extraction simulation with more comprehensive data
   */
  private static simulatePDFTextExtraction(filename: string): string {
    // Enhanced simulation with takeoff quantities and detailed specifications
    return `
      COMMERCIAL ROOFING TAKEOFF SHEET
      
      Project Name: ${filename.replace('.pdf', '').replace(/[-_]/g, ' ')}
      Address: 1505 Wallace Rd, Carrollton, TX 75006
      Company: ABC Roofing Contractors
      
      Building Specifications:
      Square Footage: 154,400 sf
      Building Height: 30 feet
      Dimensions: 400 ft x 386 ft
      Elevation: 550 feet
      Roof Configuration: Multi-Level
      
      Roof System:
      Membrane Thickness: 60 mil
      Membrane Color: White
      Deck Type: Steel
      Roof Slope: 1/4" per foot (2%)
      
      Insulation System:
      Insulation Type: Polyisocyanurate
      Insulation Thickness: 3.0 inches
      R-Value: R-18
      Cover Board Type: Gypsum
      Cover Board Thickness: 5/8 inch
      Existing Insulation: Remove existing damaged insulation
      Existing Insulation Condition: Poor
      
      Roof Features & Quantities:
      Roof Drains: 8 qty
      Drain Types: Roof Drain, Scupper, Overflow Drain
      Penetrations: 15 qty
      Penetration Types: HVAC, Plumbing Vent, Electrical Conduit, Gas Line
      Skylights: 3 qty
      Roof Hatches: 2 qty
      HVAC Units: 5 RTUs
      Walkway Pads: Required for equipment access
      Gutter Type: Internal
      Downspouts: 6 qty
      Expansion Joints: 4 qty
      Parapet Height: 42 inches
      
      Linear Takeoff:
      Flashing: 2,450 linear feet
      Edge Metal: 1,680 linear feet
      Gutters: 320 linear feet
      Walkway Pads: 850 square feet
      
      Project Type: Tearoff and Replace
    `;
  }

  /**
   * Extract structured data from text using pattern matching
   */
  private static extractDataFromText(text: string): ExtractedData {
    const extractedFields: ParsedField[] = [];
    let totalConfidence = 0;
    let fieldCount = 0;

    // Extract each type of data
    for (const [fieldName, patterns] of Object.entries(this.patterns)) {
      const result = this.extractField(text, patterns, fieldName);
      if (result) {
        extractedFields.push(result);
        totalConfidence += result.confidence;
        fieldCount++;
      }
    }

    // Convert extracted fields to structured data
    const extractedData: ExtractedData = {
      confidence: fieldCount > 0 ? totalConfidence / fieldCount : 0,
    };

    extractedFields.forEach(field => {
      switch (field.field) {
        case 'projectName':
          extractedData.projectName = field.value;
          break;
        case 'address':
          extractedData.address = field.value;
          break;
        case 'companyName':
          extractedData.companyName = field.value;
          break;
        case 'squareFootage':
          extractedData.squareFootage = parseInt(field.value.replace(/,/g, ''));
          break;
        case 'buildingHeight':
          extractedData.buildingHeight = parseFloat(field.value);
          break;
        case 'buildingDimensions':
          const dimensions = field.value;
          if (Array.isArray(dimensions) && dimensions.length === 2) {
            extractedData.buildingDimensions = {
              length: parseFloat(dimensions[0]),
              width: parseFloat(dimensions[1]),
            };
          }
          break;
        case 'elevation':
          extractedData.elevation = parseFloat(field.value);
          break;
        case 'membraneThickness':
          extractedData.membraneThickness = field.value;
          break;
        case 'membraneColor':
          extractedData.membraneColor = field.value;
          break;
        case 'deckType':
          extractedData.deckType = field.value;
          break;
        case 'numberOfDrains':
          extractedData.numberOfDrains = parseInt(field.value);
          break;
        case 'drainTypes':
          extractedData.drainTypes = field.value;
          break;
        case 'numberOfPenetrations':
          extractedData.numberOfPenetrations = parseInt(field.value);
          break;
        case 'penetrationTypes':
          extractedData.penetrationTypes = field.value;
          break;
        case 'skylights':
          extractedData.skylights = parseInt(field.value);
          break;
        case 'roofHatches':
          extractedData.roofHatches = parseInt(field.value);
          break;
        case 'hvacUnits':
          extractedData.hvacUnits = parseInt(field.value);
          break;
        case 'walkwayPadRequested':
          extractedData.walkwayPadRequested = field.value === true;
          break;
        case 'gutterType':
          extractedData.gutterType = field.value;
          break;
        case 'downspouts':
          extractedData.downspouts = parseInt(field.value);
          break;
        case 'expansionJoints':
          extractedData.expansionJoints = parseInt(field.value);
          break;
        case 'parapetHeight':
          extractedData.parapetHeight = parseFloat(field.value);
          break;
        case 'roofConfiguration':
          extractedData.roofConfiguration = field.value;
          break;
        case 'insulationType':
          extractedData.insulationType = field.value;
          break;
        case 'insulationThickness':
          extractedData.insulationThickness = parseFloat(field.value);
          break;
        case 'insulationRValue':
          extractedData.insulationRValue = parseFloat(field.value);
          break;
        case 'coverBoardType':
          extractedData.coverBoardType = field.value;
          break;
        case 'coverBoardThickness':
          extractedData.coverBoardThickness = parseFloat(field.value);
          break;
        case 'hasExistingInsulation':
          extractedData.hasExistingInsulation = field.value === true;
          break;
        case 'existingInsulationCondition':
          extractedData.existingInsulationCondition = field.value;
          break;
        case 'linearFootFlashing':
          extractedData.linearFootFlashing = parseInt(field.value.replace(/,/g, ''));
          break;
        case 'linearFootEdgeMetal':
          extractedData.linearFootEdgeMetal = parseInt(field.value.replace(/,/g, ''));
          break;
        case 'linearFootGutter':
          extractedData.linearFootGutter = parseInt(field.value.replace(/,/g, ''));
          break;
        case 'squareFootWalkwayPads':
          extractedData.squareFootWalkwayPads = parseInt(field.value.replace(/,/g, ''));
          break;
      }
    });

    return extractedData;
  }

  /**
   * Enhanced field extraction with better array handling
   */
  private static extractField(text: string, patterns: RegExp[], fieldName: string): ParsedField | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let value: any = match[1]?.trim();
        let confidence = 0.8; // Base confidence for pattern match

        // Special handling for array fields
        if (fieldName.includes('Types') || fieldName.includes('drainTypes') || fieldName.includes('penetrationTypes')) {
          // For type fields, extract multiple matches
          const allMatches = [...text.matchAll(new RegExp(pattern.source, 'gi'))];
          if (allMatches.length > 1) {
            value = allMatches.map(m => m[1] || m[0]).filter(Boolean);
            confidence = 0.9;
          } else if (value && value.includes(',')) {
            value = value.split(',').map((s: string) => s.trim()).filter(Boolean);
            confidence = 0.85;
          } else if (value) {
            value = [value];
          }
        }

        // Special handling for boolean fields
        if (fieldName === 'walkwayPadRequested' || fieldName === 'hasExistingInsulation') {
          value = true;
          confidence = 0.9;
        }

        // Special handling for building dimensions
        if (fieldName === 'buildingDimensions' && match[2]) {
          value = [match[1].trim(), match[2].trim()];
          confidence = 0.9;
        }

        // Clean up common artifacts
        value = this.cleanExtractedValue(value, fieldName);

        // Adjust confidence based on value quality
        confidence = this.adjustConfidence(value, fieldName, confidence);

        if (confidence > 0.3) {
          return {
            field: fieldName,
            value,
            confidence,
            source: match[0].trim(),
          };
        }
      }
    }
    return null;
  }

  /**
   * Enhanced value cleaning for new field types
   */
  private static cleanExtractedValue(value: any, fieldName: string): any {
    if (Array.isArray(value)) {
      return value.map(v => this.cleanExtractedValue(v, fieldName));
    }
    
    if (typeof value !== 'string') return value;

    // Remove common prefixes/suffixes
    value = value.replace(/^[:\-\s]+|[:\-\s]+$/g, '');
    
    // Field-specific cleaning
    switch (fieldName) {
      case 'numberOfDrains':
      case 'numberOfPenetrations':
      case 'skylights':
      case 'roofHatches':
      case 'hvacUnits':
      case 'downspouts':
      case 'expansionJoints':
        value = value.replace(/[^\d]/g, '');
        break;
      case 'linearFootFlashing':
      case 'linearFootEdgeMetal':
      case 'linearFootGutter':
      case 'squareFootWalkwayPads':
        value = value.replace(/[^\d,]/g, '');
        break;
      case 'parapetHeight':
      case 'insulationThickness':
      case 'insulationRValue':
      case 'coverBoardThickness':
        value = value.replace(/[^\d.]/g, '');
        break;
      case 'drainTypes':
      case 'penetrationTypes':
        if (Array.isArray(value)) {
          value = value.map(v => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase());
        }
        break;
      case 'insulationType':
      case 'coverBoardType':
      case 'gutterType':
      case 'roofConfiguration':
      case 'existingInsulationCondition':
        value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        break;
    }

    return value;
  }

  /**
   * Enhanced confidence adjustment for new field types
   */
  private static adjustConfidence(value: any, fieldName: string, baseConfidence: number): number {
    let confidence = baseConfidence;

    // Check value reasonableness for quantities
    switch (fieldName) {
      case 'numberOfDrains':
        const drains = parseInt(value);
        if (drains < 1 || drains > 50) confidence *= 0.7;
        break;
      case 'numberOfPenetrations':
        const pens = parseInt(value);
        if (pens < 1 || pens > 100) confidence *= 0.7;
        break;
      case 'hvacUnits':
        const hvac = parseInt(value);
        if (hvac < 0 || hvac > 20) confidence *= 0.8;
        break;
      case 'parapetHeight':
        const height = parseFloat(value);
        if (height < 6 || height > 120) confidence *= 0.6;
        break;
      case 'insulationThickness':
        const thickness = parseFloat(value);
        if (thickness < 0.5 || thickness > 10) confidence *= 0.7;
        break;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Enhanced preview data with comprehensive field mappings
   */
  static getPreviewData(extractedData: ExtractedData): Array<{
    field: string;
    label: string;
    value: any;
    confidence: number;
    willPopulate: boolean;
  }> {
    const preview = [];
    const minConfidence = 0.5;

    const fieldMappings = {
      // Basic project info
      projectName: 'Project Name',
      address: 'Project Address',
      companyName: 'Company Name',
      squareFootage: 'Square Footage',
      buildingHeight: 'Building Height',
      elevation: 'Elevation',
      
      // Roof system
      membraneThickness: 'Membrane Thickness',
      membraneColor: 'Membrane Color',
      deckType: 'Deck Type',
      roofSlope: 'Roof Slope',
      exposureCategory: 'Exposure Category',
      
      // Insulation
      insulationType: 'Insulation Type',
      insulationThickness: 'Insulation Thickness',
      insulationRValue: 'Insulation R-Value',
      coverBoardType: 'Cover Board Type',
      coverBoardThickness: 'Cover Board Thickness',
      hasExistingInsulation: 'Has Existing Insulation',
      existingInsulationCondition: 'Existing Insulation Condition',
      
      // Roof features
      numberOfDrains: 'Number of Drains',
      numberOfPenetrations: 'Number of Penetrations',
      skylights: 'Skylights',
      roofHatches: 'Roof Hatches',
      hvacUnits: 'HVAC Units',
      walkwayPadRequested: 'Walkway Pads Requested',
      gutterType: 'Gutter Type',
      downspouts: 'Downspouts',
      expansionJoints: 'Expansion Joints',
      parapetHeight: 'Parapet Height',
      roofConfiguration: 'Roof Configuration',
      
      // Takeoff quantities
      linearFootFlashing: 'Linear Feet of Flashing',
      linearFootEdgeMetal: 'Linear Feet of Edge Metal',
      linearFootGutter: 'Linear Feet of Gutters',
      squareFootWalkwayPads: 'Square Feet of Walkway Pads',
    };

    for (const [field, label] of Object.entries(fieldMappings)) {
      const value = extractedData[field as keyof ExtractedData];
      if (value !== undefined && value !== null) {
        let displayValue = value;
        
        // Format arrays for display
        if (Array.isArray(value)) {
          displayValue = value.join(', ');
        }
        
        preview.push({
          field,
          label,
          value: displayValue,
          confidence: extractedData.confidence,
          willPopulate: extractedData.confidence >= minConfidence,
        });
      }
    }

    // Handle building dimensions separately
    if (extractedData.buildingDimensions) {
      preview.push({
        field: 'buildingDimensions',
        label: 'Building Dimensions',
        value: `${extractedData.buildingDimensions.length} x ${extractedData.buildingDimensions.width}`,
        confidence: extractedData.confidence,
        willPopulate: extractedData.confidence >= minConfidence,
      });
    }

    // Handle drain types and penetration types
    if (extractedData.drainTypes) {
      preview.push({
        field: 'drainTypes',
        label: 'Drain Types',
        value: extractedData.drainTypes.join(', '),
        confidence: extractedData.confidence,
        willPopulate: extractedData.confidence >= minConfidence,
      });
    }

    if (extractedData.penetrationTypes) {
      preview.push({
        field: 'penetrationTypes',
        label: 'Penetration Types',
        value: extractedData.penetrationTypes.join(', '),
        confidence: extractedData.confidence,
        willPopulate: extractedData.confidence >= minConfidence,
      });
    }

    return preview;
  }
}
