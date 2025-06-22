#!/usr/bin/env node

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

/**
 * PDF Analysis Tool using Puppeteer
 * 
 * This tool analyzes PDF output by:
 * 1. Converting PDF to HTML using Puppeteer
 * 2. Extracting layout and key values
 * 3. Comparing against input JSON
 * 4. Flagging issues for the self-healing agent
 */

interface AnalysisInput {
  pdfPath: string;
  inputJsonPath: string;
  outputDir?: string;
}

interface PDFIssue {
  type: 'missing_value' | 'formatting_error' | 'layout_issue' | 'data_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  expectedValue?: string;
  actualValue?: string;
  suggestedFix?: string;
}

interface AnalysisResult {
  success: boolean;
  pdfPath: string;
  inputPath: string;
  issues: PDFIssue[];
  extractedData: {
    projectName?: string;
    address?: string;
    zonePressures?: Record<string, number>;
    templateUsed?: string;
    windSpeed?: number;
    sections?: string[];
  };
  layoutMetrics: {
    pageCount: number;
    contentHeight: number;
    fontSizes: number[];
    margins: { top: number; bottom: number; left: number; right: number };
  };
  timestamp: string;
}

class PDFAnalyzer {
  private browser: puppeteer.Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async analyzePDF(input: AnalysisInput): Promise<AnalysisResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const issues: PDFIssue[] = [];
    let extractedData = {};
    let layoutMetrics = {
      pageCount: 0,
      contentHeight: 0,
      fontSizes: [],
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    };

