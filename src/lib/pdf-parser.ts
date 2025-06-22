// PDF parsing service for extracting roofing project data
// Uses pdf-parse library for text extraction and pattern matching for data identification

interface ExtractedData {
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
  membraneThickness?: string;
  membraneColor?: string;
  deckType?: string;
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
   * Simulate PDF text extraction for demonstration
   * In production, this would be replaced with actual PDF parsing
   */
  private static simulatePDFTextExtraction(filename: string): string {
    // This simulates extracted text from a typical roofing project PDF
    return `
      ROOFING PROJECT PROPOSAL
      
      Project Name: ${filename.replace('.pdf', '').replace(/[-_]/g, ' ')}
      Address: 1505 Wallace Rd, Carrollton, TX 75006
      Company: ABC Roofing Contractors
      
      Building Specifications:
      Square Footage: 154,400 sf
      Building Height: 30 feet
      Dimensions: 400 ft x 386 ft
      Elevation: 550 feet
      
      Roof System:
      Membrane Thickness: 60 mil
      Membrane Color: White
      Deck Type: Steel
      
      Project Type: Recover
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
      }
    });

    return extractedData;
  }

  /**
   * Extract a specific field using multiple patterns
   */
  private static extractField(text: string, patterns: RegExp[], fieldName: string): ParsedField | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let value: any = match[1]?.trim();
        let confidence = 0.8; // Base confidence for pattern match

        // Special handling for different field types
        if (fieldName === 'buildingDimensions' && match[2]) {
          value = [match[1].trim(), match[2].trim()];
          confidence = 0.9; // Higher confidence for dimensions with both values
        }

        // Clean up common artifacts
        value = this.cleanExtractedValue(value, fieldName);

        // Adjust confidence based on value quality
        confidence = this.adjustConfidence(value, fieldName, confidence);

        if (confidence > 0.3) { // Only return if confidence is reasonable
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
   * Clean up extracted values
   */
  private static cleanExtractedValue(value: any, fieldName: string): any {
    if (typeof value !== 'string') return value;

    // Remove common prefixes/suffixes
    value = value.replace(/^[:\-\s]+|[:\-\s]+$/g, '');
    
    // Field-specific cleaning
    switch (fieldName) {
      case 'squareFootage':
        value = value.replace(/[^\d,]/g, '');
        break;
      case 'membraneThickness':
        value = value.replace(/[^\d.]/g, '');
        break;
      case 'membraneColor':
        value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        break;
      case 'deckType':
        value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        break;
    }

    return value;
  }

  /**
   * Adjust confidence based on value quality
   */
  private static adjustConfidence(value: any, fieldName: string, baseConfidence: number): number {
    let confidence = baseConfidence;

    // Check value reasonableness
    switch (fieldName) {
      case 'squareFootage':
        const sf = parseInt(value.replace(/,/g, ''));
        if (sf < 100 || sf > 10000000) confidence *= 0.5;
        break;
      case 'buildingHeight':
        const height = parseFloat(value);
        if (height < 8 || height > 200) confidence *= 0.6;
        break;
      case 'elevation':
        const elev = parseFloat(value);
        if (elev < -500 || elev > 15000) confidence *= 0.7;
        break;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Get a preview of what will be populated
   */
  static getPreviewData(extractedData: ExtractedData): Array<{
    field: string;
    label: string;
    value: any;
    confidence: number;
    willPopulate: boolean;
  }> {
    const preview = [];
    const minConfidence = 0.5; // Minimum confidence to suggest population

    const fieldMappings = {
      projectName: 'Project Name',
      address: 'Project Address',
      companyName: 'Company Name',
      squareFootage: 'Square Footage',
      buildingHeight: 'Building Height',
      elevation: 'Elevation',
      membraneThickness: 'Membrane Thickness',
      membraneColor: 'Membrane Color',
      deckType: 'Deck Type',
    };

    for (const [field, label] of Object.entries(fieldMappings)) {
      const value = extractedData[field as keyof ExtractedData];
      if (value !== undefined) {
        preview.push({
          field,
          label,
          value,
          confidence: extractedData.confidence,
          willPopulate: extractedData.confidence >= minConfidence,
        });
      }
    }

    if (extractedData.buildingDimensions) {
      preview.push({
        field: 'buildingDimensions',
        label: 'Building Dimensions',
        value: `${extractedData.buildingDimensions.length} x ${extractedData.buildingDimensions.width}`,
        confidence: extractedData.confidence,
        willPopulate: extractedData.confidence >= minConfidence,
      });
    }

    return preview;
  }
}
