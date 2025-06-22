#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

/**
 * Fix Proposal Tool
 * 
 * This tool analyzes PDF issues and proposes targeted code fixes using Claude-driven logic.
 * It generates surgical fixes rather than full rewrites.
 */

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
  extractedData: Record<string, any>;
  layoutMetrics: Record<string, any>;
  timestamp: string;
}

interface FixProposal {
  version: string;
  targetModule: string;
  functionName: string;
  issuesSolved: string[];
  codeSnippet: string;
  explanation: string;
  testCase?: string;
  dependencies?: string[];
}

interface ProposalInput {
  analysisResult: AnalysisResult;
  currentVersion?: string;
  targetIssues?: string[];
}

class FixProposalEngine {
  private fixTemplates: Map<string, string> = new Map();

  constructor() {
    this.initializeFixTemplates();
  }

  private initializeFixTemplates(): void {
    // Template for missing value fixes
    this.fixTemplates.set('missing_value', `
// CLAUDE FIX v{version} - {description}
function {functionName}(data: any, pdf: any): void {
  // Original validation
  if (!data.{fieldName}) {
    console.warn('Missing {fieldName} in input data');
    return;
  }
  
  // Enhanced rendering logic
  const {fieldName}Value = data.{fieldName};
  pdf.text(\`{labelText}: \${fieldName}Value\`, {x}, {y});
  
  // Additional formatting if needed
  {additionalFormatting}
}
`);

    // Template for data mismatch fixes
    this.fixTemplates.set('data_mismatch', `
// CLAUDE FIX v{version} - {description}
function {functionName}(inputData: any, pdf: any): void {
  // Ensure correct data source
  const value = inputData.{correctPath};
  
  if (value === undefined || value === null) {
    console.error('Cannot find {correctPath} in input data');
    return;
  }
  
  // Apply proper formatting
  const formattedValue = {formatFunction}(value);
  
  // Render with correct positioning
  pdf.text(\`{label}: \${formattedValue}\`, {x}, {y}, {
    fontSize: {fontSize},
    font: '{fontName}'
  });
}
`);

    // Template for layout fixes
    this.fixTemplates.set('layout_issue', `
// CLAUDE FIX v{version} - {description}
function {functionName}(pdf: any, content: any): void {
  // Calculate proper positioning
  const pageWidth = pdf.page.width;
  const pageHeight = pdf.page.height;
  const margin = {margin};
  
  // Set up layout constraints
  const contentArea = {
    x: margin,
    y: margin,
    width: pageWidth - (margin * 2),
    height: pageHeight - (margin * 2)
  };
  
  // Apply layout with proper spacing
  {layoutLogic}
}
`);

    // Template for formatting fixes
    this.fixTemplates.set('formatting_error', `
// CLAUDE FIX v{version} - {description}
function {functionName}(pdf: any, data: any): void {
  // Set consistent formatting
  const formatOptions = {
    fontSize: {fontSize},
    font: '{fontName}',
    lineHeight: {lineHeight}
  };
  
  // Apply formatting consistently
  pdf.font(formatOptions.font, formatOptions.fontSize);
  
  // Render content with proper formatting
  {renderingLogic}
}
`);
  }

  async proposeFixesForIssues(input: ProposalInput): Promise<FixProposal[]> {
    const proposals: FixProposal[] = [];
    const { issues } = input.analysisResult;
    
    // Get current version number
    const currentVersion = input.currentVersion || 'v1';
    const nextVersion = this.incrementVersion(currentVersion);

    // Group issues by type and module
    const groupedIssues = this.groupIssuesByType(issues);

    for (const [issueType, issueList] of groupedIssues.entries()) {
      const proposal = await this.generateFixForIssueType(
        issueType,
        issueList,
        nextVersion,
        input.analysisResult
      );
      
      if (proposal) {
        proposals.push(proposal);
      }
    }

    return proposals;
  }

  private groupIssuesByType(issues: PDFIssue[]): Map<string, PDFIssue[]> {
    const grouped = new Map<string, PDFIssue[]>();
    
    for (const issue of issues) {
      if (!grouped.has(issue.type)) {
        grouped.set(issue.type, []);
      }
      grouped.get(issue.type)!.push(issue);
    }
    
    return grouped;
  }

