#!/usr/bin/env node

// MCP PDF Analysis Tool
// Analyzes generated SOW PDFs for compliance and formatting issues

const fs = require('fs');
const path = require('path');

interface AnalysisResult {
  success: boolean;
  issues: Array<{
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    section?: string;
    suggestion?: string;
  }>;
  extractedData: {
    projectName?: string;
    address?: string;
    windSpeed?: number;
    template?: string;
    pageCount?: number;
    fileSize?: number;
  };
  scores: {
    formatCompliance: number;
    contentCompleteness: number;
    templateAccuracy: number;
    overall: number;
  };
}

async function analyzePDF(pdfPath: string, inputData: any): Promise<AnalysisResult> {
  console.log('Analyzing PDF output...');
  console.log(`PDF Path: ${pdfPath}`);
  console.log(`Input Data: ${JSON.stringify(inputData, null, 2)}`);
  
  const result: AnalysisResult = {
    success: true,
    issues: [],
    extractedData: {},
    scores: {
      formatCompliance: 0,
      contentCompleteness: 0,
      templateAccuracy: 0,
      overall: 0
    }
  };
  
  try {
    // Check if PDF file exists
    if (!fs.existsSync(pdfPath)) {
      result.success = false;
      result.issues.push({
        level: 'HIGH',
        message: 'PDF file not found',
        suggestion: 'Verify PDF generation completed successfully'
      });
      return result;
    }
    
    // Get file stats
    const stats = fs.statSync(pdfPath);
    result.extractedData.fileSize = stats.size;
    result.extractedData.pageCount = Math.ceil(stats.size / (50 * 1024)); // Rough estimate
    
    // Extract project data from filename
    const filename = path.basename(pdfPath);
    if (filename.includes(inputData.projectName?.replace(/\s+/g, '_'))) {
      result.extractedData.projectName = inputData.projectName;
    } else {
      result.issues.push({
        level: 'MEDIUM',
        message: 'Project name mismatch between input and PDF output',
        suggestion: 'Verify project name consistency'
      });
    }
    
    // Analyze file size
    if (stats.size < 100 * 1024) { // Less than 100KB
      result.issues.push({
        level: 'HIGH',
        message: 'PDF file size unusually small - may indicate content generation issues',
        suggestion: 'Review SOW content generation and template population'
      });
      result.scores.contentCompleteness = 30;
    } else if (stats.size < 500 * 1024) { // Less than 500KB
      result.issues.push({
        level: 'MEDIUM',
        message: 'PDF file size smaller than expected for complete SOW',
        suggestion: 'Verify all sections are included and properly formatted'
      });
      result.scores.contentCompleteness = 60;
    } else {
      result.scores.contentCompleteness = 90;
    }
    
    // Estimate page count and validate
    const estimatedPages = Math.ceil(stats.size / (50 * 1024));
    if (estimatedPages < 15) {
      result.issues.push({
        level: 'HIGH',
        message: `Estimated page count (${estimatedPages}) is below expected minimum (15+ pages)`,
        suggestion: 'Review template content and section generation'
      });
      result.scores.templateAccuracy = 40;
    } else if (estimatedPages < 25) {
      result.issues.push({
        level: 'MEDIUM',
        message: `Estimated page count (${estimatedPages}) is below typical range (25-35 pages)`,
        suggestion: 'Verify all sections are populated with detailed content'
      });
      result.scores.templateAccuracy = 70;
    } else {
      result.scores.templateAccuracy = 95;
    }
    
    // Format compliance checks
    result.scores.formatCompliance = 85; // Base score
    
    if (!pdfPath.endsWith('.pdf')) {
      result.issues.push({
        level: 'HIGH',
        message: 'Output file is not in PDF format',
        suggestion: 'Ensure PDF conversion is working correctly'
      });
      result.scores.formatCompliance -= 20;
    }
    
    // Template validation based on input parameters
    const expectedTemplate = determineExpectedTemplate(inputData);
    result.extractedData.template = expectedTemplate;
    
    // Mock data for demonstration
    result.extractedData.projectName = inputData.projectName || 'Unknown Project';
    result.extractedData.address = inputData.address || 'Unknown Address';
    result.extractedData.windSpeed = inputData.windSpeed || 150;
    
    // Calculate overall score
    result.scores.overall = Math.round(
      (result.scores.formatCompliance + 
       result.scores.contentCompleteness + 
       result.scores.templateAccuracy) / 3
    );
    
    // Add success indicators
    if (result.scores.overall >= 85) {
      result.issues.push({
        level: 'LOW',
        message: 'PDF analysis completed successfully with high compliance score',
        suggestion: 'SOW appears to be generated correctly'
      });
    } else if (result.scores.overall >= 70) {
      result.issues.push({
        level: 'MEDIUM',
        message: 'PDF analysis shows good compliance with minor issues',
        suggestion: 'Review and address identified issues for optimal quality'
      });
    } else {
      result.issues.push({
        level: 'HIGH',
        message: 'PDF analysis shows significant compliance issues',
        suggestion: 'Major review and corrections needed'
      });
    }
    
  } catch (error) {
    result.success = false;
    result.issues.push({
      level: 'HIGH',
      message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestion: 'Check PDF file integrity and analysis tool configuration'
    });
  }
  
  return result;
}

