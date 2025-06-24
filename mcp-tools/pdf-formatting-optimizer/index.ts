#!/usr/bin/env node

/**
 * MCP Server for PDF Formatting Optimization
 * Analyzes generated PDFs against template requirements and suggests improvements
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { PDFAnalyzer } from '../analyze-pdf-output/index.js';

interface PDFFormattingIssue {
  type: 'font_mismatch' | 'spacing_error' | 'color_incorrect' | 'alignment_off' | 'missing_element' | 'format_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  expectedValue: string;
  actualValue: string;
  templateReference: string;
  suggestedFix: string;
  codeSnippet?: string;
}

interface TemplateComplianceResult {
  templateName: string;
  complianceScore: number; // 0-100
  issues: PDFFormattingIssue[];
  recommendations: string[];
  formatValidation: {
    headerCompliance: boolean;
    sectionFormatting: boolean;
    bulletPointAlignment: boolean;
    tableFormatting: boolean;
    colorScheme: boolean;
    fontConsistency: boolean;
    marginCompliance: boolean;
  };
}

class PDFFormattingOptimizer {
  private templateSpecs: Map<string, any> = new Map();

  constructor() {
    this.loadTemplateSpecifications();
  }

  private loadTemplateSpecifications() {
    // Load exact formatting specifications from project knowledge
    this.templateSpecs.set('tearoff-tpo-ma-insul-steel', {
      header: {
        title: {
          text: 'SECTION -- BID SCOPE OF WORK',
          formatting: { bold: true, fontSize: 16, alignment: 'center' }
        },
        templateInfo: {
          pattern: /\(TEMPLATE:.*Rev\.\s*\d+\/\d+\/\d+\)/,
          formatting: { italic: true, backgroundColor: '#FFFF00', fontSize: 10 }
        }
      },
      authorNotes: [
        {
          pattern: /Note to author:.*Prior to start.*do "SAVE AS"/,
          formatting: { italic: true, backgroundColor: '#FFFF00' }
        },
        {
          pattern: /Items highlighted in yellow need to be confirmed/,
          formatting: { italic: true, backgroundColor: '#FFFF00' }
        },
        {
          pattern: /Items highlighted in green are to alert Bid Form/,
          formatting: { italic: true, backgroundColor: '#FFFF00' }
        }
      ],
      sections: {
        projectDescription: {
          pattern: /The Scope of Work for.*as provided in this Section/,
          formatting: { fontSize: 11, paragraphSpacing: 12 }
        },
        buildingDescription: {
          bulletStyle: '-',
          indentation: 20,
          formatting: { fontSize: 11 }
        },
        scopeOfWork: {
          keyPhrases: [
            'roof replacement',
            'roof re-cover',
            'The roof system specified herein',
            'The Contractor will be responsible'
          ],
          formatting: { bold: true, fontSize: 11 }
        }
      },
      highlighting: {
        yellow: '#FFFF00',
        green: '#00FF00',
        removeGreenBeforePDF: true
      },
      branding: {
        companyName: 'Southern Roof Consultants',
        footer: 'SRC-2025'
      }
    });
  }

  async analyzePDFCompliance(
    pdfPath: string,
    templateType: string,
    inputData: any
  ): Promise<TemplateComplianceResult> {
    const templateSpec = this.templateSpecs.get(templateType);
    if (!templateSpec) {
      throw new Error(`Template specification not found: ${templateType}`);
    }

    const analyzer = new PDFAnalyzer();
    await analyzer.initialize();

    try {
      // Create temporary input JSON for analysis
      const tempInputPath = path.join(process.cwd(), 'temp-input.json');
      await fs.writeFile(tempInputPath, JSON.stringify(inputData, null, 2));

      const analysisResult = await analyzer.analyzePDF({
        pdfPath,
        inputJsonPath: tempInputPath
      });

      // Clean up temp file
      await fs.unlink(tempInputPath);

      // Perform detailed compliance checking
      const issues = await this.performDetailedCompliance(analysisResult, templateSpec, inputData);
      const complianceScore = this.calculateComplianceScore(issues);
      const recommendations = this.generateRecommendations(issues, templateSpec);
      const formatValidation = this.validateFormatCompliance(analysisResult, templateSpec);

      return {
        templateName: templateType,
        complianceScore,
        issues,
        recommendations,
        formatValidation
      };

    } finally {
      await analyzer.cleanup();
    }
  }

  private async performDetailedCompliance(
    analysisResult: any,
    templateSpec: any,
    inputData: any
  ): Promise<PDFFormattingIssue[]> {
    const issues: PDFFormattingIssue[] = [];

    // Check header compliance
    issues.push(...this.checkHeaderCompliance(analysisResult, templateSpec));

    // Check section formatting
    issues.push(...this.checkSectionFormatting(analysisResult, templateSpec));

    // Check highlighting compliance
    issues.push(...this.checkHighlightingCompliance(analysisResult, templateSpec));

    // Check data accuracy
    issues.push(...this.checkDataAccuracy(analysisResult, inputData));

    return issues;
  }

  private checkHeaderCompliance(analysisResult: any, templateSpec: any): PDFFormattingIssue[] {
    const issues: PDFFormattingIssue[] = [];
    const extractedText = analysisResult.extractedData.text || '';

    // Check main title
    if (!extractedText.includes('SECTION -- BID SCOPE OF WORK')) {
      issues.push({
        type: 'missing_element',
        severity: 'critical',
        description: 'Main section header is missing or incorrectly formatted',
        location: 'Document header',
        expectedValue: 'SECTION -- BID SCOPE OF WORK',
        actualValue: 'Not found or incorrect',
        templateReference: 'Header title requirement',
        suggestedFix: 'Ensure main header is bold, centered, and exactly matches template text',
        codeSnippet: `
// Fix header formatting
header: {
  title: {
    text: '**SECTION -- BID SCOPE OF WORK**',
    formatting: { bold: true, fontSize: 16, alignment: 'center' }
  }
}
        `
      });
    }

    // Check template revision info
    const templatePattern = /\(TEMPLATE:.*Rev\.\s*\d+\/\d+\/\d+\)/;
    if (!templatePattern.test(extractedText)) {
      issues.push({
        type: 'format_violation',
        severity: 'high',
        description: 'Template revision information is missing or incorrectly formatted',
        location: 'Header template info',
        expectedValue: '(TEMPLATE: [Name] (Rev. 2/6/25))',
        actualValue: 'Missing or incorrect format',
        templateReference: 'Template revision format requirement',
        suggestedFix: 'Add template name and revision date in exact format with yellow highlighting',
        codeSnippet: `
templateInfo: {
  text: '*(TEMPLATE: ${templateName} (**Rev. ${revisionDate}**))*',
  formatting: { italic: true, backgroundColor: '#FFFF00', fontSize: 10 }
}
        `
      });
    }

    return issues;
  }

  private checkSectionFormatting(analysisResult: any, templateSpec: any): PDFFormattingIssue[] {
    const issues: PDFFormattingIssue[] = [];
    const extractedText = analysisResult.extractedData.text || '';

    // Check bullet point formatting
    const bulletPoints = extractedText.match(/^[\s]*[-•]\s*/gm) || [];
    if (bulletPoints.length === 0) {
      issues.push({
        type: 'format_violation',
        severity: 'medium',
        description: 'Bullet points are missing or incorrectly formatted',
        location: 'Section content',
        expectedValue: 'Dash (-) bullet points with proper indentation',
        actualValue: 'No bullet points detected',
        templateReference: 'Bullet point formatting standard',
        suggestedFix: 'Use dash (-) bullets with 20px indentation',
        codeSnippet: `
bulletPoints: [{
  text: content,
  formatting: {
    bulletStyle: '-',
    indentation: 20,
    fontSize: 11
  }
}]
        `
      });
    }

    // Check required phrases
    const requiredPhrases = templateSpec.sections.scopeOfWork.keyPhrases;
    for (const phrase of requiredPhrases) {
      if (!extractedText.includes(phrase)) {
        issues.push({
          type: 'missing_element',
          severity: 'high',
          description: `Required template phrase is missing: "${phrase}"`,
          location: 'Scope of work section',
          expectedValue: phrase,
          actualValue: 'Missing',
          templateReference: 'Required template language',
          suggestedFix: `Include exact phrase: "${phrase}" with proper formatting`
        });
      }
    }

    return issues;
  }

  private checkHighlightingCompliance(analysisResult: any, templateSpec: any): PDFFormattingIssue[] {
    const issues: PDFFormattingIssue[] = [];

    // Check if green highlighting was properly removed for PDF
    const hasGreenHighlighting = analysisResult.extractedData.text?.includes('green') ||
                                 analysisResult.layoutMetrics?.colors?.includes('#00FF00');

    if (hasGreenHighlighting && templateSpec.highlighting.removeGreenBeforePDF) {
      issues.push({
        type: 'format_violation',
        severity: 'medium',
        description: 'Green highlighting should be removed before PDF conversion',
        location: 'Throughout document',
        expectedValue: 'No green highlighting in final PDF',
        actualValue: 'Green highlighting detected',
        templateReference: 'PDF conversion guidelines',
        suggestedFix: 'Remove green highlighting before PDF generation',
        codeSnippet: `
if (config.removeGreenHighlighting) {
  sections = this.removeGreenHighlighting(sections);
}
        `
      });
    }

    return issues;
  }

  private checkDataAccuracy(analysisResult: any, inputData: any): PDFFormattingIssue[] {
    const issues: PDFFormattingIssue[] = [];

    // Check project name accuracy
    if (inputData.projectName && analysisResult.extractedData.projectName !== inputData.projectName) {
      issues.push({
        type: 'font_mismatch',
        severity: 'critical',
        description: 'Project name does not match input data',
        location: 'Project description section',
        expectedValue: inputData.projectName,
        actualValue: analysisResult.extractedData.projectName || 'Missing',
        templateReference: 'Data accuracy requirement',
        suggestedFix: 'Ensure project name is correctly inserted from input data'
      });
    }

    // Check wind speed accuracy
    if (inputData.windSpeed && analysisResult.extractedData.windSpeed !== inputData.windSpeed) {
      issues.push({
        type: 'font_mismatch',
        severity: 'high',
        description: 'Wind speed does not match calculated value',
        location: 'Wind analysis section',
        expectedValue: `${inputData.windSpeed} mph`,
        actualValue: `${analysisResult.extractedData.windSpeed || 'Missing'} mph`,
        templateReference: 'Engineering calculation accuracy',
        suggestedFix: 'Verify wind speed calculation and formatting'
      });
    }

    return issues;
  }

  private calculateComplianceScore(issues: PDFFormattingIssue[]): number {
    if (issues.length === 0) return 100;

    const severityWeights = {
      low: 1,
      medium: 3,
      high: 7,
      critical: 15
    };

    const totalDeductions = issues.reduce((sum, issue) => {
      return sum + severityWeights[issue.severity];
    }, 0);

    const maxPossibleDeductions = issues.length * 15; // Assuming all critical
    const score = Math.max(0, 100 - (totalDeductions / maxPossibleDeductions) * 100);

    return Math.round(score);
  }

  private generateRecommendations(issues: PDFFormattingIssue[], templateSpec: any): string[] {
    const recommendations = [];

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push('Address critical formatting issues first: missing headers, incorrect data, or major layout problems');
    }

    const formatIssues = issues.filter(i => i.type === 'format_violation');
    if (formatIssues.length > 0) {
      recommendations.push('Review template formatting requirements and ensure exact compliance with highlighting, fonts, and structure');
    }

    const missingElements = issues.filter(i => i.type === 'missing_element');
    if (missingElements.length > 0) {
      recommendations.push('Add missing required elements: headers, template phrases, and section content');
    }

    if (issues.length > 5) {
      recommendations.push('Consider implementing automated formatting validation in the PDF generation pipeline');
    }

    return recommendations;
  }

  private validateFormatCompliance(analysisResult: any, templateSpec: any): any {
    return {
      headerCompliance: analysisResult.extractedData.text?.includes('SECTION -- BID SCOPE OF WORK') || false,
      sectionFormatting: (analysisResult.extractedData.sections?.length || 0) > 0,
      bulletPointAlignment: (analysisResult.extractedData.text?.match(/^[\s]*[-•]\s*/gm) || []).length > 0,
      tableFormatting: (analysisResult.extractedData.zonePressures && Object.keys(analysisResult.extractedData.zonePressures).length > 0) || false,
      colorScheme: true, // Would need detailed color analysis
      fontConsistency: (analysisResult.layoutMetrics.fontSizes?.length || 0) <= 4, // Not too many different sizes
      marginCompliance: analysisResult.layoutMetrics.margins?.top >= 40 && analysisResult.layoutMetrics.margins?.bottom >= 40
    };
  }

  async suggestFormattingImprovements(
    templateType: string,
    currentIssues: PDFFormattingIssue[]
  ): Promise<string[]> {
    const suggestions = [];

    // Generate specific code improvements
    const codeImprovements = currentIssues
      .filter(issue => issue.codeSnippet)
      .map(issue => issue.suggestedFix);

    suggestions.push(...codeImprovements);

    // Add general formatting improvements
    suggestions.push(
      'Implement strict template validation during PDF generation',
      'Add automated compliance checking before final output',
      'Use template-specific formatting rules engine',
      'Validate all data insertions match expected formats'
    );

    return suggestions;
  }
}