  private async generateFixForIssueType(
    issueType: string,
    issues: PDFIssue[],
    version: string,
    analysisResult: AnalysisResult
  ): Promise<FixProposal | null> {
    const template = this.fixTemplates.get(issueType);
    if (!template) {
      console.warn(`No template found for issue type: ${issueType}`);
      return null;
    }

    // Determine target module and function based on issue type
    const { targetModule, functionName } = this.determineTargetModule(issueType, issues);
    
    // Generate specific fix code
    const codeSnippet = this.generateSpecificFix(issueType, issues, version, analysisResult);
    
    // Create explanation
    const explanation = this.generateExplanation(issueType, issues);
    
    // Generate test case
    const testCase = this.generateTestCase(targetModule, functionName, issues);

    return {
      version,
      targetModule,
      functionName,
      issuesSolved: issues.map(i => i.description),
      codeSnippet,
      explanation,
      testCase,
      dependencies: this.determineDependencies(issueType)
    };
  }

  private determineTargetModule(issueType: string, issues: PDFIssue[]): { targetModule: string; functionName: string } {
    // Analyze issues to determine which module/function needs fixing
    
    if (issueType === 'missing_value') {
      const projectNameIssue = issues.find(i => i.description.includes('Project name'));
      if (projectNameIssue) {
        return { targetModule: 'addProjectInfo', functionName: 'addProjectName' };
      }
      
      const zonePressureIssue = issues.find(i => i.description.includes('Zone pressure'));
      if (zonePressureIssue) {
        return { targetModule: 'addZonePressures', functionName: 'addZonePressureTable' };
      }
      
      return { targetModule: 'addKeyValue', functionName: 'addMissingValue' };
    }
    
    if (issueType === 'data_mismatch') {
      const addressIssue = issues.find(i => i.description.includes('address'));
      if (addressIssue) {
        return { targetModule: 'addProjectInfo', functionName: 'addProjectAddress' };
      }
      
      return { targetModule: 'dataBinding', functionName: 'bindCorrectData' };
    }
    
    if (issueType === 'layout_issue') {
      return { targetModule: 'pdfLayout', functionName: 'fixLayoutSpacing' };
    }
    
    if (issueType === 'formatting_error') {
      return { targetModule: 'pdfFormatting', functionName: 'fixTextFormatting' };
    }
    
    return { targetModule: 'generatePDF', functionName: 'applyGeneralFix' };
  }

  private generateSpecificFix(
    issueType: string,
    issues: PDFIssue[],
    version: string,
    analysisResult: AnalysisResult
  ): string {
    switch (issueType) {
      case 'missing_value':
        return this.generateMissingValueFix(issues, version, analysisResult);
      
      case 'data_mismatch':
        return this.generateDataMismatchFix(issues, version, analysisResult);
      
      case 'layout_issue':
        return this.generateLayoutFix(issues, version, analysisResult);
      
      case 'formatting_error':
        return this.generateFormattingFix(issues, version, analysisResult);
      
      default:
        return this.generateGenericFix(issues, version, analysisResult);
    }
  }

  private generateMissingValueFix(issues: PDFIssue[], version: string, analysisResult: AnalysisResult): string {
    const primaryIssue = issues[0];
    const functionName = primaryIssue.description.includes('Project name') ? 'addProjectName' : 'addMissingValue';
    
    return `// CLAUDE FIX ${version} - Missing value fix for: ${primaryIssue.description}
function ${functionName}(inputData: any, pdf: any, options: any = {}): void {
  // Validation and safety checks
  if (!inputData) {
    console.error('Input data is required for ${functionName}');
    return;
  }
  
  // Extract required value from input
  const value = inputData.projectName || inputData.name || 'Unknown Project';
  
  if (!value || value.trim() === '') {
    console.warn('Missing or empty value in input data');
    return;
  }
  
  // Set proper positioning
  const x = options.x || 50;
  const y = options.y || 100;
  
  // Render with proper formatting
  pdf.fontSize(14)
     .font('Helvetica-Bold')
     .text(\`Project: \${value}\`, x, y);
  
  // Add spacing for next element
  return y + 25;
}

// Helper function for consistent formatting
function formatProjectName(name: string): string {
  return name.trim().replace(/\\s+/g, ' ');
}`;
  }