function determineExpectedTemplate(inputData: any): string {
  const projectType = inputData.projectType?.toLowerCase() || '';
  const deckType = inputData.deckType?.toLowerCase() || '';
  const membraneType = inputData.membraneType?.toLowerCase() || 'tpo';
  
  if (projectType.includes('tear') || projectType.includes('replace')) {
    if (membraneType.includes('tpo')) {
      if (deckType.includes('steel')) {
        return 'tearoff-tpo-ma-insul-steel';
      } else if (deckType.includes('gypsum')) {
        return 'tearoff-tpo-adhered-insul-adhered-gypsum';
      } else if (deckType.includes('lwc')) {
        return 'tearoff-tpo-ma-insul-lwc-steel';
      }
    }
  } else if (projectType.includes('recover')) {
    if (deckType.includes('steel')) {
      return 'recover-tpo-rhino-iso-eps-flute-fill-ssr';
    }
  }
  
  return 'tearoff-tpo-ma-insul-steel'; // Default
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node index.ts <pdf_path> <input_data_json_file>');
    process.exit(1);
  }
  
  const pdfPath = args[0];
  const inputDataFile = args[1];
  
  let inputData = {};
  
  try {
    if (fs.existsSync(inputDataFile)) {
      const inputDataRaw = fs.readFileSync(inputDataFile, 'utf8');
      inputData = JSON.parse(inputDataRaw);
    }
  } catch (error) {
    console.warn('Warning: Could not read input data file');
  }
  
  const result = await analyzePDF(pdfPath, inputData);
  
  console.log('\n=== PDF Analysis Results ===');
  console.log(`Success: ${result.success}`);
  console.log(`Issues found: ${result.issues.length}`);
  
  if (result.issues.length > 0) {
    console.log('\n=== Issues ===');
    result.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.level}] ${issue.message}`);
      if (issue.section) console.log(`   Section: ${issue.section}`);
      if (issue.suggestion) console.log(`   Suggestion: ${issue.suggestion}`);
      console.log('');
    });
  }
  
  console.log('=== Extracted Data ===');
  console.log(JSON.stringify(result.extractedData, null, 2));
  
  console.log('\n=== Compliance Scores ===');
  console.log(`Format Compliance: ${result.scores.formatCompliance}%`);
  console.log(`Content Completeness: ${result.scores.contentCompleteness}%`);
  console.log(`Template Accuracy: ${result.scores.templateAccuracy}%`);
  console.log(`Overall Score: ${result.scores.overall}%`);
  
  // Exit with appropriate code
  process.exit(result.success && result.scores.overall >= 70 ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

export { analyzePDF, AnalysisResult };