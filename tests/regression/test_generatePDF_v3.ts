/**
 * Regression Test for PDF Generation v3
 * Tests the complete PDF generation pipeline using input_v3.json
 * Validates expected fields, zones, layout, and content
 */

import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { pdfLayoutAnalyzer, type LayoutExpectations } from './compare_pdf_layout.js';
import supabaseClient from '../../utils/supabaseClient.js';

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: {
    expectedFields?: string[];
    actualFields?: string[];
    missingFields?: string[];
    extraFields?: string[];
    layoutValidation?: any;
    contentValidation?: any;
  };
  errors?: string[];
}

export interface PDFTestSuite {
  suiteName: string;
  tests: TestResult[];
  overallPassed: boolean;
  totalDuration: number;
  summary: {
    passed: number;
    failed: number;
    total: number;
  };
}

export class PDFGenerationV3Tester {
  private inputPath: string;
  private outputDir: string;
  
  constructor(
    inputPath: string = './tests/fixtures/input_v3.json',
    outputDir: string = './output'
  ) {
    this.inputPath = inputPath;
    this.outputDir = outputDir;
  }

  /**
   * Run the complete test suite for PDF generation v3
   */
  async runTestSuite(): Promise<PDFTestSuite> {
    const suite: PDFTestSuite = {
      suiteName: 'PDF Generation v3 Regression Test',
      tests: [],
      overallPassed: true,
      totalDuration: 0,
      summary: { passed: 0, failed: 0, total: 0 },
    };

    const startTime = Date.now();

    try {
      // Load input data
      const inputData = await this.loadInputData();
      
      // Test 1: Input data validation
      suite.tests.push(await this.testInputDataValidation(inputData));
      
      // Test 2: PDF generation
      const pdfPath = await this.testPDFGeneration(inputData);
      suite.tests.push(pdfPath.test);
      
      if (pdfPath.success && pdfPath.path) {
        // Test 3: Layout validation
        suite.tests.push(await this.testLayoutValidation(pdfPath.path));
        
        // Test 4: Content validation
        suite.tests.push(await this.testContentValidation(pdfPath.path, inputData));
        
        // Test 5: Wind load calculations
        suite.tests.push(await this.testWindLoadCalculations(pdfPath.path, inputData));
        
        // Test 6: Zone-specific requirements
        suite.tests.push(await this.testZoneRequirements(pdfPath.path, inputData));
        
        // Test 7: Fastener pattern validation
        suite.tests.push(await this.testFastenerPatterns(pdfPath.path, inputData));
      }

    } catch (error) {
      suite.tests.push({
        testName: 'Test Suite Execution',
        passed: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)],
      });
    }

    // Calculate summary
    suite.totalDuration = Date.now() - startTime;
    suite.summary.total = suite.tests.length;
    suite.summary.passed = suite.tests.filter(t => t.passed).length;
    suite.summary.failed = suite.summary.total - suite.summary.passed;
    suite.overallPassed = suite.summary.failed === 0;

    // Log results to Supabase if we have a PDF version
    await this.logTestSuite(suite);

    return suite;
  }

  /**
   * Load and validate input data
   */
  private async loadInputData(): Promise<Record<string, any>> {
    try {
      const inputContent = await readFile(this.inputPath, 'utf-8');
      return JSON.parse(inputContent);
    } catch (error) {
      throw new Error(`Failed to load input data from ${this.inputPath}: ${error}`);
    }
  }

  /**
   * Test 1: Input data validation
   */
  private async testInputDataValidation(inputData: Record<string, any>): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Input Data Validation';
    
    try {
      const requiredFields = [
        'project',
        'address',
        'windLoads',
        'roofSystem',
        'materials',
        'attachmentSchedule',
      ];

      const actualFields = Object.keys(inputData);
      const missingFields = requiredFields.filter(field => !actualFields.includes(field));
      const extraFields = actualFields.filter(field => !requiredFields.includes(field));

      // Validate specific field structures
      const errors: string[] = [];

      if (inputData.windLoads) {
        if (!inputData.windLoads.basicWindSpeed || typeof inputData.windLoads.basicWindSpeed !== 'number') {
          errors.push('windLoads.basicWindSpeed is required and must be a number');
        }
        if (!inputData.windLoads.zones || !Array.isArray(inputData.windLoads.zones)) {
          errors.push('windLoads.zones is required and must be an array');
        }
      }

      if (inputData.roofSystem) {
        if (!inputData.roofSystem.membrane || !inputData.roofSystem.membrane.type) {
          errors.push('roofSystem.membrane.type is required');
        }
        if (!inputData.roofSystem.deck || !inputData.roofSystem.deck.type) {
          errors.push('roofSystem.deck.type is required');
        }
      }

      const passed = missingFields.length === 0 && errors.length === 0;

      return {
        testName,
        passed,
        duration: Date.now() - startTime,
        details: {
          expectedFields: requiredFields,
          actualFields,
          missingFields,
          extraFields,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Test 2: PDF generation
   */
  private async testPDFGeneration(inputData: Record<string, any>): Promise<{
    test: TestResult;
    success: boolean;
    path?: string;
  }> {
    const startTime = Date.now();
    const testName = 'PDF Generation';
    
    try {
      // Import the PDF generator (assuming it exists)
      const { generatePDF } = await import('../../src/pdf-generator.js');
      
      // Generate PDF
      const outputPath = join(this.outputDir, `test_output_${Date.now()}.pdf`);
      await generatePDF(inputData, outputPath);
      
      // Verify file exists and has content
      await access(outputPath);
      const stats = await import('fs/promises').then(fs => fs.stat(outputPath));
      
      if (stats.size === 0) {
        throw new Error('Generated PDF file is empty');
      }

      return {
        test: {
          testName,
          passed: true,
          duration: Date.now() - startTime,
          details: {
            outputPath,
            fileSize: stats.size,
          },
        },
        success: true,
        path: outputPath,
      };
    } catch (error) {
      return {
        test: {
          testName,
          passed: false,
          duration: Date.now() - startTime,
          details: {},
          errors: [error instanceof Error ? error.message : String(error)],
        },
        success: false,
      };
    }
  }

  /**
   * Test 3: Layout validation
   */
  private async testLayoutValidation(pdfPath: string): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Layout Validation';
    
    try {
      const expectations: LayoutExpectations = {
        sections: [
          {
            name: 'header',
            required: true,
            minElements: 1,
          },
          {
            name: 'wind-loads',
            required: true,
            minElements: 2,
          },
          {
            name: 'attachment-schedule',
            required: true,
            minElements: 1,
          },
          {
            name: 'materials',
            required: true,
            minElements: 1,
          },
        ],
        globalExpectations: {
          minPages: 1,
          maxPages: 20,
          requiredSections: ['header', 'wind-loads', 'attachment-schedule'],
          fontSizeRange: { min: 8, max: 24 },
        },
      };

      const comparison = await pdfLayoutAnalyzer.validatePDFLayout(pdfPath, expectations);

      return {
        testName,
        passed: comparison.isMatch,
        duration: Date.now() - startTime,
        details: {
          layoutValidation: {
            confidence: comparison.confidence,
            summary: comparison.summary,
            differences: comparison.differences.slice(0, 5), // Limit for readability
          },
        },
        errors: comparison.differences.length > 0 ? 
          comparison.differences.map(d => d.description) : undefined,
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Test 4: Content validation
   */
  private async testContentValidation(pdfPath: string, inputData: Record<string, any>): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Content Validation';
    
    try {
      const layout = await pdfLayoutAnalyzer.extractPDFLayout(pdfPath);
      const errors: string[] = [];

      // Extract all text content
      const allText = layout.pages
        .flatMap(page => page.sections)
        .flatMap(section => section.elements)
        .filter(element => element.type === 'text')
        .map(element => element.content || '')
        .join(' ')
        .toLowerCase();

      // Validate expected content
      const expectedContent = [
        inputData.project?.name || 'project name',
        inputData.address?.street || 'project address',
        inputData.windLoads?.basicWindSpeed?.toString() || 'wind speed',
        inputData.roofSystem?.membrane?.type || 'membrane type',
      ];

      for (const expected of expectedContent) {
        if (expected && !allText.includes(expected.toLowerCase())) {
          errors.push(`Expected content not found: "${expected}"`);
        }
      }

      // Validate wind load zones
      if (inputData.windLoads?.zones) {
        for (const zone of inputData.windLoads.zones) {
          const zoneName = zone.name || zone.type;
          if (zoneName && !allText.includes(zoneName.toLowerCase())) {
            errors.push(`Wind load zone not found: "${zoneName}"`);
          }
        }
      }

      return {
        testName,
        passed: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          contentValidation: {
            expectedContent,
            textLength: allText.length,
            foundContent: expectedContent.filter(content => 
              content && allText.includes(content.toLowerCase())
            ),
          },
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Test 5: Wind load calculations
   */
  private async testWindLoadCalculations(pdfPath: string, inputData: Record<string, any>): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Wind Load Calculations';
    
    try {
      const layout = await pdfLayoutAnalyzer.extractPDFLayout(pdfPath);
      const errors: string[] = [];

      // Extract all text content
      const allText = layout.pages
        .flatMap(page => page.sections)
        .flatMap(section => section.elements)
        .filter(element => element.type === 'text')
        .map(element => element.content || '')
        .join(' ');

      // Validate wind pressure calculations are present
      const windPressurePattern = /(\d+\.?\d*)\s*(psf|lb\/ft²|pounds?)/gi;
      const windPressureMatches = allText.match(windPressurePattern);
      
      if (!windPressureMatches || windPressureMatches.length === 0) {
        errors.push('No wind pressure calculations found in PDF');
      }

      // Validate basic wind speed is mentioned
      if (inputData.windLoads?.basicWindSpeed) {
        const basicWindSpeed = inputData.windLoads.basicWindSpeed.toString();
        if (!allText.includes(basicWindSpeed)) {
          errors.push(`Basic wind speed ${basicWindSpeed} not found in PDF`);
        }
      }

      // Validate ASCE reference
      if (!allText.toLowerCase().includes('asce')) {
        errors.push('ASCE standard reference not found in PDF');
      }

      // Validate zone calculations
      if (inputData.windLoads?.zones) {
        const expectedZones = inputData.windLoads.zones.length;
        const foundZones = (allText.match(/zone\s*[a-z]?\d*/gi) || []).length;
        
        if (foundZones < expectedZones) {
          errors.push(`Expected ${expectedZones} zones, found ${foundZones} in PDF`);
        }
      }

      return {
        testName,
        passed: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          windLoadValidation: {
            windPressureMatches: windPressureMatches?.length || 0,
            hasAsceReference: allText.toLowerCase().includes('asce'),
            expectedZones: inputData.windLoads?.zones?.length || 0,
            foundZones: (allText.match(/zone\s*[a-z]?\d*/gi) || []).length,
          },
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Test 6: Zone-specific requirements
   */
  private async testZoneRequirements(pdfPath: string, inputData: Record<string, any>): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Zone-Specific Requirements';
    
    try {
      const layout = await pdfLayoutAnalyzer.extractPDFLayout(pdfPath);
      const errors: string[] = [];

      // Extract all text content
      const allText = layout.pages
        .flatMap(page => page.sections)
        .flatMap(section => section.elements)
        .filter(element => element.type === 'text')
        .map(element => element.content || '')
        .join(' ');

      // Check for attachment schedule table
      const hasAttachmentSchedule = allText.toLowerCase().includes('attachment schedule') ||
                                   allText.toLowerCase().includes('fastener schedule');
      
      if (!hasAttachmentSchedule) {
        errors.push('Attachment schedule not found in PDF');
      }

      // Check for field, perimeter, and corner zones
      const expectedZoneTypes = ['field', 'perimeter', 'corner'];
      for (const zoneType of expectedZoneTypes) {
        if (!allText.toLowerCase().includes(zoneType)) {
          errors.push(`Zone type "${zoneType}" not found in PDF`);
        }
      }

      // Check for fastener spacing information
      const spacingPattern = /(\d+\.?\d*)\s*(inch|in|")/gi;
      const spacingMatches = allText.match(spacingPattern);
      
      if (!spacingMatches || spacingMatches.length === 0) {
        errors.push('Fastener spacing information not found in PDF');
      }

      // Validate manufacturer requirements if specified
      if (inputData.roofSystem?.membrane?.manufacturer) {
        const manufacturer = inputData.roofSystem.membrane.manufacturer;
        if (!allText.toLowerCase().includes(manufacturer.toLowerCase())) {
          errors.push(`Manufacturer "${manufacturer}" not referenced in PDF`);
        }
      }

      return {
        testName,
        passed: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          zoneValidation: {
            hasAttachmentSchedule,
            foundZoneTypes: expectedZoneTypes.filter(type => 
              allText.toLowerCase().includes(type)
            ),
            spacingMatches: spacingMatches?.length || 0,
          },
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Test 7: Fastener pattern validation
   */
  private async testFastenerPatterns(pdfPath: string, inputData: Record<string, any>): Promise<TestResult> {
    const startTime = Date.now();
    const testName = 'Fastener Pattern Validation';
    
    try {
      const layout = await pdfLayoutAnalyzer.extractPDFLayout(pdfPath);
      const errors: string[] = [];

      // Extract all text content
      const allText = layout.pages
        .flatMap(page => page.sections)
        .flatMap(section => section.elements)
        .filter(element => element.type === 'text')
        .map(element => element.content || '')
        .join(' ');

      // Check for fastener type specifications
      const fastenerPattern = /(\d+\.?\d*)\s*(#\d+|gauge|ga)/gi;
      const fastenerMatches = allText.match(fastenerPattern);
      
      if (!fastenerMatches || fastenerMatches.length === 0) {
        errors.push('Fastener specifications not found in PDF');
      }

      // Check for plate specifications
      if (!allText.toLowerCase().includes('plate') && !allText.toLowerCase().includes('washer')) {
        errors.push('Plate/washer specifications not found in PDF');
      }

      // Validate deck type compatibility
      if (inputData.roofSystem?.deck?.type) {
        const deckType = inputData.roofSystem.deck.type.toLowerCase();
        if (!allText.toLowerCase().includes(deckType)) {
          errors.push(`Deck type "${deckType}" not referenced in PDF`);
        }
      }

      // Check for withdrawal resistance values
      const withdrawalPattern = /(\d+\.?\d*)\s*(lb|lbf|pounds)/gi;
      const withdrawalMatches = allText.match(withdrawalPattern);
      
      if (!withdrawalMatches || withdrawalMatches.length === 0) {
        errors.push('Withdrawal resistance values not found in PDF');
      }

      return {
        testName,
        passed: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          fastenerValidation: {
            fastenerMatches: fastenerMatches?.length || 0,
            hasPlateSpecs: allText.toLowerCase().includes('plate') || 
                          allText.toLowerCase().includes('washer'),
            withdrawalMatches: withdrawalMatches?.length || 0,
          },
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        duration: Date.now() - startTime,
        details: {},
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Log test suite results to Supabase
   */
  private async logTestSuite(suite: PDFTestSuite): Promise<void> {
    try {
      // Create a dummy project for testing if it doesn't exist
      const testProjectId = 'test-project-regression';
      
      for (const test of suite.tests) {
        await supabaseClient.logTestResult({
          pdfVersionId: testProjectId,
          testType: 'regression',
          testName: test.testName,
          passed: test.passed,
          expectedResult: test.details,
          actualResult: { passed: test.passed },
          diffData: test.errors ? { errors: test.errors } : undefined,
          executionTimeMs: test.duration,
          errorMessage: test.errors?.join('; '),
        });
      }
    } catch (error) {
      console.warn('Failed to log test results to Supabase:', error);
    }
  }
}

// Export function for easy CLI usage
export async function runPDFGenerationV3Test(
  inputPath?: string,
  outputDir?: string
): Promise<PDFTestSuite> {
  const tester = new PDFGenerationV3Tester(inputPath, outputDir);
  return tester.runTestSuite();
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    console.log('🧪 Running PDF Generation v3 Regression Test...\n');
    
    try {
      const suite = await runPDFGenerationV3Test();
      
      console.log(`📊 Test Results for: ${suite.suiteName}`);
      console.log(`⏱️  Total Duration: ${suite.totalDuration}ms`);
      console.log(`✅ Passed: ${suite.summary.passed}`);
      console.log(`❌ Failed: ${suite.summary.failed}`);
      console.log(`📈 Success Rate: ${((suite.summary.passed / suite.summary.total) * 100).toFixed(1)}%\n`);
      
      // Print individual test results
      for (const test of suite.tests) {
        const status = test.passed ? '✅' : '❌';
        console.log(`${status} ${test.testName} (${test.duration}ms)`);
        
        if (!test.passed && test.errors) {
          for (const error of test.errors) {
            console.log(`   ⚠️  ${error}`);
          }
        }
      }
      
      console.log(`\n🎯 Overall Result: ${suite.overallPassed ? 'PASSED' : 'FAILED'}`);
      
      // Exit with appropriate code
      process.exit(suite.overallPassed ? 0 : 1);
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  })();
}