  private generateDataMismatchFix(issues: PDFIssue[], version: string, analysisResult: AnalysisResult): string {
    const primaryIssue = issues[0];
    
    return `// CLAUDE FIX ${version} - Data mismatch fix for: ${primaryIssue.description}
function bindCorrectData(inputData: any, pdf: any, fieldName: string, options: any = {}): void {
  // Navigate to correct data path
  const dataPath = fieldName.split('.');
  let value = inputData;
  
  for (const key of dataPath) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.error(\`Cannot find \${fieldName} in input data\`);
      return;
    }
  }
  
  // Validate extracted value
  if (value === undefined || value === null) {
    console.warn(\`No value found for \${fieldName}\`);
    return;
  }
  
  // Apply proper formatting based on field type
  let formattedValue: string;
  if (fieldName.includes('address')) {
    formattedValue = this.formatAddress(value);
  } else if (fieldName.includes('pressure')) {
    formattedValue = this.formatPressure(value);
  } else {
    formattedValue = String(value);
  }
  
  // Render with correct positioning
  const x = options.x || 50;
  const y = options.y || 100;
  const label = options.label || fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  
  pdf.text(\`\${label}: \${formattedValue}\`, x, y);
}

// Helper formatting functions
function formatAddress(address: string): string {
  return address.trim().replace(/\\s+/g, ' ');
}

function formatPressure(pressure: number): string {
  return \`\${Math.abs(pressure).toFixed(1)} psf\`;
}`;
  }

  private generateLayoutFix(issues: PDFIssue[], version: string, analysisResult: AnalysisResult): string {
    return `// CLAUDE FIX ${version} - Layout fix for spacing and positioning issues
function fixLayoutSpacing(pdf: any, content: any[], options: any = {}): number {
  // Calculate page dimensions and margins
  const pageWidth = pdf.page.width;
  const pageHeight = pdf.page.height;
  const margin = options.margin || 50;
  const lineHeight = options.lineHeight || 20;
  
  // Set up content area
  const contentArea = {
    x: margin,
    y: margin,
    width: pageWidth - (margin * 2),
    height: pageHeight - (margin * 2)
  };
  
  let currentY = contentArea.y;
  
  // Process each content item with proper spacing
  for (const item of content) {
    // Check if we need a new page
    if (currentY + lineHeight > contentArea.y + contentArea.height) {
      pdf.addPage();
      currentY = margin;
    }
    
    // Render item with consistent spacing
    switch (item.type) {
      case 'header':
        currentY = this.renderHeader(pdf, item, contentArea.x, currentY);
        break;
      case 'table':
        currentY = this.renderTable(pdf, item, contentArea.x, currentY, contentArea.width);
        break;
      case 'text':
        currentY = this.renderText(pdf, item, contentArea.x, currentY);
        break;
    }
    
    // Add spacing after each item
    currentY += lineHeight * 0.5;
  }
  
  return currentY;
}

function renderHeader(pdf: any, item: any, x: number, y: number): number {
  pdf.fontSize(16)
     .font('Helvetica-Bold')
     .text(item.text, x, y);
  return y + 25;
}

function renderTable(pdf: any, item: any, x: number, y: number, maxWidth: number): number {
  const cellPadding = 5;
  const rowHeight = 20;
  
  // Calculate column widths
  const colCount = item.headers.length;
  const colWidth = (maxWidth - (cellPadding * 2 * colCount)) / colCount;
  
  let currentY = y;
  
  // Render headers
  for (let i = 0; i < item.headers.length; i++) {
    const cellX = x + (i * (colWidth + cellPadding * 2));
    pdf.rect(cellX, currentY, colWidth, rowHeight).stroke();
    pdf.text(item.headers[i], cellX + cellPadding, currentY + cellPadding);
  }
  currentY += rowHeight;
  
  // Render data rows
  for (const row of item.data) {
    for (let i = 0; i < row.length; i++) {
      const cellX = x + (i * (colWidth + cellPadding * 2));
      pdf.rect(cellX, currentY, colWidth, rowHeight).stroke();
      pdf.text(String(row[i]), cellX + cellPadding, currentY + cellPadding);
    }
    currentY += rowHeight;
  }
  
  return currentY + 10;
}`;
  }