    try {
      // Load input JSON for comparison
      const inputJson = JSON.parse(await fs.readFile(input.inputJsonPath, 'utf-8'));
      
      // Convert PDF to data URL and load in browser
      const pdfBuffer = await fs.readFile(input.pdfPath);
      const page = await this.browser.newPage();
      
      // Load PDF in browser (using PDF.js or similar)
      await page.goto(`data:application/pdf;base64,${pdfBuffer.toString('base64')}`);
      
      // Extract PDF content and analyze layout
      const analysis = await page.evaluate(() => {
        const textContent = document.body.innerText || '';
        const elements = Array.from(document.querySelectorAll('*'));
        
        return {
          text: textContent,
          elementCount: elements.length,
          pageHeight: document.body.scrollHeight,
          fonts: Array.from(new Set(
            elements.map(el => getComputedStyle(el).fontSize)
          )).filter(Boolean)
        };
      });

      // Extract key data from PDF text
      extractedData = this.extractKeyData(analysis.text, inputJson);
      
      // Analyze layout metrics
      layoutMetrics = {
        pageCount: 1, // Basic implementation
        contentHeight: analysis.pageHeight,
        fontSizes: analysis.fonts.map(f => parseInt(f.replace('px', ''))),
        margins: { top: 50, bottom: 50, left: 50, right: 50 } // Estimated
      };

      // Compare against input JSON and flag issues
      issues.push(...this.compareWithInput(extractedData, inputJson));
      issues.push(...this.analyzeLayout(layoutMetrics));

      await page.close();

    } catch (error) {
      issues.push({
        type: 'formatting_error',
        severity: 'critical',
        description: `Failed to analyze PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedFix: 'Check PDF file path and ensure file is valid'
      });
    }

    return {
      success: issues.filter(i => i.severity === 'critical').length === 0,
      pdfPath: input.pdfPath,
      inputPath: input.inputJsonPath,
      issues,
      extractedData,
      layoutMetrics,
      timestamp: new Date().toISOString()
    };
  }

  private extractKeyData(text: string, inputJson: any): Record<string, any> {
    const extracted: Record<string, any> = {};

    // Extract project name
    const projectNameMatch = text.match(/Project:?\s*(.+?)(?:\n|$)/i);
    if (projectNameMatch) {
      extracted.projectName = projectNameMatch[1].trim();
    }

    // Extract address
    const addressMatch = text.match(/Address:?\s*(.+?)(?:\n|$)/i);
    if (addressMatch) {
      extracted.address = addressMatch[1].trim();
    }

    // Extract zone pressures
    const zonePressures: Record<string, number> = {};
    const zoneMatches = text.matchAll(/Zone\s*(\d+).*?(-?\d+\.?\d*)\s*psf/gi);
    for (const match of zoneMatches) {
      const zone = `zone${match[1]}`;
      const pressure = parseFloat(match[2]);
      zonePressures[zone] = pressure;
    }
    if (Object.keys(zonePressures).length > 0) {
      extracted.zonePressures = zonePressures;
    }

    // Extract wind speed
    const windSpeedMatch = text.match(/(\d+)\s*mph/i);
    if (windSpeedMatch) {
      extracted.windSpeed = parseInt(windSpeedMatch[1]);
    }

    // Extract template information
    const templateMatch = text.match(/Template:?\s*([^\\n]+)/i);
    if (templateMatch) {
      extracted.templateUsed = templateMatch[1].trim();
    }

    // Extract sections
    const sections = [];
    const sectionMatches = text.matchAll(/^([A-Z][^\\n]*?)(?=\\n|$)/gm);
    for (const match of sectionMatches) {
      if (match[1].length > 10 && match[1].length < 100) {
        sections.push(match[1].trim());
      }
    }
    if (sections.length > 0) {
      extracted.sections = sections;
    }

    return extracted;
  }

  private compareWithInput(extracted: Record<string, any>, inputJson: any): PDFIssue[] {
    const issues: PDFIssue[] = [];

    // Check project name
    if (inputJson.projectName && extracted.projectName !== inputJson.projectName) {
      issues.push({
        type: 'data_mismatch',
        severity: 'high',
        description: 'Project name mismatch between input and PDF output',
        expectedValue: inputJson.projectName,
        actualValue: extracted.projectName,
        suggestedFix: 'Update PDF generator to correctly use input.projectName'
      });
    }

    // Check address
    if (inputJson.address && extracted.address !== inputJson.address) {
      issues.push({
        type: 'data_mismatch',
        severity: 'high',
        description: 'Address mismatch between input and PDF output',
        expectedValue: inputJson.address,
        actualValue: extracted.address,
        suggestedFix: 'Update PDF generator to correctly use input.address'
      });
    }

    // Check zone pressures
    if (inputJson.windAnalysis?.zonePressures && extracted.zonePressures) {
      for (const [zone, expectedPressure] of Object.entries(inputJson.windAnalysis.zonePressures)) {
        const actualPressure = extracted.zonePressures[zone];
        if (actualPressure !== undefined && Math.abs(actualPressure - (expectedPressure as number)) > 0.1) {
          issues.push({
            type: 'data_mismatch',
            severity: 'medium',
            description: `Zone pressure mismatch for ${zone}`,
            expectedValue: expectedPressure.toString(),
            actualValue: actualPressure.toString(),
            suggestedFix: `Update zone pressure calculation for ${zone}`
          });
        }
      }
    }

    // Check for missing critical values
    if (!extracted.projectName) {
      issues.push({
        type: 'missing_value',
        severity: 'critical',
        description: 'Project name is missing from PDF output',
        suggestedFix: 'Add project name rendering to PDF generator'
      });
    }

    if (!extracted.zonePressures || Object.keys(extracted.zonePressures).length === 0) {
      issues.push({
        type: 'missing_value',
        severity: 'high',
        description: 'Zone pressures are missing from PDF output',
        suggestedFix: 'Add zone pressure table rendering to PDF generator'
      });
    }

    return issues;
  }

  private analyzeLayout(metrics: any): PDFIssue[] {
    const issues: PDFIssue[] = [];

    // Check for layout issues
    if (metrics.contentHeight < 500) {
      issues.push({
        type: 'layout_issue',
        severity: 'medium',
        description: 'PDF content appears too short, possible layout issue',
        suggestedFix: 'Check PDF page layout and content rendering'
      });
    }

    if (metrics.fontSizes.length === 0) {
      issues.push({
        type: 'formatting_error',
        severity: 'medium',
        description: 'No font information detected, possible rendering issue',
        suggestedFix: 'Verify PDF font rendering and text extraction'
      });
    }

    return issues;
  }
}

// CLI interface
async function main() {
  const analyzer = new PDFAnalyzer();
  
  try {
    await analyzer.initialize();

    // Parse command line arguments
    const args = process.argv.slice(2);
    const pdfPath = args[0];
    const inputJsonPath = args[1];

    if (!pdfPath || !inputJsonPath) {
      console.error('Usage: analyze-pdf-output <pdf-path> <input-json-path>');
      process.exit(1);
    }

    // Verify files exist
    try {
      await fs.access(pdfPath);
      await fs.access(inputJsonPath);
    } catch (error) {
      console.error('Error: Could not access input files');
      process.exit(1);
    }

    console.log('Analyzing PDF output...');
    const result = await analyzer.analyzePDF({
      pdfPath,
      inputJsonPath
    });

    // Output results
    console.log('\\n=== PDF Analysis Results ===');
    console.log(`Success: ${result.success}`);
    console.log(`Issues found: ${result.issues.length}`);
    
    if (result.issues.length > 0) {
      console.log('\\n=== Issues ===');
      result.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
        if (issue.expectedValue && issue.actualValue) {
          console.log(`   Expected: ${issue.expectedValue}`);
          console.log(`   Actual: ${issue.actualValue}`);
        }
        if (issue.suggestedFix) {
          console.log(`   Suggested fix: ${issue.suggestedFix}`);
        }
        console.log('');
      });
    }

    console.log('\\n=== Extracted Data ===');
    console.log(JSON.stringify(result.extractedData, null, 2));

    console.log('\\n=== Layout Metrics ===');
    console.log(JSON.stringify(result.layoutMetrics, null, 2));

    // Save results to file
    const outputPath = path.join(process.cwd(), 'pdf-analysis-result.json');
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
    console.log(`\\nResults saved to: ${outputPath}`);

  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  } finally {
    await analyzer.cleanup();
  }
}

// Export for use as module
export { PDFAnalyzer, type AnalysisInput, type AnalysisResult, type PDFIssue };

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}