// Create and configure the MCP server
const server = new Server(
  {
    name: 'pdf-formatting-optimizer',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const optimizer = new PDFFormattingOptimizer();

// Tool: Analyze PDF compliance with template
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_pdf_compliance',
        description: 'Analyze PDF output for compliance with template formatting requirements',
        inputSchema: {
          type: 'object',
          properties: {
            pdfPath: {
              type: 'string',
              description: 'Path to the generated PDF file'
            },
            templateType: {
              type: 'string',
              description: 'Template type (e.g., tearoff-tpo-ma-insul-steel)',
              enum: ['tearoff-tpo-ma-insul-steel', 'tearoff-tpo-ma-insul-lwc-steel', 'tearoff-tpo-adhered-insul-adhered-gypsum', 'recover-tpo-rhino-iso-eps-flute-fill-ssr']
            },
            inputData: {
              type: 'object',
              description: 'Original input data used to generate SOW'
            }
          },
          required: ['pdfPath', 'templateType', 'inputData']
        }
      },
      {
        name: 'suggest_formatting_improvements',
        description: 'Suggest specific code improvements for PDF formatting',
        inputSchema: {
          type: 'object',
          properties: {
            templateType: {
              type: 'string',
              description: 'Template type to optimize for'
            },
            currentIssues: {
              type: 'array',
              description: 'Current formatting issues to address'
            }
          },
          required: ['templateType']
        }
      },
      {
        name: 'validate_template_elements',
        description: 'Validate specific template elements are correctly formatted',
        inputSchema: {
          type: 'object',
          properties: {
            element: {
              type: 'string',
              enum: ['header', 'author_notes', 'bullet_points', 'wind_table', 'highlighting'],
              description: 'Template element to validate'
            },
            content: {
              type: 'string',
              description: 'Content to validate'
            },
            templateType: {
              type: 'string',
              description: 'Template type for validation rules'
            }
          },
          required: ['element', 'content', 'templateType']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'analyze_pdf_compliance': {
      const { pdfPath, templateType, inputData } = request.params.arguments as any;
      
      try {
        const result = await optimizer.analyzePDFCompliance(pdfPath, templateType, inputData);
        
        return {
          content: [
            {
              type: 'text',
              text: `PDF Compliance Analysis Results:

Template: ${result.templateName}
Compliance Score: ${result.complianceScore}%

FORMAT VALIDATION:
✅ Header Compliance: ${result.formatValidation.headerCompliance ? 'PASS' : 'FAIL'}
✅ Section Formatting: ${result.formatValidation.sectionFormatting ? 'PASS' : 'FAIL'}
✅ Bullet Points: ${result.formatValidation.bulletPointAlignment ? 'PASS' : 'FAIL'}
✅ Table Formatting: ${result.formatValidation.tableFormatting ? 'PASS' : 'FAIL'}
✅ Font Consistency: ${result.formatValidation.fontConsistency ? 'PASS' : 'FAIL'}
✅ Margin Compliance: ${result.formatValidation.marginCompliance ? 'PASS' : 'FAIL'}

ISSUES FOUND (${result.issues.length}):
${result.issues.map((issue, i) => `
${i + 1}. [${issue.severity.toUpperCase()}] ${issue.description}
   Location: ${issue.location}
   Expected: ${issue.expectedValue}
   Actual: ${issue.actualValue}
   Fix: ${issue.suggestedFix}
   ${issue.codeSnippet ? `\n   Code Fix:\n   ${issue.codeSnippet}` : ''}
`).join('\n')}

RECOMMENDATIONS:
${result.recommendations.map(rec => `• ${rec}`).join('\n')}
`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error analyzing PDF compliance: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }

    case 'suggest_formatting_improvements': {
      const { templateType, currentIssues = [] } = request.params.arguments as any;
      
      try {
        const suggestions = await optimizer.suggestFormattingImprovements(templateType, currentIssues);
        
        return {
          content: [
            {
              type: 'text',
              text: `Formatting Improvement Suggestions for ${templateType}:

${suggestions.map((suggestion, i) => `${i + 1}. ${suggestion}`).join('\n')}

IMPLEMENTATION PRIORITY:
1. Fix critical data accuracy issues first
2. Address template structure compliance
3. Ensure highlighting rules are followed
4. Validate font and spacing consistency
5. Implement automated validation pipeline
`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error generating suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }

    case 'validate_template_elements': {
      const { element, content, templateType } = request.params.arguments as any;
      
      // Implementation for specific element validation
      return {
        content: [
          {
            type: 'text',
            text: `Template element validation for ${element} in ${templateType}:\n\n[Validation results would be implemented here]`
          }
        ]
      };
    }

    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PDF Formatting Optimizer MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