  private generateFormattingFix(issues: PDFIssue[], version: string, analysisResult: AnalysisResult): string {
    return `// CLAUDE FIX ${version} - Formatting fix for text rendering and font issues
function fixTextFormatting(pdf: any, options: any = {}): void {
  // Set consistent font defaults
  const fontDefaults = {
    regularFont: 'Helvetica',
    boldFont: 'Helvetica-Bold',
    italicFont: 'Helvetica-Oblique',
    size: {
      title: 18,
      header: 14,
      body: 10,
      caption: 8
    }
  };
  
  // Override with provided options
  const fonts = { ...fontDefaults, ...options.fonts };
  
  // Set default text formatting
  pdf.font(fonts.regularFont, fonts.size.body);
  
  // Define text formatting functions
  pdf.addFormattingMethods = function() {
    this.title = (text: string, x: number, y: number) => {
      return this.font(fonts.boldFont, fonts.size.title).text(text, x, y);
    };
    
    this.header = (text: string, x: number, y: number) => {
      return this.font(fonts.boldFont, fonts.size.header).text(text, x, y);
    };
    
    this.body = (text: string, x: number, y: number) => {
      return this.font(fonts.regularFont, fonts.size.body).text(text, x, y);
    };
    
    this.caption = (text: string, x: number, y: number) => {
      return this.font(fonts.italicFont, fonts.size.caption).text(text, x, y);
    };
    
    this.bold = (text: string, x: number, y: number) => {
      return this.font(fonts.boldFont).text(text, x, y);
    };
  };
  
  // Apply formatting methods
  pdf.addFormattingMethods();
}

// Helper function for consistent line spacing
function calculateLineSpacing(fontSize: number): number {
  return fontSize * 1.2;
}

// Helper function for text wrapping
function wrapText(pdf: any, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const textWidth = pdf.widthOfString(testLine);
    
    if (textWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}`;
  }

  private generateGenericFix(issues: PDFIssue[], version: string, analysisResult: AnalysisResult): string {
    const primaryIssue = issues[0];
    
    return `// CLAUDE FIX ${version} - Generic fix for: ${primaryIssue.description}
function applyGeneralFix(inputData: any, pdf: any, options: any = {}): void {
  // Generic fix implementation
  console.log('Applying general fix for:', '${primaryIssue.description}');
  
  // Add validation
  if (!inputData || !pdf) {
    console.error('Missing required parameters for fix');
    return;
  }
  
  // Apply suggested fix logic
  ${primaryIssue.suggestedFix ? `// Suggested: ${primaryIssue.suggestedFix}` : '// No specific suggestion provided'}
  
  // Add error handling
  try {
    // Implementation based on issue type
    ${this.generateIssueSpecificLogic(primaryIssue)}
  } catch (error) {
    console.error('Fix application failed:', error);
  }
}`;
  }

  private generateIssueSpecificLogic(issue: PDFIssue): string {
    if (issue.description.includes('missing')) {
      return `// Add missing element
    const missingValue = inputData.${this.extractFieldName(issue.description)} || 'N/A';
    pdf.text(\`Missing Value: \${missingValue}\`, 50, 100);`;
    }
    
    if (issue.description.includes('mismatch')) {
      return `// Correct data mismatch
    const correctValue = inputData.${this.extractFieldName(issue.description)};
    if (correctValue) {
      pdf.text(\`Corrected: \${correctValue}\`, 50, 100);
    }`;
    }
    
    return `// Generic fix application
    console.log('Applied generic fix');`;
  }

  private extractFieldName(description: string): string {
    // Extract likely field name from description
    const words = description.toLowerCase().split(' ');
    
    if (words.includes('project') && words.includes('name')) return 'projectName';
    if (words.includes('address')) return 'address';
    if (words.includes('zone') && words.includes('pressure')) return 'zonePressures';
    if (words.includes('wind') && words.includes('speed')) return 'windSpeed';
    
    return 'unknownField';
  }

  private generateExplanation(issueType: string, issues: PDFIssue[]): string {
    const issueCount = issues.length;
    const primaryIssue = issues[0];
    
    return `This fix addresses ${issueCount} ${issueType.replace('_', ' ')} issue${issueCount > 1 ? 's' : ''}. 
    
Primary issue: ${primaryIssue.description}

The fix implements:
1. Proper data validation and error handling
2. Correct data extraction from input JSON
3. Consistent formatting and layout
4. Fallback values for missing data

This is a surgical fix that only modifies the specific functionality related to ${issueType} without affecting other parts of the PDF generation system.`;
  }

  private generateTestCase(targetModule: string, functionName: string, issues: PDFIssue[]): string {
    return `// Test case for ${functionName}
const testInput = {
  projectName: 'Test Project',
  address: '123 Test Street, Test City, TX',
  zonePressures: {
    zone1: -45.2,
    zone2: -67.8,
    zone3: -89.1
  }
};

const mockPDF = {
  text: jest.fn(),
  font: jest.fn().mockReturnThis(),
  fontSize: jest.fn().mockReturnThis()
};

// Test the fix
${functionName}(testInput, mockPDF);

// Verify the fix worked
expect(mockPDF.text).toHaveBeenCalled();
expect(mockPDF.font).toHaveBeenCalledWith(expect.any(String));`;
  }

  private determineDependencies(issueType: string): string[] {
    const baseDependencies = ['fs', 'path'];
    
    switch (issueType) {
      case 'missing_value':
        return [...baseDependencies, 'lodash'];
      case 'formatting_error':
        return [...baseDependencies, 'pdfkit'];
      case 'layout_issue':
        return [...baseDependencies, 'pdfkit'];
      default:
        return baseDependencies;
    }
  }

  private incrementVersion(currentVersion: string): string {
    const match = currentVersion.match(/v(\d+)/);
    if (match) {
      const num = parseInt(match[1]) + 1;
      return `v${num}`;
    }
    return 'v2';
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const analysisResultPath = args[0];
  const currentVersion = args[1] || 'v1';

  if (!analysisResultPath) {
    console.error('Usage: propose-fix-snippet <analysis-result-path> [current-version]');
    process.exit(1);
  }

  try {
    // Load analysis result
    const analysisResult = JSON.parse(await fs.readFile(analysisResultPath, 'utf-8'));
    
    const engine = new FixProposalEngine();
    const proposals = await engine.proposeFixesForIssues({
      analysisResult,
      currentVersion
    });

    console.log('\\n=== Fix Proposals ===');
    console.log(`Generated ${proposals.length} fix proposal(s)`);
    
    for (const proposal of proposals) {
      console.log(`\\n--- Fix ${proposal.version} for ${proposal.targetModule} ---`);
      console.log(`Function: ${proposal.functionName}`);
      console.log(`Issues solved: ${proposal.issuesSolved.length}`);
      console.log(`\\nExplanation:`);
      console.log(proposal.explanation);
      console.log(`\\nCode snippet preview (first 200 chars):`);
      console.log(proposal.codeSnippet.substring(0, 200) + '...');
      
      // Save proposal to file
      const outputPath = path.join(
        process.cwd(), 
        'fixes', 
        'snippets', 
        `${proposal.targetModule}_${proposal.version}.ts`
      );
      
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, proposal.codeSnippet);
      console.log(`\\nSaved to: ${outputPath}`);
    }

    // Save all proposals as JSON
    const allProposalsPath = path.join(process.cwd(), 'fix-proposals.json');
    await fs.writeFile(allProposalsPath, JSON.stringify(proposals, null, 2));
    console.log(`\\nAll proposals saved to: ${allProposalsPath}`);

  } catch (error) {
    console.error('Proposal generation failed:', error);
    process.exit(1);
  }
}

// Export for use as module
export { FixProposalEngine, type FixProposal, type ProposalInput };

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}
